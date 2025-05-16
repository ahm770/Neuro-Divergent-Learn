// src/components/common/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
    </svg>
);

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinkClass = "text-white hover:text-opacity-80 transition-opacity duration-150";
    const navButtonClass = "bg-white text-[var(--color-link)] hover:bg-opacity-90 dark:text-primary dark:hover:bg-slate-200 font-semibold py-1 px-3 rounded text-sm";

    return (
        <nav className="bg-primary text-white dark:bg-slate-900 body-theme-high-contrast:bg-hc-background body-theme-high-contrast:text-hc-text body-theme-high-contrast:border-b body-theme-high-contrast:border-hc-border shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link to="/" className={`text-xl font-bold ${navLinkClass}`}>
                    Accessible Learning
                </Link>
                <div className="space-x-2 sm:space-x-4 flex items-center">
                    {isAuthenticated && user?.role === 'admin' && (
                        <Link to="/admin" className={navLinkClass}>Admin Panel</Link>
                    )}
                    {isAuthenticated && user?.role === 'creator' && (
                        <Link to="/creator/dashboard" className={navLinkClass}>Creator Studio</Link>
                    )}

                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className={navLinkClass}>My Dashboard</Link>
                            <Menu as="div" className="relative inline-block text-left">
                                <div>
                                    <Menu.Button className={`inline-flex w-full justify-center items-center space-x-1 rounded-md px-1 py-1 sm:px-2 text-sm font-medium ${navLinkClass} focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}>
                                        <UserIcon />
                                        <span className="hidden md:inline">{user?.name || user?.email?.split('@')[0]}</span>
                                        <svg className="-mr-1 ml-1 h-5 w-5 hidden sm:inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </Menu.Button>
                                </div>
                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                >
                                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50
                                                        bg-[var(--color-card-background)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
                                        <div className="px-1 py-1 ">
                                             <div className="px-3 py-2">
                                                <p className="text-xs text-[var(--color-text-secondary)]">Signed in as</p>
                                                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{user?.email}</p>
                                                <p className="text-xs text-[var(--color-text-secondary)] capitalize">Role: {user?.role}</p>
                                            </div>
                                        </div>
                                        <div className="px-1 py-1">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Link
                                                        to="/profile"
                                                        className={`group flex w-full items-center rounded-md px-2 py-2 text-sm 
                                                                    ${active ? 'bg-[var(--color-link)] text-white dark:text-[var(--color-button-primary-text)] body-theme-high-contrast:text-[var(--color-hc-background)]' : 'text-[var(--color-text-primary)]'}`}
                                                    >
                                                        Update Profile
                                                    </Link>
                                                )}
                                            </Menu.Item>
                                        </div>
                                        <div className="px-1 py-1">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={handleLogout}
                                                        className={`group flex w-full items-center rounded-md px-2 py-2 text-sm
                                                                    ${active ? 'bg-[var(--color-link)] text-white dark:text-[var(--color-button-primary-text)] body-theme-high-contrast:text-[var(--color-hc-background)]' : 'text-[var(--color-text-primary)]'}`}
                                                    >
                                                        Logout
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        </div>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className={navLinkClass}>Login</Link>
                            <Link to="/signup" className={navButtonClass}>
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;