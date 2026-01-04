import React from 'react';
import { List } from 'lucide-react';

const PDFViewer = ({ url, toc }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
                {url ? (
                    <iframe
                        src={url}
                        style={{ width: '100%', height: '100%', border: 'none', borderRadius: '12px' }}
                        title="PDF Viewer"
                    />
                ) : (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: '#000',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.3
                    }}>
                        PDF Source Not Available
                    </div>
                )}
            </div>

            {toc && toc.length > 0 && (
                <div className="glass-panel" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    <div className="section-header">
                        <List size={14} /> Table of Contents
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {toc.map((item, i) => (
                            <div
                                key={i}
                                style={{
                                    padding: '4px 10px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    border: '1px solid var(--border-color)',
                                    cursor: 'default'
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>{item.page_number}</span> {item.title}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PDFViewer;
