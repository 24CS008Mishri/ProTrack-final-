const mongoose = require('mongoose');
//const taskSchema = require('./Task');
const taskSchema = require('./Task.js'); // Use the exact casing and extension

const ProjectSchema = new mongoose.Schema({
    projectName: { type: String, required: true },
    description: { type: String },
    domain: { type: String },
    requiredStudents: { type: Number },
    students: { type: [String], default: [] },
    // ADDED: Reference to the User model (the mentor)
    mentor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    status: { type: String, default: 'Proposed' },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    tasks: [taskSchema] ,// Embedding the task list directly
    githubMap: {
        type: Map,
        of: String,
        default: {}
    },
    repoLink: { type: String, default: "" }
} ,{ timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);