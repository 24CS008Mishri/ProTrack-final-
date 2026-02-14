const Project = require('../models/Project');

// Mentor adds a task to the pool
exports.addTask = async (req, res) => {
    const { projectId, taskName, description, assignedTo, deadline } = req.body;
    try {
        const project = await Project.findById(projectId);
        // If assignedTo is empty, it remains "General" for students to select
        let status = "Unassigned";
    if (assignedTo && assignedTo !== "General" && assignedTo !== "") {
        status = "In Progress";
    }
        project.tasks.push({ 
            taskName, 
            description, 
            assignedTo: assignedTo || "General", 
            deadline,
            status
        });
        await project.save();
        res.status(200).json({ message: "Task added to project pool" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Student clicks "Select" to take a task
// projectController.js - UPDATED

// taskController.js
exports.claimTask = async function (req, res) {
    const { projectId, taskId, studentId } = req.body;

    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });

        const task = project.tasks.id(taskId);
        if (!task) return res.status(404).json({ message: "Task not found" });

     
        // Update assignment and status
        task.assignedTo = studentId;
        task.status = "In Progress"; 

        await project.save();
        res.status(200).json({ message: "Task claimed!", task });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.submitTask = async (req, res) => {
    try {
        const { projectId, taskId, submission } = req.body; 

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });

        const task = project.tasks.id(taskId);
        if (!task) return res.status(404).json({ message: "Task not found" });

        // FIX: Ensure the submission object exists before setting the link
        task.submission = {
            link: submission.link,
            submittedAt: new Date()
        };
        
        task.status = "Pending Review";

        await project.save();
        res.status(200).json({ message: "Submitted successfully!" });
    } catch (err) {
        console.error("BACKEND CRASH:", err); // This will show the real error in your terminal
        res.status(500).json({ message: err.message });
    }
};