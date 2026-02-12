import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

const Home = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeMode, setActiveMode] = useState(null); // 'search', 'study', 'image'
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachedFiles((prev) => [...prev, ...files]);
    e.target.value = null; // Reset for same file re-selection
  };

  const removeFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
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

    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query + (attachedFiles.length > 0 ? ` (Attached files: ${attachedFiles.map(f => f.name).join(", ")})` : ""),
          system_prompt: `You are Ziggy, a friendly AI assistant. The user is a guest explorer on our home page. ${activeMode === 'search' ? 'Current mode: SEARCH. Provide detailed web-style search results.' : activeMode === 'study' ? 'Current mode: STUDY. Act as a tutor, explaining concepts simply.' : activeMode === 'image' ? 'Current mode: IMAGE GENERATION. Describe vivid images based on user input.' : ''}`
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Oops! Ziggy is a bit sleepy right now. 🐱 🔌" }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Detect and render images in message content
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
      <div className="prose prose-invert max-w-none text-zinc-100 bg-transparent text-left">
        <ReactMarkdown>
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 font-sans antialiased text-white relative">
      <div className={`w-full max-w-3xl transition-all duration-500 ${messages.length > 0 ? "mt-4 flex-grow flex flex-col" : "mb-20"}`}>

        {messages.length === 0 ? (
          /* Hero Section */
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter drop-shadow-2xl">
              Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Ziggy.</span>
            </h1>
            <p className="text-zinc-400 text-lg mb-12 max-w-xl mx-auto font-medium leading-relaxed">
              Your neighborhood AI. Faster, cuter, and always ready to help. No account needed to start.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {!localStorage.getItem('access_token') ? (
                <>
                  <Link
                    to="/login"
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 active:scale-95 text-sm uppercase tracking-widest"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/signup"
                    className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold transition-all active:scale-95 text-sm uppercase tracking-widest"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <Link
                  to="/dashboard"
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 active:scale-95 text-sm uppercase tracking-widest flex items-center gap-3"
                >
                  <span>Go to Dashboard</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Chat Display */
          <div className="flex-grow space-y-6 mb-8 overflow-y-auto custom-scrollbar p-6 bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === "assistant" ? "" : "flex-row-reverse"}`}>
                <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-sm font-bold shadow-xl ${msg.role === "assistant" ? "bg-indigo-600 text-white" : "bg-white/10 text-zinc-300 border border-white/10"}`}>
                  {msg.role === "assistant" ? "🐱" : "E"}
                </div>
                <div className="flex flex-col gap-2 max-w-[85%] text-left">
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed text-left ${msg.role === "assistant" ? "bg-white/5 border border-white/5 text-zinc-100" : "bg-indigo-600/40 text-white border border-indigo-500/30"}`}>
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
              <div className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-sm">🐱</div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div className={`w-full transition-all duration-500 ${messages.length > 0 ? "sticky bottom-8" : ""}`}>
          <div className="flex justify-center mb-4 gap-2">
            <button
              onClick={() => setActiveMode(prev => prev === 'search' ? null : 'search')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${activeMode === 'search' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-lg shadow-cyan-500/10' : 'bg-white/5 text-zinc-500 border-white/10 hover:bg-white/10'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              Search
            </button>
            <button
              onClick={() => setActiveMode(prev => prev === 'study' ? null : 'study')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${activeMode === 'study' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/10' : 'bg-white/5 text-zinc-500 border-white/10 hover:bg-white/10'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Study
            </button>
            <button
              onClick={() => setActiveMode(prev => prev === 'image' ? null : 'image')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${activeMode === 'image' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-lg shadow-purple-500/10' : 'bg-white/5 text-zinc-500 border-white/10 hover:bg-white/10'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Image
            </button>
          </div>
          <div className="relative group">

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

            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] opacity-20 group-hover:opacity-40 blur-xl transition duration-500"></div>
            <div className="relative flex items-center gap-3 border border-white/15 rounded-[2rem] px-5 py-4 shadow-3xl bg-[#1a1a2e]/60 backdrop-blur-3xl transition-all hover:bg-[#1a1a2e]/80">

              <input
                type="file"
                multiple
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-zinc-400 hover:text-indigo-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.486L20.5 13" /></svg>
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={activeMode === 'search' ? "Search for anything..." : activeMode === 'study' ? "Ask a study question..." : activeMode === 'image' ? "Describe an image to create..." : "Message Ziggy..."}
                className="flex-1 outline-none text-lg text-white placeholder-zinc-500 bg-transparent"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() && attachedFiles.length === 0}
                className="bg-white/10 p-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-30"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          {messages.length === 0 && (
            /* Recommendations */
            <div className="flex flex-wrap gap-3 mt-10 justify-center">
              {[
                { label: "Tell me a joke 🤡", query: "Tell me a funny cat joke!" },
                { label: "Ziggy's origin? 🐱", query: "Who is Ziggy and what can you do?" },
                { label: "Quantum Physics? ⚛️", query: "Explain quantum entanglement in simple terms." },
                { label: "Travel tips 🌍", query: "Give me 3 hidden gems in Japan." }
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleSendMessage(item.query)}
                  className="px-6 py-3 text-xs border border-white/10 rounded-full text-zinc-400 hover:bg-white/10 hover:border-indigo-500/50 hover:text-white transition-all font-bold uppercase tracking-widest shadow-lg hover:shadow-indigo-500/20 active:scale-95"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!messages.length && (
        <p className="absolute bottom-8 text-[10px] text-zinc-700 font-bold uppercase tracking-[0.4em] pointer-events-none">
          Interactive Protocol Active — Ziggy AI v1.0
        </p>
      )}
    </div>
  );
};

export default Home;
