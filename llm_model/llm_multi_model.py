import nltk
from prompts import SENTENCES_TO_CLAIMS_PROMPT, CHECKWORTHY_PROMPT, QGEN_PROMPT, VERIFY_PROMPT, IDENTIFY_STANCE_PROMPT, zero_shot_edit_response_given_question, zero_shot_edit_response, QUESTION_WITH_RAG_PROMPT
import os
import torch
import json

from PIL import Image

from unsloth import FastLanguageModel, is_bfloat16_supported, FastVisionModel
from unsloth.chat_templates import get_chat_template

from transformers import AutoTokenizer, AutoModelForCausalLM
from transformers.utils import is_flash_attn_2_available
import transformers

from langchain_community.retrievers import ArxivRetriever

from pydantic import BaseModel

from typing import Tuple

from sentence_transformers import CrossEncoder
from copy import deepcopy

import spacy

import time
import ast
import pprint
import numpy as np
import requests
import re
import itertools
import bs4

import concurrent.futures

import pandas as pd

os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "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"
os.environ["HUGGINGFACEHUB_API_TOKEN"] = "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"

device = "cuda"
torch.cuda.empty_cache()

question_duplicate_model = CrossEncoder('navteca/quora-roberta-base', device=torch.device("cuda:0" if torch.cuda.is_available() else "cpu"),)
question_duplicate_tokenizer = spacy.load("en_core_web_sm", disable=["ner", "tagger", "lemmatizer"])
passage_ranker = CrossEncoder(
    "cross-encoder/ms-marco-MiniLM-L-6-v2",
    max_length=512,
    device=torch.device("cuda" if torch.cuda.is_available() else "cpu"),
)

class Message(BaseModel):
    role: str
    content: str

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
        token = "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"
    )

    llm_model.to(device)

    return llm_model, tokenizer

async def textSummarizationMultiModal(llm_model: FastVisionModel, tokenizer: AutoTokenizer, input_text: str) -> str:
    
    instruction = (
f"""Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appriopriately completes the request.

### Instruction:
Summarize the following text.

### Input:
{input_text}

### Response:
""")
    
    messages = [
        {"role": "user", "content": [
            {"type": "text", "text": instruction}
        ]}
    ]

    FastVisionModel.for_inference(llm_model)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    formatted_text = tokenizer.apply_chat_template(messages, add_generation_prompt = True)
    input_ids = tokenizer(None, formatted_text, add_special_tokens = False, return_tensors = "pt").to(device)

    output_encoded = llm_model.generate(**input_ids, max_new_tokens = 8192, temperature = 0.1, use_cache = True)
    prompt_length = input_ids['input_ids'].shape[1]
    output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)

    return output_decoded

async def textElaborationMultiModel(llm_model: FastVisionModel, tokenizer: AutoTokenizer, input_text: str) -> str:

    instruction = (
f"""Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appriopriatel completes the request.

### Instruction:
Expand and generate detailed text from the following input.
1. Use the notes provided below as the foundation
2. Add context, explainations, and details where necessary.
3. Maintain clarity, logical flow, and a consistent tone throughout.
4. If any ambiguity exists in the notes, make reasonable assumptions.

### Input:
{input_text}

### Response:
""")
    
    messages = [
        {"role": "user", "content": [
            {"type": "text", "text": instruction}
        ]}
    ]

    FastVisionModel.for_inference(llm_model)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    formatted_text = tokenizer.apply_chat_template(messages, add_generation_prompt = True)
    input_ids = tokenizer(None, formatted_text, add_special_tokens = False, return_tensors = "pt").to(device)

    output_encoded = llm_model.generate(**input_ids, max_new_tokens = 8192, temperature = 0.1, use_cache = True)
    prompt_length = input_ids['input_ids'].shape[1]
    output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)

    return output_decoded

async def customChatWithMultiModelLLM(llm_model: FastVisionModel, tokenizer: AutoTokenizer, messages: list[Message]) -> str:
    
    dialogue_template = [
        {
            "role": "system",
            "content": "You are a helpful assistant. Answer all questions to the best of your ability in English."
        }
    ]
    print(messages)

    for message in messages:
        print(message)
        dialogue_template.append({
            "role": message['role'],
            "content": [
                {"type": "text", "text": message['content']}
            ]
        })

    FastVisionModel.for_inference(llm_model)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    formatted_text = tokenizer.apply_chat_template(dialogue_template, add_generation_prompt = True, tokenize = False)
    input_ids = tokenizer(None, formatted_text, add_special_tokens = False, return_tensors = "pt").to(device)
    
    output_encoded = llm_model.generate(**input_ids, max_new_tokens = 8192, temperature = 0.1, use_cache = True)
    prompt_length = input_ids['input_ids'].shape[1]
    output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)

    return output_decoded

