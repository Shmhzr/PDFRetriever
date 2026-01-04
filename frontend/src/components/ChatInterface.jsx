import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Loader2 } from 'lucide-react';

const ChatInterface = ({ token, apiKey, model, chatId }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (chatId) {
            fetchHistory();
        }
    }, [chatId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchHistory = async () => {
        try {
            const res = await fetch(`/api/chats/${chatId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.history || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !apiKey) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch(`/api/query?api_key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    query: input,
                    model: model
                })
            });

            const data = await res.json();
            if (res.ok) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.answer,
                    reasoning: data.reasoning
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Error: ${data.detail || 'Failed to get answer'}`
                }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Connection failed' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-wrapper" style={{ padding: 0, width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            <div className="chat-messages" style={{ overflowY: 'auto', maxHeight: '500px', paddingRight: '1rem' }}>
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`message ${msg.role}`}
                            style={{ marginBottom: '1rem' }}
                        >
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flexShrink: 0, marginTop: '4px' }}>
                                    {msg.role === 'user' ? (
                                        <div className="glass-panel" style={{ padding: '6px', borderRadius: '8px' }}>
                                            <User size={16} />
                                        </div>
                                    ) : (
                                        <div className="glass-panel" style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--accent-color)' }}>
                                            <Bot size={16} className="accent" />
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                                    {msg.reasoning && (
                                        <details style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            <summary style={{ cursor: 'pointer', opacity: 0.7, fontWeight: 600 }}>Deep Thinking</summary>
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                style={{ padding: '0.75rem', borderLeft: '2px solid var(--accent-color)', marginTop: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0 8px 8px 0' }}
                                            >
                                                {msg.reasoning}
                                            </motion.div>
                                        </details>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="message assistant"
                    >
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div className="glass-panel" style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--accent-color)' }}>
                                <Loader2 size={16} className="spin accent" />
                            </div>
                            <span style={{ fontSize: '0.85rem', opacity: 0.6, fontWeight: 500 }}>Gemini is thinking...</span>
                        </div>
                    </motion.div>
                )}
                <div ref={scrollRef} />
            </div>

            <div className="chat-input-area" style={{ marginTop: '1.5rem', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <textarea
                    id="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Ask a question about the PDF..."
                    style={{ minHeight: '52px', maxHeight: '150px' }}
                />
                <button
                    id="send-btn"
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    style={{
                        opacity: !input.trim() ? 0.3 : 1,
                        transition: 'all 0.2s',
                        background: loading ? 'transparent' : 'var(--accent-color)'
                    }}
                >
                    {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;
