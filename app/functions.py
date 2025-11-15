from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain_core.runnables import RunnablePassthrough
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

import os
import tempfile
import uuid
import pandas as pd
import re
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv  # ✅ NEW: to load .env file

# Load environment variables from .env file
load_dotenv()

# ==========================================================
#                ORIGINAL FUNCTIONS (UNCHANGED)
# ==========================================================

def clean_filename(filename):
    new_filename = re.sub(r'\s\(\d+\)', '', filename)
    return new_filename

def get_pdf_text(uploaded_file): 
    try:
        input_file = uploaded_file.read()
        temp_file = tempfile.NamedTemporaryFile(delete=False)
        temp_file.write(input_file)
        temp_file.close()

        loader = PyPDFLoader(temp_file.name)
        documents = loader.load()

        return documents
    finally:
        os.unlink(temp_file.name)

def split_document(documents, chunk_size, chunk_overlap):    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size,
                                          chunk_overlap=chunk_overlap,
                                          length_function=len,
                                          separators=["\n\n", "\n", " "])
    return text_splitter.split_documents(documents)

def get_embedding_function(api_key):
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004",
        google_api_key=api_key
    )
    return embeddings

def create_vectorstore(chunks, embedding_function, file_name, vector_store_path="db"):
    ids = [str(uuid.uuid5(uuid.NAMESPACE_DNS, doc.page_content)) for doc in chunks]
    unique_ids = set()
    unique_chunks = []
    unique_chunks = [] 
    for chunk, id in zip(chunks, ids):     
        if id not in unique_ids:       
            unique_ids.add(id)
            unique_chunks.append(chunk)        

    vectorstore = Chroma.from_documents(documents=unique_chunks, 
                                        collection_name=clean_filename(file_name),
                                        embedding=embedding_function, 
                                        ids=list(unique_ids), 
                                        persist_directory = vector_store_path)
    vectorstore.persist()
    return vectorstore

def create_vectorstore_from_texts(documents, api_key, file_name):
    docs = split_document(documents, chunk_size=1000, chunk_overlap=200)
    embedding_function = get_embedding_function(api_key)
    vectorstore = create_vectorstore(docs, embedding_function, file_name)
    return vectorstore

def load_vectorstore(file_name, api_key, vectorstore_path="db"):
    embedding_function = get_embedding_function(api_key)
    return Chroma(persist_directory=vectorstore_path, 
                  embedding_function=embedding_function, 
                  collection_name=clean_filename(file_name))

PROMPT_TEMPLATE = """
You are an assistant for question-answering tasks.
Use the following pieces of retrieved context to answer
the question. If you don't know the answer, say that you
don't know. DON'T MAKE UP ANYTHING.

{context}

---

Answer the question based on the above context: {question}
"""

class AnswerWithSources(BaseModel):
    answer: str = Field(description="Answer to question")
    sources: str = Field(description="Full direct text chunk from the context used to answer the question")
    reasoning: str = Field(description="Explain the reasoning of the answer based on the sources")
    
class ExtractedInfoWithSources(BaseModel):
    paper_title: AnswerWithSources
    paper_summary: AnswerWithSources
    publication_year: AnswerWithSources
    paper_authors: AnswerWithSources

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def query_document(vectorstore, query, api_key):
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=api_key)
    retriever=vectorstore.as_retriever(search_type="similarity")
    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)

    rag_chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt_template
            | llm.with_structured_output(ExtractedInfoWithSources)
        )

    structured_response = rag_chain.invoke(query)
    df = pd.DataFrame([structured_response.dict()])

    answer_row = []
    source_row = []
    reasoning_row = []

    for col in df.columns:
        answer_row.append(df[col][0]['answer'])
        source_row.append(df[col][0]['sources'])
        reasoning_row.append(df[col][0]['reasoning'])

    structured_response_df = pd.DataFrame([answer_row, source_row, reasoning_row], columns=df.columns, index=['answer', 'source', 'reasoning'])
  
    return structured_response_df.T

# ==========================================================
#          🔹 NEWLY ADDED SUMMARIZATION FUNCTION 🔹
# ==========================================================

def summarize_pdf(documents, api_key, max_length=1000):
    """
    Summarize a list of LangChain Document objects using Gemini.

    Parameters:
        documents (list): List of LangChain Document objects
        api_key (str): Your Google Gemini API key
        max_length (int): Approximate max characters per summarization batch

    Returns:
        str: A summary of the document content
    """
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.prompts import ChatPromptTemplate
    
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=api_key)
    
    text = "\n\n".join([doc.page_content for doc in documents])
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=max_length, chunk_overlap=100)
    chunks = text_splitter.split_text(text)
    
    summaries = []
    prompt_template = ChatPromptTemplate.from_template(
        "Summarize the following text clearly and concisely:\n\n{text}"
    )
    
    for chunk in chunks:
        response = (prompt_template | llm).invoke({"text": chunk})
        summaries.append(response.content)
    
    final_prompt = ChatPromptTemplate.from_template(
        "Combine and refine the following partial summaries into one cohesive and concise final summary:\n\n{summaries}"
    )
    final_summary = (final_prompt | llm).invoke({"summaries": '\n\n'.join(summaries)})
    
    return final_summary.content

