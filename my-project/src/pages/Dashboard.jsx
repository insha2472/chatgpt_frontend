import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../Context/ThemeContext';
import { useAuth } from '../Context/AuthContext';
import ZiggyMascot from '../Components/ZiggyMascot';

const renderMessageContent = (content) => {
    if (!content || typeof content !== 'string') return <p className="italic text-zinc-500 uppercase tracking-widest text-[10px]">Empty Message</p>;

    if (content.includes('IMAGE_URL:')) {
        const parts = content.split('IMAGE_URL: ');
        const text = parts[0] || "";
        const url = parts[1] || "";
        return (
            <div className="space-y-4 text-left">
                {text.trim() && (
                    <div className="prose prose-invert max-w-none text-zinc-100 bg-transparent text-left">
                        <ReactMarkdown>{text}</ReactMarkdown>
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
        <div className="prose prose-invert max-w-none text-zinc-100 bg-transparent text-left">
            <ReactMarkdown>{content}</ReactMarkdown>
        </div>
    );
};

const MessageItem = ({ msg, isTypewriter = false, typewriterText, userName, getAvatarLetter }) => {
    const isUser = msg.role === 'user';
    return (
        <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 mb-4`}>
            <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className="flex-shrink-0 flex flex-col items-center">
                    {msg.role === 'assistant' ? (
                        <ZiggyMascot className="w-8 h-8" pulse={isTypewriter} />
                    ) : (
                        <div className="w-8 h-8 bg-zinc-700/80 rounded-full flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/10">{getAvatarLetter(userName)}</div>
                    )}
                </div>

                {/* Bubble Content */}
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`relative px-4 py-2.5 rounded-2xl glass shadow-xl border border-white/5 ${isUser ? 'rounded-tr-none text-right' : 'rounded-tl-none text-left'}`}>
                        <div className="font-bold mb-1 text-[9px] opacity-40 uppercase tracking-widest">{msg.role === 'assistant' ? 'Ziggy' : 'You'}</div>
                        <div className={`max-w-none text-[14px] ${!isUser ? 'leading-[1.8]' : ''}`}>
                            {isTypewriter ? (
                                <div className="prose prose-invert prose-p:leading-relaxed max-w-none text-zinc-100 text-left">
                                    <ReactMarkdown>{typewriterText}</ReactMarkdown>
                                </div>
                            ) : (
                                renderMessageContent(msg.content)
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InputComponent = ({ handleSendMessage, isTyping, stopTyping, centered, activeMode, setActiveMode, attachedFiles, setAttachedFiles, fileInputRef, handleFileChange, removeFile }) => {
    const [localInput, setLocalInput] = useState('');

    const onSendMessage = () => {
        if (!localInput.trim() && attachedFiles.length === 0) return;
        handleSendMessage(localInput);
        setLocalInput('');
    };

    return (
        <div className={`w-full max-w-3xl px-4 ${centered ? '' : 'mx-auto'}`}>
            {!centered && (
                <div className="flex justify-center mb-4 gap-2">
                    {['search', 'study', 'image'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => setActiveMode(prev => prev === mode ? null : mode)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${activeMode === mode ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shadow-lg' : 'bg-white/5 text-zinc-500 border-white/10 hover:bg-white/10'}`}
                        >
                            <span className="capitalize">{mode}</span>
                        </button>
                    ))}
                </div>
            )}

            {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {attachedFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-zinc-300">
                            <span className="truncate max-w-[150px]">{file.name}</span>
                            <button onClick={() => removeFile(i)} className="p-0.5 hover:bg-white/10 rounded-full text-zinc-500 hover:text-red-400 transition-colors">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className={`relative flex items-end w-full p-4 glass rounded-[24px] shadow-2xl border border-white/10 focus-within:border-white/20 transition-all group`}>
                <input
                    type="file"
                    multiple
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 mr-2 text-zinc-500 hover:text-white rounded-full transition-colors self-end mb-1 hover:bg-white/5"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.486L20.5 13" /></svg>
                </button>
                <textarea
                    value={localInput}
                    onChange={(e) => setLocalInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendMessage(); } }}
                    placeholder="Message Ziggy"
                    className="flex-1 max-h-[200px] min-h-[48px] py-3 px-0 bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-white text-base md:text-lg placeholder:text-zinc-500 resize-none overflow-y-auto"
                    rows={1}
                />
                <button
                    onClick={onSendMessage}
                    disabled={!localInput.trim() && attachedFiles.length === 0 || isTyping}
                    className={`p-2.5 ml-2 mb-1 rounded-full transition-all duration-300 ${localInput.trim() || attachedFiles.length > 0 ? 'bg-white text-black hover:scale-105 shadow-lg' : 'bg-white/5 text-zinc-700 cursor-not-allowed'}`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
            </div>
            {centered && (
                <div className="text-center text-[11px] text-zinc-500 mt-4 font-normal tracking-tight opacity-60">
                    Ziggy can make mistakes. Check important info.
                </div>
            )}
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const { logout } = useAuth();
    const [history, setHistory] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [userName, setUserName] = useState('Explorer');
    const [userEmail, setUserEmail] = useState('explorer@example.com');
    const [isTyping, setIsTyping] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [activeMode, setActiveMode] = useState(null);
    const [typewriterText, setTypewriterText] = useState("");
    const fileInputRef = useRef(null);
    const abortControllerRef = useRef(null);
    const isStoppingRef = useRef(false);

    const isChatEmpty = !currentChat || (currentChat.id === 'temp' && currentChat.messages.length === 0);

    const stopTyping = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        isStoppingRef.current = true;
        setIsTyping(false);
    };

    // Load history and user data
    useEffect(() => {
        const fetchHistoryData = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                console.log("Fetching history with token:", token ? "Token present" : "No token");
                const response = await fetch(`${import.meta.env.VITE_API_BASE}/chat/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log("History received:", data.length, "items");
                    setHistory(Array.isArray(data) ? data : []);
                } else {
                    console.error("History fetch failed:", response.status);
                }
            } catch (err) { console.error("History fetch error:", err); }
        };
        fetchHistoryData();
        const storedName = localStorage.getItem('user_name');
        if (storedName) setUserName(storedName);
    }, [navigate]);

    // Outside click handlers
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.sidebar-menu-trigger')) setActiveMenuId(null);
            if (!e.target.closest('.profile-trigger')) setShowProfile(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchHistory = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE}/chat/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setHistory(Array.isArray(data) ? data : []);
            }
        } catch (err) { console.error(err); }
    };

    const handleNewChat = () => {
        if (currentChat && currentChat.messages.length > 0) fetchHistory();
        setCurrentChat(null);
        setAttachedFiles([]);
        setActiveMode(null);
        setTypewriterText("");
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setAttachedFiles((prev) => [...prev, ...files]);
        e.target.value = null;
    };

    const removeFile = (index) => {
        setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = async (text) => {
        if (!text.trim() && attachedFiles.length === 0) return;
        const userMsg = { role: 'user', content: text, files: attachedFiles.map(f => ({ name: f.name, type: f.type })) };
        const token = localStorage.getItem('access_token');
        let session_id = currentChat?.id;
        const tempChat = currentChat ? { ...currentChat, messages: [...currentChat.messages, userMsg] } : { id: 'temp', title: text.substring(0, 30), messages: [userMsg] };
        setCurrentChat(tempChat);
        setAttachedFiles([]);
        setIsTyping(true);
        setTypewriterText("");
        isStoppingRef.current = false;
        abortControllerRef.current = new AbortController();

        try {
            if (!session_id || session_id === 'temp') {
                const sessionRes = await fetch(`${import.meta.env.VITE_API_BASE}/chat/history`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ title: text.substring(0, 30) || "New Chat" })
                });
                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();
                    session_id = sessionData.id;
                    tempChat.id = session_id;
                    setHistory(prev => [sessionData, ...prev]);
                }
            }
            await fetch(`${import.meta.env.VITE_API_BASE}/chat/history/${session_id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(userMsg)
            });
            const aiRes = await fetch(`${import.meta.env.VITE_API_BASE}/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: userMsg.content + (attachedFiles.length > 0 ? ` (Attached files: ${attachedFiles.map(f => f.name).join(", ")})` : ""),
                    system_prompt: `You are Ziggy, a helpful AI assistant. The user's name is ${userName}. ${activeMode === 'search' ? 'Current mode: SEARCH.' : activeMode === 'study' ? 'Current mode: STUDY.' : activeMode === 'image' ? 'Current mode: IMAGE GENERATION.' : ''}`
                }),
                signal: abortControllerRef.current.signal
            });
            if (!aiRes.ok) throw new Error('AI failed');
            const aiData = await aiRes.json();
            const fullResponse = aiData.response;
            setIsTyping(false);
            let currentText = "";
            for (let i = 0; i < fullResponse.length; i++) {
                if (isStoppingRef.current) break;
                currentText += fullResponse[i];
                setTypewriterText(currentText);
                await new Promise(r => setTimeout(r, 10));
            }
            const assistantMsg = { role: 'assistant', content: isStoppingRef.current ? currentText : fullResponse };
            const finalChat = { ...tempChat, messages: [...tempChat.messages, assistantMsg] };
            setCurrentChat(finalChat);
            setTypewriterText("");
            setHistory(prev => prev.map(c => c.id === session_id ? { ...c, last_msg: assistantMsg.content } : c));
            await fetch(`${import.meta.env.VITE_API_BASE}/chat/history/${session_id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(assistantMsg)
            });
            isStoppingRef.current = false;
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Request aborted');
                return;
            }
            console.error(err);
            setIsTyping(false);
            const errMsg = { role: 'assistant', content: "Ziggy had a hiccup! ⚡️ Try again?" };
            setCurrentChat(prev => ({ ...prev, messages: prev ? [...prev.messages, errMsg] : [errMsg] }));
        } finally {
            abortControllerRef.current = null;
        }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const loadChat = async (chat) => {
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/chat/history/${chat.id}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const msgs = await res.json();
                setCurrentChat({ ...chat, messages: msgs });
                setTypewriterText("");
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteChat = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this chat?")) return;
        const token = localStorage.getItem('access_token');
        try {
            await fetch(`${import.meta.env.VITE_API_BASE}/chat/history/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
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
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/chat/history/${id}`, {
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

    const groupHistory = (chats) => {
        const groups = { 'Today': [], 'Yesterday': [], 'Previous Days': [] };
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

        chats.forEach(chat => {
            const date = new Date(chat.created_at || Date.now()); date.setHours(0, 0, 0, 0);
            if (date.getTime() === today.getTime()) groups['Today'].push(chat);
            else if (date.getTime() === yesterday.getTime()) groups['Yesterday'].push(chat);
            else groups['Previous Days'].push(chat);
        });
        return Object.fromEntries(Object.entries(groups).filter(([_, items]) => items.length > 0));
    };

    const groupedHistory = groupHistory(history);

    return (
        <div className="flex h-[calc(100vh-80px)] w-full bg-transparent text-gray-100 font-sans overflow-hidden relative">

            {/* Sidebar */}
            <aside
                className={`flex-shrink-0 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col h-full transition-all duration-300 ease-in-out z-50 overflow-hidden ${isSidebarOpen ? 'w-[280px]' : 'w-0'}`}
            >
                <div className="flex flex-col h-full w-[280px] relative">
                    {/* Sidebar Header */}
                    <div className="p-4 flex items-center justify-between gap-2 border-b border-white/5">
                        <button
                            onClick={handleNewChat}
                            className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all text-sm font-semibold border border-white/5 group"
                        >
                            <svg className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                            <span>New Chat</span>
                        </button>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            title="Close sidebar"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                        </button>
                    </div>

                    {/* Chat History List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-2 pt-4">
                        {/* History Dropdown Toggle */}
                        <div className="px-1">
                            <button
                                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest"
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    History
                                </div>
                                <svg className={`w-4 h-4 transition-transform duration-300 ${isHistoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                        </div>

                        {isHistoryOpen && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                {Object.entries(groupedHistory).map(([groupName, chats]) => (
                                    <div key={groupName} className="space-y-1">
                                        <div className="px-3 text-[10px] font-bold text-zinc-500 py-1 uppercase tracking-[0.2em] opacity-50">{groupName}</div>
                                        {chats.map(chat => (
                                            <div key={chat.id} className="relative group/item px-1">
                                                <button
                                                    onClick={() => loadChat(chat)}
                                                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center pr-8 ${currentChat?.id === chat.id ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'}`}
                                                >
                                                    <span className="truncate flex-1">{chat.title}</span>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === chat.id ? null : chat.id); }}
                                                    className={`sidebar-menu-trigger absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-600 hover:text-white rounded-lg opacity-0 group-hover/item:opacity-100 transition-all ${activeMenuId === chat.id ? 'opacity-100' : ''}`}
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                                                </button>
                                                {activeMenuId === chat.id && (
                                                    <div className="absolute left-full ml-1 top-0 w-32 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-[70] overflow-hidden py-1.5 animate-in fade-in slide-in-from-left-2 duration-150">
                                                        <button onClick={(e) => handleRenameChat(chat.id, e)} className="w-full text-left px-3 py-2 text-[12px] text-zinc-300 hover:bg-white/10 flex items-center gap-2">
                                                            <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                            Rename
                                                        </button>
                                                        <button onClick={(e) => handleDeleteChat(chat.id, e)} className="w-full text-left px-3 py-2 text-[12px] text-red-400 hover:bg-white/10 flex items-center gap-2">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Profile Section - Fixed Bottom */}
                    <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
                        <div className="relative">
                            {showProfile && (
                                <div className="absolute bottom-[calc(100%+12px)] left-0 w-full bg-[#171717] border border-white/10 rounded-2xl shadow-2xl py-1.5 px-1 z-[100] animate-in slide-in-from-bottom-2 duration-200">
                                    <button onClick={() => { setIsSettingsOpen(true); setShowProfile(false); setActiveTab('account'); }} className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/5 rounded-xl transition-all text-[13px] text-zinc-300">
                                        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        Profile
                                    </button>
                                    <button onClick={() => { setIsSettingsOpen(true); setShowProfile(false); setActiveTab('general'); }} className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/5 rounded-xl transition-all text-[13px] text-zinc-300">
                                        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        Settings
                                    </button>
                                    <div className="h-px bg-white/5 my-1.5 mx-2" />
                                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-red-500/10 rounded-xl transition-all text-[13px] text-red-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        Logout
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowProfile(!showProfile); }}
                                className="profile-trigger flex items-center gap-3 w-full px-2.5 py-2.5 rounded-xl hover:bg-white/5 transition-all text-left group"
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg ring-1 ring-white/20">
                                    {getAvatarLetter(userName)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-bold text-zinc-100 truncate tracking-tight">{userName}</div>
                                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-60 scale-90 origin-left">Pro Account</div>
                                </div>
                                <svg className={`w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-all ${showProfile ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 relative flex flex-col h-full overflow-hidden transition-all duration-300 bg-transparent">

                {/* Floating Open Sidebar Button (Visible only when sidebar is closed) */}
                {!isSidebarOpen && (
                    <div className="absolute top-4 left-4 z-[60] flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2.5 bg-black/40 backdrop-blur-3xl text-zinc-400 hover:text-white rounded-xl border border-white/10 hover:border-white/20 transition-all shadow-2xl group"
                            title="Open sidebar"
                        >
                            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative scroll-smooth flex flex-col w-full h-full pb-40">
                    {isChatEmpty ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 w-full max-w-3xl mx-auto">
                            <div className="w-20 h-20 bg-white/5 backdrop-blur-3xl rounded-3xl flex items-center justify-center shadow-2xl mb-8 border border-white/10 group hover:scale-110 transition-transform duration-500">
                                <ZiggyMascot className="w-14 h-14" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-10 text-center tracking-tight">What can I help with?</h2>

                            <div className="flex justify-center mb-10 gap-2">
                                {['search', 'study', 'image'].map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setActiveMode(prev => prev === mode ? null : mode)}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all border ${activeMode === mode ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-white/5 text-zinc-500 border-white/10 hover:bg-white/10'}`}
                                    >
                                        <span className="capitalize">{mode}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Centered Input */}
                            <InputComponent
                                handleSendMessage={handleSendMessage}
                                isTyping={isTyping}
                                stopTyping={stopTyping}
                                centered={true}
                                activeMode={activeMode}
                                setActiveMode={setActiveMode}
                                attachedFiles={attachedFiles}
                                setAttachedFiles={setAttachedFiles}
                                fileInputRef={fileInputRef}
                                handleFileChange={handleFileChange}
                                removeFile={removeFile}
                            />

                            {/* Suggestions */}
                            <div className="grid grid-cols-2 gap-4 w-full px-4 mt-12 max-w-2xl">
                                {["Plan a trip", "Help me write", "Summarize text", "Code something"].map((text, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSendMessage(text)}
                                        className="p-4 bg-white/5 backdrop-blur-xl border border-white/5 hover:bg-white/10 rounded-2xl text-left transition-all hover:scale-[1.02] shadow-sm group"
                                    >
                                        <div className="text-[13px] font-semibold text-zinc-400 group-hover:text-white transition-colors">{text}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-3xl mx-auto px-5 pt-10 pb-10 flex flex-col gap-8">
                            {currentChat.messages.map((msg, idx) => (
                                <MessageItem key={idx} msg={msg} userName={userName} getAvatarLetter={getAvatarLetter} />
                            ))}
                            {typewriterText && (
                                <MessageItem
                                    msg={{ role: 'assistant', content: typewriterText }}
                                    isTypewriter={true}
                                    typewriterText={typewriterText}
                                    userName={userName}
                                    getAvatarLetter={getAvatarLetter}
                                />
                            )}
                            {isTyping && !typewriterText && (
                                <div className="w-full py-4">
                                    <div className="flex gap-4 max-w-3xl mx-auto">
                                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ring-1 ring-white/10">Z</div>
                                        <div className="flex items-center gap-1.5 h-8">
                                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-150"></span>
                                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-300"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Input Area (Bottom Fixed Only when chat is active) */}
                {!isChatEmpty && (
                    <div className="absolute bottom-0 left-0 w-full pt-10 pb-6 px-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20">
                        {isTyping && (
                            <div className="flex justify-center mb-4">
                                <button
                                    onClick={stopTyping}
                                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-xs font-bold shadow-2xl"
                                >
                                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                                    Stop Generation
                                </button>
                            </div>
                        )}
                        <InputComponent
                            handleSendMessage={handleSendMessage}
                            isTyping={isTyping}
                            stopTyping={stopTyping}
                            centered={false}
                            activeMode={activeMode}
                            setActiveMode={setActiveMode}
                            attachedFiles={attachedFiles}
                            setAttachedFiles={setAttachedFiles}
                            fileInputRef={fileInputRef}
                            handleFileChange={handleFileChange}
                            removeFile={removeFile}
                        />
                        <div className="mt-3 text-center text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-40">
                            Ziggy AI V2.0.1 © 2026. GPT Project.
                        </div>
                    </div>
                )}
            </main>

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#171717] w-full max-w-2xl rounded-[32px] border border-white/10 shadow-2xl flex flex-col h-[520px] overflow-hidden">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 shrink-0">
                            <h2 className="text-xl font-bold text-white tracking-tight">Settings</h2>
                            <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex flex-1 overflow-hidden">
                            <div className="w-52 border-r border-white/5 py-4 shrink-0 bg-black/20">
                                {['general', 'account', 'data'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`w-full text-left px-8 py-3 text-[13px] transition-all capitalize ${activeTab === tab ? 'bg-white/5 text-white font-bold border-r-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                                {activeTab === 'general' && (
                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-bold text-white">Theme</div>
                                                <div className="text-xs text-zinc-500 mt-1">Customize your visual experience</div>
                                            </div>
                                            <select
                                                value={theme}
                                                onChange={(e) => setTheme(e.target.value.toLowerCase())}
                                                className="bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                                            >
                                                <option value="system">System</option>
                                                <option value="light">Light</option>
                                                <option value="dark">Dark</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'account' && (
                                    <div className="space-y-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Name</label>
                                            <div className="text-sm text-zinc-100 bg-white/5 p-4 rounded-2xl border border-white/5 font-medium">{userName}</div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email</label>
                                            <div className="text-sm text-zinc-100 bg-white/5 p-4 rounded-2xl border border-white/5 font-medium">{userEmail}</div>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'data' && (
                                    <div className="space-y-8">
                                        <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-[24px] space-y-4">
                                            <div>
                                                <div className="text-sm font-bold text-red-400">Delete all chats</div>
                                                <div className="text-xs text-red-400/60 mt-1">This action cannot be undone. All history will be wiped.</div>
                                            </div>
                                            <button
                                                onClick={() => { if (window.confirm("Permanently delete ALL chats?")) { setHistory([]); setCurrentChat(null); setIsSettingsOpen(false); } }}
                                                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[12px] font-bold rounded-xl transition-all border border-red-500/20"
                                            >
                                                Permanently Delete All History
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
