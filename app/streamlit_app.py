import streamlit as st  
from functions import *
import base64

# Initialize the API key in session state if it doesn't exist
if 'api_key' not in st.session_state:
    st.session_state.api_key = ''

def display_pdf(uploaded_file):
    bytes_data = uploaded_file.getvalue()
    base64_pdf = base64.b64encode(bytes_data).decode('utf-8')
    pdf_display = f'<iframe src="data:application/pdf;base64,{base64_pdf}" width="700" height="1000" type="application/pdf"></iframe>'
    st.markdown(pdf_display, unsafe_allow_html=True)


def load_streamlit_page():
    st.set_page_config(layout="wide", page_title="LLM Tool")

    col1, col2 = st.columns([0.5, 0.5], gap="large")

    with col1:
        st.header("Input your OpenAI API key")
        api_key = st.text_input(
            'OpenAI API key',
            type='password',
            key='api_key',
            label_visibility="collapsed"
        )

        if api_key.strip():
            st.header("Upload file")
            uploaded_file = st.file_uploader(
                "Please upload your PDF document:",
                type="pdf"
            )
        else:
            st.warning("⚠️ Please enter your API key to proceed.")
            uploaded_file = None

    return col1, col2, uploaded_file, api_key


# -----------------------
# MAIN PAGE EXECUTION
# -----------------------

col1, col2, uploaded_file, api_key = load_streamlit_page()

if uploaded_file is not None and api_key.strip():

    # Load the text from PDF
    documents = get_pdf_text(uploaded_file)

    # Build vectorstore
    st.session_state.vector_store = create_vectorstore_from_texts(
        documents,
        api_key=st.session_state.api_key,
        file_name=uploaded_file.name
    )

    with col2:
        display_pdf(uploaded_file)

    st.success("PDF processed successfully!")

    # -----------------------------
    # ➤ NEW: ADD SUMMARIZATION UI
    # -----------------------------
    with col1:
        st.subheader("PDF Tools")

        if st.button("Summarize PDF"):
            with st.spinner("Summarizing PDF..."):
                summary = summarize_pdf(documents, api_key)
                st.write("### 📄 Summary")
                st.write(summary)

        # -----------------------------
        # EXISTING: GENERATE TABLE
        # -----------------------------
        if st.button("Generate table"):
            with st.spinner("Generating answer..."):

                answer = query_document(
                    vectorstore=st.session_state.vector_store,
                    query="Give me the title, summary, publication date, and authors of the research paper.",
                    api_key=st.session_state.api_key
                )

                st.subheader("Generated Table")
                st.write(answer)