async def imagesWithMultiModelLLM(llm_model: FastVisionModel, tokenizer: AutoTokenizer, input_text: str, images: list[Image.Image]) -> str:

    content_list = []
    for image in images:
        content_list.append({"type": "image"})
    content_list.append({"type": "text", "text": input_text})

    message = [
        {"role": "user", "content": content_list}
    ]

    FastVisionModel.for_inference(llm_model)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    formatted_text = tokenizer.apply_chat_template(message, add_generation_prompt = True)
    input_ids = tokenizer(images, formatted_text, return_tensors = "pt", add_special_tokens = False).to(device)

    output_encoded = llm_model.generate(**input_ids, max_new_tokens = 8192, temperature = 0.1, use_cache = True)
    prompt_length = input_ids['input_ids'].shape[1]
    output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)

    return output_decoded

async def customChatVideoTranscriptWithMultiModelLLM(llm_model: FastVisionModel, tokenizer: AutoTokenizer, input_text: str, video_transcript: str) -> str:
    
    instruction = (
f"""Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appriopriately completes the request

### Instruction:
{input_text}

### Input:
{video_transcript}

### Response:
"""
    )
    dialogue_template = [
        {
            "role": "system",
            "content": "You are a helpful assistant. Answer all questions to the best of your ability in English."
        }
    ]
    
    dialogue_template.append({
        "role": "user",
        "content": [
            {"type": "text", "text": instruction}
        ]
    })
    

    FastVisionModel.for_inference(llm_model)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    formatted_text = tokenizer.apply_chat_template(dialogue_template, add_generation_prompt = True, tokenize = False)
    input_ids = tokenizer(None, formatted_text, add_special_tokens = False, return_tensors = "pt").to(device)
    
    output_encoded = llm_model.generate(**input_ids, max_new_tokens = 8192, temperature = 0.1, use_cache = True)
    prompt_length = input_ids['input_ids'].shape[1]
    output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)

    return output_decoded

def questionAndAnswerRAG(llm_model: FastVisionModel, tokenizer: AutoTokenizer, question: str) -> str:

    docs = retrieveArxivPapers(question)
    formatted_docs = formatDocs(docs)

    prompt = QUESTION_WITH_RAG_PROMPT.format(question = question, docs = formatted_docs)
    result = generateLLMOutput(llm_model, tokenizer, prompt)

    return result

def claimGenerationWithMultiModelLLM(llm_model: FastVisionModel, tokenizer: AutoTokenizer, input_text: str) -> str:
    
    instruction = (
f"""
You are given a piece of text that includes knowledge claims. A claim is a statement that asserts something as true or false, which can be verified by humans. Your task is to accurately identify and extract
every claim stated. Your response MUST be a list of dictionaries. Each dictonary should contain the key "claim", which correspond to the extracted claim (will all coreferences resolved).
You MUST only respond in the format as described below. DO NOT RESPOND WITH ANYTHING ELSE. ADDING ANY OTHER EXTRA NOTES THAT VIOLATE THE RESPONSE FORMAT IS BANNED. START YOUR RESPONSE WITH '['.
[response format]:
[
    {{
        "claim": "Ensure that the claim is fewer than 15 words and conveys a complete idea. Resolve any coreference (pronouns or other referencing expressions) in the claim for clarity",
    }},
    ...
]

Here are two examples:
[text]: Tomas Berdych defeated Gael Monfis 6-1, 6-4 on Saturday. The sixth-seed reaches Monte Carlo Masters final for the first time . Berdych will face either Rafael Nadal or Novak Djokovic in the final.
[response]: [{{"claim": "Tomas Berdych defeated Gael Monfis 6-1, 6-4"}}, {{"claim": "Tomas Berdych defeated Gael Monfis 6-1, 6-4 on Saturday"}}, {{"claim": "Tomas Berdych reaches Monte Carlo Masters final"}}, {{"claim": "Tomas Berdych is the sixth-seed"}}, {{"claim": "Tomas Berdych reaches Monte Carlo Masters final for the first time"}}, {{"claim": "Berdych will face either Rafael Nadal or Novak Djokovic"}}, {{"claim": "Berdych will face either Rafael Nadal or Novak Djokovic in the final"}}]

[text]: Tinder only displays the last 34 photos - but users can easily see more. Firm also said it had improved its mutual friends feature.
[response]: [{{"claim": "Tinder only displays the last photos"}}, {{"claim": "Tinder only displays the last 34 photos"}}, {{"claim": "Tinder users can easily see more photos"}}, {{"claim": "Tinder said it had improved its feature"}}, {{"claim": "Tinder said it had improved its mutual friends feature"}}]

Now complete the following, ONLY RESPONSE IN A LIST FORMAT, NO OTHER WORDS!!! START YOUR RESPONSE WITH '[' AND END WITH ']':
[text]: {input_text}
[response]: 
"""
    )

    prompt_template = [
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": instruction}
            ]
        }
    ]


    FastVisionModel.for_inference(llm_model)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    formatted_text = tokenizer.apply_chat_template(prompt_template, add_generation_prompt = True)
    input_ids = tokenizer(None, formatted_text, add_special_tokens = False, return_tensors = "pt").to(device)

    output_encoded = llm_model.generate(**input_ids, max_new_tokens = 8192, temperature = 0.1, use_cache = True)
    prompt_length = input_ids['input_ids'].shape[1]
    output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)

    return output_decoded

