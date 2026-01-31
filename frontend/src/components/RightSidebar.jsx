import React, { useState } from 'react';
import axios from 'axios';
import { X, Send, Sparkles, Bot, User, Users, ToggleLeft, ToggleRight } from 'lucide-react';

// Sub-component for Staff Settings
const StaffSettingsModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:3000/staff', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaffList(res.data);
        } catch (err) {
            console.error("Failed to fetch staff", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleAvailability = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:3000/staff/${id}/availability`,
                { isAvailable: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStaffList(prev => prev.map(s => s.id === id ? { ...s, isAvailable: !currentStatus } : s));
        } catch (err) {
            alert('Failed to update status');
        }
    };

    return (
        <>
            <button
                onClick={() => { fetchStaff(); setIsOpen(true); }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                title="Staff Settings"
            >
                <Users size={20} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800">Staff Availability</h3>
                            <button onClick={() => setIsOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {loading ? <p className="text-sm text-slate-500">Loading...</p> : (
                                staffList.map(staff => (
                                    <div key={staff.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-sm text-slate-700">{staff.name}</p>
                                            <p className="text-xs text-slate-400">{staff.role}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleAvailability(staff.id, staff.isAvailable)}
                                            className={`${staff.isAvailable ? 'text-emerald-600' : 'text-slate-400'}`}
                                        >
                                            {staff.isAvailable ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

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
                    <div className="flex items-center gap-2">
                        <StaffSettingsModal />
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
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