# ==========================================================
#          🔹 OPTIONAL EXAMPLE USAGE 🔹
# ==========================================================
if __name__ == "__main__":
    # Load API key from .env file
    api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        raise ValueError("❌ GOOGLE_API_KEY not found in your .env file")

    # Example usage (requires a local PDF file)
    class DummyFile:
        def read(self):
            with open("example.pdf", "rb") as f:
                return f.read()

    uploaded_file = DummyFile()

    # Load PDF and summarize
    docs = get_pdf_text(uploaded_file)
    summary = summarize_pdf(docs, api_key)
    print("\n=== PDF SUMMARY ===\n")
    print(summary)

# from langchain_community.document_loaders import PyPDFLoader
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
# from langchain_community.vectorstores import Chroma
# from langchain_core.runnables import RunnablePassthrough
# from langchain_core.prompts import ChatPromptTemplate
# from pydantic import BaseModel, Field

# import os
# import tempfile
# import uuid
# import pandas as pd
# import re
# import numpy as np
# from sklearn.metrics.pairwise import cosine_similarity
# from langchain_google_genai import GoogleGenerativeAIEmbeddings

# def clean_filename(filename):
#     """
#     Remove "(number)" pattern from a filename 
#     (because this could cause error when used as collection name when creating Chroma database).

#     Parameters:
#         filename (str): The filename to clean

#     Returns:
#         str: The cleaned filename
#     """
#     # Regular expression to find "(number)" pattern
#     new_filename = re.sub(r'\s\(\d+\)', '', filename)
#     return new_filename

# def get_pdf_text(uploaded_file): 
#     """
#     Load a PDF document from an uploaded file and return it as a list of documents

#     Parameters:
#         uploaded_file (file-like object): The uploaded PDF file to load

#     Returns:
#         list: A list of documents created from the uploaded PDF file
#     """
#     try:
#         # Read file content
#         input_file = uploaded_file.read()

#         # Create a temporary file (PyPDFLoader requires a file path to read the PDF,
#         # it can't work directly with file-like objects or byte streams that we get from Streamlit's uploaded_file)
#         temp_file = tempfile.NamedTemporaryFile(delete=False)
#         temp_file.write(input_file)
#         temp_file.close()

#         # load PDF document
#         loader = PyPDFLoader(temp_file.name)
#         documents = loader.load()

#         return documents
    
#     finally:
#         # Ensure the temporary file is deleted when we're done with it
#         os.unlink(temp_file.name)


# def split_document(documents, chunk_size, chunk_overlap):    
#     """
#     Function to split generic text into smaller chunks.
#     chunk_size: The desired maximum size of each chunk (default: 400)
#     chunk_overlap: The number of characters to overlap between consecutive chunks (default: 20).

#     Returns:
#         list: A list of smaller text chunks created from the generic text
#     """
#     text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size,
#                                           chunk_overlap=chunk_overlap,
#                                           length_function=len,
#                                           separators=["\n\n", "\n", " "])
    
#     return text_splitter.split_documents(documents)


# def get_embedding_function(api_key):
#     """
#     Return a GoogleGenerativeAIEmbeddings object, which creates vector embeddings from text
#     using the Gemini (Google Generative AI) API.

#     Parameters:
#         api_key (str): Your Google Gemini API key.

#     Returns:
#         GoogleGenerativeAIEmbeddings: A Gemini embeddings object for text embedding tasks.
#     """
#     embeddings = GoogleGenerativeAIEmbeddings(
#         model="models/text-embedding-004",
#         google_api_key=api_key
#     )
#     return embeddings


# def create_vectorstore(chunks, embedding_function, file_name, vector_store_path="db"):

#     """
#     Create a vector store from a list of text chunks.

#     :param chunks: A list of generic text chunks
#     :param embedding_function: A function that takes a string and returns a vector
#     :param file_name: The name of the file to associate with the vector store
#     :param vector_store_path: The directory to store the vector store

#     :return: A Chroma vector store object
#     """

#     # Create a list of unique ids for each document based on the content
#     ids = [str(uuid.uuid5(uuid.NAMESPACE_DNS, doc.page_content)) for doc in chunks]
    
