import os

from langchain_community.retrievers import ArxivRetriever
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

from uuid import uuid4
from pypdf import PdfReader
from tqdm import tqdm
from txtai.embeddings import Embeddings

DATA_PATH = r"papers"
CHROMA_PATH = r"chroma_db"

def is_valid_pdf(file_path):
    """Check if a file is a valid PDF."""
    try:
        with open(file_path, "rb") as file:
            PdfReader(file)  # Attempt to read the PDF
        return True
    except Exception as e:
        print(f"Invalid or corrupted PDF: {file_path}. Error: {e}")
        return False
    
def rag_indexing():

    embeddings_model = HuggingFaceEmbeddings(model_name = "sentence-transformers/all-mpnet-base-v2")

    vector_store = Chroma(
        collection_name = "example_collection",
        embedding_function = embeddings_model,
        persist_directory = CHROMA_PATH
    )

    loader = PyPDFDirectoryLoader(DATA_PATH)

    # # Filter valid PDFs
    # pdf_files = [
    #     os.path.join(DATA_PATH, file) for file in os.listdir(DATA_PATH)
    #     if file.lower().endswith(".pdf") and is_valid_pdf(os.path.join(DATA_PATH, file))
    # ]

    # if not pdf_files:
    #     print("No valid PDFs found in the directory.")
    #     return
    raw_documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size = 300,
        chunk_overlap = 100,
        length_function = len,
        is_separator_regex = False
    )

    chunks = text_splitter.split_documents(raw_documents)
    uuids = [str(uuid4()) for _ in range(len(chunks))]
    
    for i, chunk in tqdm(enumerate(chunks), total=len(chunks), desc="Adding documents to vector store"):
        try:
            vector_store.add_documents(documents=[chunk], ids=[uuids[i]])
        except Exception as e:
            print(f"Failed to add chunk {i} to the vector store. Error: {e}")

    # vector_store.add_documents(documents = chunks, ids = uuids)

def load_embeddings_model():
    
    embeddings_model = HuggingFaceEmbeddings(model_name = "sentence-transformers/all-mpnet-base-v2")

    return embeddings_model

# def rag_retrieval(query: str, embeddings_model: HuggingFaceEmbeddings, num_results: int = 5):

#     # embeddings_model = HuggingFaceEmbeddings(model_name = "sentence-transformers/all-mpnet-base-v2")

#     vector_store = Chroma(
#         collection_name = "example_collection",
#         embedding_function = embeddings_model,
#         persist_directory = CHROMA_PATH
#     )

#     docs = vector_store.similarity_search(query, k = num_results)
    
#     ## Adjust this to return in the form of a list for the fact checking pipeline
#     docs_list = [doc.page_content for doc in docs]
    
#     return docs_list

#     formatted_docs = "\n\n".join(doc.page_content for doc in docs)

#     return formatted_docs

def load_wikipedia_embeddings_model():
    embeddings = Embeddings()
    embeddings_model = embeddings.load(provider="huggingface-hub", container="neuml/txtai-wikipedia")

    return embeddings_model

def rag_retrieval(query: str, embeddings_model, num_results: int = 5):

    result = embeddings_model.search(query, limit = num_results)
    # context = "\n".join([x["text"] for x in result])

    return result

# rag_indexing()

# result = rag_retrieval("elastic stress tensor in nanomembranes", load_embeddings_model())
# print(result)


# embeddings_model = load_wikipedia_embeddings_model()
# result = rag_retrieval("elastic stress tensor in nanomembranes", embeddings_model)

# print(result)