import React, { useState } from 'react';
import { X, Send, Sparkles, Bot, User } from 'lucide-react';

const RightSidebar = ({ isOpen, onClose }) => {
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { type: 'bot', text: 'Hello! I am your AI assistant. How can I help you optimize your business today?' }
    ]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        // Add user message
        const newHistory = [...chatHistory, { type: 'user', text: message }];
        setChatHistory(newHistory);
        setMessage('');

        // Simulate AI response
        setTimeout(() => {
            setChatHistory(prev => [...prev, {
                type: 'bot',
                text: 'I am processing your request... This is a simulated response for the UI demo.'
            }]);
        }, 1000);
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`fixed inset-y-0 right-0 z-50 w-[450px] max-w-[90vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out border-l border-slate-100 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-[#033543] to-[#054b5e] rounded-xl shadow-lg shadow-[#033543]/20">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-slate-800">AI Assistant</h2>
                            <p className="text-xs text-slate-500 font-medium">Always here to help</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                    {chatHistory.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex gap-4 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.type === 'user'
                                    ? 'bg-[#033543] text-white'
                                    : 'bg-white text-emerald-600 border border-slate-100'
                                }`}>
                                {msg.type === 'user' ? <User size={18} /> : <Bot size={18} />}
                            </div>

                            {/* Message Bubble */}
                            <div className={`flex flex-col gap-1 max-w-[80%] ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`p-4 text-sm leading-relaxed shadow-sm ${msg.type === 'user'
                                        ? 'bg-[#033543] text-white rounded-2xl rounded-tr-none'
                                        : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium px-1">
                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-5 bg-white border-t border-slate-100">
                    <form onSubmit={handleSend} className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Ask me anything..."
                                className="w-full pl-5 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543]/20 transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!message.trim()}
                            className="p-3.5 bg-[#033543] text-white rounded-xl hover:bg-[#033543]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#033543]/20 hover:shadow-xl hover:shadow-[#033543]/30 active:scale-95 transform"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                    <div className="text-center mt-3">
                        <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                            POWERED BY AGENTIC AI
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default RightSidebar;
