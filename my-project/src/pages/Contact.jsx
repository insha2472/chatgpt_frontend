import React from 'react';

const Contact = () => {
    return (
        <div className="min-h-screen text-[var(--text-secondary)] py-20 px-6 font-sans antialiased relative">
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
                <div>
                    <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-6 drop-shadow-lg">Get in touch</h1>
                    <p className="text-lg text-[var(--text-secondary)] mb-8 leading-relaxed drop-shadow-md">
                        Have a question or feedback? We'd love to hear from you. Fill out the form or reach out to us directly.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)]">Email</h3>
                                <p className="text-[var(--text-secondary)]">support@gptproject.com</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)]">Office</h3>
                                <p className="text-[var(--text-secondary)]">123 AI Boulevard, Silicon Valley, CA</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
                    <form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">First Name</label>
                                <input type="text" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600" placeholder="John" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Last Name</label>
                                <input type="text" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600" placeholder="Doe" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Email</label>
                            <input type="email" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600" placeholder="john@example.com" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Message</label>
                            <textarea className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[120px] resize-none placeholder:text-zinc-600" placeholder="How can we help?" />
                        </div>
                        <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-[var(--text-primary)] font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;
