// src/components/common/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login'); // Redirect to login after logout
    };

    return (
        <nav className="bg-primary shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-xl font-bold text-white hover:text-primary-light transition duration-200">
                    Accessible Learning
                </Link>
                <div className="space-x-4 flex items-center">
                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className="text-white hover:text-primary-light">Dashboard</Link>
                            {/* Add more links as needed */}
                            <span className="text-primary-light">Welcome, {user?.name || user?.email}!</span>
                            <button
                                onClick={handleLogout}
                                className="bg-secondary hover:bg-pink-500 text-white font-semibold py-1 px-3 rounded transition duration-200"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-white hover:text-primary-light">Login</Link>
                            <Link to="/signup" className="bg-white text-primary font-semibold py-1 px-3 rounded hover:bg-gray-100 transition duration-200">
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