#     # Ensure that only unique docs with unique ids are kept
#     unique_ids = set()
#     unique_chunks = []
    
#     unique_chunks = [] 
#     for chunk, id in zip(chunks, ids):     
#         if id not in unique_ids:       
#             unique_ids.add(id)
#             unique_chunks.append(chunk)        

#     # Create a new Chroma database from the documents
#     vectorstore = Chroma.from_documents(documents=unique_chunks, 
#                                         collection_name=clean_filename(file_name),
#                                         embedding=embedding_function, 
#                                         ids=list(unique_ids), 
#                                         persist_directory = vector_store_path)

#     # The database should save automatically after we create it
#     # but we can also force it to save using the persist() method
#     vectorstore.persist()
    
#     return vectorstore


# def create_vectorstore_from_texts(documents, api_key, file_name):
    
#     # Step 2 split the documents  
#     """
#     Create a vector store from a list of texts.

#     :param documents: A list of generic text documents
#     :param api_key: The OpenAI API key used to create the vector store
#     :param file_name: The name of the file to associate with the vector store

#     :return: A Chroma vector store object
#     """
#     docs = split_document(documents, chunk_size=1000, chunk_overlap=200)
    
#     # Step 3 define embedding function
#     embedding_function = get_embedding_function(api_key)

#     # Step 4 create a vector store  
#     vectorstore = create_vectorstore(docs, embedding_function, file_name)
    
#     return vectorstore


# def load_vectorstore(file_name, api_key, vectorstore_path="db"):

#     """
#     Load a previously saved Chroma vector store from disk.

#     :param file_name: The name of the file to load (without the path)
#     :param api_key: The OpenAI API key used to create the vector store
#     :param vectorstore_path: The path to the directory where the vector store was saved (default: "db")
    
#     :return: A Chroma vector store object
#     """
#     embedding_function = get_embedding_function(api_key)
#     return Chroma(persist_directory=vectorstore_path, 
#                   embedding_function=embedding_function, 
#                   collection_name=clean_filename(file_name))

# # Prompt template
# PROMPT_TEMPLATE = """
# You are an assistant for question-answering tasks.
# Use the following pieces of retrieved context to answer
# the question. If you don't know the answer, say that you
# don't know. DON'T MAKE UP ANYTHING.

# {context}

# ---

# Answer the question based on the above context: {question}
# """

# class AnswerWithSources(BaseModel):
#     """An answer to the question, with sources and reasoning."""
#     answer: str = Field(description="Answer to question")
#     sources: str = Field(description="Full direct text chunk from the context used to answer the question")
#     reasoning: str = Field(description="Explain the reasoning of the answer based on the sources")
    

# class ExtractedInfoWithSources(BaseModel):
#     """Extracted information about the research article"""
#     paper_title: AnswerWithSources
#     paper_summary: AnswerWithSources
#     publication_year: AnswerWithSources
#     paper_authors: AnswerWithSources

# def format_docs(docs):
#     """
#     Format a list of Document objects into a single string.

#     :param docs: A list of Document objects

#     :return: A string containing the text of all the documents joined by two newlines
#     """
#     return "\n\n".join(doc.page_content for doc in docs)

# # retriever | format_docs passes the question through the retriever, generating Document objects, and then to format_docs to generate strings;
# # RunnablePassthrough() passes through the input question unchanged.
# def query_document(vectorstore, query, api_key):

#     """
#     Query a vector store with a question and return a structured response.

#     :param vectorstore: A Chroma vector store object
#     :param query: The question to ask the vector store
#     :param api_key: The OpenAI API key to use when calling the OpenAI Embeddings API

#     :return: A pandas DataFrame with three rows: 'answer', 'source', and 'reasoning'
#     """
#     llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=api_key)

#     retriever=vectorstore.as_retriever(search_type="similarity")

#     prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)

#     rag_chain = (
#             {"context": retriever | format_docs, "question": RunnablePassthrough()}
#             | prompt_template
#             | llm.with_structured_output(ExtractedInfoWithSources)
#         )

#     structured_response = rag_chain.invoke(query)
#     df = pd.DataFrame([structured_response.dict()])

#     # Transforming into a table with two rows: 'answer' and 'source'
#     answer_row = []
#     source_row = []
#     reasoning_row = []

#     for col in df.columns:
#         answer_row.append(df[col][0]['answer'])
#         source_row.append(df[col][0]['sources'])
#         reasoning_row.append(df[col][0]['reasoning'])

#     # Create new dataframe with two rows: 'answer' and 'source'
#     structured_response_df = pd.DataFrame([answer_row, source_row, reasoning_row], columns=df.columns, index=['answer', 'source', 'reasoning'])
  
#     return structured_response_df.T