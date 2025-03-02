import os
import sys
import json
import torch
import logging

from unsloth import FastLanguageModel
from typing import Tuple
from transformers import AutoTokenizer
from transformers.utils import is_flash_attn_2_available

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.append(parent_dir)

from fact_checking_pipeline import load_question_duplicate_model, load_passage_ranker, get_evidences_for_claim_rag, verify_claim

device = "cuda"
torch.cuda.empty_cache()

def load_json_lines(filename):
    data = []
    with open(filename, 'r') as file:
        for line in file:
            data.append(json.loads(line.strip()))
    return data

def load_llm_model() -> Tuple[FastLanguageModel, AutoTokenizer]:

    if (is_flash_attn_2_available() and (torch.cuda.get_device_capability(0)[0] >= 8)):
        attn_implementation = "flash_attention_2"
    else:
        attn_implementation = "sdpa"

    print(f"[INFO] Using attention implementation: {attn_implementation}")

    model_id = "woshityj/llama_3.2_3B_Instruct_bnb_finetuned"
    print(f"[INFO] Using model_id: {model_id}")

    llm_model, tokenizer = FastLanguageModel.from_pretrained(
        model_name = model_id,
        max_seq_length = 8192,
        dtype = None,
        load_in_4bit = True,
        token = "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"
    )

    llm_model.to(device)

    return llm_model, tokenizer


def evaluate_fact_checking_pipeline(llm_model, tokenizer, question_duplicate_model, question_duplicate_tokenizer, passage_ranker):
    check_claims_json = load_json_lines("../../fact_checking_evaluation_data/claims.jsonl")

    factual_labels = []

    for claim in check_claims_json:
        claim_text = claim["claim"]
        evidences = get_evidences_for_claim_rag(llm_model = llm_model, 
                                                tokenizer = tokenizer, 
                                                claim = claim_text, 
                                                question_duplicate_model = question_duplicate_model,
                                                question_duplicate_tokenizer = question_duplicate_tokenizer,
                                                passage_ranker = passage_ranker)
        
        evids = [evid["text"] for evid in evidences["aggregated"]]
        result = verify_claim(claim_text, evids, model = llm_model, tokenizer = tokenizer)
        print(result)
        if result.get("factuality") is None:
            if result.get("correction") or result.get("error"):
                result["factuality"] = False
            else:
                result["factuality"] = True
        factual_labels.append(result["factuality"])
    
    updated_data = [
        {**item, 'claim_label': bool_value}
        for item, bool_value in zip(check_claims_json, factual_labels)
    ]

    with open("../../fact_checking_evaluation_data/claims_with_labels_llama_finetuned.jsonl", "w") as f:
        for item in updated_data:
            f.write(json.dumps(item) + "\n")
    
    return


def evaluate_normal(llm_model, tokenizer):
    check_claims_json = load_json_lines("../../fact_checking_evaluation_data/claims.jsonl")

    factual_labels = []

    for claim in check_claims_json:
        claim_text = claim["claim"]
        result = verify_claim(claim_text, [], model = llm_model, tokenizer = tokenizer)
        print(result)
        if result.get("factuality") is None:
            if result.get("correction") or result.get("error"):
                result["factuality"] = False
            else:
                result["factuality"] = True
        factual_labels.append(result["factuality"])
    
    updated_data = [
        {**item, 'claim_label': bool_value}
        for item, bool_value in zip(check_claims_json, factual_labels)
    ]

    with open("../../fact_checking_evaluation_data/claims_with_labels_llama.jsonl", "w") as f:
        for item in updated_data:
            f.write(json.dumps(item) + "\n")
    
    return

llm_model, tokenizer = load_llm_model()
question_duplicate_model, question_duplicate_tokenizer = load_question_duplicate_model()
passage_ranker = load_passage_ranker()

evaluate_fact_checking_pipeline(llm_model, tokenizer, question_duplicate_model, question_duplicate_tokenizer, passage_ranker)
evaluate_normal(llm_model=llm_model, tokenizer=tokenizer)