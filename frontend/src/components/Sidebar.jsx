import React, { useState } from 'react';
import { Plus, MessageSquare, LogOut, Cpu, Settings, Trash2, Calendar, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = ({
    user,
    chats,
    currentChatId,
    setCurrentChatId,
    apiKey,
    setApiKey,
    selectedModel,
    setSelectedModel,
    onLogout,
    onNewChat,
    collapsed,
    setCollapsed
}) => {
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleDeleteChat = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Delete this chat?')) return;

        try {
            const res = await fetch(`/api/chats/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                // The parent usually refreshes on its own
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Group chats by date
    const groupChats = () => {
        const today = new Date().toDateString();
        const groups = {
            today: [],
            previous: []
        };

        chats.forEach(chat => {
            const chatDate = new Date(chat.created_at || Date.now()).toDateString();
            if (chatDate === today) {
                groups.today.push(chat);
            } else {
                groups.previous.push(chat);
            }
        });

        return groups;
    };

    const chatGroups = groupChats();

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                {!collapsed && (
                    <div className="logo-text" style={{ fontSize: '1.2rem' }}>
                        <span className="accent">PDF</span>Retriever
                    </div>
                )}
                <button
                    className="btn-secondary toggle-btn"
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    style={{ padding: '0.4rem', border: 'none', background: 'transparent' }}
                >
                    {collapsed ? <Menu size={20} /> : <X size={20} />}
                </button>
            </div>

            <button
                className="btn-primary new-chat-btn"
                onClick={onNewChat}
                style={{
                    padding: collapsed ? '0.85rem 0.6rem' : '0.85rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    justifyContent: collapsed ? 'center' : 'flex-start'
                }}
            >
                <Plus size={20} /> {!collapsed && "New Chat"}
            </button>

            <div className="sidebar-section">
                {!collapsed && <h3 className="section-title">Workspace</h3>}
                <div className="glass-panel" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    background: 'rgba(255,255,255,0.02)',
                    padding: collapsed ? '0.5rem' : '1rem'
                }}>
                    <div className="input-group" style={{ margin: 0 }}>
                        {!collapsed && <label style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.5, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            MODEL
                            <span title="Choose which AI model to use for document analysis. Gemini 2.0 is newest and fastest." style={{ cursor: 'help', opacity: 0.7 }}>ℹ️</span>
                        </label>}
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            style={{ padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)' }}
                            title="Choose AI model for document analysis"
                        >
                            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                            <option value="gemini-flash-latest">Gemini 1.5 Flash</option>
                        </select>
                    </div>
                    {!collapsed && (
                        <div className="input-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.5, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                API KEY
                                <span title="Your Google Generative AI API key. Required to process PDFs. Keep it private!" style={{ cursor: 'help', opacity: 0.7 }}>ℹ️</span>
                            </label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    localStorage.setItem('apiKey', e.target.value);
                                }}
                                placeholder="••••••••"
                                style={{ padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)' }}
                                title="Enter your Google API key to enable PDF analysis"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="sidebar-section" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {!collapsed && <h3 className="section-title" style={{ marginBottom: '0.5rem' }}>History</h3>}
                <div className="scrollable" style={{ flex: 1 }}>
                    <div className="nav-list">
                        {chatGroups.today.length > 0 && (
                            <>
                                {!collapsed && <div style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.3, padding: '0.5rem 0.75rem' }}>Today</div>}
                                {chatGroups.today.map(chat => (
                                    <ChatItem
                                        key={chat.chat_id}
                                        chat={chat}
                                        active={currentChatId === chat.chat_id}
                                        onSelect={() => setCurrentChatId(chat.chat_id)}
                                        onDelete={(e) => handleDeleteChat(e, chat.chat_id)}
                                        collapsed={collapsed}
                                    />
                                ))}
                            </>
                        )}

                        {chatGroups.previous.length > 0 && (
                            <>
                                {!collapsed && <div style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.3, padding: '1rem 0.75rem 0.5rem' }}>Previous</div>}
                                {chatGroups.previous.map(chat => (
                                    <ChatItem
                                        key={chat.chat_id}
                                        chat={chat}
                                        active={currentChatId === chat.chat_id}
                                        onSelect={() => setCurrentChatId(chat.chat_id)}
                                        onDelete={(e) => handleDeleteChat(e, chat.chat_id)}
                                        collapsed={collapsed}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {!collapsed && user && (
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            style={{
                                width: '100%',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '12px',
                                padding: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                color: 'inherit',
                                fontSize: '0.9rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                        >
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                color: 'white',
                                flexShrink: 0
                            }}>
                                {user.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {user.username || 'User'}
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    Free Plan
                                </div>
                            </div>
                            <ChevronLeft size={16} style={{ opacity: 0.5, transform: showUserMenu ? 'rotate(90deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                        </button>

                        {showUserMenu && (
                            <div style={{
                                position: 'absolute',
                                bottom: 'calc(100% + 0.5rem)',
                                left: 0,
                                right: 0,
                                background: 'rgba(24, 24, 27, 0.95)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                zIndex: 1000,
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                            }}>
                                <div style={{ padding: '0.75rem 0' }}>
                                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, opacity: 0.5, textTransform: 'uppercase' }}>
                                        Account
                                    </div>
                                    <button
                                        style={{
                                            width: '100%',
                                            background: 'transparent',
                                            border: 'none',
                                            padding: '0.75rem 1rem',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            color: 'inherit',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <Settings size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} /> Settings
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            onLogout();
                                        }}
                                        style={{
                                            width: '100%',
                                            background: 'transparent',
                                            border: 'none',
                                            padding: '0.75rem 1rem',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            color: '#ef4444',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <LogOut size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} /> Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {collapsed && user && (
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.6rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: 'white',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        title={`Logged in as ${user.username}`}
                    >
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                    </button>
                )}
                {!collapsed && (
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textAlign: 'center', opacity: 0.5 }}>
                        PDFRetriever v2.5
                    </div>
                )}
            </div>
        </aside>
    );
};

const ChatItem = ({ chat, active, onSelect, onDelete, collapsed }) => (
    <div
        className={`nav-item ${active ? 'active' : ''}`}
        onClick={onSelect}
        style={{
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '0.7rem 0' : '0.7rem 0.75rem'
        }}
        title={collapsed ? chat.title : ""}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <MessageSquare size={14} style={{ opacity: active ? 1 : 0.5, flexShrink: 0 }} />
            {!collapsed && (
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {chat.title}
                </span>
            )}
        </div>
        {!collapsed && (
            <Trash2
                size={14}
                className="trash-icon"
                onClick={onDelete}
            />
        )}
    </div>
);

export default Sidebar;
