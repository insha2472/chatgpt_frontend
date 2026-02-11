import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
    return (
        <header className="fixed top-0 left-0 right-0 h-20 bg-white/70 backdrop-blur-xl border-b border-gray-100/50 flex items-center justify-between px-8 z-50 transition-all">
            <div className="flex items-center gap-10">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-100 group-hover:rotate-6 transition-transform">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-orange-600 transition-colors">
                        GPT Project
                    </span>
                </Link>
                <nav className="hidden md:flex items-center gap-8">
                    {["Home", "About", "Contact"].map((item) => (
                        <Link
                            key={item}
                            to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                            className="text-sm font-bold text-gray-500 hover:text-orange-500 transition-colors tracking-wide uppercase"
                        >
                            {item}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <Link
                    to="/login"
                    className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                >
                    Log in
                </Link>
                <Link
                    to="/signup"
                    className="px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-teal-500 to-emerald-400 text-white hover:from-teal-600 hover:to-emerald-500 rounded-xl transition-all shadow-lg shadow-teal-100 active:scale-95"
                >
                    Sign up
                </Link>
            </div>
        </header>
    );
};

export default Header;