def queryGenerationFromClaimsWithMultiModelLLM(llm_model: FastVisionModel, tokenizer: AutoTokenizer, input_text: str) -> str:

    instruction = (
f"""
You are a query generator designed to help users verify a given claim using search engines. Your primary task is to generate a Python list of two effective and skeptical search engine queries. These queries should assist users in critically evaluating the factuality of a provided claim using search engines.
You should only respond in the format as described below (a Python list of queries). PLEASE STRICTLY FOLLOW THE FORMAT. DO NOT RETURN ANYTHING ELSE. START YOUR RESPONSE WITH '['.
[response format]: ['query1', 'query2']

Here are three examples:
claim: The CEO of twitter is Bill Gates.
response: ["Who is the CEO of twitter?"]

claim: Michael Phelps is the most decorated Olympian of all time.
response: ["Who is the most decorated Olympian of all time?"]

claim: ChatGPT is created by Google.
response: ["Who created ChatGPT?"]

Now complete the following (ONLY RESPOND IN A LIST FORMAT, DO NOT RETURN OTHER WORDS!!! START YOUR RESPONSE WITH '[' AND END WITH ']'):
claim: {input_text}
response:
"""
)
    prompt_template = [
        {
            "role": "system",
            "content": "You are a query generator that generates effective and concise search engine queries to verify a given claim. You only respond in a Python list format (NO OTHER WORDS!)"
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": instruction}
            ]
        }
    ]

    FastVisionModel.for_inference(llm_model)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    formatted_text = tokenizer.apply_chat_template(prompt_template, add_generation_prompt = True)
    input_ids = tokenizer(None, formatted_text, add_special_tokens = False, return_tensors = "pt").to(device)

    output_encoded = llm_model.generate(**input_ids, max_new_tokens = 8192, temperature = 0.1, use_cache = True)
    prompt_length = input_ids['input_ids'].shape[1]
    output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)

    return output_decoded

def formatDocs(docs):

    return "\n\n".join(doc.page_content for doc in docs)

def retrieveArxivPapers(query: str) -> str:

    retriever = ArxivRetriever(load_max_docs = 1, get_full_documents = False)

    retrieved_docs = retriever.invoke(query)
    formatted_docs = formatDocs(retrieved_docs)

    return formatted_docs

def narrowDownQueriesWithMultiModelLLM(llm_model: FastVisionModel, tokenizer: AutoTokenizer, input_text: str, queries: list[str]) -> str:

    instruction = (
f"""
You are given a summarized text and a list of search engine queries. Your task is to identify the most effective and relevant query to verify the summarized text. 
You should only respond in the format as described below. DO NOT RETURN ANYTHING ELSE. START YOUR RESPONSE WITH '[' AND END WITH ']'. ONLY RESPOND WITH A SINGLE QUERY.
[response format]: ['query1']

Here is an example:
Summarized text: The Ragdoll is a breed of cat with a distinct colorpoint coat and blue eyes. Its morphology is large and weighty, and it has a semi-long and silky soft coat. American breeder Ann Baker developed Ragdools in 1960s. They are best known for their docile, placid temperament and affectionate nature.
Queries: ["Who developed Ragdolls?", "What are Ragdolls known for?"]
Response: ["Who developed Ragdolls?"]

Now complete the following:
Summarized text: {input_text}
Queries: {queries}
Response:
"""
    )

    prompt_template = [
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": instruction}
            ]
        }
    ]


    FastVisionModel.for_inference(llm_model)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    formatted_text = tokenizer.apply_chat_template(prompt_template, add_generation_prompt = True)
    input_ids = tokenizer(None, formatted_text, add_special_tokens = False, return_tensors = "pt").to(device)

    output_encoded = llm_model.generate(**input_ids, max_new_tokens = 8192, temperature = 0.1, use_cache = True)
    prompt_length = input_ids['input_ids'].shape[1]
    output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)

    return output_decoded

