# from flask import Flask, request, jsonify
from llm_model import load_peft_model, text_summarization, text_summarization_with_rag_validation, custom_chat

from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
import uvicorn
from pydantic import BaseModel

from typing import List

import json

class Content(BaseModel):
    content: str

class Message(BaseModel):
    role: str
    content: str

class Messages(BaseModel):
    messages: list[Message]

app = FastAPI()
llm_model, tokenizer = load_peft_model()

def convert_messages_to_json(messages: List[Message]) -> str:

    message_dicts = [
        {
            "role": message.role,
            "content": message.content
        } for message in messages
    ]

    return json.dump(message_dicts)

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

        messages = await custom_chat(llm_model, tokenizer, messages.messages)

        print("results: ")
        print(messages)
        return messages
    
    except Exception as e:
        return {"error": str(e)}

if __name__ == '__main__':
    uvicorn.run(app, host = "localhost", port = 8000)