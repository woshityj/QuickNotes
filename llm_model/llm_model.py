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

os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "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"
os.environ["HUGGINGFACEHUB_API_TOKEN"] = "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"

device = "cuda"
torch.cuda.empty_cache()

class Message(BaseModel):
    role: str
    content: str

def load_peft_model():

    if (is_flash_attn_2_available() and (torch.cuda.get_device_capability(0)[0] >= 8)):
        attn_implementation = "flash_attention_2"
    else:
        attn_implementation = "sdpa"

    print(f"[INFO] Using attention implementation: {attn_implementation}")

    model_id = "woshityj/llama_3.2_3B_Instruct_bnb_finetuned"
    print(f"[INFO] Using model_id: {model_id}")

    peft_model, tokenizer = FastLanguageModel.from_pretrained(
        model_name = model_id,
        max_seq_length = 8192,
        dtype = None,
        load_in_4bit = True,
        token = "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"
    )

    peft_model.to(device)

    return peft_model, tokenizer

def load_multi_modal_llm():

    if (is_flash_attn_2_available() and (torch.cuda.get_device_capability(0)[0] >= 8)):
        attn_implementation = "flash_attention_2"
    else:
        attn_implementation = "sdpa"

    print(f"[INFO] Using attention implementation: {attn_implementation}")

    model_id = "unsloth/Llama-3.2-11B-Vision-Instruct-bnb-4bit"
    print(f"[INFO] Using model_id: {model_id}")

    peft_model, tokenizer = FastVisionModel.from_pretrained(
        model_name = model_id,
        max_seq_length = 8192,
        dtype = None,
        load_in_4bit = True,
        token = "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"
    )

    peft_model.to(device)

    return peft_model, tokenizer

