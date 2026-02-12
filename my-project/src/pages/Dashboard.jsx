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

    // Scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [currentChat?.messages, isTyping]);

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
        <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className={`fixed lg:relative z-20 glass h-full sidebar-transition flex flex-col ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:w-0'} border-r border-white/5`}>
                <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center glow-purple">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8.5 8c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zm7 0c.83 0 1.5.67 1.5 1.5S16.33 11 15.5 11 14 10.33 14 9.5 14.67 8 15.5 8zM12 18c-2.21 0-4-1.79-4-4h8c0 2.21-1.79 4-4 4z" /></svg>
                        </div>
                        <span className="font-black text-xl tracking-tighter text-neon-purple">ZIGGY</span>
                    </div>
                </div>

                <div className="px-4 mb-4">
                    <button
                        onClick={handleNewChat}
                        className="flex items-center gap-3 w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-bold text-zinc-300"
                    >
                        <svg className="w-5 h-5 text-electric-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        New Voyage
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar px-3 space-y-1">
                    {history.map(chat => (
                        <div key={chat.id} className="group relative">
                            <button
                                onClick={() => loadChat(chat)}
                                className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-all flex items-center gap-3 ${currentChat?.id === chat.id ? 'bg-electric-purple/10 text-electric-purple border border-electric-purple/30' : 'text-zinc-500 hover:bg-white/5 border border-transparent'}`}
                            >
                                <span className="truncate font-bold flex-grow">{chat.title}</span>
                            </button>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => handleRenameChat(chat.id, e)} className="p-1 hover:text-electric-cyan"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" /></svg></button>
                                <button onClick={(e) => handleDeleteChat(chat.id, e)} className="p-1 hover:text-red-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" /></svg></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-white/5">
                    <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-purple to-electric-blue flex items-center justify-center text-sm font-black ring-1 ring-white/20">
                            {getAvatarLetter(userName)}
                        </div>
                        <div className="flex-grow text-left">
                            <div className="text-sm font-black tracking-tight">{userName}</div>
                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Master Explorer</div>
                        </div>
                    </button>
                    {showProfile && (
                        <div className="mt-2 glass-electric p-2 rounded-xl space-y-1">
                            <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg font-bold">Log out</button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Content Area */}
            <main className="relative z-10 flex-grow flex flex-col h-full sidebar-transition">
                <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-electric-cyan glow-cyan transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                        </button>
                        <h2 className="font-black text-lg tracking-tight text-zinc-100">{currentChat?.title || 'Launch Terminal'}</h2>
                    </div>
                </header>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-8 space-y-10">
                    {!currentChat && (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                            <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center animate-pulse mb-8 border border-white/10 glow-purple">
                                <svg className="w-12 h-12 text-electric-purple" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8.5 8c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zm7 0c.83 0 1.5.67 1.5 1.5S16.33 11 15.5 11 14 10.33 14 9.5 14.67 8 15.5 8zM12 18c-2.21 0-4-1.79-4-4h8c0 2.21-1.79 4-4 4z" /></svg>
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter text-white mb-4 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Hello, {userName}</h1>
                            <p className="text-zinc-500 text-xl font-medium">Ziggy is online and ready for neural link. What shall we discover?</p>
                        </div>
                    )}

                    {currentChat?.messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-5 rounded-3xl shadow-2xl ${msg.role === 'user' ? 'bg-electric-blue/20 border border-electric-blue/40 text-blue-50' : 'glass-electric border border-white/5 text-zinc-200'}`}>
                                <div className="prose prose-invert prose-p:leading-relaxed max-w-none text-sm font-medium">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="glass-electric p-5 rounded-3xl border border-white/5 flex gap-2">
                                <div className="w-2 h-2 bg-electric-cyan rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-electric-cyan rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-electric-cyan rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <footer className="p-8">
                    <div className="max-w-4xl mx-auto relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-electric-purple to-electric-cyan rounded-3xl blur opacity-20 group-hover:opacity-40 transition"></div>
                        <div className="relative flex items-end gap-4 glass p-3 rounded-3xl border border-white/10">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                placeholder="Transmit data to Ziggy..."
                                className="flex-grow bg-transparent border-none focus:ring-0 text-white placeholder:text-zinc-700 resize-none max-h-48 py-3 px-4 custom-scrollbar font-medium"
                                rows={1}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isTyping}
                                className="btn-electric p-4 rounded-2xl disabled:opacity-30 flex items-center justify-center"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default Dashboard;