def claimVerificationWithMultiModelLLM(llm_model: FastVisionModel, tokenizer: AutoTokenizer, claim: str, evidence: str) -> str:
        
    instruction = (
f"""
You are given a piece of text. Your task is to identify whether there are any factual errors within the text.
When you are judging the factuality of the given text, you could reference the provided evidences if needed. The provided evidences may be helpful. Some evidences may contradict to each other. You must be careful when using the evidences to judge the factuality of the given text.
The response should be a dictionary with three keys - "reasoning", "factuality", "error", and "correction", which correspond to the reasoning, whether the given text is factual or not (Boolean - True or False), the factual error present in the text, and the corrected text.
The following is the given text
[text]: {claim}
The following is the provided evidences
[evidences]: {evidence}
You should only respond in format as described below. DO NOT RETURN ANYTHING ELSE. START YOUR RESPONSE WITH '{{'.
[response format]: 
{{
    "reasoning": "Why is the given text factual or non-factual? Be careful when you said something is non-factual. When you said something is non-factual, you must provide multiple evidences to support your decision.",
    "error": "None if the text is factual; otherwise, describe the error.",
    "correction": "The corrected text if there is an error.",
    "factuality": True if the given text is factual, False otherwise.
}}
"""
)
    
    prompt_template = [
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": instruction}
            ]
        }
    ]


    FastVisionModel.for_inference(llm_model)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    formatted_text = tokenizer.apply_chat_template(prompt_template, add_generation_prompt = True)
    input_ids = tokenizer(None, formatted_text, add_special_tokens = False, return_tensors = "pt").to(device)

    output_encoded = llm_model.generate(**input_ids, max_new_tokens = 8192, temperature = 0.1, use_cache = True)
    prompt_length = input_ids['input_ids'].shape[1]
    output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)

    return output_decoded

def textSummarizationWithRAG(llm_model: FastVisionModel, tokenizer: AutoTokenizer, input_text: str, evidences: str) -> str:

    instruction = (
f"""
You are instructed to finish the following task step by step. 
Claim:
{input_text}

Retrieval text:
{evidences}

The first step is to check if the retrieval text is relevant with the claim. Based on the check result, you are ready to implement the following step.
(1) If they are not relevant, you should return: [Not Relevant]

(2) If they are relevant but the retrieval text has information conflict with the claim, you should return: [Conflict] and return the original claim with the conflict information highlighted

(3) If they are relevant and there is no information conflict, you should return: [Relevant] and return the original claim

Here is one example:
Claim: The Ragdoll is a breed of cat with a distinct colorpoint coat and blue eyes. Its morphology is large and weighty, and it has a semi-long and silky soft coat. American breeder Ann Baker developed Ragdools in 1960s. They are best known for their docile, 
placid temperament and affectionate nature.

Retreival text: A domestic short-haired cat is a cat possessing a coat of short fur, not belonging to any particular recognized cat breed. In the United Kingdom, they are colloquially called moggies.

Response: [Not Relevant]

Now complete the following:
Claim: {input_text}

Retrieval text: {evidences}

Response:
""")
    
    prompt_template = [
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": instruction}
            ]
        }
    ]

    FastVisionModel.for_inference(llm_model)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    formatted_text = tokenizer.apply_chat_template(prompt_template, add_generation_prompt = True)
    input_ids = tokenizer(None, formatted_text, add_special_tokens = False, return_tensors = "pt").to(device)

    output_encoded = llm_model.generate(**input_ids, max_new_tokens = 8192, temperature = 0.1, use_cache = True)
    prompt_length = input_ids['input_ids'].shape[1]
    output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)

    return output_decoded

def textSummarizationWithRAGPipeline(llm_model: FastVisionModel, tokenizer: AutoTokenizer, input_text: str) -> str:

    queries = []
    claims = claimGenerationWithMultiModelLLM(llm_model, tokenizer, input_text)



# llm_model, tokenizer = loadMultiModalLLM()
# result = claimGenerationWithMultiModelLLM(llm_model, tokenizer, "Audi AG () is a German automobile manufacturer that designs, engineers, produces, markets and distributes luxury vehicles. Audi is a subsidiary of Volkswagen Group and has its roots at Ingolstadt, Bavaria, Germany. Audi vehicles are produced in nine production facilities worldwide.")
# print(result)
# result = queryGenerationFromClaimsWithMultiModelLLM(llm_model, tokenizer, "Audi vehicles are produced in nine production facilities worldwide")
# print(result)
# result = retrieveArxivPapers("Audi production facilities")
# print(result)
# result = claimVerificationWithMultiModelLLM(llm_model, tokenizer, "Audi vehicles are produced in nine production facilities worldwide", "Audi AG () is a German automobile manufacturer that designs, engineers, produces, markets and distributes luxury vehicles. Audi is a subsidiary of Volkswagen Group and has its roots at Ingolstadt, Bavaria, Germany. Audi vehicles are produced in nine production facilities worldwide.")
# print(result)
# result = textSummarizationWithRAG(llm_model, tokenizer, "Audi AG () is a German automobile manufacturer that designs, engineers, produces, markets and distributes luxury vehicles. Audi is a subsidiary of Volkswagen Group and has its roots at Ingolstadt, Bavaria, Germany. Audi vehicles are produced in nine production facilities worldwide.", "We adapt the approach of Rudnev, Shakan, and Shkredov to prove that in an arbitrary field $\mathbb{F}$, for all $A \subset \mathbb{F}$ finite with $|A| <p^{1/4}$ if $p:= Char(\mathbb{F})$ is positive, we have $$|A(A+1)| \gtrsim|A|^{11/9}, \qquad |AA| + |(A+1)(A+1)| \gtrsim |A|^{11/9}.$$ This improves uponthe exponent of $6/5$ given by an incidence theorem of Stevens and de Zeeuw.")
# print(result)

