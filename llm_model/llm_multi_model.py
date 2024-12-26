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