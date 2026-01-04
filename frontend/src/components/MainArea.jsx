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
        <main className="main-content">
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

            <div className="workspace-grid" style={{ position: 'relative' }}>
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

                <div className="document-section" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>
                    {processedData ? (
                        <>
                            <div className="pdf-container" style={{ height: '500px', flexShrink: 0 }}>
                                <PDFViewer url={pdfUrl} toc={processedData.toc} />
                            </div>
                            <ChatInterface
                                token={token}
                                apiKey={apiKey}
                                model={selectedModel}
                                chatId={currentChatId}
                            />
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: '2rem',
                                maxWidth: '500px',
                                margin: '4rem auto'
                            }}
                        >
                            <div className="glass-card" style={{
                                width: '100px',
                                height: '100px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '24px',
                                color: 'var(--accent-color)'
                            }}>
                                <CloudUpload size={48} />
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '0.75rem', background: 'linear-gradient(to bottom, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    Knowledge at your fingertips
                                </h1>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
                                    Upload any PDF to instantly query, extract tables, and surface deep visual insights with Gemini's multi-modal intelligence.
                                </p>
                            </div>

                            <label className="btn-primary" style={{ cursor: 'pointer', padding: '1.25rem 2.5rem', fontSize: '1.1rem', width: 'auto', borderRadius: '16px', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.2)' }} title="Choose a PDF file to analyze. Max 10MB recommended.">
                                <CloudUpload size={24} /> Select Document to Index
                                <input type="file" onChange={handleFileUpload} accept="application/pdf" hidden />
                            </label>

                            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', opacity: 0.5 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }} title="Analyzes document layout and text structure">
                                    <CheckCircle2 size={14} className="accent" /> Full Layout OCR
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }} title="Identifies and extracts tabular data">
                                    <CheckCircle2 size={14} className="accent" /> Table Extraction
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }} title="Answer questions about images and visual elements">
                                    <CheckCircle2 size={14} className="accent" /> Visual QA
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="analysis-section glass-panel" style={{ border: 'none', borderRadius: 0, borderLeft: '1px solid var(--border-color)' }}>
                    <AnalysisPanel data={processedData} fileName={processedData?.file_name} />
                </div>
            </div>
        </main>
    );
};

export default MainArea;
