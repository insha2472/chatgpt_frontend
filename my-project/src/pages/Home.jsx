import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import ZiggyMascot from "../Components/ZiggyMascot";

const Home = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [userName, setUserName] = useState('Explorer');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeMode, setActiveMode] = useState(null); // 'search', 'study', 'image'
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isStoppingRef = useRef(false);

  // Smart Scroll to bottom logic
  const scrollToBottom = (force = false) => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    if (force || isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const storedName = localStorage.getItem('user_name');
    if (storedName) setUserName(storedName);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const stopTyping = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isStoppingRef.current = true;
    setIsTyping(false);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachedFiles((prev) => [...prev, ...files]);
    e.target.value = null;
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() && attachedFiles.length === 0) return;

    const userMessage = {
      role: "user",
      content: text,
      files: attachedFiles.map(f => ({ name: f.name, type: f.type }))
    };
    setMessages((prev) => [...prev, userMessage]);
    setAttachedFiles([]);
    setIsTyping(true);
    isStoppingRef.current = false;
    abortControllerRef.current = new AbortController();

    const token = localStorage.getItem('access_token');

    try {
      let session_id = null;
      if (token) {
        const sessRes = await fetch("http://127.0.0.1:8000/chat/history", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ title: text.substring(0, 30) || "Home Chat" })
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
          message: text + (attachedFiles.length > 0 ? ` (Attached files: ${attachedFiles.map(f => f.name).join(", ")})` : ""),
          system_prompt: `You are Ziggy, a friendly AI assistant. The user's name is ${userName}. ${activeMode === 'search' ? 'Current mode: SEARCH.' : activeMode === 'study' ? 'Current mode: STUDY.' : activeMode === 'image' ? 'Current mode: IMAGE GENERATION.' : ''}`
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();

      if (isStoppingRef.current) return;

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
      if (error.name === 'AbortError') return;
      setMessages((prev) => [...prev, { role: "assistant", content: "Oops! Ziggy is a bit sleepy right now. 🐱 🔌" }]);
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
      isStoppingRef.current = false;
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

  const InputArea = () => {
    const [localInput, setLocalInput] = useState('');

    const onSendMessage = () => {
      if (!localInput.trim() && attachedFiles.length === 0) return;
      handleSendMessage(localInput);
      setLocalInput('');
    };

    return (
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
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
              placeholder="What can I help with?"
              className="flex-1 outline-none text-base md:text-xl text-[var(--text-primary)] placeholder-zinc-500 bg-transparent border-none focus:ring-0 shadow-none"
            />

            <button
              onClick={onSendMessage}
              disabled={!localInput.trim() && attachedFiles.length === 0}
              className="bg-white text-black p-3.5 rounded-2xl hover:scale-110 transition-all active:scale-95 disabled:opacity-20 disabled:grayscale shadow-xl font-bold"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full bg-transparent relative h-screen overflow-hidden">
      <div className="flex-1 flex flex-col relative w-full h-full">

        <div ref={scrollAreaRef} className={`flex-1 flex flex-col items-center px-4 relative ${messages.length === 0 ? "justify-center" : "justify-start"} overflow-y-auto custom-scrollbar h-full`}>
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
