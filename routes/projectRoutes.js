const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Project = require('../models/Project');
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
// Add this at the top of routes/projectRoutes.js
const { protect } = require('../controllers/authController');
const Notification = require('../models/Notification');

// --- Project Management Routes ---
router.post('/add',protect, projectController.addProject);
router.get('/student/:userId', projectController.getStudentProjects);
router.get('/mentor/future', projectController.getFutureProjects);
router.get('/mentor/active', projectController.getActiveProjects);
router.patch('/add-student', projectController.addStudentToProject);

// 1. PLACE SPECIFIC SUB-ROUTES FIRST (Before generic /:id)

// Add this to your project routes file
router.patch('/:id/github-map-simple', async (req, res) => {
    try {
        const { userId, handle } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ message: "Project not found" });

        // Check if this student is actually part of this project
        if (!project.students.includes(userId)) {
            return res.status(403).json({ message: "You are not a member of this project." });
        }

        // Save the mapping
        if (!project.githubMap) project.githubMap = new Map();
        project.githubMap.set(userId, handle.toLowerCase());
        
        project.markModified('githubMap');
        await project.save();

        res.json({ success: true, githubMap: project.githubMap });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/:id', projectController.getProjectById);
// Existing route
router.patch('/add-student', projectController.addStudentToProject);

// NEW: Route for GitHub Link
// This matches: PATCH /api/projects/697ed350...
router.patch('/:id', projectController.updateProjectRepo);


// --- Task Lifecycle Routes ---
router.post('/add-task', protect,taskController.addTask);
router.patch('/claim-task', taskController.claimTask);

// 1. UPDATE STATUS (e.g., set to 'In Progress')
router.post('/update-task-status', async (req, res) => {
    const { projectId, taskId, status } = req.body;
    try {
        const project = await Project.findById(projectId);
        const task = project.tasks.id(taskId);
        task.status = status;
        await project.save();
        res.status(200).json({ message: "Status updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/submit-task', taskController.submitTask);
// 2. STUDENT SUBMISSION (Link/File)

// 3. MENTOR REVIEW (Approve/Reject)
router.post('/review-task', protect, async (req, res) => {
    const { projectId, taskId, status, feedback } = req.body;
    try {
        const project = await Project.findById(projectId);
        const task = project.tasks.id(taskId);

        if (!task) return res.status(404).json({ message: "Task not found" });

        // 1. Update Task Status & Feedback
        task.status = status; 
        task.mentorFeedback = feedback;
        
        // 2. TRIGGER NOTIFICATION to the Student
        // We use 'submittedBy' which we saved as a String (Roll No) during submission
        const studentRollNo = task.submission.submittedBy; 

        if (studentRollNo) {
            const notification = new Notification({
                recipient: studentRollNo, // Matches student's userId string
                senderName: req.user.name, // Mentor's name from protect middleware
                type: status === 'Completed' ? 'approval' : 'rejection',
                projectName: project.projectName,
                taskTitle: task.taskName,
                message: status === 'Completed' ? `approved your task and gave feedback: "${feedback} (${project.projectName} - ${task.taskName})"` : `requested changes: "${feedback} (${project.projectName} - ${task.taskName})"`
            });
            await notification.save();
        }

        await project.save();
        res.status(200).json({ message: "Review recorded and student notified" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// // 4. GET NOTIFICATIONS (For Students)
// router.get('/my-notifications/:rollNo', async (req, res) => {
//     try {
//         // Find projects where the student has tasks that were reviewed
//         const projects = await Project.find({ "tasks.assignedTo": req.params.rollNo });
//         let notifications = [];

//         projects.forEach(p => {
//             const myReviewedTasks = p.tasks.filter(t => 
//                 t.assignedTo === req.params.rollNo && 
//                 (t.status === 'Changes Required' || t.status === 'Completed')
//             );
//             notifications.push(...myReviewedTasks);
//         });

//         res.status(200).json(notifications);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// --- Delete Route ---
router.delete('/delete-task', async (req, res) => {
    try {
        const { projectId, taskId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ error: "Invalid ID format" });
        }

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: "Project not found" });

        project.tasks = project.tasks.filter(task => task._id.toString() !== taskId);
        await project.save();
        res.status(200).json({ message: "Task deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message }); 
    }
});
// In your backend routes file:
router.get('/task-details/:projectId/:taskId', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        const task = project.tasks.id(req.params.taskId);
        
        if (!task) return res.status(404).json({ message: "Task not found" });
        
        res.json(task); // This returns the JSON your frontend is looking for
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Add this to your backend routes
router.put('/update-task', async (req, res) => {
    const { projectId, taskId, taskName, description, deadline } = req.body;

    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });

        const task = project.tasks.id(taskId);
        if (!task) return res.status(404).json({ message: "Task not found" });

        // Update fields based on your Mongoose schema
        task.taskName = taskName;
        task.description = description;
        task.deadline = deadline;

        await project.save();
        res.status(200).json({ message: "Task updated successfully", task });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error during update" });
    }
});

router.patch('/:id/complete',async (req, res) => {
    try {
        const { rating } = req.body;
        
        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'Completed',
                rating: rating 
            },
            { new: true }
        );

        if (!updatedProject) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.json({ message: "Project archived successfully", project: updatedProject });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;