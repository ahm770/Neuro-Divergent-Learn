// src/pages/SignupPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const SignupPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signup, loading, error, setError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const success = await signup({ name, email, password });
        if (success) {
            navigate('/dashboard');
        }
    };

    const errorClass = "mb-4 text-sm text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300 body-theme-high-contrast:bg-hc-background body-theme-high-contrast:text-hc-link body-theme-high-contrast:border body-theme-high-contrast:border-hc-link p-3 rounded";


    return (
        <div className="max-w-md mx-auto mt-10">
            <div className="card"> {/* Using .card class */}
                <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <p className={errorClass}>{error}</p>}
                    <div>
                        <label className="form-label-default" htmlFor="name">Name (Optional)</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="form-input-default" // Using generic input class
                        />
                    </div>
                    <div>
                        <label className="form-label-default" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input-default" // Using generic input class
                            required
                        />
                    </div>
                    <div>
                        <label className="form-label-default" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input-default" // Using generic input class
                            required
                            minLength="6"
                        />
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">Minimum 6 characters</p>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="button-primary w-full" // Using generic button class
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium"> {/* Link uses global 'a' style */}
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;