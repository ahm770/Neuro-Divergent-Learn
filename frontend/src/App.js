// src/App.jsx
import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
 

// Import Pages (Create these basic files next)
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage'; // Example protected page
import ContentPage from './pages/ContentPage'; // Example protected page
import HomePage from './pages/HomePage'; // Public landing page
import AdminRoute from './components/common/AdminRoute';
import AdminDashboardPage from './pages/admin/AdminDashboardPage'; // Create this
import AdminContentListPage from './pages/admin/AdminContentListPage'; // Create this
import AdminCreateContentPage from './pages/admin/AdminCreateContentPage'; // Create this
import AdminEditContentPage from './pages/admin/AdminEditContentPage'; // Create this

// Import Components
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar'; // Create this next

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar /> {/* Add Navbar */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
             {/* Wrap protected routes */}
             <Route path="/dashboard" element={<DashboardPage />} />
             <Route path="/content/:topic" element={<ContentPage />} />
             {/* Add other protected routes here */}
          </Route>
          <Route element={<AdminRoute />}>
  <Route path="/admin" element={<AdminDashboardPage />} />
  <Route path="/admin/content" element={<AdminContentListPage />} />
  <Route path="/admin/content/create" element={<AdminCreateContentPage />} />
  <Route path="/admin/content/edit/:contentId" element={<AdminEditContentPage />} />
  {/* Add more admin routes as needed */}
</Route>

          {/* Catch-all/Not Found Route */}
          <Route path="*" element={<div><h2>404 Not Found</h2><Link to="/">Go Home</Link></div>} />
        </Routes>
      </main>
       <footer className="bg-gray-200 text-center p-4 mt-auto">
         © {new Date().getFullYear()} Accessible Learning Portal
       </footer>
    </div>
  );
}

export default App;