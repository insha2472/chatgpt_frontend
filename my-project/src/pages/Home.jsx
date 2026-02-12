import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import ZiggyMascot from "../Components/ZiggyMascot";

const Home = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userName, setUserName] = useState('Explorer');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeMode, setActiveMode] = useState(null); // 'search', 'study', 'image'
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const storedName = localStorage.getItem('user_name');
    if (storedName) setUserName(storedName);

    const fetchHistory = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      try {
        const response = await fetch('http://127.0.0.1:8000/chat/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setHistory(Array.isArray(data) ? data : []);
        }
      } catch (err) { console.error(err); }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachedFiles((prev) => [...prev, ...files]);
    e.target.value = null;
  };

  const handleSendMessage = async (initialQuery) => {
    const query = initialQuery || input;
    if (!query.trim() && attachedFiles.length === 0) return;

    const userMessage = {
      role: "user",
      content: query,
      files: attachedFiles.map(f => ({ name: f.name, type: f.type }))
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachedFiles([]);
    setIsTyping(true);

    const token = localStorage.getItem('access_token');

    try {
      let session_id = null;
      if (token) {
        const sessRes = await fetch("http://127.0.0.1:8000/chat/history", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ title: query.substring(0, 30) || "Home Chat" })
        });
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          session_id = sessData.id;
          await fetch(`http://127.0.0.1:8000/chat/history/${session_id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(userMessage)
          });
        }
      }

      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: query + (attachedFiles.length > 0 ? ` (Attached files: ${attachedFiles.map(f => f.name).join(", ")})` : ""),
          system_prompt: `You are Ziggy, a friendly AI assistant. The user's name is ${userName}. ${activeMode === 'search' ? 'Current mode: SEARCH.' : activeMode === 'study' ? 'Current mode: STUDY.' : activeMode === 'image' ? 'Current mode: IMAGE GENERATION.' : ''}`
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();
      const assistantMessage = { role: "assistant", content: data.response };
      setMessages((prev) => [...prev, assistantMessage]);

      if (token && session_id) {
        await fetch(`http://127.0.0.1:8000/chat/history/${session_id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(assistantMessage)
        });
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Oops! Ziggy is a bit sleepy right now. 🐱 🔌" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessageContent = (content) => {
    if (!content || typeof content !== 'string') return <p className="italic text-zinc-500 uppercase tracking-widest text-[10px]">Empty Message</p>;

    if (content.includes('IMAGE_URL:')) {
      const parts = content.split('IMAGE_URL: ');
      const text = parts[0] || "";
      const url = parts[1] || "";
      return (
        <div className="space-y-4 text-left">
          {text.trim() && (
            <div className="prose prose-invert max-w-none text-zinc-100 bg-transparent text-left leading-[1.8]">
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
      <div className="prose prose-invert max-w-none text-zinc-100 bg-transparent text-left leading-[1.8]">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  };

  const InputArea = () => (
    <div className={`w-full transition-all duration-500`}>
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
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-400 rounded-[2rem] opacity-20 group-hover:opacity-40 blur-2xl transition duration-500"></div>
        <div className="relative flex items-center gap-3 border border-white/10 rounded-[2rem] px-4 md:px-6 py-4 md:py-5 shadow-3xl bg-white/5 backdrop-blur-3xl transition-all hover:bg-white/10 hover:border-white/20">
          <input
            type="file"
            multiple
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-zinc-500 hover:text-indigo-400 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="What can I help with?"
            className="flex-1 outline-none text-base md:text-xl text-[var(--text-primary)] placeholder-zinc-500 bg-transparent border-none focus:ring-0 shadow-none"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() && attachedFiles.length === 0}
            className="bg-white text-black p-3.5 rounded-2xl hover:scale-110 transition-all active:scale-95 disabled:opacity-20 disabled:grayscale shadow-xl font-bold"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full bg-transparent relative">
      {/* Sidebar for navigation toggle */}
      <aside
        className={`fixed top-0 left-0 bottom-0 bg-black/60 backdrop-blur-3xl border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out z-[150] overflow-hidden ${isSidebarOpen ? 'w-[280px]' : 'w-0'}`}
      >
        <div className="flex flex-col h-full w-[280px]">
          <div className="p-6 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <ZiggyMascot className="w-8 h-8" />
              <span className="text-lg font-black text-white tracking-tighter">ZIGGY HOME</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-zinc-500 hover:text-white rounded-xl hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {[
              { to: "/dashboard", label: "Dashboard", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", color: "indigo" },
              { to: "/about", label: "About", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "purple" },
              { to: "/contact", label: "Contact", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", color: "pink" }
            ].map((link, idx) => (
              <Link key={idx} to={link.to} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all group">
                <div className={`w-9 h-9 rounded-xl bg-${link.color}-500/10 flex items-center justify-center group-hover:bg-${link.color}-500/20 transition-colors`}>
                  <svg className={`w-4 h-4 text-${link.color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} /></svg>
                </div>
                <span className="text-sm font-bold tracking-tight">{link.label}</span>
              </Link>
            ))}

            {history.length > 0 && (
              <div className="pt-6 border-t border-white/5 mt-6">
                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] px-3 mb-4">Recent Conversations</div>
                <div className="space-y-1">
                  {history.slice(0, 5).map(chat => (
                    <Link key={chat.id} to="/dashboard" className="block px-3 py-2.5 text-xs text-zinc-500 hover:text-zinc-200 truncate hover:bg-white/5 rounded-xl transition-all">
                      {chat.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-white/5 bg-black/20">
            <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-black text-indigo-400 border border-indigo-500/10">
                {userName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-white truncate">{userName}</div>
                <div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">Free License</div>
              </div>
            </div>
            <div className="mt-4 text-[9px] text-zinc-700 font-bold uppercase tracking-[0.3em] text-center opacity-40">
              Architecture v2.0.1 • Secured
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col relative w-full">
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-24 left-6 z-40 p-3 bg-black/40 backdrop-blur-3xl text-zinc-400 hover:text-white rounded-2xl border border-white/10 hover:border-white/20 transition-all shadow-2xl group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
        )}

        <div className={`flex-1 flex flex-col items-center px-4 relative ${messages.length === 0 ? "justify-center" : "justify-start"}`}>
          <div className="w-full max-w-5xl">
            {messages.length === 0 ? (
              <>
                <section className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center py-20 animate-in fade-in duration-1000">
                  <div className="text-center mb-12">
                    <div className="mb-10 flex justify-center">
                      <ZiggyMascot className="w-28 h-28" />
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-tight drop-shadow-2xl">
                      Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Ziggy.</span>
                    </h1>
                    <p className="text-zinc-400 text-lg md:text-2xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                      Your adorable AI companion. Faster, smarter, and always ready to help. Start chatting for free.
                    </p>

                    <div className="w-full max-w-3xl mx-auto">
                      <InputArea />
                    </div>

                    <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16 opacity-30 grayscale transition-all hover:grayscale-0 hover:opacity-50">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em]">RESEARCH</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.4em]">ACADEMIA</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.4em]">CREATIVITY</span>
                    </div>
                  </div>
                </section>


              </>
            ) : (
              <div className="w-full py-8 flex flex-col min-h-[calc(100vh-160px)]">
                <div className="flex-grow space-y-6 mb-8 p-8 bg-black/20 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-5 ${msg.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}>
                      <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-sm font-black shadow-xl ${msg.role === "assistant" ? "bg-white/5 border border-white/5" : "bg-indigo-600 text-white border border-indigo-500 shadow-indigo-500/20"}`}>
                        {msg.role === "assistant" ? <ZiggyMascot className="w-10 h-10" pulse={false} /> : userName.charAt(0)}
                      </div>
                      <div className="flex flex-col gap-2 max-w-[85%] text-left">
                        <div className={`p-5 rounded-3xl text-sm leading-relaxed ${msg.role === "assistant" ? "bg-white/5 border border-white/5 text-zinc-100" : "bg-white/10 text-white border border-white/10"}`}>
                          {renderMessageContent(msg.content)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-5 animate-pulse">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                        <ZiggyMascot className="w-10 h-10" />
                      </div>
                      <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex gap-1.5 items-center">
                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-200"></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="sticky bottom-8 w-full max-w-3xl mx-auto z-50">
                  <InputArea />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
