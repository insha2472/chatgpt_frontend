import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch('http://127.0.0.1:8000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.detail || 'Login failed');
            }

            const data = await response.json();

            // Store tokens and name
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('token_type', data.token_type);
            localStorage.setItem('user_name', data.user_name || 'Ziggy User');
            if (data.refresh_token) {
                localStorage.setItem('refresh_token', data.refresh_token);
            }

            // Redirect to dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 font-sans antialiased text-white">
            {/* Glassmorphism Container */}
            <div className="w-full max-w-[400px] relative z-10 bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/20">
                        {/* Ziggy Logo Placeholder (Simple Robot) */}
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9a2 2 0 100-4 2 2 0 000 4zm4 0a2 2 0 100-4 2 2 0 000 4z" /></svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
                    <p className="text-sm text-zinc-400 mt-2">Log in to your Ziggy account</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500 ml-1">Email address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-12 px-4 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-white placeholder:text-zinc-600 disabled:opacity-50"
                            placeholder="name@example.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-xs font-medium text-zinc-500">Password</label>
                        </div>
                        <div className="relative group">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-12 px-4 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-white placeholder:text-zinc-600 disabled:opacity-50"
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 px-1 text-sm disabled:opacity-50"
                                disabled={loading}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors mt-4 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-white/5"
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            'Log In'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-zinc-500">
                        Don't have an account? <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline">Sign up</Link>
                    </p>
                </div>

                <div className="relative flex items-center py-8">
                    <div className="flex-grow border-t border-zinc-900"></div>
                    <span className="flex-shrink mx-4 text-xs text-zinc-600 uppercase tracking-widest">OR</span>
                    <div className="flex-grow border-t border-zinc-900"></div>
                </div>

                <div className="space-y-3">
                    <button className="flex items-center justify-center gap-3 w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors group">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/nps/google.svg" className="w-5 h-5" alt="Google" />
                        <span className="text-sm font-medium text-white">Continue with Google</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
