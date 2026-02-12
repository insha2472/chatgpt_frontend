import React from 'react';

const ZiggyMascot = ({ className = "w-10 h-10", pulse = true }) => {
    return (
        <div className={`relative flex items-center justify-center ${className} ${pulse ? 'animate-pulse' : ''}`}>
            {/* Cute Futuristic Cat SVG */}
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(187,134,252,0.5)]">
                {/* Cat Ears */}
                <path d="M25 45L15 20L40 38" fill="#bb86fc" stroke="#bb86fc" strokeWidth="2" strokeLinejoin="round" />
                <path d="M75 45L85 20L60 38" fill="#bb86fc" stroke="#bb86fc" strokeWidth="2" strokeLinejoin="round" />

                {/* Cat Head */}
                <circle cx="50" cy="55" r="35" fill="#171717" stroke="#bb86fc" strokeWidth="3" />

                {/* Face Display (Glass Effect) */}
                <ellipse cx="50" cy="55" rx="25" ry="18" fill="#03dac6" fillOpacity="0.1" />

                {/* Eyes (Glowing) */}
                <circle cx="40" cy="55" r="4" fill="#03dac6" className="animate-bounce">
                    <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="60" cy="55" r="4" fill="#03dac6" className="animate-bounce">
                    <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
                </circle>

                {/* Little Blush */}
                <circle cx="30" cy="62" r="3" fill="#ff00ff" fillOpacity="0.3" />
                <circle cx="70" cy="62" r="3" fill="#ff00ff" fillOpacity="0.3" />

                {/* W-shaped Mouth (Cute Small) */}
                <path d="M45 65Q50 70 55 65" fill="none" stroke="#03dac6" strokeWidth="2" strokeLinecap="round" />
            </svg>

            {/* Tiny Glow Ring */}
            <div className="absolute inset-0 rounded-full border border-indigo-500/30 blur-sm"></div>
        </div>
    );
};

export default ZiggyMascot;
