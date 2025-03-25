import os
import sys
import json
import pickle
import logging
import torch
import pandas as pd

from typing import Tuple
from ragas import EvaluationDataset, evaluate
from txtai.embeddings import Embeddings
from transformers import AutoTokenizer
from transformers.utils import is_flash_attn_2_available
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.retrievers import WikipediaRetriever
from unsloth import FastVisionModel

from datasets import load_dataset
import kagglehub

from ragas.metrics import Faithfulness, FactualCorrectness, LLMContextRecall, LLMContextPrecisionWithReference
# from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
# from ragas.integrations.langchain import EvaluatorChain

device = "cuda"
logging.basicConfig(format="%(levelname)s | %(asctime)s | %(message)s", level = logging.INFO)
OPENAI_API_KEY = "sk-proj-XXXXXXXXXXXXXXXXXXX"
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

QUESTION_WITH_RAG_PROMPT = """
Use the following pieces of context to answer the question at the end.
If you don't know the answer, use your knowledge to answer the question, if you don't know just say that you don't know, don't try to make up an answer.
Use three sentences maximum and keep the answer as concise as possible.

Context: {context}

Question: {question}

Response: """

def loadMultiModalLLM() -> Tuple[FastVisionModel, AutoTokenizer]:
    
    if (is_flash_attn_2_available() and (torch.cuda.get_device_capability(0)[0] >= 8)):
        attn_implementation = "flash_attention_2"
    else:
        attn_implementation = "sdpa"

    print(f"[INFO] Using attention implementation: {attn_implementation}")

    model_id = "unsloth/Llama-3.2-11B-Vision-Instruct-bnb-4bit"
    print(f"[INFO] Using model_id: {model_id}")

    llm_model, tokenizer = FastVisionModel.from_pretrained(
        model_name = model_id,
        max_seq_length = 8192,
        dtype = None,
        load_in_4bit = True,
        token = "XXXXXXXXXXXXXXXX"
    )

    llm_model.to(device)

    return llm_model, tokenizer

def load_wikipedia_embeddings_model():
    embeddings = Embeddings()
    embeddings_model = embeddings.load(provider="huggingface-hub", container="neuml/txtai-wikipedia")

    return embeddings_model

def generateLLMOutput(model: FastVisionModel, tokenizer: AutoTokenizer, input_text: str, system_role: str = "You are a helpful assistant.") -> str:

    messages = [
    {
        "role": "system",
        "content": system_role
    },
    {
        "role": "user",
        "content": [
            {"type": "text", "text": input_text}
        ]
    }]
    FastVisionModel.for_inference(model)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    formatted_text = tokenizer.apply_chat_template(messages, add_generation_prompt = True)
    input_ids = tokenizer(None, formatted_text, add_special_tokens = False, return_tensors = "pt").to(device)
    
    output_encoded = model.generate(**input_ids, max_new_tokens = 8192, temperature = 0.7, use_cache = True)
    prompt_length = input_ids['input_ids'].shape[1]
    output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)

    return output_decoded

# def rag_retrieval(query: str, embeddings_model, num_results: int = 5):

#     result = embeddings_model.search(query, limit = num_results)
#     context = "\n".join([x["text"] for x in result])

#     return context

# Load Natural Question dataset for RAG Evaluation
def load_natural_question_dataset():
    # df = pd.read_csv('S08_question_answer_pairs.txt', sep='\t')
    
    dataset = load_dataset("neural-bridge/rag-dataset-1200")

    return dataset

def question_and_answer_with_rag(llm_model: FastVisionModel, tokenizer: AutoTokenizer, question: str, context: str) -> str:

    # docs = rag_retrieval(question, embeddings_model)
    # results = embeddings_model.invoke(question)
    # content = "\n\n".join(doc.page_content for doc in results)
    # content = rag_retrieval(question, embeddings_model)
    # logging.info(f"Retrieved contexts: {content}")
    user_input = QUESTION_WITH_RAG_PROMPT.format(context = context, question = question)
    # print(user_input)
    
    response = generateLLMOutput(llm_model, tokenizer, user_input)

    logging.info(f"LLM Question and Answer RAG Response: {response}")

    return response

def generate_llm_responses():
    # Load the Wikipedia embeddings model
    # wikipedia_embeddings_model = load_wikipedia_embeddings_model()

    # docs = rag_retrieval("who is the main character of tokyo ghoul?", wikipedia_embeddings_model)
    # print(docs)
    # retriever = WikipediaRetriever()
    # docs = retriever.invoke('who is the main character of tokyo ghoul?')
    # print(docs[0].page_content)

    # # Load the MultiModal LLM Model
    llm_model, tokenizer = loadMultiModalLLM()

    evaluation_dataset = []

    dataset = load_natural_question_dataset()
    for data in dataset['test']:
        llm_response = question_and_answer_with_rag(llm_model, tokenizer, data['question'], data['context'])
        evaluation_dataset.append({
            "user_input": data['question'],
            "retrieved_contexts": [data['context']],
            "response": llm_response,
            "reference": data['answer']
        })
    
    with open("llm_rag_evaluation", "wb") as f:
        pickle.dump(evaluation_dataset, f)
    
    return


def evaluate_rag():
    with open("llm_normal_evaluation_revised", "rb") as f:
        evaluation_dataset = pickle.load(f)
    print(type(evaluation_dataset))
    print(evaluation_dataset[0])
    evaluation_data = EvaluationDataset.from_list(evaluation_dataset)
    result = evaluate(dataset = evaluation_data, metrics = [FactualCorrectness()])

    return result

# result = evaluate_rag()
# print(result)

def evaluate_normal():
    llm_model, tokenizer = loadMultiModalLLM()

    evaluation_dataset = []

    dataset = load_natural_question_dataset()
    for data in dataset['test']:
        logging.info(f"Question: {data['question']}")
        llm_response = generateLLMOutput(llm_model, tokenizer, data['question'])
        logging.info(f"LLM Response: {llm_response}")
        evaluation_dataset.append({
            "user_input": data['question'],
            "response": llm_response,
        })
    
    with open("llm_normal_evaluation", "wb") as f:
        pickle.dump(evaluation_dataset, f)


def main():
    # evaluate_normal()
    # generate_llm_responses()
    result = evaluate_rag()
    logging.info(result)


if __name__ == "__main__":
    main()