const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet'); // For security headers
const morgan = require('morgan'); // For request logging

require('dotenv').config();

// --- Environment Variable Check ---
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'OPENROUTER_API_KEY',
  // 'YOUR_SITE_URL', // Recommended, but provide defaults in controllers if not set
  // 'YOUR_SITE_NAME', // Recommended, but provide defaults if not set
  // 'OPENROUTER_DEFAULT_MODEL' // Has a default in controllers
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL ERROR: Environment variable ${envVar} is not defined.`);
    process.exit(1);
  }
}

const app = express();

// --- Middleware ---
const corsOptions = {
  origin: [ // Add your frontend URLs here
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://[::1]:3000",
    process.env.FRONTEND_URL, // If you have one in .env for deployed frontend
    "https://opulent-garbanzo-975vgqvp4jj4cg6x-3000.app.github.dev" // Example Codespaces URL
  ].filter(Boolean), // Filter out undefined/null values
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(helmet()); // Adds various security HTTP headers
app.use(express.json({ limit: '10mb' })); // For parsing application/json, increased limit for potential media uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // For parsing application/x-www-form-urlencoded

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // HTTP request logger middleware (useful for development)
}

// --- Routes ---
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const qaRoutes = require('./routes/qaRoutes');
// const userRoutes = require('./routes/userRoutes'); // If you create separate user management routes

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/qa', qaRoutes);
// app.use('/api/users', userRoutes);


// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully."))
  .catch(err => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1); // Exit if DB connection fails
  });

// --- Basic Welcome Route ---
app.get("/", (req, res) => res.send("Accessible Learning Portal API is running."));

// --- Global Error Handler (simple example) ---
// This should be the last middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected error occurred.',
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined // Optionally show stack in dev
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`));