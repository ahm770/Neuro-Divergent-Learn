const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const corsOptions = {
  origin: [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://[::1]:3000",
    "https://opulent-garbanzo-975vgqvp4jj4cg6x-3000.app.github.dev"
  ],
  credentials: true,
  preflightContinue: false,
  optionSuccessStatus: 200
};

require('dotenv').config();

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

const contentRoutes = require('./routes/contentRoutes');
const qaRoutes = require('./routes/qaRoutes');
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

app.use('/api/qa', qaRoutes);

app.use('/api/content', contentRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

app.get("/", (req, res) => res.send("API Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
