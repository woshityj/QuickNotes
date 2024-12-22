# from flask import Flask, request, jsonify
from llm_model import load_peft_model, load_multi_modal_llm, text_summarization, text_summarization_with_rag_validation, custom_chat, text_with_image, custom_chat_multi_modal_llm

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

import base64

class Content(BaseModel):
    content: str

class Message(BaseModel):
    role: str
    content: str

class Messages(BaseModel):
    messages: list[Message] = Field(...)
    file: Optional[str] = None

app = FastAPI()
# llm_model, tokenizer = load_peft_model()
llm_model, tokenizer = load_multi_modal_llm()

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
        raise HTTPException(status_code = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail = "Invalid file type")
    
    detected_file_type = file_info.extension.lower()
    print(detected_file_type)

    if (detected_file_type not in accepted_image_types):
        raise HTTPException(status_code = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail = "Invalid file type")
    
    file.seek(0, 2)
    real_file_size = file.tell()
    file.seek(0)

    if (real_file_size > FILE_SIZE):
        raise HTTPException(status_code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail = "File too large")
    
    return True

@app.post("/summarize")
async def summarize(content: Content):
    try:
        summarization = await text_summarization(llm_model, tokenizer, content.content)

        return {"data": summarization}
    
    except Exception as e:
        return {"error": str(e)}

@app.post("/chat")
async def chat(messages: Messages):
    try:
        if (messages.file is None):
            reply = await custom_chat_multi_modal_llm(llm_model, tokenizer, messages.messages)

            return reply
        else:
            base64bytes = base64.b64decode(messages.file)
            bytesObj = BytesIO(base64bytes)

            print(check_file_type_image(bytesObj))
            if (check_file_type_image(bytesObj)):
                image = Image.open(bytesObj)
                reply = await text_with_image(llm_model, tokenizer, messages.messages[-1].content, image)

                return reply
            
            raise HTTPException(status_code = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail = "Invalid file type")
    
    except Exception as e:
        return HTTPException(status_code = status.HTTP_500_INTERNAL_SERVER_ERROR, detail = str(e))
    
@app.post("/image")
async def image(text: Annotated[str, Form()], image: UploadFile | None = None):

    try:

        contents = await image.read()
        image = Image.open(BytesIO(contents))

        message = await text_with_image(llm_model, tokenizer, text, image)

        return {"data": message}


    except Exception as e:
        return {"error": str(e)}


if __name__ == '__main__':
    uvicorn.run(app, host = "localhost", port = 8000, reload = False)