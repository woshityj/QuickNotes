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

from langchain_community.retrievers import ArxivRetriever

from pydantic import BaseModel

from typing import Tuple

from sentence_transformers import CrossEncoder
from copy import deepcopy

import spacy

import pandas as pd

os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "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"
os.environ["HUGGINGFACEHUB_API_TOKEN"] = "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"

device = "cuda"
torch.cuda.empty_cache()

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

# summarized_text = "Machine learning (ML) is not an artificial intelligence (AI). ML is focused on developing algorithms and statistical models that enable computers to perform tasks without explicit programming. Instead of relying on pre-defined instructions, machine learning systems learn patterns and relationships from data to make predictions or decisions. At its core, ML can be categorized into three main types: supervised learning, unsupervised learning, and reinforcement learning. In supervised learning, algorithms are trained on labeled datasets, where the input-output pairs are explicitly provided, making it suitable for tasks like classification and regression. Unsupervised learning, on the other hand, deals with unlabeled data, using techniques such as clustering and dimensionality reduction to discover hidden patterns. Reinforcement learning involves an agent interacting with an environment, learning optimal strategies through rewards and penalties. Common algorithms include decision trees, support vector machines, neural networks, and k-means clustering. Machine learning has found applications in diverse fields, including natural language processing, computer vision, recommendation systems, and autonomous vehicles. However, ML models are not without challenges; issues such as data bias, overfitting, and interpretability remain significant concerns in the field. As technology advances, machine learning continues to play a critical role in driving innovation and solving complex problems across industries."
# claims = convertTextToSentence(text = summarized_text, model = llm_model, tokenizer = tokenizer)
# print(claims)
# checkworthy_results = identifyCheckWorthiness(texts = claims, model = llm_model, tokenizer = tokenizer)
# print(checkworthy_results)
# evidence = []
# for i, claim in enumerate(claims):
#     print(i)
#     if checkworthy_results[i].lower() == "yes":
#         evidences = getWebEvidencesForClaim(llm_model, tokenizer, claim)
#         evids = [evid['text'] for evid in evidences['aggregated']]
#     else:
#         evids = []
#     evidence.append(evids)

# label, log = verify_document(claims, evidence, model = llm_model, tokenizer = tokenizer, num_retries = 3)
# print("Label: \n")
# print(label)
# print("Log: \n")
# print(log)
# log["checkworthy"] = checkworthy_results
# print("\n\n\n")
# print("Final Result:")
# def print_full(x):
#     pd.set_option('display.max_rows', len(x))
#     print(x)
#     pd.reset_option('display.max_rows')
# print_full(log)
# print(log.columns)

# revised_text = revise_response(summarized_text, log["claim"].tolist(), model = llm_model, tokenizer = tokenizer)
# print(revised_text)
# print(evidence)
# evidences = []

# string = "2. Is machine learning a part of artificial intelligence?"
# print(string.split(".")[1].strip())
# print("." in string)
