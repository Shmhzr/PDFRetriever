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
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(9, 9, 11, 0.5)' }}>
            <div className="tabs" style={{ padding: '0.75rem 1rem 0', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
                        onClick={() => setActiveTab('results')}
                        style={{
                            position: 'relative',
                            padding: '0.75rem 1.25rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            borderRadius: '8px 8px 0 0',
                            border: 'none',
                            background: 'transparent',
                            color: activeTab === 'results' ? 'var(--accent-color)' : 'var(--text-secondary)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileSpreadsheet size={16} /> Results
                        </div>
                        {activeTab === 'results' && (
                            <motion.div
                                layoutId="activeTabUnderline"
                                style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', background: 'var(--accent-color)', zIndex: 10 }}
                            />
                        )}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
                        onClick={() => setActiveTab('insights')}
                        style={{
                            position: 'relative',
                            padding: '0.75rem 1.25rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            borderRadius: '8px 8px 0 0',
                            border: 'none',
                            background: 'transparent',
                            color: activeTab === 'insights' ? 'var(--accent-color)' : 'var(--text-secondary)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Lightbulb size={16} /> Insights
                        </div>
                        {activeTab === 'insights' && (
                            <motion.div
                                layoutId="activeTabUnderline"
                                style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', background: 'var(--accent-color)', zIndex: 10 }}
                            />
                        )}
                    </button>
                </div>
            </div>

            <div className="tab-content scrollable" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', minHeight: 0 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                    >
                        {activeTab === 'results' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
                                        Extracted Tables ({data.tables?.length || 0})
                                    </h3>
                                </div>
                                {data.tables && data.tables.length > 0 ? (
                                    data.tables.map((table, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="glass-panel"
                                            style={{
                                                padding: '0',
                                                overflow: 'hidden',
                                                background: 'rgba(24, 24, 27, 0.4)',
                                                border: '1px solid rgba(255,255,255,0.05)'
                                            }}
                                        >
                                            <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-color)' }}>PAGE {table.page}</span>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{table.caption || `Table ${i + 1}`}</span>
                                                </div>
                                                <Info size={14} style={{ opacity: 0.3 }} />
                                            </div>
                                            <div style={{ overflowX: 'auto', padding: '1px' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                                    <thead>
                                                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                            {table.cells[0]?.map((_, ci) => (
                                                                <th key={ci} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                                                    Col {ci + 1}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {table.cells.map((row, ri) => (
                                                            <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'background 0.2s' }} className="table-row-hover">
                                                                {row.map((cell, ci) => (
                                                                    <td key={ci} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.8)' }}>
                                                                        {cell}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                        <p style={{ opacity: 0.4, fontSize: '0.85rem' }}>No structured tables found in this document.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
                                    Visual Intelligence ({data.media?.length || 0})
                                </h3>
                                {data.media && data.media.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                        {data.media.map((item, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="glass-panel"
                                                style={{
                                                    padding: '1.25rem',
                                                    background: 'rgba(24, 24, 27, 0.4)',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    gap: '1.25rem'
                                                }}
                                            >
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '8px',
                                                    background: 'rgba(59, 130, 246, 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    <Eye size={20} className="accent" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>PAGE {item.page}</span>
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Visual Observation</span>
                                                    </div>
                                                    <p style={{ fontSize: '0.9rem', color: '#fff', lineHeight: '1.6', fontWeight: 400 }}>
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                        <p style={{ opacity: 0.4, fontSize: '0.85rem' }}>No visual components or charts described.</p>
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
