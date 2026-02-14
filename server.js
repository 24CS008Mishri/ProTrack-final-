const express = require('express');
const connectDB = require('./db');
const path = require('path'); // Required for handling file paths
require('dotenv').config();

const app = express();

// 1. Connect Database
connectDB();

// 2. Middleware
app.use(express.json());

// 3. STATIC FOLDER SERVING (CRITICAL)
// This tells Express to serve everything inside the 'public' folder 
// so you can access localhost:5000/pages/login.html
app.use(express.static(path.join(__dirname, 'public')));

// 4. API ROUTES
// Connects the login/register logic to the server
app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/projects', require('./routes/projectRoutes')); // Future use
app.use('/api/projects', require('./routes/projectRoutes'));
// 5. DEFAULT ROUTE (Redirect to login)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html'));
});
// Port Fallback
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));