def text_summarization_multi_modal(llm_model: FastVisionModel, tokenizer: AutoTokenizer, input_text: str) -> str:

    instruction = (
f"""Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

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
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    input_text = tokenizer.apply_chat_template(messages, add_generation_prompt = True)
    input_ids = tokenizer(None, input_text, add_special_tokens = False, return_tensors = 'pt').to(device)
    FastVisionModel.for_inference(llm_model)

    output_encoded = llm_model.generate(**input_ids, max_new_tokens = 8192, temperature = 0.1, use_cache = True)
    prompt_length = input_ids['input_ids'].shape[1]
    output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)

    return output_decoded

async def text_with_image(llm_model: FastVisionModel, tokenizer: AutoTokenizer, input_text: str, image: Image):

    messages = [
        {"role": "user", "content": [
            {"type": "image" },
            {"type": "text", "text": input_text}
        ]}
    ]

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    input_text = tokenizer.apply_chat_template(messages, add_generation_prompt = True)
    inputs = tokenizer(image, input_text, return_tensors = 'pt', add_special_tokens = False).to(device)

    output_encoded = llm_model.generate(**inputs, max_new_tokens = 8192, temperature = 0.1, use_cache = True)
    prompt_length = inputs['input_ids'].shape[1]
    output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)

    return output_decoded


# def load_llm_model() -> (AutoModelForCausalLM, AutoTokenizer):

#     if (is_flash_attn_2_available() and (torch.cuda.get_device_capability(0)[0] >= 8)):
#         attn_implementation = "flash_attention_2"
#     else:
#         attn_implementation = "sdpa"
    
#     print(f"[INFO] Using attention implementation: {attn_implementation}")

#     model_id = "meta-llama/Llama-3.2-3B-Instruct"
#     print(f"[INFO] Using model_id: {model_id}")

#     tokenizer = AutoTokenizer.from_pretrained(pretrained_model_name_or_path = model_id)
#     llm_model = AutoModelForCausalLM.from_pretrained(pretrained_model_name_or_path = model_id,
#                                                     torch_dtype = torch.float16,
#                                                     low_cpu_mem_usage = False,
#                                                     attn_implementation = attn_implementation)
    
#     llm_model.to(device)

#     return llm_model, tokenizer

async def text_summarization(llm_model: FastLanguageModel, tokenizer: AutoTokenizer, input_text: str) -> str:
    
    prompt = (
f"""Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
Summarize the following text.

### Input:
{input_text}

### Response:
""")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    input_ids = tokenizer(prompt, return_tensors = 'pt').to(device)
    FastLanguageModel.for_inference(llm_model)

    output_encoded = llm_model.generate(**input_ids, max_new_tokens = 8192, temperature = 0.1)
    prompt_length = input_ids['input_ids'].shape[1]
    output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)

    return output_decoded

def format_text_for_document(retrieved_docs: ArxivRetriever) -> str:
    
    format_text = "\n\n".join(doc.page_content for doc in retrieved_docs)

    return format_text

def retrieve_arxiv_documents(num_of_docs_to_load: int, input_text: str) -> str:
    
    retriever = ArxivRetriever(
        load_max_docs = 3,
        get_ful_document = False
    )

    retrieved_docs = retriever.invoke(input_text)
    formatted_docs_content = format_text_for_document(retrieved_docs)

    return formatted_docs_content

def text_summarization_with_rag_validation(llm_model: AutoModelForCausalLM, tokenizer: AutoTokenizer, input_text: str) -> str:
    
    context = retrieve_arxiv_documents(3, input_text)

    prompt_template = (
f"""
You are instructed to finish following text step by step. Here is the user text: ###{input_text}###.
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

    dialogue_template = [
        {"role": "user",
        "content": prompt_template}
    ]

    prompt = tokenizer.apply_chat_template(dialogue_template, add_generation_prompt = False, tokenize = False)
    
    input_ids = tokenizer(prompt, return_tensors = "pt").to("cuda")

    output_encoded = llm_model.generate(**input_ids, max_new_tokens = 2048, temperature = 0.1)

    output_decoded = tokenizer.decode(output_encoded[0])

    output_decoded = (output_decoded.replace(prompt, '')
                                    .replace('<|eot_id|>', '')
                                    .replace('<|start_header_id|>', '')
                                    .replace('<|end_header_id|>', '')
                                    .replace('<|begin_of_text|>', ''))
    
    return output_decoded

async def custom_chat_multi_modal_llm(llm_model: FastVisionModel, tokenizer: AutoTokenizer, messages: list[Message]) -> str:
    dialogue_template = [
        {
            "role": "system",
            "content": "You are a helpful assistant. Answer all questions to the best of your ability in English."
        }
    ]

    for message in messages:
        dialogue_template.append({
            "role": message.role,
            "content": [
                {"type": "text", "text": message.content}
            ]
        })
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    input_text = tokenizer.apply_chat_template(dialogue_template, add_generation_prompt = True, tokenize = False)

    FastVisionModel.for_inference(llm_model)
    inputs = tokenizer(None, input_text, return_tensors = 'pt', add_special_tokens = False).to(device)

    output_encoded = llm_model.generate(**inputs, max_new_tokens = 8192, temperature = 0.1, use_cache = True)
    prompt_length = inputs['input_ids'].shape[1]
    output_decoded = tokenizer.decode(output_encoded[0][prompt_length:], skip_special_tokens = True)

    return output_decoded

async def custom_chat(llm_model: FastLanguageModel, tokenizer: AutoTokenizer, messages: list[Message]) -> str:
    
    dialogue_template = [
        {
            "role": "system",
            "content": "You are a helpful assistant. Answer all questions to the best of your ability in English."
        }
    ]

    for message in messages:
        dialogue_template.append({
            "role": message.role,
            "content": message.content
        })

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    prompt = tokenizer.apply_chat_template(dialogue_template, add_generation_prompt = True, tokenize = False)

    # print(prompt)

    FastLanguageModel.for_inference(llm_model)

    input_ids = tokenizer(prompt, return_tensors = "pt").to(device)
    output_encoded = llm_model.generate(input_ids = input_ids['input_ids'], attention_mask = input_ids['attention_mask'], max_new_tokens = 8192, temperature = 0.1, do_sample = True)

    output_decoded = tokenizer.decode(output_encoded[0], skip_special_tokens = True)

    response_content = output_decoded.split("assistant")[-1].strip()

    return response_content

# llm_model, tokenizer = load_multi_modal_llm()
# user_content = "Computing is part of everything we do. Computing drives innovation in engineering, business, entertainment, education, and the sciences—and it provides solutions to complex, challenging problems of all kinds. Computer science is the study of computers and computational systems. It is a broad field which includes everything from the algorithms that make up software to how software interacts with hardware to how well software is developed and designed. Computer scientists use various mathematical algorithms, coding procedures, and their expert programming skills to study computer processes and develop new software and systems."
# print(text_summarization_multi_modal(llm_model, tokenizer, user_content))

# llm_model, tokenizer = load_llm_model()
# user_content = "When the ASCII value of a character is converted to binary, it can be seen that the sixth-bit changes from 1 to 0 when going from lowercase to uppercase of a character, and the rest remains the same."
# print(text_summarization(llm_model, tokenizer, user_content))
# print(text_summarization_with_rag_validation(llm_model, tokenizer, user_content))

# retrieve_arxiv_documents(3, "What is the ImageBind model?")
