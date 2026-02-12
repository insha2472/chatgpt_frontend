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
                    system_prompt: `You are Zigi, a helpful AI assistant. The user's name is ${userName}.`
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
            const errMsg = { role: 'assistant', content: "Zigi had a hiccup! ⚡️ Try again?" };
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
        <div className="flex h-screen w-screen bg-[#212121] text-gray-100 font-sans overflow-hidden">
            {/* Sidebar - Fixed Left, Toggleable */}
            <div
                className={`flex-shrink-0 bg-[#171717] flex flex-col transition-all duration-300 ease-in-out relative ${isSidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden'}`}
                style={{ visibility: isSidebarOpen ? 'visible' : 'hidden' }}
            >
                <div className="flex flex-col h-full w-[260px]">
                    {/* New Chat & Header */}
                    <div className="p-3 mb-1 shrink-0">
                        <button
                            onClick={handleNewChat}
                            className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-[#212121] transition-colors text-sm text-gray-200 group border border-white/0 hover:border-white/5"
                        >
                            <div className="flex items-center gap-2">
                                <div className="p-1 bg-white text-black rounded-full h-6 w-6 flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                </div>
                                <span className="font-medium">New chat</span>
                            </div>
                            <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                    </div>

                    {/* History List */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-2 space-y-2 custom-scrollbar">
                        <div className="px-2 text-xs font-semibold text-gray-500 py-1">Today</div>
                        {history.map(chat => (
                            <button
                                key={chat.id}
                                onClick={() => loadChat(chat)}
                                className={`group relative w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center pr-2 ${currentChat?.id === chat.id ? 'bg-[#212121] text-white' : 'text-gray-300 hover:bg-[#212121]'}`}
                            >
                                <span className="truncate flex-1 relative z-10">{chat.title}</span>
                                <div className={`absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#171717] to-transparent group-hover:from-[#212121] ${currentChat?.id === chat.id ? 'from-[#212121]' : ''}`}></div>
                            </button>
                        ))}
                    </div>

                    {/* Profile Section - Fixed Bottom */}
                    <div className="p-3 border-t border-white/5 mt-auto bg-[#171717] shrink-0">
                        <div className="relative">
                            <button
                                onClick={() => setShowProfile(!showProfile)}
                                className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl hover:bg-[#212121] transition-colors text-left"
                            >
                                <div className="w-8 h-8 rounded-full bg-white text-[#171717] flex items-center justify-center font-semibold text-sm tracking-tighter">
                                    {getAvatarLetter(userName)}
                                </div>
                                <div className="flex-1 font-medium text-sm text-white truncate">{userName}</div>
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </button>

                            {showProfile && (
                                <div className="absolute bottom-full left-0 w-full mb-2 bg-[#2f2f2f] border border-white/5 rounded-xl shadow-xl overflow-hidden py-1 z-50">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-[#424242] transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        Log out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col h-full relative min-w-0 bg-[#212121]">
                {/* Header - Minimal, Toggle + Model Name */}
                <header className="h-12 flex items-center px-3 shrink-0 absolute top-0 w-full z-10 bg-transparent">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 text-gray-400 hover:text-white rounded-md transition-colors"
                            title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-2 text-lg font-semibold text-gray-200 hover:bg-[#2f2f2f] rounded-lg transition-colors cursor-pointer">
                            <span className="opacity-90">Ziggy</span>
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                    </div>
                </header>

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative scroll-smooth flex flex-col items-center w-full">
                    {!currentChat || currentChat.messages.length === 0 ? (
                        /* Empty State - Perfectly Centered */
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                                <div className="text-xl text-black font-black">Z</div>
                            </div>
                            <h2 className="text-2xl font-semibold text-white mb-8">What can I help with?</h2>

                            {/* Suggestion Grid */}
                            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl px-4">
                                {["Plan a trip", "Help me write", "Summarize text", "Code something"].map((text, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(text)}
                                        className="p-4 bg-[#2f2f2f]/50 border border-white/5 hover:bg-[#2f2f2f] rounded-xl text-left transition-colors group"
                                    >
                                        <div className="text-sm font-medium text-gray-200 group-hover:text-white">{text}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Message Stream - Distinct Boxes */
                        <div className="w-full max-w-3xl px-5 pt-20 pb-40 flex flex-col gap-6">
                            {currentChat.messages.map((msg, idx) => (
                                <div key={idx} className={`w-full flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className="flex-shrink-0 flex flex-col relative items-end">
                                            {msg.role === 'assistant' ? (
                                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm">Z</div>
                                            ) : (
                                                <div className="w-8 h-8 bg-[#543636] rounded-full flex items-center justify-center text-white text-sm font-medium">{getAvatarLetter(userName)}</div>
                                            )}
                                        </div>
                                        <div className={`relative px-5 py-3.5 rounded-2xl ${msg.role === 'user' ? 'bg-[#2f2f2f] text-white' : 'text-gray-100'}`}>
                                            <div className="font-semibold mb-1 text-xs opacity-50 uppercase tracking-wider">{msg.role === 'assistant' ? 'Ziggy' : 'You'}</div>
                                            <div className="prose prose-invert prose-p:leading-7 prose-pre:bg-[#0d0d0d] prose-pre:rounded-lg prose-pre:border prose-pre:border-white/10 max-w-none">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="w-full py-4">
                                    <div className="flex gap-4 max-w-3xl">
                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">Z</div>
                                        <div className="flex items-center gap-1.5 h-8 px-4">
                                            <span className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-pulse"></span>
                                            <span className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-pulse delay-150"></span>
                                            <span className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-pulse delay-300"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} className="h-px" />
                        </div>
                    )}
                </div>

                {/* Fixed Input Area */}
                <div className="absolute bottom-0 left-0 w-full pt-10 pb-6 px-4 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent z-20">
                    <div className="max-w-3xl mx-auto">
                        <div className="relative flex items-end w-full p-3 bg-[#2f2f2f] rounded-[26px] shadow-lg border border-white/5 focus-within:ring-1 focus-within:ring-white/10 focus-within:bg-[#2f2f2f] hover:border-white/10 transition-colors">
                            <button className="p-2 mr-2 text-gray-400 hover:text-white bg-[#212121] rounded-full transition-colors self-end mb-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            </button>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                placeholder="Message Ziggy"
                                className="flex-1 max-h-[200px] min-h-[44px] py-3 bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-500 resize-none overflow-y-auto"
                                rows={1}
                                style={{ height: 'auto' }}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isTyping}
                                className={`p-2 ml-2 mb-1 rounded-full transition-all duration-200 ${input.trim() ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#424242] text-gray-600 cursor-not-allowed'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                        <div className="text-center text-xs text-gray-500 mt-2 font-normal">
                            Ziggy can make mistakes. Check important info.
                        </div>
                    </div>
                </div>
            </main>
        </div>

    );
};

export default Dashboard;
