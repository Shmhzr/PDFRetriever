import streamlit as st
import base64
import os
import json
from io import BytesIO
from dotenv import load_dotenv
from functions import *

load_dotenv()

# --- Page Configuration ---
st.set_page_config(
    page_title="PDFRetriever Pro",
    page_icon=":material/description:",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- Glassmorphism & Material UI Theme ---
st.markdown("""
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<style>
    /* Global Styling - Zinc Theme */
    .stApp {
        background-color: #09090b;
        color: #f4f4f5;
        font-family: 'Inter', sans-serif;
    }

    /* Fixed Header / Sidebar Toggle Fix */
    header {
        background-color: rgba(9, 9, 11, 0.8) !important;
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    /* Glassmorphism Sidebar */
    [data-testid="stSidebar"] {
        background-color: #09090b !important;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    /* Dashboard Panels */
    .glass-panel {
        background: #18181b;
        border-radius: 12px;
        padding: 24px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        margin-bottom: 24px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    }

    /* Premium Headings */
    .premium-header {
        font-size: 0.95rem;
        font-weight: 700;
        color: #71717a;
        margin-bottom: 1.2rem;
        text-transform: uppercase;
        letter-spacing: 2px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    /* Modern Buttons */
    .stButton>button {
        background: #27272a;
        border-radius: 10px;
        color: #fafafa;
        border: 1px solid #3f3f46;
        padding: 0.6rem 1.2rem;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        font-weight: 500;
        width: 100%;
    }
    
    .stButton>button:hover {
        background: #3f3f46;
        border-color: #52525b;
        transform: translateY(-1px);
    }

    /* TOC Buttons (Minimalist) */
    .nav-btn button {
        background: transparent !important;
        color: #a1a1aa !important;
        border: none !important;
        text-align: left !important;
        justify-content: flex-start !important;
        padding: 10px 14px !important;
        margin-bottom: 6px !important;
        font-size: 0.9rem !important;
        border-radius: 8px !important;
    }
    .nav-btn button:hover {
        background: rgba(255, 255, 255, 0.05) !important;
        color: #fafafa !important;
    }

    /* Chat Styling */
    .stChatMessage {
        background-color: #18181b !important;
        border-radius: 16px !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        padding: 1.2rem !important;
        margin-bottom: 1.2rem !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    /* Sleek Tabs */
    .stTabs [data-baseweb="tab-list"] {
        gap: 12px;
        background-color: #09090b;
        padding: 6px;
        border-radius: 12px;
        margin-bottom: 24px;
        border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .stTabs [data-baseweb="tab"] {
        height: 40px;
        background-color: transparent !important;
        border-radius: 8px !important;
        color: #71717a !important;
        border: none !important;
        padding: 0px 16px !important;
        transition: all 0.2s ease;
        font-weight: 500;
    }

    .stTabs [data-baseweb="tab"]:hover {
        color: #fafafa !important;
    }

    .stTabs [aria-selected="true"] {
        background-color: #27272a !important;
        color: #fafafa !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    /* Scrollbar Styling */
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    ::-webkit-scrollbar-track {
        background: transparent;
    }
    ::-webkit-scrollbar-thumb {
        background: #27272a;
        border-radius: 10px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: #3f3f46;
    }

    /* Main Container Padding */
    .block-container {
        padding-top: 2rem !important;
        padding-bottom: 2rem !important;
    }

    /* Hide standard Streamlit elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
</style>
</style>
""", unsafe_allow_html=True)

# --- Session State Management ---
if 'user' not in st.session_state:
    st.session_state.user = None
if 'auth_mode' not in st.session_state:
    st.session_state.auth_mode = "login"

# Init DB
init_db()

# --- Auth Portal ---
def auth_portal():
    st.markdown('<div style="height: 10vh;"></div>', unsafe_allow_html=True)
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        st.markdown(f'<div class="glass-panel" style="text-align: center;">', unsafe_allow_html=True)
        st.markdown(f'<h3>{"Welcome Back" if st.session_state.auth_mode == "login" else "Create Account"}</h3>', unsafe_allow_html=True)
        
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")
        
        if st.session_state.auth_mode == "login":
            if st.button("Sign In"):
                user = verify_user(username, password)
                if user:
                    st.session_state.user = user
                    st.rerun()
                else:
                    st.error("Invalid credentials")
            st.markdown("---")
            if st.button("No account? Sign up"):
                st.session_state.auth_mode = "signup"
                st.rerun()
        else:
            if st.button("Sign Up"):
                success, msg = register_user(username, password)
                if success:
                    st.success("Account created! Please sign in.")
                    st.session_state.auth_mode = "login"
                    st.rerun()
                else:
                    st.error(msg)
            st.markdown("---")
            if st.button("Already have an account? Sign in"):
                st.session_state.auth_mode = "login"
                st.rerun()
        st.markdown('</div>', unsafe_allow_html=True)

if not st.session_state.user:
    auth_portal()
    st.stop()

# --- Post-Auth Session States ---
if 'api_key' not in st.session_state:
    st.session_state.api_key = ""
if 'processed_data' not in st.session_state:
    st.session_state.processed_data = None
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []
if 'current_file' not in st.session_state:
    st.session_state.current_file = None
if 'target_page' not in st.session_state:
    st.session_state.target_page = 1
if 'pdf_bytes' not in st.session_state:
    st.session_state.pdf_bytes = None
if 'pending_query' not in st.session_state:
    st.session_state.pending_query = None
if 'show_analysis' not in st.session_state:
    st.session_state.show_analysis = True
if 'current_chat_id' not in st.session_state:
    st.session_state.current_chat_id = None

# --- Left Sidebar (Project Controls & TOC) ---
with st.sidebar:
    st.markdown(f'<div style="text-align: right; margin-bottom: 10px; color: #71717a; font-size: 0.8rem;">Logged in as: <b>{st.session_state.user.username}</b></div>', unsafe_allow_html=True)
    if st.button("Sign Out", icon=":material/logout:", use_container_width=True):
        st.session_state.user = None
        st.rerun()
    
    st.markdown('<div class="premium-header">Project Workspace</div>', unsafe_allow_html=True)
    
    with st.expander(":material/settings: Configuration", expanded=not st.session_state.processed_data):
        api_key_input = st.text_input("Gemini API Key", value=st.session_state.api_key, type="password", placeholder="Paste your API key...")
        st.session_state.api_key = api_key_input
        uploaded_file = st.file_uploader("Document Repository", type="pdf")

    if uploaded_file and st.session_state.api_key:
        if st.button("Index Document", icon=":material/memory:"):
            with st.spinner("Synthesizing knowledge..."):
                try:
                    parsed_data = intelligent_pdf_parse(uploaded_file, st.session_state.api_key)
                    if "error" in parsed_data:
                        st.error(parsed_data["error"])
                    else:
                        vectorstore, _ = store_parsed_data(parsed_data, uploaded_file.name, st.session_state.api_key, st.session_state.user.id)
                        st.session_state.processed_data = parsed_data
                        st.session_state.current_file = uploaded_file.name
                        st.session_state.vectorstore = vectorstore
                        st.session_state.pdf_bytes = uploaded_file.getvalue()
                        # Reset chat for new document
                        st.session_state.chat_history = []
                        st.session_state.current_chat_id = None
                        st.rerun()
                except Exception as e:
                    st.error(f"Synthesis Failure: {e}")

    if st.session_state.processed_data:
        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown('<div class="premium-header">Document Navigation</div>', unsafe_allow_html=True)
        for item in st.session_state.processed_data.get("toc", []):
            unique_key = f"toc_{item['page_number']}_{item['title']}"
            if st.button(f"• P.{item['page_number']} — {item['title']}", key=unique_key, use_container_width=True):
                st.session_state.target_page = item['page_number']
                st.rerun()

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('<div class="premium-header">Chat History</div>', unsafe_allow_html=True)
    
    if st.button("New Chat", icon=":material/add:", use_container_width=True):
        st.session_state.chat_history = []
        st.session_state.current_chat_id = None
        st.session_state.processed_data = None
        st.session_state.pdf_bytes = None
        st.rerun()
    
    chats = get_all_chats(st.session_state.user.id)
    for chat in chats:
        cols = st.columns([0.8, 0.2])
        if cols[0].button(chat['title'], key=f"chat_{chat['chat_id']}", use_container_width=True):
            try:
                loaded = load_chat(chat['chat_id'])
                if loaded:
                    # Restore state
                    st.session_state.chat_history = loaded.get('history', [])
                    st.session_state.current_chat_id = chat['chat_id']
                    st.session_state.current_file = loaded.get('file_name')
                    st.session_state.processed_data = loaded.get('processed_data')
                    
                    # Restore PDF bytes
                    if loaded.get('pdf_b64'):
                        import base64
                        st.session_state.pdf_bytes = base64.b64decode(loaded['pdf_b64'])
                    
                    # Force reload vectorstore if we have an API key
                    if st.session_state.api_key and st.session_state.current_file:
                        try:
                            st.session_state.vectorstore = load_vectorstore(st.session_state.current_file, st.session_state.api_key)
                        except Exception as ve:
                            st.sidebar.warning(f"VectorStore failed: {ve}")
                    
                    if not st.session_state.processed_data:
                        st.sidebar.info("Note: This history item is missing document structure data.")
                    
                    st.rerun()
                else:
                    st.sidebar.error("Failed to load chat data.")
            except Exception as e:
                st.sidebar.error(f"Sync error: {e}")
        if cols[1].button(":material/delete:", key=f"del_{chat['chat_id']}", help="Delete Chat"):
            delete_chat(chat['chat_id'])
            if st.session_state.current_chat_id == chat['chat_id']:
                st.session_state.chat_history = []
                st.session_state.current_chat_id = None
            st.rerun()

# --- Main Layout Architecture ---
if not st.session_state.processed_data:
    st.markdown('<div style="height: 15vh;"></div>', unsafe_allow_html=True)
    st.markdown('<h1 style="text-align: center; font-size: 3rem; font-weight: 700;">PDFRetriever <span style="color: #3b82f6;">Pro</span></h1>', unsafe_allow_html=True)
    st.markdown('<p style="text-align: center; font-size: 1.1rem; color: #a1a1aa; max-width: 600px; margin: 0 auto;">High-fidelity document analysis with neural retrieval and multimodal reasoning.</p>', unsafe_allow_html=True)
    st.markdown('<div style="height: 10vh;"></div>', unsafe_allow_html=True)
    
    landing_cols = st.columns(3)
    features = [
        (":material/bolt:", "Neural Indexing", "Rapid vectorization for instant semantic retrieval."),
        (":material/view_in_ar:", "Structural Extraction", "High-precision mapping of tables and objects."),
        (":material/schema:", "Cross-Modal Logic", "Unified analysis of textual and visual data.")
    ]
    for i, (icon, title, desc) in enumerate(features):
        with landing_cols[i]:
            st.markdown(f"""
            <div class="glass-panel" style="text-align: center; height: 100%;">
                <span class="material-icons" style="font-size: 32px; color: #3b82f6; margin-bottom: 12px;">{icon.split('/')[-1].replace(':','')}</span>
                <h4 style="margin-top: 0;">{title}</h4>
                <p style="color: #a1a1aa; font-size: 0.9rem;">{desc}</p>
            </div>
            """, unsafe_allow_html=True)
else:
    # Header area with Title and Toggle
    header_cols = st.columns([0.8, 0.2])
    with header_cols[0]:
        st.markdown(f'<h2 style="margin:0; font-weight:800; letter-spacing:-1px;">{st.session_state.current_file}</h2>', unsafe_allow_html=True)
    with header_cols[1]:
        label = "Hide Sidebar" if st.session_state.show_analysis else "Show Sidebar"
        icon = ":material/right_panel_close:" if st.session_state.show_analysis else ":material/right_panel_open:"
        if st.button(icon, help=label, use_container_width=True):
            st.session_state.show_analysis = not st.session_state.show_analysis
            st.rerun()

    st.markdown('<div style="height: 20px;"></div>', unsafe_allow_html=True)

    # Secondary Layout Split
    if st.session_state.show_analysis:
        main_col, side_col = st.columns([1.3, 0.7], gap="large")
    else:
        main_col = st.container()

    # --- Main Column: PDF + Interaction ---
    with main_col:
        # Document Viewer
        st.markdown('<div class="premium-header"><span class="material-icons">visibility</span> Document Intelligence</div>', unsafe_allow_html=True)
        if st.session_state.pdf_bytes:
            b64 = base64.b64encode(st.session_state.pdf_bytes).decode()
            pdf_src = f"data:application/pdf;base64,{b64}#page={st.session_state.target_page}"
            st.markdown(f'<iframe src="{pdf_src}" width="100%" height="700" style="border:none;"></iframe>', unsafe_allow_html=True)
        
        st.markdown('<div style="height: 32px;"></div>', unsafe_allow_html=True)

        # Interaction Section (Always Visible here)
        st.markdown('<div class="premium-header"><span class="material-icons">terminal</span> Neural Interaction</div>', unsafe_allow_html=True)
        chat_container = st.container(height=500, border=False)
        
        def process_query(q):
            st.session_state.chat_history.append({"role": "user", "content": q})
            with chat_container:
                with st.chat_message("user"): st.markdown(q)
                with st.chat_message("assistant"):
                    with st.spinner("Synthesizing context..."):
                        result = query_pdf(st.session_state.vectorstore, q, st.session_state.api_key)
                        st.markdown(result.answer)
                        st.session_state.chat_history.append({
                            "role": "assistant", 
                            "content": result.answer,
                            "reasoning": result.reasoning,
                            "context": result.context_used
                        })
                        # Auto-save chat with full context
                        st.session_state.current_chat_id = save_chat(
                            st.session_state.chat_history, 
                            st.session_state.current_file,
                            st.session_state.user.id,
                            st.session_state.current_chat_id,
                            processed_data=st.session_state.processed_data,
                            pdf_bytes=st.session_state.pdf_bytes
                        )
            st.rerun()

        if st.session_state.pending_query:
            q = st.session_state.pending_query
            st.session_state.pending_query = None
            process_query(q)

        with chat_container:
            for message in st.session_state.chat_history:
                with st.chat_message(message["role"]):
                    st.markdown(message["content"])
                    if message["role"] == "assistant" and "reasoning" in message:
                        with st.expander("Analysis Path"): 
                            st.caption(message["reasoning"])

        query = st.chat_input("Query findings or request data extraction...")
        if query:
            process_query(query)

    # --- Side Column: Structural + Multimodal ---
    if st.session_state.show_analysis:
        with side_col:
            st.markdown('<div class="premium-header"><span class="material-icons">analytics</span> Extraction Nodes</div>', unsafe_allow_html=True)
            analysis_tabs = st.tabs([
                ":material/database: Structural", 
                ":material/visibility: Multimodal"
            ])

            with analysis_tabs[0]:
                tables = get_tables_for_file(st.session_state.current_file, st.session_state.user.id)
                if not tables.empty:
                    for idx, row in tables.iterrows():
                        with st.container(border=True):
                            tcols = st.columns([0.7, 0.3])
                            with tcols[0]:
                                st.markdown(f"**P.{row['page']}** {row['caption'] or ''}")
                            with tcols[1]:
                                if st.button(":material/near_me:", key=f"jump_t_{idx}", help="Jump"):
                                    st.session_state.target_page = row['page']
                                    st.rerun()
                            st.table(json.loads(row['data_json']))
                else:
                    st.info("No structural units identified.")

            with analysis_tabs[1]:
                media_data = st.session_state.processed_data.get("media", [])
                if media_data:
                    for idx, item in enumerate(media_data):
                        with st.container(border=True):
                            mcols = st.columns([0.7, 0.3])
                            with mcols[0]:
                                st.markdown(f"**P.{item['page']}** Vision Analysis")
                            with mcols[1]:
                                if st.button(":material/near_me:", key=f"jump_m_{idx}"):
                                    st.session_state.target_page = item['page']
                                    st.rerun()
                            st.write(item['description'])
                else:
                    st.info("No multimodal assets flagged.")
