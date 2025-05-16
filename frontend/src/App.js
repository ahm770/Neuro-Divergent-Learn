// src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Link, BrowserRouter } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';

// Import Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ContentPage from './pages/ContentPage';
import HomePage from './pages/HomePage';
import UserProfilePage from './pages/UserProfilePage';

// Admin Pages
import AdminRoute from './components/common/AdminRoute';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminContentListPage from './pages/admin/AdminContentListPage';
import AdminCreateContentPage from './pages/admin/AdminCreateContentPage';
import AdminEditContentPage from './pages/admin/AdminEditContentPage';
import AdminUserManagementPage from './pages/admin/AdminUserManagementPage'; // New

// Creator Pages & Components
import CreatorRoute from './components/common/CreatorRoute'; // New
import CreatorDashboardPage from './pages/creator/CreatorDashboardPage'; // New

// Import Components
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import SimpleMermaidTest from './components/common/SimpleMermaidTest';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const { user } = useAuth();

  useEffect(() => {
    const rootEl = document.documentElement;
    const bodyEl = document.body;

    rootEl.classList.remove('dark');
    ['font-size-small', 'font-size-medium', 'font-size-large', 'font-size-xlarge'].forEach(cls => rootEl.classList.remove(cls));
    bodyEl.classList.remove('theme-high-contrast', 'font-dyslexic', 'theme-light');

    if (user && user.preferences) {
      const { theme, fontSize, dyslexiaFontEnabled } = user.preferences;
      if (theme === 'dark') rootEl.classList.add('dark');
      else if (theme === 'high-contrast') bodyEl.classList.add('theme-high-contrast');
      else bodyEl.classList.add('theme-light');
      rootEl.classList.add(`font-size-${fontSize || 'medium'}`);
      if (dyslexiaFontEnabled) bodyEl.classList.add('font-dyslexic');
    } else {
      bodyEl.classList.add('theme-light');
      rootEl.classList.add('font-size-medium');
    }
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col">
       <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/content/:topic" element={<ContentPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/content" element={<AdminContentListPage />} />
            <Route path="/admin/content/create" element={<AdminCreateContentPage />} />
            <Route path="/admin/content/edit/:contentId" element={<AdminEditContentPage />} />
            <Route path="/admin/users" element={<AdminUserManagementPage />} /> {/* New admin route */}
          </Route>

          {/* Creator Routes */}
          <Route element={<CreatorRoute />}>
            <Route path="/creator/dashboard" element={<CreatorDashboardPage />} />
            {/* Creators use the same components as Admins for content management for now */}
            <Route path="/creator/content" element={<AdminContentListPage />} />
            <Route path="/creator/content/create" element={<AdminCreateContentPage />} />
            <Route path="/creator/content/edit/:contentId" element={<AdminEditContentPage />} />
          </Route>

          <Route path="*" element={<div className="text-center py-10"><h2 className="text-2xl font-bold">404 Not Found</h2><Link to="/" className="button-primary mt-4 inline-block">Go Home</Link></div>} />
        </Routes>
      </main>
      <footer className="text-center p-4 mt-auto border-t border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm">
        © {new Date().getFullYear()} Accessible Learning Portal.
        {user && user.preferences && (
            <div className="text-xs opacity-70">
                Theme: {user.preferences.theme}, Font: {user.preferences.fontSize}, Dyslexic: {user.preferences.dyslexiaFontEnabled ? 'On' : 'Off'}
            </div>
        )}
        
      </footer>
    </div>
  );
}

export default App;