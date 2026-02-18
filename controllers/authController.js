const jwt = require('jsonwebtoken'); // This fixes the "jwt is not defined" error
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// REGISTER
exports.register = async (req, res) => {
    try {
        const { name, userId, email, role, password } = req.body;
        if (role === 'admin') {
            return res.status(403).json({ message: "Admin registration restricted." });
        }
        if (role === 'student' && !userId.match(/^(23|24|25)/)) {
        return res.status(400).json({ message: "Student IDs must start with year (23/24/25)" });
    }
    
    if (role === 'mentor' && !['csm', 'cem', 'itm'].some(prefix => userId.startsWith(prefix))) {
        return res.status(400).json({ message: "Mentor IDs must start with department prefix (csm/cem/itm)" });
    }
        // Create instance
        const newUser = new User({ name, userId, email, role, password });
        

        // Save to DB (this triggers the .pre('save') hook in the model)
        await newUser.save();
        
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};

// LOGIN
// Inside your login function in controllers/authController.js
exports.login = async (req, res) => {

    console.log("Login Request Received:", req.body);
    
    const { userId, password } = req.body;
    try {
        const user = await User.findOne({ userId });
        if (!user) return res.status(400).json({ message: "Invalid User ID" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

        // Generate Token
        const token = jwt.sign(
            { id: user._id, userId: user.userId, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // SEND THIS RESPONSE
        res.json({
            token, // THIS MUST BE HERE
            userId: user.userId,
            role: user.role,
            name: user.name
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// 3. MIDDLEWARE: PROTECT
exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized' });
        }
    }
    if (!token) res.status(401).json({ message: 'No token' });
};

// 4. MIDDLEWARE: ADMIN ONLY
exports.adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Access Denied: Admin only" });
    }
};