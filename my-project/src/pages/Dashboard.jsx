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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [activeMode, setActiveMode] = useState(null);
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
                    setHistory(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Failed to fetch history", err);
            }
        };

        fetchHistory();
        const storedName = localStorage.getItem('user_name');
        if (storedName) setUserName(storedName);
    }, [navigate]);

    // Scroll to bottom (REMOVED as requested)
    // useEffect(() => { ... }, [currentChat?.messages, isTyping]);

    const handleNewChat = () => {
        setCurrentChat(null);
        setInput('');
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

        // Optimistic Update
        const tempChat = currentChat
            ? { ...currentChat, messages: [...currentChat.messages, userMsg] }
            : { id: 'temp', title: input.substring(0, 30), messages: [userMsg] };

        setCurrentChat(tempChat);
        setInput('');
        setAttachedFiles([]);
        setIsTyping(true);

        try {
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

            // Save User Message
            await fetch(`http://127.0.0.1:8000/chat/history/${session_id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userMsg)
            });

            // Get AI Completion
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

            // Final State Update
            const finalChat = { ...tempChat, messages: [...tempChat.messages, assistantMsg] };
            setCurrentChat(finalChat);
            setHistory(prev => prev.map(c => c.id === session_id ? { ...c, last_msg: assistantMsg.content } : c));

            // Save Assistant Message
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
            const errMsg = { role: 'assistant', content: "Ziggy had a circuit short! ⚡️ Try again?" };
            setCurrentChat(prev => ({ ...prev, messages: prev ? [...prev.messages, errMsg] : [errMsg] }));
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
        <div className="flex h-screen w-screen bg-[#050505] text-white font-sans overflow-hidden select-none">
            {/* Sidebar */}
            <aside className={`fixed lg:relative z-20 glass h-full sidebar-transition flex flex-col shrink-0 ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:w-0'} border-r border-white/5`}>
                <div className="p-5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 shrink-0 bg-indigo-600 rounded-lg flex items-center justify-center glow-purple">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8.5 8c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zm7 0c.83 0 1.5.67 1.5 1.5S16.33 11 15.5 11 14 10.33 14 9.5 14.67 8 15.5 8zM12 18c-2.21 0-4-1.79-4-4h8c0 2.21-1.79 4-4 4z" /></svg>
                        </div>
                        <span className={`font-bold text-xl tracking-tighter text-neon-purple whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>ZIGGY</span>
                    </div>
                </div>

                <div className="px-4 mb-4 shrink-0">
                    <button
                        onClick={handleNewChat}
                        className="flex items-center gap-3 w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-xs font-bold text-zinc-300 group overflow-hidden"
                    >
                        <svg className="w-4 h-4 text-electric-cyan shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        <span className="whitespace-nowrap">New History</span>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar px-3 space-y-1">
                    {history.map(chat => (
                        <div key={chat.id} className="group relative">
                            <button
                                onClick={() => loadChat(chat)}
                                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-3 ${currentChat?.id === chat.id ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:bg-white/5 border border-transparent'}`}
                            >
                                <span className="truncate flex-grow font-medium">{chat.title}</span>
                            </button>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => handleDeleteChat(chat.id, e)} className="p-1 hover:text-red-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" /></svg></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-white/5 bg-black/40 shrink-0 relative z-30">
                    <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                        <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-black ring-1 ring-white/10 group-hover:glow-purple transition-all">
                            {getAvatarLetter(userName)}
                        </div>
                        <div className="flex-grow text-left overflow-hidden">
                            <div className="text-sm font-bold tracking-tight text-white truncate">{userName}</div>
                            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest truncate">My Account</div>
                        </div>
                        <svg className={`w-4 h-4 text-zinc-500 transition-transform ${showProfile ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                    </button>

                    {/* Pop-up Menu */}
                    {showProfile && (
                        <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 p-1">
                            <button onClick={handleLogout} className="w-full text-left px-3 py-3 text-xs text-red-400 hover:bg-red-500/10 rounded-lg font-bold flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Content Area */}
            <main className="relative z-10 flex-grow flex flex-col h-screen overflow-hidden sidebar-transition">
                {/* Toggle Button Absolute on Border */}
                <div
                    className="absolute left-0 top-8 -translate-x-1/2 z-50 cursor-pointer hidden lg:block"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    <div className="w-8 h-8 bg-[#1a1a1a] border border-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-electric-purple/50 transition-all shadow-xl">
                        <svg className={`w-4 h-4 transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </div>
                </div>

                <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 backdrop-blur-xl shrink-0 pl-8 lg:pl-6">
                    <div className="flex items-center gap-4">
                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <h2 className="font-bold text-sm tracking-tight text-zinc-500 uppercase tracking-[0.2em]">{currentChat?.title || 'Terminal Link Active'}</h2>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-500">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full border border-emerald-500/20">
                            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                            SECURE
                        </div>
                    </div>
                </header>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6 scroll-smooth">
                    {!currentChat && (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto pb-20">
                            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10 glow-purple">
                                <svg className="w-10 h-10 text-electric-purple" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8.5 8c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zm7 0c.83 0 1.5.67 1.5 1.5S16.33 11 15.5 11 14 10.33 14 9.5 14.67 8 15.5 8zM12 18c-2.21 0-4-1.79-4-4h8c0 2.21-1.79 4-4 4z" /></svg>
                            </div>
                            <h1 className="text-4xl font-black tracking-tighter text-white mb-2 uppercase">Hello, {userName === 'Ziggy User' ? 'Explorer' : userName}</h1>
                            <p className="text-zinc-500 text-base font-medium">Transmission Channel Open • Ready for Input</p>
                        </div>
                    )}

                    {currentChat?.messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-50 ml-10' : 'bg-white/5 border border-white/5 text-zinc-200 mr-10 shadow-xl'}`}>
                                <div className="prose prose-invert prose-sm prose-p:leading-relaxed max-w-none font-medium">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-1.5 align-center">
                                <div className="w-1.5 h-1.5 bg-electric-cyan rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-electric-cyan rounded-full animate-bounce delay-100"></div>
                                <div className="w-1.5 h-1.5 bg-electric-cyan rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <footer className="p-6 shrink-0 bg-gradient-to-t from-black/40 to-transparent">
                    <div className="max-w-3xl mx-auto relative group">
                        <div className="absolute -inset-0.5 bg-electric-purple/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                        <div className="relative flex items-end gap-3 glass p-2 rounded-2xl border border-white/10">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                placeholder="Transmit message..."
                                className="flex-grow bg-transparent border-none focus:ring-0 text-white placeholder:text-zinc-700 resize-none max-h-32 py-2.5 px-3 custom-scrollbar font-medium text-sm"
                                rows={1}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isTyping}
                                className="w-10 h-10 bg-white text-black rounded-xl disabled:opacity-30 flex items-center justify-center hover:bg-electric-cyan hover:text-black transition-colors shrink-0"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-[9px] text-zinc-600 mt-4 uppercase tracking-[0.3em] font-bold">Ziggy Neural Link v2.5 • Unified Protocol</p>
                </footer>
            </main>
        </div>
    );

};

export default Dashboard;
