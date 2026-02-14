const jwt = require('jsonwebtoken'); // This fixes the "jwt is not defined" error
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// REGISTER
exports.register = async (req, res) => {
    try {
        const { name, userId, email, role, password } = req.body;
        
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
    const { userId, password } = req.body;
    try {
        const user = await User.findOne({ userId });
        if (!user) return res.status(400).json({ message: "Invalid User ID" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

        // Generate Token
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
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