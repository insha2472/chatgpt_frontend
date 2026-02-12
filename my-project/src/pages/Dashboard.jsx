import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const Dashboard = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [input, setInput] = useState('');
    const [showProfile, setShowProfile] = useState(false);
    const [userName, setUserName] = useState('Explorer');
    const [isTyping, setIsTyping] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [activeMode, setActiveMode] = useState(null); // 'search', 'study', 'image'
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Load history and user data
    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await fetch('http://127.0.0.1:8000/chat/history', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setHistory(data);
                }
            } catch (err) {
                console.error("Failed to fetch history", err);
            }
        };

        fetchHistory();
        const storedName = localStorage.getItem('user_name');
        if (storedName) setUserName(storedName);
    }, [navigate]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentChat?.messages, isTyping]);

    const handleNewChat = () => {
        setCurrentChat(null);
        setInput('');
        setIsSidebarOpen(false);
    };

    const handleSendMessage = async () => {
        if (!input.trim() && attachedFiles.length === 0) return;

        const userMsg = {
            role: 'user',
            content: input,
            files: attachedFiles.map(f => ({ name: f.name, type: f.type }))
        };

        const token = localStorage.getItem('access_token');
        let session_id = currentChat?.id;

        // 1. Optimistic Update
        const tempChat = currentChat
            ? { ...currentChat, messages: [...currentChat.messages, userMsg] }
            : { id: 'temp', title: input.substring(0, 30), messages: [userMsg] };

        setCurrentChat(tempChat);
        setInput('');
        setAttachedFiles([]);
        setIsTyping(true);

        try {
            // 2. Ensure session exists
            if (!session_id || session_id === 'temp') {
                const sessionRes = await fetch('http://127.0.0.1:8000/chat/history', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title: input.substring(0, 30) || "New Chat" })
                });
                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();
                    session_id = sessionData.id;
                    tempChat.id = session_id;
                    setHistory(prev => [sessionData, ...prev]);
                }
            }

            // 3. Save User Message
            await fetch(`http://127.0.0.1:8000/chat/history/${session_id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userMsg)
            });

            // 4. Get AI Completion
            const aiRes = await fetch('http://127.0.0.1:8000/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    system_prompt: `You are Ziggy, a helpful AI assistant. The user's name is ${userName}.`
                }),
            });

            if (!aiRes.ok) throw new Error('AI failed');
            const aiData = await aiRes.json();
            const assistantMsg = { role: 'assistant', content: aiData.response };

            // 5. Final State Update
            const finalChat = { ...tempChat, messages: [...tempChat.messages, assistantMsg] };
            setCurrentChat(finalChat);
            setHistory(prev => prev.map(c => c.id === session_id ? { ...c, last_msg: assistantMsg.content } : c));

            // 6. Save Assistant Message
            await fetch(`http://127.0.0.1:8000/chat/history/${session_id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(assistantMsg)
            });

        } catch (err) {
            console.error("Chat Error", err);
            const errMsg = { role: 'assistant', content: "Ziggy is a bit lost in space right now! 🪐 Try again?" };
            setCurrentChat(prev => ({ ...prev, messages: [...prev.messages, errMsg] }));
        } finally {
            setIsTyping(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const loadChat = async (chat) => {
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`http://127.0.0.1:8000/chat/history/${chat.id}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const msgs = await res.json();
                setCurrentChat({ ...chat, messages: msgs });
            }
        } catch (err) {
            console.error(err);
        }
        setIsSidebarOpen(false);
    };

    const handleDeleteChat = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this chat?")) return;
        const token = localStorage.getItem('access_token');
        try {
            await fetch(`http://127.0.0.1:8000/chat/history/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setHistory(prev => prev.filter(c => c.id !== id));
            if (currentChat?.id === id) setCurrentChat(null);
        } catch (err) { console.error(err); }
    };

    const handleRenameChat = async (id, e) => {
        e.stopPropagation();
        const chat = history.find(c => c.id === id);
        const newTitle = window.prompt("New Title:", chat.title);
        if (!newTitle) return;
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`http://127.0.0.1:8000/chat/history/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title: newTitle })
            });
            if (res.ok) {
                setHistory(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
                if (currentChat?.id === id) setCurrentChat(prev => ({ ...prev, title: newTitle }));
            }
        } catch (err) { console.error(err); }
    };

    const getAvatarLetter = (name) => (name ? name.charAt(0).toUpperCase() : 'Z');

    return (
        <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
            {/* Dark Blur Background Overlay */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,40,1)_0%,rgba(5,5,5,1)_100%)] z-0"></div>

            {/* Sidebar */}
            <aside className={`relative z-10 glass h-full transition-all duration-500 flex flex-col ${isSidebarCollapsed ? 'w-20' : 'w-72'} border-r border-white/5`}>
                <div className="p-4 flex items-center justify-between">
                    {!isSidebarCollapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8.5 8c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zm7 0c.83 0 1.5.67 1.5 1.5S16.33 11 15.5 11 14 10.33 14 9.5 14.67 8 15.5 8zM12 18c-2.21 0-4-1.79-4-4h8c0 2.21-1.79 4-4 4z" /><path d="M6 6L4 2h4l-2 4zM18 6l2-4h-4l2 4z" /></svg>
                            </div>
                            <span className="font-bold text-lg tracking-tight">Ziggy Hub</span>
                        </div>
                    )}

                    {/* Uiverse Isometric Toggle */}
                    <div className="uiverse-card mx-auto">
                        <ul>
                            <li className="iso-pro" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                                <span className="circle"></span>
                                <span className="circle"></span>
                                <span className="circle"></span>
                                <svg className="uiverse-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                <span className="uiverse-text">{isSidebarCollapsed ? 'Expand' : 'Collapse'}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="px-3 mb-2 mt-4">
                    <button
                        onClick={handleNewChat}
                        className={`group flex items-center gap-3 w-full bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all ${isSidebarCollapsed ? 'p-3 justify-center' : 'p-3'}`}
                    >
                        <svg className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        {!isSidebarCollapsed && <span className="font-semibold text-sm">New Voyage</span>}
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar px-2 space-y-1">
                    {!isSidebarCollapsed && history.map(chat => (
                        <div key={chat.id} className="group relative">
                            <button
                                onClick={() => loadChat(chat)}
                                className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-all flex items-center gap-3 ${currentChat?.id === chat.id ? 'bg-indigo-600/20 text-white border border-indigo-500/30' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300 border border-transparent'}`}
                            >
                                <svg className="w-4 h-4 shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                <span className="truncate font-medium flex-grow pr-8">{chat.title}</span>
                            </button>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => handleRenameChat(chat.id, e)} className="p-1 hover:text-indigo-400"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" /></svg></button>
                                <button onClick={(e) => handleDeleteChat(chat.id, e)} className="p-1 hover:text-red-400"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" /></svg></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-white/5">
                    <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold ring-1 ring-white/20 shrink-0">
                            {getAvatarLetter(userName)}
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="flex-grow text-left overflow-hidden">
                                <div className="text-sm font-bold truncate">{userName}</div>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-tighter">Verified Explorer</div>
                            </div>
                        )}
                    </button>
                    {showProfile && !isSidebarCollapsed && (
                        <div className="mt-2 glass p-2 rounded-xl space-y-1 animate-in slide-in-from-bottom-2">
                            <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2" /></svg>
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="relative z-10 flex-grow flex flex-col h-full bg-transparent">
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <h2 className="font-bold text-indigo-100">{currentChat?.title || 'Ziggy Exploration'}</h2>
                        {activeMode && <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 uppercase font-bold tracking-widest">{activeMode}</span>}
                    </div>
                </header>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {!currentChat && (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
                            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center animate-bounce shadow-2xl shadow-indigo-500/10">
                                <svg className="w-12 h-12 text-indigo-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8.5 8c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zm7 0c.83 0 1.5.67 1.5 1.5S16.33 11 15.5 11 14 10.33 14 9.5 14.67 8 15.5 8zM12 18c-2.21 0-4-1.79-4-4h8c0 2.21-1.79 4-4 4z" /><path d="M6 6L4 2h4l-2 4zM18 6l2-4h-4l2 4z" /></svg>
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-white leading-tight">Ready to sail, {userName}?</h1>
                            <p className="text-zinc-400 text-lg">Your cute AI companion is fueled and ready for new discoveries. What's on your mind?</p>
                        </div>
                    )}

                    {currentChat?.messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl shadow-2xl ${msg.role === 'user' ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-50' : 'bg-white/5 border border-white/10 text-zinc-100'}`}>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start animate-pulse">
                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <footer className="p-6">
                    <div className="max-w-4xl mx-auto relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                        <div className="relative flex items-end gap-3 glass p-2 rounded-2xl">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                placeholder="Whisper something to Ziggy..."
                                className="flex-grow bg-transparent border-none focus:ring-0 text-white placeholder:text-zinc-600 resize-none max-h-48 py-3 px-4 custom-scrollbar"
                                rows={Math.min(input.split('\n').length, 8)}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isTyping}
                                className="bg-white text-black p-3 rounded-xl hover:bg-indigo-400 hover:text-white transition-all disabled:opacity-30 active:scale-95"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-zinc-600 mt-4 uppercase tracking-[0.2em] font-bold">Ziggy AI Propulsion v2.0 • Powered by GPT-4o</p>
                </footer>
            </main>
        </div>
    );
};

export default Dashboard;
