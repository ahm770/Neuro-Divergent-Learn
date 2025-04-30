import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();

  // Example list of topics - you'd likely fetch this later
  const topics = ['photosynthesis', 'gravity', 'react-basics', 'python-loops'];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-primary">Dashboard</h1>
      <p className="mb-6">Welcome back, {user?.name || user?.email}!</p>

      <h2 className="text-2xl font-semibold mb-3">Available Topics:</h2>
      <ul className="list-disc list-inside space-y-2">
         {topics.map(topic => (
             <li key={topic}>
                 <Link
                     to={`/content/${topic}`}
                     className="text-blue-600 hover:text-blue-800 hover:underline capitalize" // Capitalize for display
                 >
                     {topic.replace('-', ' ')} {/* Replace hyphens for readability */}
                 </Link>
             </li>
         ))}
      </ul>

      {/* Add more dashboard content here later */}
    </div>
  );
};

export default DashboardPage;