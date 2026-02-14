const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    taskName: { type: String, required: true },
    description: { type: String },
    assignedTo: { type: String, default: "General" }, // "General" means unassigned
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    deadline: { type: Date },
    status: { 
        type: String, 
        enum: ['Unassigned', 'In Progress', 'Pending Review', 'Changes Required', 'Completed'], 
        default: 'Unassigned' 
    },
    submission: {
        link: { type: String, default: "" },
        submittedAt: { type: Date }
    },
    mentorFeedback: { type: String, default: "" }// New field
}, { timestamps: true });

module.exports = taskSchema;