# claims = claimGenerationWithMultiModelLLM(llm_model, tokenizer, summarized_text)
# print(claims)
# if (claims.endswith("]") == False):
#     claims = claims + "]"

# claims_json = json.loads(claims)
# print(claims_json)

# queries_set = set()
# for claim in claims_json:
#     query = queryGenerationFromClaimsWithMultiModelLLM(llm_model, tokenizer, claim['claim'])
#     query_array = ast.literal_eval(query)
#     for query in query_array:
#         queries_set.add(query)

# print(queries_set)

# single_query = narrowDownQueriesWithMultiModelLLM(llm_model, tokenizer, summarized_text, queries_set)
# print(single_query)
# evidences = []
# for query in queries_set:
#     evidences.append(retrieveArxivPapers(query))

# print("\n")
# print(evidences)

# verification_results = []
# for idx, claim in enumerate(claims_json):
#     verification_result = textSummarizationWithRAG(llm_model, tokenizer, claim['claim'], evidences[idx])
#     verification_results.append(verification_result)

# print("\n")
# print(verification_results)

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


## Pipeline -> Claim Generation -> Identify Noteable Claims -> Generate Queries -> Retrieve Evidences -> Verify Claims

def doc_to_sentences(doc: str) -> list[str]:
    sentences = nltk.sent_tokenize(doc)
    sentences = [s.strip() for s in sentences if len(s.strip()) >= 3]

    return sentences

def convertTextToSentence(text: str, model: FastVisionModel, tokenizer: AutoTokenizer, num_retries = 3) -> list[str]:

    results = None
    user_input = SENTENCES_TO_CLAIMS_PROMPT.format(doc = text).strip()
    for _ in range(num_retries):
        try:
            r = generateLLMOutput(model, tokenizer, user_input, system_role =  "You are good at decomposing and decontextualizing text.")
            results = eval(r)
            break
        except Exception as e:
            print(f"An unexpected error occured: {e}")
    
    if isinstance(results, list):
        return results
    else:
        print(f"Model output error. It does not output a list of sentences correctly, return NLTK split results.")
        return doc_to_sentences(text)
    
def identifyCheckWorthiness(texts: list[str], model: FastVisionModel, tokenizer: AutoTokenizer, num_retries = 3) -> list[str]:

    results = ["Yes"] * len(texts)

    for _ in range(num_retries):
        try:
            user_input = CHECKWORTHY_PROMPT.format(texts = texts)
            r = generateLLMOutput(model, tokenizer, user_input, system_role = "You are a helpful fact checker assistant.")
            results = eval(r)
            assert(len(results) == len(texts))
            break
        
        except AssertionError as e:
            print(f"An unexpected error occured: {e}")
            print(f"There is {len(texts)} claims, while {len(results)} checkworthy results.")
            results = ["Yes"] * len(texts)
            print(f"Returning default results.: {results}")

        except Exception as e:
            print(f"An unexpected error occured: {e}")

    return results


# 

def is_tag_visible(element: bs4.element) -> bool:
    if element.parent.name in [
        "style",
        "script",
        "head",
        "title",
        "meta",
        "[document]",
    ] or isinstance(element, bs4.element.Comment):
        return False

    return True

def remove_duplicate_questions(model: CrossEncoder, all_questions: list[str]) -> list[str]:

    qset = [all_questions[0]]
    for question in all_questions[1:]:
        q_list = [(q, question) for q in qset]
        scores = model.predict(q_list)
        if np.max(scores) < 0.60:
            qset.append(question)
    # print(f"Qset: {qset}")
    return qset


def search_google(query: str, num_web_pages: int = 10, timeout: int = 6, save_url: str = '') -> list[str]:

    query = query.replace(" ", "+")

    USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:65.0) Gecko/20100101 Firefox/65.0"
    # mobile user-agent
    MOBILE_USER_AGENT = "Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36"
    headers = {'User-Agent': USER_AGENT}

    lang = "en"
    urls = []
    for page in range(0, num_web_pages, 10):
        url = "https://www.google.com/search?q={}&lr=lang_{}&hl={}&start={}".format(query, lang, lang, page)
        r = requests.get(url, headers = headers, timeout = timeout)
        urls += re.findall('href="(https?://.*?)"', r.text)
    
    urls = list(set(urls))

    if not save_url == "":
        with open(save_url, 'w') as file:
            for url in urls:
                file.write(url + "\n")
    
    return urls

