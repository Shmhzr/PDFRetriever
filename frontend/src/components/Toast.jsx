import React, { useState, useEffect, createContext, useContext } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div id="toast-container" style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                {toasts.map(t => (
                    <div key={t.id} className="toast glass-card" style={{
                        padding: '12px 24px',
                        fontSize: '0.9rem',
                        animation: 'slideIn 0.3s'
                    }}>
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

// Simple container for the app
export const ToastContainer = () => null; // Not needed if we use Provider around app
export const toast = (msg) => {
    // This is a placeholder; in a real app we'd use the context
    console.log("Toast:", msg);
};
