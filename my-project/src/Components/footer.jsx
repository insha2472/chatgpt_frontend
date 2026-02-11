import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="w-full bg-white border-t border-gray-100 py-10 px-8">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded-md"></div>
                    <span className="text-sm font-bold text-gray-900">GPT Project</span>
                </div>

                <div className="flex items-center gap-8">
                    {["Privacy", "Terms", "Status"].map((item) => (
                        <Link
                            key={item}
                            to="#"
                            className="text-xs font-semibold text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            {item}
                        </Link>
                    ))}
                </div>

                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                    © 2026 GPT Project
                </p>
            </div>
        </footer>
    );
}

export default Footer;