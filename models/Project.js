const mongoose = require('mongoose');
//const taskSchema = require('./Task');
const taskSchema = require('./Task.js'); // Use the exact casing and extension

const ProjectSchema = new mongoose.Schema({
    projectName: { type: String, required: true },
    description: { type: String },
    domain: { type: String },
    requiredStudents: { type: Number },
    students: { type: [String], default: [] },
    status: { type: String, default: 'Proposed' },
    tasks: [taskSchema] ,// Embedding the task list directly
    repoLink: { type: String, default: "" }
} ,{ timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);