import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen text-[var(--text-secondary)] py-20 px-6 font-sans antialiased relative">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6 drop-shadow-lg">About <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">GPT Project</span></h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            We are building the future of conversational AI interfaces. Our mission is to make advanced intelligence accessible, intuitive, and beautiful for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] drop-shadow-md">Our Vision</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              In a world driven by data, we believe in the power of human-centric design. We bridge the gap between complex algorithms and everyday creativity, empowering you to do more, faster.
            </p>
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-indigo-400 drop-shadow-sm">10k+</span>
                <span className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">Users</span>
              </div>
              <div className="w-px bg-white/10"></div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-purple-400 drop-shadow-sm">99.9%</span>
                <span className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">Uptime</span>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[60px]"></div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Why Choose Us?</h3>
              <ul className="space-y-3">
                {['Advanced AI Models', 'Secure & Private', '24/7 Support', 'Continuous Updates'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[var(--text-secondary)]">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Join the Revolution</h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">Ready to experience the next generation of AI tools? Sign up today and get started for free.</p>
          <button className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all shadow-lg hover:shadow-white/20">Get Started</button>
        </div>
      </div>
    </div>
  );
};

export default About;
