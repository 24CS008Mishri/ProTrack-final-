const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../controllers/authController');

// Get all notifications for the logged-in user
// Get all notifications for the logged-in user
router.get('/', protect, async (req, res) => {
    try {
        // Change req.user._id to req.user.userId (or whatever your Roll No field is)
        const notifications = await Notification.find({ recipient: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark a specific notification as read
// Optimized single read route
router.patch('/:id/read', protect, async (req, res) => {
    try {
        // Added check: Only update if the recipient matches the logged-in user
        await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.userId }, 
            { isRead: true }
        );
        res.json({ message: "Marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark all as read
router.patch('/read-all', protect, async (req, res) => {
    try {
        // CHANGED: Use req.user.userId to match the String recipient in DB
        const result = await Notification.updateMany(
            { recipient: req.user.userId, isRead: false }, 
            { $set: { isRead: true } }
        );
        
        res.json({ 
            message: "All marked as read", 
            count: result.modifiedCount 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;