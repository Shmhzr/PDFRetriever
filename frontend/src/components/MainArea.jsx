import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInterface from './ChatInterface';
import AnalysisPanel from './AnalysisPanel';
import PDFViewer from './PDFViewer';
import { CloudUpload, Search, Layout, Database, Loader2, FileText, CheckCircle2, Plus } from 'lucide-react';

const MainArea = ({
    token,
    apiKey,
    selectedModel,
    currentChatId,
    setCurrentChatId,
    processedData,
    setProcessedData,
    onChatCreated
}) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [pdfUrl, setPdfUrl] = useState(null);
    const abortControllerRef = useRef(null);

    useEffect(() => {
        if (currentChatId) {
            loadChatSession();
        }
    }, [currentChatId]);

    const loadChatSession = async () => {
        try {
            const res = await fetch(`/api/chats/${currentChatId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProcessedData(data.processed_data);
                if (data.pdf_b64) {
                    setPdfUrl(`data:application/pdf;base64,${data.pdf_b64}`);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setUploading(false);
            setPdfUrl(null);
            setUploadProgress(0);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !apiKey) return;

        setUploading(true);
        setUploadProgress(0);

        // Setup AbortController
        abortControllerRef.current = new AbortController();

        // Simple progress simulation
        const interval = setInterval(() => {
            setUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
        }, 800);

        const formData = new FormData();
        formData.append('file', file);

        // Immediate preview
        const localUrl = URL.createObjectURL(file);
        setPdfUrl(localUrl);

        try {
            const res = await fetch(`/api/upload?api_key=${apiKey}&model=${selectedModel}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
                signal: abortControllerRef.current.signal
            });
            const data = await res.json();
            if (res.ok) {
                setUploadProgress(100);
                setTimeout(() => {
                    setCurrentChatId(data.chat_id);
                    setProcessedData(data.processed_data);
                    onChatCreated();
                    setUploading(false);
                }, 500);
            } else {
                if (data.detail !== 'The user aborted a request.') {
                    alert(data.detail || 'Upload failed');
                }
                setUploading(false);
                setPdfUrl(null); // Reset if failed
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Upload aborted');
            } else {
                alert('Connection error');
                setUploading(false);
                setPdfUrl(null);
            }
        } finally {
            clearInterval(interval);
            abortControllerRef.current = null;
        }
    };

    return (
        <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <header className="app-header">
                <div>
                    {currentChatId && (
                        <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Analyzing: {processedData?.file_name || 'Document'}
                        </h2>
                    )}
                </div>
                {processedData && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <label className="btn-secondary" style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '0.4rem 0.8rem' }} title="Upload another PDF to analyze in a new chat session">
                            <Plus size={14} /> New Index
                            <input type="file" onChange={handleFileUpload} accept="application/pdf" hidden />
                        </label>
                    </div>
                )}
            </header>

            <div className="workspace-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: 0, flex: 1, overflow: 'hidden', position: 'relative' }}>
                <AnimatePresence>
                    {uploading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(9, 9, 11, 0.9)',
                                backdropFilter: 'blur(8px)',
                                zIndex: 100,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: '1.5rem'
                            }}
                        >
                            <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        border: '4px solid rgba(59, 130, 246, 0.1)',
                                        borderTop: '4px solid var(--accent-color)',
                                        borderRadius: '50%'
                                    }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <FileText className="accent" size={32} />
                                </div>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                                    {uploadProgress < 100 ? 'Analyzing PDF...' : 'Finalizing...'}
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                    Extracting layouts, tables, and visual insights via Gemini
                                </p>
                            </div>

                            <div style={{ width: '300px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    style={{ height: '100%', background: 'var(--accent-color)' }}
                                />
                            </div>

                            <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.5 }}>
                                {uploadProgress}%
                            </div>

                            <button
                                className="btn-secondary"
                                onClick={handleCancel}
                                style={{
                                    marginTop: '1rem',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.8rem',
                                    borderColor: 'rgba(239, 68, 68, 0.2)',
                                    color: '#ef4444'
                                }}
                            >
                                Cancel Analysis
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Left Panel - PDF Viewer */}
                {processedData ? (
                    <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 700 }}>Document</h3>
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                            <div className="pdf-container" style={{ height: '100%', position: 'relative' }}>
                                <PDFViewer url={pdfUrl} toc={processedData.toc} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: '2rem',
                            padding: '2rem',
                            borderRight: '1px solid var(--border-color)'
                        }}
                    >
                        <div className="glass-card" style={{
                            width: '80px',
                            height: '80px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '24px',
                            color: 'var(--accent-color)'
                        }}>
                            <CloudUpload size={40} />
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                Upload a PDF
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Start by selecting a document to analyze
                            </p>
                        </div>

                        <label className="btn-primary" style={{ cursor: 'pointer', padding: '1rem 2rem', fontSize: '1rem', width: 'auto', borderRadius: '12px' }} title="Choose a PDF file to analyze. Max 10MB recommended.">
                            <CloudUpload size={18} /> Select Document
                            <input type="file" onChange={handleFileUpload} accept="application/pdf" hidden />
                        </label>
                    </motion.div>
                )}

                {/* Center Panel - Chat */}
                <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)' }}>
                        <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Conversation</h3>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                        {processedData ? (
                            <ChatInterface
                                token={token}
                                apiKey={apiKey}
                                model={selectedModel}
                                chatId={currentChatId}
                            />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.3 }}>
                                <p style={{ fontSize: '0.9rem', textAlign: 'center' }}>Upload a document to start chatting</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Analysis */}
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)' }}>
                        <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Analysis</h3>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <AnalysisPanel data={processedData} fileName={processedData?.file_name} />
                    </div>
                </div>
            </div>
        </main>
    );
};

export default MainArea;
