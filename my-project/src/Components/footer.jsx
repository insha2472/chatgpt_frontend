import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="w-full bg-white border-t border-gray-100 py-12 px-8">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex flex-col items-center md:items-start gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-teal-500 rounded-lg shadow-sm"></div>
                        <span className="text-lg font-bold text-gray-900">GPT Project</span>
                    </div>
                    <p className="text-sm text-gray-400 font-medium text-center md:text-left">
                        © 2026 GPT Project. All rights reserved.
                    </p>
                </div>

                <div className="flex items-center gap-8">
                    {["Privacy", "Terms", "Status", "Help"].map((item) => (
                        <Link
                            key={item}
                            to="#"
                            className="text-sm font-bold text-gray-400 hover:text-teal-600 transition-colors"
                        >
                            {item}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">System Operational</span>
                </div>
            </div>
        </footer>
    );
}

export default Footer;