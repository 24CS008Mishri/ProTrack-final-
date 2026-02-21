const Project = require('../models/Project');
const Notification = require('../models/Notification');

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
        // NOTIFICATION LOGIC
        if (assignedTo && assignedTo !== "General") {
            // assignedTo is already a String (Roll No), so we save it directly
            await new Notification({
                recipient: assignedTo, 
                senderName: req.user.name,
                type: 'new_task',
                projectName: project.projectName,
                taskTitle: taskName,
                message: `assigned you a new task: ${taskName}`
            }).save();
        } else {
            // project.students contains Strings, so this now works perfectly!
            const promises = project.students.map(studentId => {
                return new Notification({
                    recipient: studentId,
                    senderName: req.user.name,
                    type: 'new_task',
                    projectName: project.projectName,
                    taskTitle: taskName,
                    message: `added a new task to the pool: ${taskName}`
                }).save();
            });
            await Promise.all(promises);
        }
        // --- NOTIFICATION LOGIC END ---
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

        // 1. Basic validation to prevent crashes
        if (!submission || !submission.link) {
            return res.status(400).json({ message: "Submission link is required" });
        }

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });

        const task = project.tasks.id(taskId);
        if (!task) return res.status(404).json({ message: "Task not found" });

        // 2. Update the task
        task.submission = {
            link: submission.link,
            submittedAt: new Date(),
            // We store the Roll No (userId) here so it's consistent with your String choice
            submittedBy: req.user.userId 
        };
        task.status = "Pending Review";

        await project.save();

        // 3. Create Notification for Mentor
        const notification = new Notification({
            // Ensure this matches how the Mentor will fetch it
            // If mentors use their 'csm001' ID, use project.mentor.userId
            // For now, using .toString() on the mentor's ObjectID is safest
            recipient: project.mentor.toString(), 
            senderName: req.user.name,
            type: 'submission',
            projectName: project.projectName,
            taskTitle: task.taskName,
            message: `submitted a task for review:`
        });
        
        await notification.save();

        res.status(200).json({ message: "Submitted successfully!" });
    } catch (err) {
        console.error("SUBMIT TASK ERROR:", err); 
        res.status(500).json({ message: err.message });
    }
};