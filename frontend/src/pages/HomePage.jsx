import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-primary">Welcome to the Accessible Learning Portal</h1>
      <p className="mb-4">Your journey to personalized learning starts here.</p>
      <Link to="/signup" className="bg-secondary hover:bg-pink-500 text-white font-semibold py-2 px-4 rounded transition duration-200 mr-2">
        Get Started (Sign Up)
      </Link>
      <Link to="/login" className="text-primary hover:underline">
        Already have an account? Login
      </Link>
    </div>
  );
};

export default HomePage;