def scrape_url(url: str, timeout: float = 3) -> tuple[str, str]:
    
    # Scrape the URL
    try:
        response = requests.get(url, timeout = timeout)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        return None, url
    
    # Extract out all the text from the tags
    try:
        soup = bs4.BeautifulSoup(response.text, "html.parser")
        texts = soup.findAll(string = True)

        visible_text = filter(is_tag_visible, texts)
    except Exception as e:
        return None, url
    
    web_text = " ".join(t.strip() for t in visible_text).strip()
    web_text = " ".join(web_text.split())
    return web_text, url

def chunk_text(text:str, tokenizer, sentences_per_passage: int = 5, filter_sentence_len: int = 250, sliding_distance: int = 2) -> list[str]:
    if not sliding_distance or sliding_distance > sentences_per_passage:
        sliding_distance = sentences_per_passage
    assert sentences_per_passage > 0 and sliding_distance > 0

    passages = []
    try:
        doc = tokenizer(text[:500000])  # Take 500k chars to not break tokenization.
        sents = [
            s.text.replace("\n", " ")
            for s in doc.sents
            if len(s.text) <= filter_sentence_len
        ]
        for idx in range(0, len(sents), sliding_distance):
            passages.append((" ".join(sents[idx : idx + sentences_per_passage]), idx, idx + sentences_per_passage - 1))
    except UnicodeEncodeError as _:
        print("Unicode error when using Spacy. Skipping text.")
    
    return passages


def get_relevant_snippets(query: str, tokenizer, passage_ranker, timeout = 10, max_search_results_per_query = 5, max_passages_per_search_result_to_return = 2, sentences_per_passage = 5):
    search_results = search_google(query, timeout = timeout)

    with concurrent.futures.ThreadPoolExecutor() as e:
        scraped_results = e.map(scrape_url, search_results, itertools.repeat(timeout))
    
    scraped_results = [r for r in scraped_results if r[0] and ".pdf" not in r[1]]

    retrieved_passages = list()
    for webtext, url in scraped_results[:max_search_results_per_query]:
        passages = chunk_text(text = webtext, tokenizer = tokenizer, sentences_per_passage = sentences_per_passage)
        if not passages:
            continue

        # Score the passages by relevance to the query using a cross-encoder
        scores = passage_ranker.predict([(query, p[0]) for p in passages]).tolist()
        passage_scores = list(zip(passages, scores))

        # Take the top passages_per_search passages for the current search results
        passage_scores.sort(key = lambda x: x[1], reverse = True)

        relevant_items = list()
        for passage_item, score in passage_scores:
            overlap = False
            if len(relevant_items) > 0:
                for item in relevant_items:
                    if passage_item[1] >= item[1] and passage_item[1] <= item[2]:
                        overlap = True
                        break
                    if passage_item[2] >= item[1] and passage_item[2] <= item[2]:
                        overlap = True
                        break
            
            if not overlap:
                relevant_items.append(deepcopy(passage_item))
                retrieved_passages.append(
                    {
                        "text": passage_item[0],
                        "url": url,
                        "sents_per_passage": sentences_per_passage,
                        "retrieval_score": score, # Cross-encoder score as retr score
                    }
                )

            if len(relevant_items) >= max_passages_per_search_result_to_return:
                break
        
    
    return retrieved_passages

def run_question_generation(prompt: str, model: FastVisionModel, tokenizer: AutoTokenizer, temperature, num_rounds, num_retries = 3) -> list[str]:
    questions = set()
    for _ in range(num_rounds):
        for _ in range(num_retries):
            try:
                r = generateLLMOutput(model, tokenizer, prompt, system_role = "You are tasked to verify the factuality of the provided statements by Googling and reference any related resources in your training data.")
                cur_round_questions = parse_api_response(r.strip())
                questions.update(cur_round_questions)
                break

            except Exception as e:
                print(f"{e}. Retrying...")
    
    questions = list(sorted(questions))
    # print(questions)
    return questions

