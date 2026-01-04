import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, Lightbulb, ChevronRight, FileSpreadsheet, Eye, Info, Layers } from 'lucide-react';

const AnalysisPanel = ({ data, fileName }) => {
    const [activeTab, setActiveTab] = useState('results');

    if (!data) return (
        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
            <Layers size={48} strokeWidth={1} />
            <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Select a document to view analytics</p>
        </div>
    );

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
            <div className="tabs" style={{ padding: '0', borderBottom: '1px solid var(--border-color)', background: 'transparent', display: 'flex', gap: 0 }}>
                <button
                    className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
                    onClick={() => setActiveTab('results')}
                    style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: 0,
                        border: 'none',
                        background: activeTab === 'results' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        color: activeTab === 'results' ? 'var(--accent-color)' : 'var(--text-secondary)',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'results' ? '2px solid var(--accent-color)' : 'none'
                    }}
                    title="View extracted tables and structured data from your PDF"
                >
                    <FileSpreadsheet size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> Tables
                </button>
                <button
                    className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
                    onClick={() => setActiveTab('insights')}
                    style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: 0,
                        border: 'none',
                        background: activeTab === 'insights' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        color: activeTab === 'insights' ? 'var(--accent-color)' : 'var(--text-secondary)',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'insights' ? '2px solid var(--accent-color)' : 'none'
                    }}
                    title="View AI-generated insights, summaries, and key findings"
                >
                    <Lightbulb size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> Insights
                </button>
            </div>

            <div className="tab-content scrollable" style={{ flex: 1, overflowY: 'auto', padding: '1rem', minHeight: 0 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                    >
                        {activeTab === 'results' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                                        Tables ({data.tables?.length || 0})
                                    </h4>
                                </div>
                                {data.tables && data.tables.length > 0 ? (
                                    data.tables.map((table, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            style={{
                                                padding: '0.75rem',
                                                background: 'rgba(24, 24, 27, 0.6)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontSize: '0.8rem'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(24, 24, 27, 0.8)';
                                                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(24, 24, 27, 0.6)';
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>Table {i + 1}</span>
                                                <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>P{table.page}</span>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                                                {table.caption || `${table.cells.length} rows × ${table.cells[0]?.length || 0} cols`}
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.4, fontSize: '0.8rem' }}>
                                        No tables found
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                                        Visuals ({data.media?.length || 0})
                                    </h4>
                                </div>
                                {data.media && data.media.length > 0 ? (
                                    data.media.map((item, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            style={{
                                                padding: '0.75rem',
                                                background: 'rgba(24, 24, 27, 0.6)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(24, 24, 27, 0.8)';
                                                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(24, 24, 27, 0.6)';
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                <Eye size={12} style={{ marginTop: '2px', color: 'var(--accent-color)', flexShrink: 0 }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-color)', marginBottom: '2px' }}>
                                                        P{item.page}
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: 1.4, opacity: 0.8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.4, fontSize: '0.8rem' }}>
                                        No visuals found
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AnalysisPanel;
