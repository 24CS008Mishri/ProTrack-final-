const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Path to your User model
const auth = require('../controllers/authController');
// POST: Change Password
router.post('/change-password',auth.protect, async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;

    try {
        // 1. Find user by their ID (23cs001, csm001, etc.)
        const user = await User.findOne({ userId });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. Compare entered 'currentPassword' with the hashed password in DB
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        

        // 4. Update and Save
        user.password = newPassword; // This will trigger the .pre('save') hook to hash it
        await user.save();

        res.status(200).json({ message: "Password updated successfully" });

    } catch (err) {
        console.error("Route Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;