def getWebEvidencesForClaim(llm_model:FastVisionModel, llm_tokenizer: AutoTokenizer, claim: str):

    evidences = dict()
    evidences['aggregated'] = list()
    # question_duplicate_model = CrossEncoder('navteca/quora-roberta-base', device=torch.device("cuda:0" if torch.cuda.is_available() else "cpu"),)
    # tokenizer = spacy.load("en_core_web_sm", disable=["ner", "tagger", "lemmatizer"])
    # passage_ranker = CrossEncoder(
    #     "cross-encoder/ms-marco-MiniLM-L-6-v2",
    #     max_length=512,
    #     device=torch.device("cuda" if torch.cuda.is_available() else "cpu"),
    # )

    questions = []
    while len(questions) <= 0:
        questions = run_question_generation(
            prompt = QGEN_PROMPT.format(claim = claim),
            model = llm_model,
            tokenizer = llm_tokenizer,
            temperature = 0.7,
            num_rounds = 2
        )
    
    questions = list(set(questions))
    
    if len(questions) > 0:
        questions = remove_duplicate_questions(question_duplicate_model, questions)
    
    questions = list(questions)
    snippets = dict()
    for question in questions:
        snippets[question] = get_relevant_snippets(question, question_duplicate_tokenizer, passage_ranker, max_search_results_per_query = 5, max_passages_per_search_result_to_return = 3)
        snippets[question] = deepcopy(sorted(snippets[question], key = lambda snippet: snippet["retrieval_score"], reverse = True)[:5])

    evidences['question_wise'] = deepcopy(snippets)
    while len(evidences["aggregated"]) < 5:
        for key in evidences["question_wise"]:
            if len(evidences["question_wise"][key]) == 0:
                print("No evidence found for question: ", key)
                evidences["aggregated"].append(                    
                    {
                        "text": ""
                    })
                continue
            # Take top evidences for each question
            index = int(len(evidences["aggregated"])/len(evidences["question_wise"]))
            # print(evidences['question_wise'])
            # print(f"Index: {index}")
            # print(f"Key: {key}")
            evidences["aggregated"].append(evidences["question_wise"][key][index])
            if len(evidences["aggregated"]) >= 5:
                break

    return evidences

stance_map = {
    "A": "support",
    "B": "refute",
    "C": "irrelevant"
}

def parse_stance_results(r):
    try:
        return stance_map[r[0]]
    except KeyError:
        if "A" in r and "support" in r:
            return "support"
        elif "B" in r and "refute" in r:
            return "refute"
        elif "C" in r and "irrelevant" in r:
            return "irrelevant"
    except Exception as e:
        print(f"An unexpected error occurred: {r}.")
        return "irrelevant"


def stance(evidence, claim, model: FastVisionModel, tokenizer: AutoTokenizer) -> str:
    prompt = IDENTIFY_STANCE_PROMPT.format(claim = claim, evidence = evidence)
    r = generateLLMOutput(model, tokenizer, prompt, system_role = "You are a helpful factchecker assistant")

    return parse_stance_results(r)

def verify_by_stance(claim: str, evidences: list[str], model: FastVisionModel, tokenizer: AutoTokenizer) -> any:
    labels = []
    for evidence in evidences:
        labels.append(stance(evidence, claim, model=model))
    
    # based on stances of evidence, determine the true/false claim by rules
    # if there is one evidence supports, we assume it is correct
    if "support" in labels:
        return True
    # if there isn't support, but refute and irrelevant, we regard as false
    elif "refute" in labels:
        return False
    else:
        # all irrelevant
        return False

def verify_claim(claim: str, evidences: list[str], model: FastVisionModel, tokenizer: AutoTokenizer, num_retries: int = 3) -> dict[str, any]:

    results = {}
    user_input = VERIFY_PROMPT.format(claim = claim, evidence = evidences)
    for _ in range(num_retries):
        try:
            r = generateLLMOutput(model, tokenizer, user_input, system_role = "You are a helpful factchecker assistant")
            results = eval(r)
            break
        except Exception as e:
            print(f"An unexpected error occured: {e}")
    
    if isinstance(results, dict):
        return results
    else:
        print(f"Error output {r}. It does not output a dict, return factual label by stance aggregation.")
        factual_label = verify_by_stance(claim, evidences, model)
        results = {
            "reasoning": "",
            "error": "",
            "correction": "",
            "factuality": factual_label
        }
        return results

def verify_document(claims: list[str], evidence: list[list[str]], model: FastVisionModel, tokenizer: AutoTokenizer, num_retries: int = 3) -> any:
    results = []
    for claim, evidence_list in zip(claims, evidence):
        result = verify_claim(claim, evidence_list, model = model, tokenizer = tokenizer, num_retries = num_retries)
        result["claim"] = claim
        result["evidence"] = evidence_list
        results.append(result)
    
    df = pd.DataFrame(results)

    return all(df["factuality"]), df


# def identifyCheckWorthiness(claims: list[str], num_retries = 3) -> list[str]:
#     instruction = (
# f"""
# You are given a list of texts that are extracted from a summarized text.
# Your task is to identify whether texts are checkworthy in the context of fact-checking.
# You should only return a list of strings, where each string selects from ["Yes", "No"] for each text.
# For example:
# Texts: ["I think Apple is a good company.", "Friends is a great TV series.", "Are you sure Preslav is a professor in MBZUAI?", "The Stanford Prison Experiment was conducted in the basement of Encina Hall.", "As a language model, I can't provide these info."]
# Response: ["No", "Yes", "No", "Yes", "No"]


