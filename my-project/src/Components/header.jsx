import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import ZiggyMascot from "./ZiggyMascot";

const Header = () => {
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const isLoggedIn = !!token;
    const userName = user?.name || 'Guest';

    const getAvatarLetter = (name) => {
        return name ? name.charAt(0).toUpperCase() : 'Z';
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-20 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-color)] flex items-center justify-between px-8 z-[100] transition-all">
            <div className="flex items-center gap-10">
                <Link to="/" className="flex items-center gap-2.5 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
                        <ZiggyMascot className="w-8 h-8" pulse={false} />
                    </div>
                    <span className="text-lg font-bold text-[var(--text-primary)] tracking-tight drop-shadow-md">Ziggy</span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    {!isLoggedIn && (
                        <Link
                            to="/"
                            className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                        >
                            Home
                        </Link>
                    )}
                    {["About", "Contact"].map((item) => (
                        <Link
                            key={item}
                            to={`/${item.toLowerCase()}`}
                            className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                        >
                            {item}
                        </Link>
                    ))}
                    {!isLoggedIn && (
                        <>
                            <Link to="/login" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Log in</Link>
                            <Link to="/signup" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Sign up</Link>
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
                        <span className="text-sm font-medium text-[var(--text-secondary)] group-hover/dash:text-[var(--text-primary)] transition-colors">Dashboard</span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-[var(--text-primary)] shadow-inner ring-1 ring-white/10">
                            {getAvatarLetter(userName)}
                        </div>
                    </Link>
                )}
            </div>
        </header>
    );
};

export default Header;
