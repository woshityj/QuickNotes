# from flask import Flask, request, jsonify
from llm_model import load_llm_model, text_summarization, text_summarization_with_rag_validation

from fastapi import FastAPI
import uvicorn

app = FastAPI()
llm_model, tokenizer = load_llm_model()

@app.post("/summarize")
async def summarize(data: str):
    try:
        summarization = text_summarization(llm_model, tokenizer, data)

        return {"data": summarization}
    
    except Exception as e:
        return {"error": str(e)}


if __name__ == '__main__':
    uvicorn.run(app, host = "localhost", port = 8000)