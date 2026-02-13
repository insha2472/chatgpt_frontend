import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import ZiggyMascot from "./ZiggyMascot";

const Header = () => {
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isLoggedIn = !!token;
    const userName = user?.name || 'Guest';

    const getAvatarLetter = (name) => {
        return name ? name.charAt(0).toUpperCase() : 'Z';
    };

    const NavLinks = ({ mobile = false }) => (
        <>
            {!isLoggedIn && (
                <Link
                    to="/"
                    onClick={() => setIsMenuOpen(false)}
                    className={`${mobile ? 'block py-4 text-center' : ''} text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`}
                >
                    Home
                </Link>
            )}
            {["About", "Contact"].map((item) => (
                <Link
                    key={item}
                    to={`/${item.toLowerCase()}`}
                    onClick={() => setIsMenuOpen(false)}
                    className={`${mobile ? 'block py-4 text-center border-t border-white/5' : ''} text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`}
                >
                    {item}
                </Link>
            ))}
            {!isLoggedIn && (
                <>
                    <Link
                        to="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className={`${mobile ? 'block py-4 text-center border-t border-white/5' : ''} text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors`}
                    >
                        Log in
                    </Link>
                    <Link
                        to="/signup"
                        onClick={() => setIsMenuOpen(false)}
                        className={`${mobile ? 'block py-4 text-center border-t border-white/5' : ''} text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors`}
                    >
                        Sign up
                    </Link>
                </>
            )}
        </>
    );

    return (
        <header className="fixed top-0 left-0 right-0 h-20 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-color)] flex items-center justify-between px-6 md:px-8 z-[100] transition-all">
            <div className="flex items-center gap-10">
                <Link to="/" className="flex items-center gap-2.5 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
                        <ZiggyMascot className="w-8 h-8" pulse={false} />
                    </div>
                    <span className="text-lg font-bold text-[var(--text-primary)] tracking-tight drop-shadow-md">Ziggy</span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    <NavLinks />
                </nav>
            </div>

            <div className="flex items-center gap-4">
                {isLoggedIn && (
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-white/10 group/dash"
                    >
                        <span className="hidden sm:inline text-sm font-medium text-[var(--text-secondary)] group-hover/dash:text-[var(--text-primary)] transition-colors">Dashboard</span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-[var(--text-primary)] shadow-inner ring-1 ring-white/10">
                            {getAvatarLetter(userName)}
                        </div>
                    </Link>
                )}

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMenuOpen && (
                <div className="absolute top-20 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-2xl border-b border-white/10 md:hidden animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    <nav className="flex flex-col p-4">
                        <NavLinks mobile={true} />
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;
