import React from "react";

const Home = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 font-sans antialiased text-white">
      {/* Main content */}
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight text-center drop-shadow-lg">
        What can I <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">help with?</span>
      </h1>

      {/* Input box */}
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 border border-white/10 rounded-3xl px-6 py-4 shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500/50 bg-white/5 backdrop-blur-xl transition-all hover:bg-white/10">
          <input
            type="text"
            placeholder="Message Ziggy..."
            className="flex-1 outline-none text-lg text-white placeholder-zinc-500 bg-transparent"
          />
          <button className="bg-white/10 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-indigo-600 transition-all active:scale-95">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-3 mt-8 justify-center">
          {["Create image", "Analyze data", "Code assistant", "Summarize text"].map((item) => (
            <button
              key={item}
              className="px-5 py-2.5 text-sm border border-white/10 rounded-full text-zinc-300 hover:bg-white/10 hover:border-indigo-500/50 hover:text-white transition-all font-medium shadow-sm hover:shadow-indigo-500/20"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Footer text */}
      <p className="text-[10px] text-zinc-600 mt-16 text-center max-w-md font-bold uppercase tracking-widest">
        Powered by Ziggy AI — Interactive Protocol Active
      </p>
    </div>
  );
};

export default Home;