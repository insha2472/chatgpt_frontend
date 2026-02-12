import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const Dashboard = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [input, setInput] = useState('');
    const [showProfile, setShowProfile] = useState(false);
    const [userName, setUserName] = useState('Guest');
    const [isTyping, setIsTyping] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [activeMode, setActiveMode] = useState(null); // 'search', 'study', 'image'
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Load history and user data from localStorage/backend on mount
    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            try {
                const response = await fetch('http://127.0.0.1:8000/chat/history', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setHistory(data);
                    localStorage.setItem('chatgpt_clone_history', JSON.stringify(data));
                } else {
                    // Try to load from localStorage as fallback
                    const savedHistory = localStorage.getItem('chatgpt_clone_history');
                    if (savedHistory) setHistory(JSON.parse(savedHistory));
                }
            } catch (err) {
                console.error("Failed to fetch backend history", err);
                const savedHistory = localStorage.getItem('chatgpt_clone_history');
                if (savedHistory) setHistory(JSON.parse(savedHistory));
            }
        };

        fetchHistory();

        const storedName = localStorage.getItem('user_name');
        if (storedName) {
            setUserName(storedName);
        }
    }, [navigate]);

    // Unified storage: History is saved to both localStorage (for fast UI) and Backend (for persistence)
    useEffect(() => {
        if (Array.isArray(history)) {
            localStorage.setItem('chatgpt_clone_history', JSON.stringify(history));
        }
    }, [history]);

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentChat, isTyping]);

    const handleNewChat = () => {
        setCurrentChat(null);
        setInput('');
        setIsSidebarOpen(false); // Close sidebar on mobile
    };

    const handleSendMessage = async () => {
        if (!input.trim() && attachedFiles.length === 0) return;

        const newMessage = {
            role: 'user',
            content: input,
            files: attachedFiles.map(f => ({ name: f.name, type: f.type }))
        };
        const token = localStorage.getItem('access_token');
        let session_id = currentChat?.id;
        let updatedChat;

        // Create history session if it doesn't exist
        if (!currentChat) {
            try {
                const sessionResponse = await fetch('http://127.0.0.1:8000/chat/history', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title: input.substring(0, 30) + (input.length > 30 ? '...' : '') })
                });
                if (sessionResponse.ok) {
                    const sessionData = await sessionResponse.json();
                    session_id = sessionData.id;
                    const newChat = { ...sessionData, messages: [newMessage] };
                    setCurrentChat(newChat);
                    setHistory([newChat, ...history]);
                    updatedChat = newChat;
                }
            } catch (err) {
                console.error("Failed to create history", err);
            }
        } else {
            updatedChat = { ...currentChat, messages: [...currentChat.messages, newMessage] };
            setCurrentChat(updatedChat);
        }

        // Save user message to backend
        if (session_id) {
            try {
                await fetch(`http://127.0.0.1:8000/chat/history/${session_id}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(newMessage)
                });
            } catch (err) {
                console.error("Failed to save user message", err);
            }
        }

        setInput('');
        setAttachedFiles([]);
        setIsTyping(true);

        try {
            const response = await fetch('http://127.0.0.1:8000/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: newMessage.content + (attachedFiles.length > 0 ? ` (Attached files: ${attachedFiles.map(f => f.name).join(", ")})` : ""),
                    system_prompt: `You are Ziggy, a helpful and cute AI assistant. The user's name is ${userName}. ${activeMode === 'search' ? 'Current mode: SEARCH. Provide detailed web-style search results.' : activeMode === 'study' ? 'Current mode: STUDY. Act as a tutor, explaining concepts simply.' : activeMode === 'image' ? 'Current mode: IMAGE GENERATION. Describe vivid images based on user input.' : ''}`
                }),
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();
            const assistantMessage = { role: 'assistant', content: data.response };

            // Update chat with real response
            const finalChat = {
                ...updatedChat,
                messages: [...updatedChat.messages, assistantMessage]
            };

            setCurrentChat(finalChat);
            setHistory(prev => {
                if (!Array.isArray(prev)) return [finalChat];
                return prev.map(chat => chat.id === finalChat.id ? finalChat : chat);
            });

            // Save assistant message to backend
            if (session_id) {
                try {
                    await fetch(`http://127.0.0.1:8000/chat/history/${session_id}/messages`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(assistantMessage)
                    });
                } catch (err) {
                    console.error("Failed to save assistant message", err);
                }
            }

        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = { role: 'assistant', content: "Sorry, I'm having trouble connecting to my brain right now! 🤯" };
            const errorChat = {
                ...updatedChat,
                messages: [...updatedChat.messages, errorMessage]
            };
            setCurrentChat(errorChat);
            setHistory(prev => prev.map(chat => chat.id === errorChat.id ? errorChat : chat));
        } finally {
            setIsTyping(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_name');
        navigate('/login');
    };

    const loadChat = async (chat) => {
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/chat/history/${chat.id}/messages`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const messages = await response.json();
                setCurrentChat({ ...chat, messages });
            } else {
                // If backend fails, check if we have messages in local history
                setCurrentChat(chat);
            }
        } catch (err) {
            console.error("Failed to load chat messages", err);
            setCurrentChat(chat);
        }
        setIsSidebarOpen(false);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setAttachedFiles((prev) => [...prev, ...files]);
        e.target.value = null;
    };

    const removeFile = (index) => {
        setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const toggleMode = (mode) => {
        setActiveMode(prev => prev === mode ? null : mode);
    };

    const handleDeleteChat = async (chatId, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this chat?")) return;

        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/chat/history/${chatId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setHistory(prev => prev.filter(c => c.id !== chatId));
                if (currentChat?.id === chatId) setCurrentChat(null);
            }
        } catch (err) {
            console.error("Failed to delete chat", err);
        }
    };

    const handleRenameChat = async (chatId, e) => {
        if (e) e.stopPropagation();
        const chat = history.find(c => c.id === chatId);
        const newTitle = window.prompt("Enter new chat title:", chat?.title);
        if (!newTitle || newTitle === chat?.title) return;

        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/chat/history/${chatId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title: newTitle })
            });
            if (response.ok) {
                const updated = await response.json();
                setHistory(prev => prev.map(c => c.id === chatId ? { ...c, title: updated.title } : c));
                if (currentChat?.id === chatId) setCurrentChat(prev => ({ ...prev, title: updated.title }));
            }
        } catch (err) {
            console.error("Failed to rename chat", err);
        }
    };

    const handleClearAllHistory = async () => {
        if (!window.confirm("Are you sure you want to clear ALL chat history? This cannot be undone.")) return;

        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/chat/history`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                localStorage.removeItem('chatgpt_clone_history');
                setHistory([]);
                setCurrentChat(null);
            }
        } catch (err) {
            console.error("Failed to clear all history", err);
            // Fallback to local only for safety
            localStorage.removeItem('chatgpt_clone_history');
            setHistory([]);
            setCurrentChat(null);
        }
    };

    // Detect and render images in message content
    const renderMessageContent = (content) => {
        if (!content || typeof content !== 'string') return <p className="italic text-zinc-600 uppercase tracking-widest text-[10px] text-center">No Content Available</p>;

        if (content.includes('IMAGE_URL:')) {
            const parts = content.split('IMAGE_URL: ');
            const text = parts[0] || "";
            const url = parts[1] || "";
            return (
                <div className="space-y-4 text-left">
                    {text.trim() && (
                        <div className="prose prose-invert max-w-none text-zinc-100 text-left">
                            <ReactMarkdown>
                                {text}
                            </ReactMarkdown>
                        </div>
                    )}
                    {url.trim() && (
                        <div className="relative group/image max-w-lg">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25"></div>
                            <img
                                src={url.trim()}
                                alt="AI Generated"
                                className="relative rounded-2xl border border-white/10 shadow-2xl hover:scale-[1.02] transition-transform duration-500"
                            />
                        </div>
                    )}
                </div>
            );
        }
        return (
            <div className="prose prose-invert max-w-none text-zinc-100 text-left">
                <ReactMarkdown>
                    {content}
                </ReactMarkdown>
            </div>
        );
    };

    // Get starting letter for avatar
    const getAvatarLetter = (name) => {
        return name ? name.charAt(0).toUpperCase() : 'Z';
    };

    // Scroll active chat into view in sidebar
    useEffect(() => {
        if (currentChat && isSidebarOpen) {
            const activeChatBtn = document.getElementById(`chat-btn-${currentChat.id}`);
            activeChatBtn?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentChat, isSidebarOpen]);

    return (
        <div className="flex min-h-[calc(100vh-80px)] text-zinc-200 font-sans antialiased relative">

            {/* Mobile Sidebar Backstop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`
                bg-[#1a1a2e]/98 backdrop-blur-2xl border-r border-white/10 flex flex-col 
                h-[calc(100vh-80px)] fixed top-20 left-0 z-30 shadow-2xl transition-all duration-500 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                ${isSidebarCollapsed ? 'w-20' : 'w-64'}
                md:translate-x-0
            `}>
                {/* Desktop Collapse Toggle */}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="hidden md:flex absolute -right-3 top-6 w-6 h-6 bg-indigo-600 rounded-full items-center justify-center text-white shadow-lg shadow-indigo-500/50 hover:scale-110 active:scale-95 transition-all z-40 border border-white/20"
                >
                    <svg className={`w-4 h-4 transition-transform duration-500 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                </button>

                <div className={`p-4 space-y-6 ${isSidebarCollapsed ? 'items-center overflow-x-hidden' : ''}`}>
                    {/* New Chat Button */}
                    <button
                        onClick={handleNewChat}
                        className={`flex items-center gap-3 border border-indigo-500/30 bg-indigo-600/10 hover:bg-indigo-600/20 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all shadow-lg hover:shadow-indigo-500/20 group uppercase tracking-wider ${isSidebarCollapsed ? 'w-12 h-12 justify-center p-0' : 'w-full'}`}
                        title={isSidebarCollapsed ? "New Chat" : ""}
                    >
                        <svg className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        {!isSidebarCollapsed && <span>New Chat</span>}
                    </button>

                    {/* History Section */}
                    {!isSidebarCollapsed ? (
                        <div className="flex flex-col bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                            <button
                                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                                className="flex items-center justify-between px-4 py-3 text-xs font-black text-zinc-400 uppercase tracking-[0.2em] hover:bg-white/5 hover:text-white transition-all group"
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-indigo-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    History
                                </span>
                                <svg className={`w-4 h-4 transition-transform duration-300 ${isHistoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                            </button>

                            {isHistoryOpen && (
                                <div className="space-y-0.5 max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar p-1">
                                    {history.length === 0 ? (
                                        <p className="px-4 py-4 text-[10px] text-zinc-600 italic text-center uppercase tracking-widest">Empty Nest</p>
                                    ) : (
                                        history.map((chat) => (
                                            <div key={chat.id} className="group relative">
                                                <button
                                                    id={`chat-btn-${chat.id}`}
                                                    onClick={() => loadChat(chat)}
                                                    className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-all truncate flex items-center gap-3 ${currentChat?.id === chat.id ? 'bg-indigo-600/20 text-white shadow-inner border border-indigo-500/30' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300 border border-transparent'}`}
                                                >
                                                    <svg className={`w-4 h-4 shrink-0 transition-opacity ${currentChat?.id === chat.id ? 'opacity-100 text-indigo-400' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                                    <span className="truncate font-medium pr-12">{chat.title}</span>
                                                </button>
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => handleRenameChat(chat.id, e)}
                                                        className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-indigo-400 transition-colors"
                                                        title="Rename"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteChat(chat.id, e)}
                                                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Collapsed History Placeholder */
                        <div className="flex flex-col items-center gap-4">
                            <button
                                onClick={() => setIsSidebarCollapsed(false)}
                                className="p-3 bg-white/5 rounded-xl hover:bg-indigo-600/20 text-indigo-400 transition-all border border-transparent hover:border-indigo-500/30"
                                title="Open History"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                        </div>
                    )}
                </div>

                <div className={`mt-auto p-4 border-t border-white/5 bg-black/10 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
                    <div className="relative w-full">
                        <button
                            onClick={() => setShowProfile(!showProfile)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 ${isSidebarCollapsed ? 'p-0 justify-center w-12 h-12 mx-auto' : 'w-full'}`}
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-inner ring-1 ring-white/20 shrink-0">
                                {getAvatarLetter(userName)}
                            </div>
                            {!isSidebarCollapsed && (
                                <>
                                    <div className="flex-grow text-left overflow-hidden">
                                        <div className="text-sm font-bold text-white shadow-black drop-shadow-sm truncate">{userName}</div>
                                        <div className="text-xs text-zinc-400">Ziggy Explorer</div>
                                    </div>
                                    <svg className={`w-4 h-4 text-zinc-500 transition-transform ${showProfile ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </>
                            )}
                        </button>

                        {showProfile && (
                            <div className="absolute bottom-full left-0 w-full mb-3 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl p-2 animate-in fade-in slide-in-from-bottom-2 z-50">
                                <button
                                    onClick={() => alert(`Profile Settings:\nName: ${userName}\nRole: Ziggy Explorer`)}
                                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    Profile Settings
                                </button>
                                <button
                                    onClick={handleClearAllHistory}
                                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Clear Chat History
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                    Log out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`flex-grow relative min-h-full flex flex-col transition-all duration-500 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                {/* Mobile Toggle Button */}
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden absolute top-4 left-4 z-40 p-2 bg-white/10 backdrop-blur-md rounded-lg text-white shadow-lg border border-white/5 active:scale-95 transition-transform"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>

                <div className="flex-grow p-6 md:p-12 pb-32">
                    {currentChat ? (
                        <div className="max-w-4xl mx-auto h-full flex flex-col">
                            <div className="flex-grow space-y-6">
                                {currentChat.messages.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-4 ${msg.role === 'assistant' ? 'bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-sm' : 'flex-row-reverse'}`}>
                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-lg overflow-hidden ${msg.role === 'assistant' ? 'bg-indigo-500 text-white ring-1 ring-indigo-400/30' : 'bg-zinc-700 text-white ring-1 ring-zinc-600/50'}`}>
                                            {msg.role === 'assistant' ? (
                                                /* Cat Avtar (Small) */
                                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8.5 8c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zm7 0c.83 0 1.5.67 1.5 1.5S16.33 11 15.5 11 14 10.33 14 9.5 14.67 8 15.5 8zM12 18c-2.21 0-4-1.79-4-4h8c0 2.21-1.79 4-4 4z" />
                                                    <path d="M6 6L4 2h4l-2 4zM18 6l2-4h-4l2 4z" />
                                                </svg>
                                            ) : getAvatarLetter(userName)}
                                        </div>
                                        <div className="flex flex-col gap-2 max-w-[85%] text-left">
                                            <div className={`text-sm leading-relaxed text-left ${msg.role === 'assistant' ? 'text-zinc-200' : 'text-white bg-indigo-600/30 backdrop-blur-md px-4 py-2 rounded-2xl rounded-tr-none border border-indigo-500/30 shadow-inner'}`}>
                                                {renderMessageContent(msg.content)}
                                            </div>
                                            {msg.files && msg.files.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {msg.files.map((file, fIdx) => (
                                                        <div key={fIdx} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-zinc-400 flex items-center gap-2">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                            {file.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex gap-4 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-sm">
                                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-lg bg-indigo-500 text-white ring-1 ring-indigo-400/30">
                                            <svg className="w-5 h-5 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8.5 8c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zm7 0c.83 0 1.5.67 1.5 1.5S16.33 11 15.5 11 14 10.33 14 9.5 14.67 8 15.5 8zM12 18c-2.21 0-4-1.79-4-4h8c0 2.21-1.79 4-4 4z" />
                                                <path d="M6 6L4 2h4l-2 4zM18 6l2-4h-4l2 4z" />
                                            </svg>
                                        </div>
                                        <div className="text-sm text-zinc-400 flex items-center gap-1">
                                            <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-100"></span>
                                            <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-200"></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-5xl mx-auto">
                            <div className="mb-12 text-center md:text-left mt-10">
                                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 drop-shadow-lg">
                                    Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 animate-pulse">{userName.split(' ')[0]}</span>
                                </h1>
                                <p className="text-zinc-300 text-lg max-w-2xl drop-shadow-md flex items-center gap-2 justify-center md:justify-start">
                                    I'm Ziggy! How can I help you today?
                                    <span className="animate-bounce">🐱</span>
                                </p>
                            </div>

                            {/* Quick Actions Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                                {[
                                    { icon: '✨', title: 'Creative Writing', desc: 'Draft a story or poem', color: 'text-amber-300' },
                                    { icon: '💻', title: 'Code Assistant', desc: 'Debug or write code', color: 'text-cyan-300' },
                                    { icon: '🎨', title: 'Image Generation', desc: 'Create vivid visuals', color: 'text-purple-300' },
                                    { icon: '📊', title: 'Data Analysis', desc: 'Verify trends & stats', color: 'text-green-300' }
                                ].map((item) => (
                                    <button
                                        key={item.title}
                                        onClick={() => setInput(`Help me with ${item.title.toLowerCase()}...`)}
                                        className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 hover:border-indigo-500/50 transition-all group text-left hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
                                    >
                                        <div className={`text-2xl mb-3 group-hover:scale-110 transition-transform ${item.color} drop-shadow-md`}>{item.icon}</div>
                                        <div className="font-bold text-white mb-1 tracking-wide">{item.title}</div>
                                        <div className="text-xs text-zinc-400">{item.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className={`fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20 transition-all duration-500 ease-in-out ${isSidebarCollapsed ? 'md:left-20' : 'md:left-64'}`}>
                    <div className="max-w-3xl mx-auto relative group">

                        {/* Attachment Preview */}
                        {attachedFiles.length > 0 && (
                            <div className="absolute bottom-full left-0 mb-3 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2">
                                {attachedFiles.map((file, idx) => (
                                    <div key={idx} className="group/file relative px-3 py-2 bg-[#1a1a2e] border border-white/10 rounded-xl text-xs font-medium text-white shadow-xl flex items-center gap-2">
                                        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.486L20.5 13" /></svg>
                                        <span className="max-w-[120px] truncate">{file.name}</span>
                                        <button
                                            onClick={() => removeFile(idx)}
                                            className="p-1 hover:bg-white/10 rounded-full text-zinc-500 hover:text-red-400 transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
                        <div className="relative">
                            <input
                                type="file"
                                multiple
                                hidden
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute left-3 bottom-4 p-2 text-zinc-400 hover:text-indigo-400 transition-colors z-10"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.486L20.5 13" /></svg>
                            </button>

                            {/* Advanced Actions Toolbar */}
                            <div className="absolute left-[52px] bottom-4 flex items-center gap-1 z-10 border-l border-white/10 pl-2">
                                <button
                                    onClick={() => toggleMode('search')}
                                    className={`p-2 rounded-lg transition-all ${activeMode === 'search' ? 'bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title="Web Search"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                </button>
                                <button
                                    onClick={() => toggleMode('study')}
                                    className={`p-2 rounded-lg transition-all ${activeMode === 'study' ? 'bg-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title="Study Mode"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                </button>
                                <button
                                    onClick={() => toggleMode('image')}
                                    className={`p-2 rounded-lg transition-all ${activeMode === 'image' ? 'bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title="Create Image"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </button>
                            </div>

                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                className="relative w-full bg-[#1a1a2e]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 pl-[200px] pr-14 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all min-h-[60px] max-h-[200px] resize-none shadow-2xl custom-scrollbar"
                                placeholder={activeMode === 'search' ? "Search for anything..." : activeMode === 'study' ? "Ask a study question..." : activeMode === 'image' ? "Describe an image to create..." : "Message Ziggy..."}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!input.trim() && attachedFiles.length === 0}
                                className="absolute right-3 bottom-3 p-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-zinc-500 mt-2">Ziggy can make mistakes. Consider checking important information.</p>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
