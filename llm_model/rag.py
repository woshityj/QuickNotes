import sys

from langchain_community.retrievers import ArxivRetriever
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

from uuid import uuid4

DATA_PATH = r"data"
CHROMA_PATH = r"chroma_db"

def rag_indexing():

    embeddings_model = HuggingFaceEmbeddings(model_name = "sentence-transformers/all-mpnet-base-v2")

    vector_store = Chroma(
        collection_name = "example_collection",
        embedding_function = embeddings_model,
        persist_directory = CHROMA_PATH
    )

    loader = PyPDFDirectoryLoader(DATA_PATH)
    raw_documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size = 300,
        chunk_overlap = 100,
        length_function = len,
        is_separator_regex = False
    )

    chunks = text_splitter.split_documents(raw_documents)
    uuids = [str(uuid4()) for _ in range(len(chunks))]
    
    vector_store.add_documents(documents = chunks, ids = uuids)

def rag_retrieval(query: str, num_results: int = 5):

    embeddings_model = HuggingFaceEmbeddings(model_name = "sentence-transformers/all-mpnet-base-v2")

    vector_store = Chroma(
        collection_name = "example_collection",
        embedding_function = embeddings_model,
        persist_directory = CHROMA_PATH
    )

    docs = vector_store.similarity_search(query, k = num_results)

    formatted_docs = "\n\n".join(doc.page_content for doc in docs)

    return formatted_docs