# Texts: {claims}
# DO NOT RETURN ANYTHING ELSE. START YOUR RESPONSE WITH '['.
# Response:
# """)

#     prompt_template = [
#         {
#             "role": "system",
#             "content": "You are a helpful factchecker assistant."
#         },
#         {
#             "role": "user",
#             "content": [
#                 {"type": "text", "text": instruction}
#             ]
#         }
#     ]

#     results = ["Yes"] * len(claims)

#     for _ in range(num_retries):
#         try:
#             FastVisionModel.for_inference(llm_model)
#             device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
#             formatted_text = tokenizer.apply_chat_template(prompt_template, add_generation_prompt = True)
#             input_ids = tokenizer(None, formatted_text, add_special_tokens = False, return_tensors = "pt").to(device)

#             output_encoded = llm_model.generate(**input_ids, max_new_tokens = 8192, temperature = 0.1, use_cache = True)
#             prompt_length = input_ids['input_ids'].shape[1]
#             output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)

#             eval()

#         except AssertionError as e:
#             print(f"An unexpected error occured: {e}")
#             print(f"There is {len(claims)} claims, while {len(results)} checkworthy results.")
#         except Exception as e:
#             print(f"An unexpected error occured: {e}")
        
#     return results


# Retrieval Functions

def parse_api_response(response: str) -> list[str]:
    split_string = "."
    questions = []
    for question in response.split("\n"):
        if split_string not in question:
            continue
        question = question.split(split_string)[1].strip()
        questions.append(question)
    
    return questions

def revise_response(response: str, claim_list: list[str],  model: FastVisionModel, tokenizer: AutoTokenizer, question = None, prompt_mode = ["with-question", "no-question"][1]) -> str:

    if prompt_mode == "with-question":
        user_input = zero_shot_edit_response_given_question.format(prompt = question, response = response, claims = claim_list)
    else:
        user_input = zero_shot_edit_response.format(response = response, claims = claim_list)
    
    r = generateLLMOutput(model, tokenizer, user_input, system_role = "You are good at correcting factual errors depending on correct claims.")

    return r
    

llm_model, tokenizer = loadMultiModalLLM()

summarized_text = "Machine learning (ML) is not an artificial intelligence (AI). ML is focused on developing algorithms and statistical models that enable computers to perform tasks without explicit programming. Instead of relying on pre-defined instructions, machine learning systems learn patterns and relationships from data to make predictions or decisions. At its core, ML can be categorized into three main types: supervised learning, unsupervised learning, and reinforcement learning. In supervised learning, algorithms are trained on labeled datasets, where the input-output pairs are explicitly provided, making it suitable for tasks like classification and regression. Unsupervised learning, on the other hand, deals with unlabeled data, using techniques such as clustering and dimensionality reduction to discover hidden patterns. Reinforcement learning involves an agent interacting with an environment, learning optimal strategies through rewards and penalties. Common algorithms include decision trees, support vector machines, neural networks, and k-means clustering. Machine learning has found applications in diverse fields, including natural language processing, computer vision, recommendation systems, and autonomous vehicles. However, ML models are not without challenges; issues such as data bias, overfitting, and interpretability remain significant concerns in the field. As technology advances, machine learning continues to play a critical role in driving innovation and solving complex problems across industries."
claims = convertTextToSentence(text = summarized_text, model = llm_model, tokenizer = tokenizer)
print(claims)
checkworthy_results = identifyCheckWorthiness(texts = claims, model = llm_model, tokenizer = tokenizer)
print(checkworthy_results)
evidence = []
for i, claim in enumerate(claims):
    print(i)
    if checkworthy_results[i].lower() == "yes":
        evidences = getWebEvidencesForClaim(llm_model, tokenizer, claim)
        evids = [evid['text'] for evid in evidences['aggregated']]
    else:
        evids = []
    evidence.append(evids)

label, log = verify_document(claims, evidence, model = llm_model, tokenizer = tokenizer, num_retries = 3)
print("Label: \n")
print(label)
print("Log: \n")
print(log)
log["checkworthy"] = checkworthy_results
print("\n\n\n")
print("Final Result:")
def print_full(x):
    pd.set_option('display.max_rows', len(x))
    print(x)
    pd.reset_option('display.max_rows')
print_full(log)
print(log.columns)

revised_text = revise_response(summarized_text, log["claim"].tolist(), model = llm_model, tokenizer = tokenizer)
print(revised_text)
# print(evidence)
# evidences = []

# string = "2. Is machine learning a part of artificial intelligence?"
# print(string.split(".")[1].strip())
# print("." in string)
