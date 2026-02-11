import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SignUp = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignUp = (e) => {
        e.preventDefault();
        console.log('Registering...', { name, email, password });
    };

    return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 relative overflow-hidden font-sans antialiased text-slate-200">
            {/* Soft Ambient Glows (Teal/Purple variant for Signup) */}
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-orange-500/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-zinc-500/5 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-[480px] bg-zinc-900/50 backdrop-blur-2xl border border-white/10 p-10 rounded-[32px] shadow-2xl relative z-10 transition-all duration-500">
                {/* Branding */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/20 mb-6 transform hover:-rotate-6 transition-transform">
                        <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-[32px] font-bold text-white tracking-tight text-center leading-tight">Create account</h1>
                    <p className="text-zinc-400 mt-2 text-center font-medium">Join our community of creators</p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-300 ml-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-14 px-5 bg-zinc-800/40 border border-zinc-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all text-white text-lg placeholder:text-zinc-600"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-300 ml-1">Email address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-14 px-5 bg-zinc-800/40 border border-zinc-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all text-white text-lg placeholder:text-zinc-600"
                            placeholder="name@domain.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-300 ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-14 px-5 bg-zinc-800/40 border border-zinc-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all text-white text-lg placeholder:text-zinc-600"
                            placeholder="Create a strong password"
                            required
                        />
                    </div>

                    <button type="submit" className="w-full h-14 mt-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-orange-900/20 active:scale-[0.98] text-lg">
                        Get Started
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-zinc-500 font-medium">
                        Already have an account? <Link to="/login" className="text-orange-500 font-bold hover:text-orange-400 underline decoration-2 underline-offset-4">Log in here</Link>
                    </p>
                </div>

                <div className="relative flex items-center py-6">
                    <div className="flex-grow border-t border-zinc-800"></div>
                    <span className="flex-shrink mx-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Or sign up with</span>
                    <div className="flex-grow border-t border-zinc-800"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-2 h-14 bg-zinc-800/50 border border-zinc-700 rounded-2xl hover:bg-zinc-700 transition-all">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/nps/google.svg" className="w-5 h-5" alt="Google" />
                        <span className="text-sm font-bold text-zinc-300">Google</span>
                    </button>
                    <button className="flex items-center justify-center gap-2 h-14 bg-zinc-800/50 border border-zinc-700 rounded-2xl hover:bg-zinc-700 transition-all">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                        <span className="text-sm font-bold text-zinc-300">GitHub</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignUp;