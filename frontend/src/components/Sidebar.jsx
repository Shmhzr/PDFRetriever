import React from 'react';
import { Plus, MessageSquare, LogOut, Cpu, Settings, Trash2, Calendar, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = ({
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
                        {!collapsed && <label style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.5, marginBottom: '4px', display: 'block' }}>MODEL</label>}
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            style={{ padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)' }}
                            title={collapsed ? "Selected Model" : ""}
                        >
                            <option value="gemini-2.0-flash">G 2.0</option>
                            <option value="gemini-2.5-flash">G 2.5</option>
                            <option value="gemini-flash-latest">G 1.5</option>
                        </select>
                    </div>
                    {!collapsed && (
                        <div className="input-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.5, marginBottom: '4px', display: 'block' }}>API KEY</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    localStorage.setItem('apiKey', e.target.value);
                                }}
                                placeholder="••••••••"
                                style={{ padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)' }}
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

            <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                    className="nav-item"
                    onClick={onLogout}
                    title="Logout"
                    style={{ width: '100%', background: 'transparent' }}
                >
                    <LogOut size={16} /> {!collapsed && "Logout"}
                </button>
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
