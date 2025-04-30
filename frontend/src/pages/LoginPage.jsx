// src/pages/LoginPage.jsx (Example Structure)
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, error, setError } = useAuth(); // Get setError
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors
        const success = await login({ email, password });
        if (success) {
            navigate('/dashboard'); // Redirect on successful login
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 border rounded shadow-lg bg-white">
            <h2 className="text-2xl font-bold mb-6 text-center text-primary">Login</h2>
            <form onSubmit={handleSubmit}>
                {error && <p className="mb-4 text-red-500 bg-red-100 p-2 rounded text-sm">{error}</p>}
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-light"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 mb-2" htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-light"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded transition duration-200 disabled:opacity-50"
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
             <p className="mt-4 text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:underline">
                    Sign up here
                </Link>
            </p>
        </div>
    );
};

export default LoginPage;