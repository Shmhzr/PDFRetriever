from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain_core.runnables import RunnablePassthrough
from langchain_core.prompts import ChatPromptTemplate

import os
import tempfile
import streamlit as st
import pandas as pd
from dotenv import load_dotenv


# In[2]:


load_dotenv()

# In[3]:


GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

# ## Define our LLM

# In[4]:


llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=os.getenv("GOOGLE_API_KEY"))
llm.invoke("Tell me a joke about cats")

# ## Process PDF documentpyenv global 3.10.4

# ### Load PDF document

# In[5]:


loader = PyPDFLoader("data/Oppenheimer-2006-Applied_Cognitive_Psychology.pdf")
pages = loader.load()
pages

# ### Split document

# In[6]:


text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500,
                                            chunk_overlap=200,
                                            length_function=len,
                                            separators=["\n\n", "\n", " "])
chunks = text_splitter.split_documents(pages)

# ### Create embeddings

# In[7]:


def get_embedding_function():
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004", google_api_key=os.getenv("GOOGLE_API_KEY")
    )
    return embeddings

embedding_function = get_embedding_function()
test_vector = embedding_function.embed_query("cat")

# In[30]:


# !pip uninstall -y langchain langchain-core langchain-community langchain-openai 

# # In[31]:


# !pip install langchain==0.1.16 langchain-community==0.0.28

# # In[32]:


from langchain.evaluation import load_evaluator

evaluator = load_evaluator(evaluator="embedding_distance", 
                            embeddings=embedding_function)

evaluator.evaluate_strings(prediction="Amsterdam", reference="coffeeshop")

# In[20]:


evaluator.evaluate_strings(prediction="Paris", reference="coffeeshop")

# ### Create vector database

# In[18]:


import uuid

def create_vectorstore(chunks, embedding_function, vectorstore_path):

    # Create a list of unique ids for each document based on the content
    ids = [str(uuid.uuid5(uuid.NAMESPACE_DNS, doc.page_content)) for doc in chunks]
    
    # Ensure that only unique docs with unique ids are kept
    unique_ids = set()
    unique_chunks = []
    
    unique_chunks = [] 
    for chunk, id in zip(chunks, ids):     
        if id not in unique_ids:       
            unique_ids.add(id)
            unique_chunks.append(chunk) 

    # Create a new Chroma database from the documents
    vectorstore = Chroma.from_documents(documents=unique_chunks, 
                                        ids=list(unique_ids),
                                        embedding=embedding_function, 
                                        persist_directory = vectorstore_path)

    vectorstore.persist()
    
    return vectorstore

# In[19]:


# Create vectorstore
vectorstore = create_vectorstore(chunks=chunks, 
                                 embedding_function=embedding_function, 
                                 vectorstore_path="vectorstore_test")

# ## 2. Query for relevant data

# In[59]:


# Load vectorstore
vectorstore = Chroma(persist_directory="vectorstore_chroma", embedding_function=embedding_function)

# In[21]:


# Create retriever and get relevant chunks
retriever = vectorstore.as_retriever(search_type="similarity")
relevant_chunks = retriever.invoke("What is the title of the paper?")
relevant_chunks

# In[ ]:


# Prompt template
PROMPT_TEMPLATE = """
You are an assistant for question-answering tasks.
Use the following pieces of retrieved context to answer
the question. If you don't know the answer, say that you
don't know. DON'T MAKE UP ANYTHING.

{context}

---

Answer the question based on the above context: {question}
"""

# ## 3. Generate responses

# In[62]:


# Concatenate context text
context_text = "\n\n---\n\n".join([doc.page_content for doc in relevant_chunks])

# Create prompt
prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
prompt = prompt_template.format(context=context_text, 
                                question="What is the title of the paper?")
print(prompt)

# In[65]:


llm.invoke(prompt)

# ### Using Langchain Expression Language

# In[66]:


def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

rag_chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt_template
            | llm
        )
rag_chain.invoke("What's the title of this paper?")

# ### Generate structured responses

# In[73]:


class AnswerWithSources(BaseModel):
    """An answer to the question, with sources and reasoning."""
    answer: str = Field(description="Answer to question")
    sources: str = Field(description="Full direct text chunk from the context used to answer the question")
    reasoning: str = Field(description="Explain the reasoning of the answer based on the sources")
    
class ExtractedInfo(BaseModel):
    """Extracted information about the research article"""
    paper_title: AnswerWithSources
    paper_summary: AnswerWithSources
    publication_year: AnswerWithSources
    paper_authors: AnswerWithSources

# In[74]:


rag_chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt_template
            | llm.with_structured_output(ExtractedInfo)
        )

rag_chain.invoke("Give me the title, summary, publication date, authors of the research paper.")

# ### Transform response into a dataframe

# In[75]:


structured_response = rag_chain.invoke("Give me the title, summary, publication date, authors of the research paper.")
df = pd.DataFrame([structured_response.dict()])

# Transforming into a table with two rows: 'answer' and 'source'
answer_row = []
source_row = []
reasoning_row = []

for col in df.columns:
    answer_row.append(df[col][0]['answer'])
    source_row.append(df[col][0]['sources'])
    reasoning_row.append(df[col][0]['reasoning'])

# Create new dataframe with two rows: 'answer' and 'source'
structured_response_df = pd.DataFrame([answer_row, source_row, reasoning_row], columns=df.columns, index=['answer', 'source', 'reasoning'])
structured_response_df

# In[ ]:



