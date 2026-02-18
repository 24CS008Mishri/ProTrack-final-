const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Project');
const { protect, adminOnly } = require('../controllers/authController');

// @route   GET /api/admin/overview
// @desc    Get all users and projects for Admin Dashboard
router.get('/overview', protect, adminOnly, async (req, res) => {
    try {
        // Fetch all users (excluding passwords)
        const users = await User.find({}).select('-password');
        
        // Fetch all projects
        const projects = await Project.find({}).populate('mentor', 'name');
        res.json({
            users,
            projects
        });
    } catch (err) {
        console.error("Admin API Error:", err);
        res.status(500).json({ message: "Server error fetching admin data" });
    }
});
// DELETE USER (Admin Only)
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User successfully removed" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting user" });
    }
});

module.exports = router;