# from flask import Flask, request, jsonify
# from llm_model import load_peft_model, load_multi_modal_llm, text_summarization, text_summarization_with_rag_validation, custom_chat, text_with_image, custom_chat_multi_modal_llm
from llm_multi_model import loadMultiModalLLM, textSummarizationMultiModal, customChatWithMultiModelLLM, imagesWithMultiModelLLM, customChatVideoTranscriptWithMultiModelLLM
from document_processing import convertBase64PDFToImages, convertVideoToText

from fastapi import FastAPI, UploadFile, File, Form, Depends
from fastapi.encoders import jsonable_encoder
from fastapi import HTTPException, status
import uvicorn
from pydantic import BaseModel, Field

from typing import List

import json
from io import BytesIO

from PIL import Image

from typing import Annotated, IO, Optional
import filetype

import ast

import base64

class Content(BaseModel):
    content: str

class Message(BaseModel):
    role: str
    content: str

class Messages(BaseModel):
    messages: list[Message]

app = FastAPI()
# llm_model, tokenizer = load_peft_model()
llm_model, tokenizer = loadMultiModalLLM()

def convert_messages_to_json(messages: List[Message]) -> str:

    message_dicts = [
        {
            "role": message.role,
            "content": message.content
        } for message in messages
    ]

    return json.dump(message_dicts)

def check_file_type_image(file: IO):
    FILE_SIZE = 2097152 # 2MB

    accepted_image_types = ["png", "jpeg", "jpg"]

    file_info = filetype.guess(file)
    print(file_info)
    if file_info is None:
        return False
    
    detected_file_type = file_info.extension.lower()
    print(detected_file_type)

    if (detected_file_type not in accepted_image_types):
        return False
    
    file.seek(0, 2)
    real_file_size = file.tell()
    file.seek(0)

    if (real_file_size > FILE_SIZE):
        return False
        
    return True

def check_file_type_pdf(file: IO):
    FILE_SIZE = 52428800 # 50MB

    accepted_pdf_types = ["pdf"]

    file_info = filetype.guess(file)
    if file_info is None:
        return False
        
    detected_file_type = file_info.extension.lower()
    if (detected_file_type not in accepted_pdf_types):
        return False
    
    file.seek(0, 2)
    real_file_size = file.tell()
    file.seek(0)

    if (real_file_size > FILE_SIZE):
        return False
            
    return True

def check_file_type_video(file: IO):
    FILE_SIZE = 52428800 # 50MB

    accepted_video_types = ["mp4"]

    file_info = filetype.guess(file)
    if file_info is None:
        return False
    
    detected_file_type = file_info.extension.lower()
    if (detected_file_type not in accepted_video_types):
        return False
    
    file.seek(0, 2)
    real_file_size = file.tell()
    file.seek(0)

    if (real_file_size > FILE_SIZE):
        return False
    
    return True

@app.post("/summarize")
async def summarize(content: Content):
    try:
        summarization = await textSummarizationMultiModal(llm_model, tokenizer, content.content)

        return {"data": summarization}
    
    except Exception as e:
        return {"error": str(e)}

@app.post("/chat")
async def chat(messages: Annotated[str, Form()], file: Annotated[Optional[UploadFile], File()] = None):
    try:
        print(messages)
        if (file is None):
            messages_json = json.loads(messages)
            reply = await customChatWithMultiModelLLM(llm_model, tokenizer, messages_json)

            return reply
        else:
            messages_json = json.loads(messages)
            bytes_object = BytesIO(file.file.read())

            if (check_file_type_image(bytes_object)):
                bytes_object.seek(0)
                image = Image.open(bytes_object)
                reply = await imagesWithMultiModelLLM(llm_model, tokenizer, messages_json[-1]['content'], [image])

                return reply
            elif (check_file_type_pdf(bytes_object)):
                images = convertBase64PDFToImages(bytes_object)
                reply = await imagesWithMultiModelLLM(llm_model, tokenizer, messages_json[-1]['content'], images)

                return reply
            
            elif (check_file_type_video(bytes_object)):
                video_transcript = await convertVideoToText(bytes_object)
                reply = await customChatVideoTranscriptWithMultiModelLLM(llm_model, tokenizer, messages_json[-1]['content'], video_transcript)

                return reply
            
            raise HTTPException(status_code = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail = "Invalid file type")
    
    except Exception as e:
        return HTTPException(status_code = status.HTTP_500_INTERNAL_SERVER_ERROR, detail = str(e))
    
@app.post("/image")
async def image(text: Annotated[str, Form()], image: UploadFile | None = None):

    try:

        contents = await image.read()
        image = Image.open(BytesIO(contents))

        message = await imagesWithMultiModelLLM(llm_model, tokenizer, text, [image])

        return {"data": message}


    except Exception as e:
        return {"error": str(e)}


if __name__ == '__main__':
    uvicorn.run(app, host = "localhost", port = 8000, reload = False)