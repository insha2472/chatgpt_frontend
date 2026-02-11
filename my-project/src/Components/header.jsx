import React from "react";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
    const location = useLocation();
    const isAuth = ["/login", "/signup"].includes(location.pathname);

    return (
        <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 z-[100] transition-all">
            <div className="flex items-center gap-10">
                <Link to="/" className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="text-lg font-bold text-gray-900 tracking-tight">GPT Project</span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    {["Home", "About", "Contact"].map((item) => (
                        <Link
                            key={item}
                            to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                            className="text-sm font-semibold text-gray-500 hover:text-orange-600 transition-colors"
                        >
                            {item}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="flex items-center gap-4">
                {!isAuth && (
                    <>
                        <Link
                            to="/login"
                            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-black transition-all"
                        >
                            Log in
                        </Link>
                        <Link
                            to="/signup"
                            className="px-5 py-2.5 text-sm font-bold bg-gray-900 text-white hover:bg-orange-600 rounded-xl transition-all shadow-md active:scale-95"
                        >
                            Sign up
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
};

export default Header;