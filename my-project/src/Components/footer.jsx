import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="w-full bg-[#1a1a2e]/60 backdrop-blur-md border-t border-white/5 py-10 px-8 relative z-10">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-md shadow-md"></div>
                    <span className="text-sm font-bold text-white tracking-wide">GPT Project</span>
                </div>

                <div className="flex items-center gap-8">
                    {["Privacy", "Terms", "Status"].map((item) => (
                        <Link
                            key={item}
                            to="#"
                            className="text-xs font-semibold text-zinc-500 hover:text-white transition-colors"
                        >
                            {item}
                        </Link>
                    ))}
                </div>

                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    © 2026 GPT Project
                </p>
            </div>
        </footer>
    );
}

export default Footer;