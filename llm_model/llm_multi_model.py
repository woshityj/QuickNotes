import os
import torch
import logging

from rag import rag_retrieval
from PIL import Image
from pydantic import BaseModel
from prompts import QUESTION_WITH_RAG_PROMPT, TEXT_SUMMARIZATION_PROMPT, VIDEO_TRANSCRIPT_PROMPT, PDF_PROMPT
from transformers import AutoTokenizer
from transformers.utils import is_flash_attn_2_available
from typing import Tuple
from unsloth import FastVisionModel, FastLanguageModel, get_chat_template

os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "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"
os.environ["HUGGINGFACEHUB_API_TOKEN"] = "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"

# LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT="https://api.smith.langchain.com"
# LANGCHAIN_API_KEY="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"
LANGCHAIN_PROJECT="capstone"
HUGGING_FACE_API_TOKEN = "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"

# retriever = ArxivRetriever(load_max_docs = 2, get_ful_documents = True)

logger = logging.getLogger("uvicorn.error")

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

def generateLLMOutput(model: FastVisionModel|FastLanguageModel, tokenizer: AutoTokenizer, input_text: str, system_role: str = "You are a helpful assistant.") -> str:

    # if type(model) is FastVisionModel:
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
    # else:
    #     # messages = [
    #     # {
    #     #     "role": "system",
    #     #     "content": system_role
    #     # },
    #     # {
    #     #     "role": "user",
    #     #     "content": input_text
    #     # }]

    #     FastLanguageModel.for_inference(model)
    #     device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    #     # tokenizer = get_chat_template(
    #     #     tokenizer,
    #     #     chat_template = "Gemma"
    #     # )

    #     # formatted_text = tokenizer.apply_chat_template(messages, add_generation_prompt = False, tokenize = False)
    #     input_ids = tokenizer(input_text, add_special_tokens = False, return_tensors = "pt").to(device)
    #     output_encoded = model.generate(**input_ids, max_new_tokens = 8192, temperature = 0.7, use_cache = True)
    #     prompt_length = input_ids['input_ids'].shape[1]
    #     output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)
    #     output_decoded = output_decoded.replace("user\n", "")
    #     output_decoded = output_decoded.replace("true", "True")
    #     output_decoded = output_decoded.replace("false", "False")
    return output_decoded

async def textSummarizationMultiModal(llm_model: FastVisionModel, tokenizer: AutoTokenizer, input_text: str) -> str:
    
    prompt = TEXT_SUMMARIZATION_PROMPT.format(input_text = input_text)
    
    messages = [
        {"role": "user", "content": [
            {"type": "text", "text": prompt}
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

async def pdfWithMultiModelLLM(llm_model: FastVisionModel, tokenizer: AutoTokenizer, input_text: str, md_text: str) -> str:

    prompt = PDF_PROMPT.format(input_text = input_text, md_text = md_text)

    dialogue_template = [
        {
            "role": "system",
            "content": "You are a helpful assistant. Answer all questions to the best of your ability in English."
        }
    ]
    
    dialogue_template.append({
        "role": "user",
        "content": [
            {"type": "text", "text": prompt}
        ]
    })

    FastVisionModel.for_inference(llm_model)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    formatted_text = tokenizer.apply_chat_template(dialogue_template, add_generation_prompt = True)
    input_ids = tokenizer(None, formatted_text, return_tensors = "pt", add_special_tokens = False).to(device)

    output_encoded = llm_model.generate(**input_ids, max_new_tokens = 8192, temperature = 0.1, use_cache = True)
    prompt_length = input_ids['input_ids'].shape[1]
    output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)

    return output_decoded


async def customChatVideoTranscriptWithMultiModelLLM(llm_model: FastVisionModel, tokenizer: AutoTokenizer, input_text: str, video_transcript: str) -> str:

    prompt = VIDEO_TRANSCRIPT_PROMPT.format(input_text = input_text, video_transcript = video_transcript)

    dialogue_template = [
        {
            "role": "system",
            "content": "You are a helpful assistant. Answer all questions to the best of your ability in English."
        }
    ]
    
    dialogue_template.append({
        "role": "user",
        "content": [
            {"type": "text", "text": prompt}
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

async def question_and_answer_with_rag(llm_model: FastVisionModel, tokenizer: AutoTokenizer, question: str, embeddings_model) -> str:

    docs = rag_retrieval(question, embeddings_model)
    context = "\n".join(x["text"] for x in docs)
    user_input = QUESTION_WITH_RAG_PROMPT.format(context = context, question = question)
    
    logger.info(f"RAG User Input: {user_input}")
    
    r = generateLLMOutput(llm_model, tokenizer, user_input)
    logger.info(f"RAG Response: {r}")

    return r

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
