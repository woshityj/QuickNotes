import os
import torch

from transformers import AutoTokenizer, AutoModelForCausalLM
from transformers.utils import is_flash_attn_2_available

from langchain_community.retrievers import ArxivRetriever

os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "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"
os.environ["HUGGINGFACEHUB_API_TOKEN"] = "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"

device = "cuda"
torch.cuda.empty_cache()

def load_llm_model() -> (AutoModelForCausalLM, AutoTokenizer):

    if (is_flash_attn_2_available() and (torch.cuda.get_device_capability(0)[0] >= 8)):
        attn_implementation = "flash_attention_2"
    else:
        attn_implementation = "sdpa"
    
    print(f"[INFO] Using attention implementation: {attn_implementation}")

    model_id = "meta-llama/Llama-3.2-3B-Instruct"
    print(f"[INFO] Using model_id: {model_id}")

    tokenizer = AutoTokenizer.from_pretrained(pretrained_model_name_or_path = model_id)
    llm_model = AutoModelForCausalLM.from_pretrained(pretrained_model_name_or_path = model_id,
                                                    torch_dtype = torch.float16,
                                                    low_cpu_mem_usage = False,
                                                    attn_implementation = attn_implementation)
    
    llm_model.to(device)

    return llm_model, tokenizer

def text_summarization(llm_model: AutoModelForCausalLM, tokenizer: AutoTokenizer, input_text: str) -> str:
    
    prompt_template = (
f"""
Generate a concise summary from the provided text. write five bullets points on the key info and then write a summary expanding on those points into a 500 word essay.
{input_text}
""")

    dialogue_template = [
        {"role": "user",
        "content": prompt_template}
    ]

    prompt = tokenizer.apply_chat_template(dialogue_template, add_generation_prompt = False, tokenize = False)

    input_ids = tokenizer(prompt, return_tensors = "pt").to("cuda")

    output_encoded = llm_model.generate(**input_ids, max_new_tokens = 1024, temperature = 0.1)

    output_decoded = tokenizer.decode(output_encoded[0])

    output_decoded = (output_decoded.replace(prompt, '')
                                    .replace('<|eot_id|>', '')
                                    .replace('<|start_header_id|>', '')
                                    .replace('<|end_header_id|>', '')
                                    .replace('<|begin_of_text|>', ''))
    
    return output_decoded

def text_summarization_with_rag_validation(llm_model: AutoModelForCausalLM, tokenizer: AutoTokenizer, input_text: str) -> str:
    
    prompt_template = (
f"""
You are instructed to finish following text step by step. Here is the user text: ###{content}###.
Here is the retrieval text:
###{context}###.
The first step is to check if the retrieval text is relevant with the user text. Based on the check result, you are ready to implement the following step.
(1) if they are not relevant, you should return to me: the user text is not relevant with the retrieval text. Start summarizing only on user text: content of the summarization
(2) if they are relevant but the retrieval text has information conflict with the user text, you only need to return "There is information conflict between the user text and the retrieval text"
(3) if they are relevant and there is no information conflict between them, you should return to me: the user text is relevant with the retrieval text and there is no information conflict. Start summarizing on
both retrieval text and user text: content of the summarization.

Here is one example: The user text is ### The Ragdoll is a breed of cat with a distinct colorpoint coat and blue eyes. Its morphology is large and weighty, and it has a semi-long and silky soft coat. American breeder Ann Baker developed Ragdolls in the 1960s. They are best known for their docile, placid temperament and affectionate nature.
###.
The retrieval text is ###A domestic short-haired cat is a cat possessing a coat of short fur, not belonging to any particular recognised cat breed. In the United Kingdom, they are colloquially called moggies.### Then, in this example,
your reply should be: The user text is not relevant with the retrieval text. Start summarizing only on user text: Ragdolls are large, gentle cats with colorpoint coats and blue eyes.
"""
    )

llm_model, tokenizer = load_llm_model()
print(text_summarization(llm_model, tokenizer, "The quick brown fox jumps over the lazy dog."))