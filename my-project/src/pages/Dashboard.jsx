import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [input, setInput] = useState('');
    const [showProfile, setShowProfile] = useState(false);
    const [userName, setUserName] = useState('Ziggy User');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Load history and user data from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('chatgpt_clone_history');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }

        const storedName = localStorage.getItem('user_name');
        if (storedName) {
            setUserName(storedName);
        }
    }, []);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('chatgpt_clone_history', JSON.stringify(history));
    }, [history]);

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentChat, isTyping]);

    const handleNewChat = () => {
        setCurrentChat(null);
        setInput('');
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const newMessage = { role: 'user', content: input };
        let updatedChat;

        // Optimistic UI update
        if (currentChat) {
            updatedChat = { ...currentChat, messages: [...currentChat.messages, newMessage] };
            setCurrentChat(updatedChat);
        } else {
            updatedChat = {
                id: Date.now(),
                title: input.substring(0, 30) + (input.length > 30 ? '...' : ''),
                messages: [newMessage],
                timestamp: new Date().toISOString()
            };
            setCurrentChat(updatedChat);
            setHistory([updatedChat, ...history]);
        }

        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch('http://127.0.0.1:8000/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: newMessage.content,
                    system_prompt: `You are Ziggy, a helpful and cute AI assistant. The user's name is ${userName}.`
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
            setHistory(prev => prev.map(chat => chat.id === finalChat.id ? finalChat : chat));

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
        navigate('/login');
    };

    const loadChat = (chat) => {
        setCurrentChat(chat);
    };

    // Get initials for avatar
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex min-h-[calc(100vh-80px)] text-zinc-200 font-sans antialiased">
            {/* Sidebar for History */}
            <aside className="w-64 bg-black/20 backdrop-blur-xl border-r border-white/5 flex flex-col hidden md:flex h-[calc(100vh-80px)] fixed top-20 left-0 z-10 shadow-xl">
                <div className="p-4">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-3 px-4 py-3 border border-white/10 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-indigo-500/20 group"
                    >
                        <svg className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-zinc-200 group-hover:text-white">New Chat</span>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto px-2 space-y-1 custom-scrollbar">
                    <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">History</div>
                    {history.length === 0 ? (
                        <p className="px-4 text-xs text-zinc-600 italic">No previous chats.</p>
                    ) : (
                        history.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => loadChat(chat)}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors truncate flex items-center gap-3 ${currentChat?.id === chat.id ? 'bg-white/10 text-white shadow-md border border-white/5' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
                            >
                                <svg className="w-4 h-4 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                <span className="truncate">{chat.title}</span>
                            </button>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-white/5">
                    <div className="relative">
                        <button
                            onClick={() => setShowProfile(!showProfile)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-inner ring-1 ring-white/20">
                                {getInitials(userName)}
                            </div>
                            <div className="flex-grow text-left overflow-hidden">
                                <div className="text-sm font-bold text-white shadow-black drop-shadow-sm truncate">{userName}</div>
                                <div className="text-xs text-zinc-400">Ziggy Explorer</div>
                            </div>
                            <svg className={`w-4 h-4 text-zinc-500 transition-transform ${showProfile ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </button>

                        {showProfile && (
                            <div className="absolute bottom-full left-0 w-full mb-2 bg-[#1a1a2e]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2 animate-in fade-in slide-in-from-bottom-2 z-50">
                                <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    Profile Settings
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
            <main className="flex-grow md:ml-64 p-6 md:p-12 relative min-h-full">
                {currentChat ? (
                    <div className="max-w-4xl mx-auto h-full flex flex-col">
                        <div className="flex-grow space-y-6 pb-32">
                            {currentChat.messages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-4 ${msg.role === 'assistant' ? 'bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-sm' : 'flex-row-reverse'}`}>
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-lg ${msg.role === 'assistant' ? 'bg-indigo-500 text-white ring-1 ring-indigo-400/30' : 'bg-zinc-700 text-white ring-1 ring-zinc-600/50'}`}>
                                        {msg.role === 'assistant' ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        ) : getInitials(userName)}
                                    </div>
                                    <div className={`text-sm leading-relaxed ${msg.role === 'assistant' ? 'text-zinc-200' : 'text-white bg-indigo-600/30 backdrop-blur-md px-4 py-2 rounded-2xl rounded-tr-none border border-indigo-500/30 shadow-inner'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-4 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-sm">
                                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-lg bg-indigo-500 text-white ring-1 ring-indigo-400/30">
                                        <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
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
                                <span className="animate-bounce">🤖</span>
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

                {/* Input Area */}
                <div className="fixed bottom-0 md:left-64 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20">
                    <div className="max-w-3xl mx-auto relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            className="relative w-full bg-[#1a1a2e]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 pr-14 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all min-h-[60px] max-h-[200px] resize-none shadow-2xl custom-scrollbar"
                            placeholder="Message Ziggy..."
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim()}
                            className="absolute right-3 bottom-3 p-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-zinc-500 mt-2">Ziggy can make mistakes. Consider checking important information.</p>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
