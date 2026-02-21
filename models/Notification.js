const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
   recipient: { type: String, required: true }, 
    senderName: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['submission', 'approval', 'rejection', 'new_task'], 
        required: true 
    },
    projectName: { type: String },
    taskTitle: { type: String },
    message: { type: String }, // e.g., "submitted a task for"
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Auto-delete notifications after 30 days to keep DB clean
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Notification', NotificationSchema);