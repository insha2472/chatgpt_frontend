import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
    const navigate = useNavigate();
    const isLoggedIn = !!localStorage.getItem('access_token');
    const userName = localStorage.getItem('user_name') || 'Guest';

    const getAvatarLetter = (name) => {
        return name ? name.charAt(0).toUpperCase() : 'Z';
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-20 bg-[#1a1a2e]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 z-[100] transition-all">
            <div className="flex items-center gap-10">
                <Link to="/" className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
                        {/* Ziggy Logo (Cat) */}
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8.5 8c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zm7 0c.83 0 1.5.67 1.5 1.5S16.33 11 15.5 11 14 10.33 14 9.5 14.67 8 15.5 8zM12 18c-2.21 0-4-1.79-4-4h8c0 2.21-1.79 4-4 4z" />
                            <path d="M6 6L4 2h4l-2 4zM18 6l2-4h-4l2 4z" />
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
                    {!isLoggedIn && (
                        <>
                            <Link to="/login" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Log in</Link>
                            <Link to="/signup" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Sign up</Link>
                        </>
                    )}
                </nav>
            </div>

            <div className="flex items-center gap-4">
                {isLoggedIn && (
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-white/10 group/dash"
                    >
                        <span className="text-sm font-medium text-zinc-400 group-hover/dash:text-white transition-colors">Dashboard</span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-inner ring-1 ring-white/10">
                            {getAvatarLetter(userName)}
                        </div>
                    </Link>
                )}
            </div>
        </header>
    );
};

export default Header;
