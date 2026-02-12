import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
    return (
        <header className="fixed top-0 left-0 right-0 h-20 bg-[#1a1a2e]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 z-[100] transition-all">
            <div className="flex items-center gap-10">
                <Link to="/" className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
                        {/* Ziggy Logo (Small) */}
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight drop-shadow-md">Ziggy</span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    {["Home", "About", "Contact"].map((item) => (
                        <Link
                            key={item}
                            to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                            className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                        >
                            {item}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white transition-all"
                >
                    Log in
                </Link>
                <Link
                    to="/signup"
                    className="px-5 py-2.5 text-sm font-bold bg-white text-black hover:bg-zinc-200 rounded-xl transition-all shadow-lg hover:shadow-white/20 active:scale-95"
                >
                    Sign up
                </Link>
            </div>
        </header>
    );
};

export default Header;
