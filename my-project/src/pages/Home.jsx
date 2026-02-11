import React from "react";

const Home = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      {/* Main content */}
      <h1 className="text-4xl md:text-5xl font-semibold text-gray-800 mb-8 tracking-tight">
        What can I help with?
      </h1>

      {/* Input box */}
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 border border-gray-200 rounded-3xl px-6 py-4 shadow-sm focus-within:ring-2 focus-within:ring-gray-100 bg-white transition-all">
          <input
            type="text"
            placeholder="Message GPT..."
            className="flex-1 outline-none text-lg text-gray-700 placeholder-gray-400"
          />
          <button className="bg-gray-100 p-2 rounded-xl text-gray-400 hover:text-black hover:bg-gray-200 transition-all">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-3 mt-6 justify-center">
          {["Create image", "Analyze data", "Code assistant", "Summarize text"].map((item) => (
            <button
              key={item}
              className="px-5 py-2 text-sm border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition-all font-medium"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Footer text */}
      <p className="text-[10px] text-gray-400 mt-16 text-center max-w-md font-medium uppercase tracking-widest">
        Powered by GPT Project — Intelligence Layer protocol active
      </p>
    </div>
  );
};

export default Home;