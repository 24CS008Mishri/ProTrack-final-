const Project = require('../models/Project');

// Create a new project
exports.addProject = async (req, res) => {
    
    console.log("User Data:", req.user); // If this is undefined, it's an auth issue
    
    try {
        const { projectName, description, domain, requiredStudents, students } = req.body;
        const newProject = new Project({
            projectName,
            description,
            domain,
            requiredStudents,
            // Automatically filled from the mentor's authenticated session
            mentor: req.user._id,
            students // Array of student IDs
        });
        await newProject.save();
        res.status(201).json({ message: "Project created successfully", project: newProject });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Mentor: Get projects with 0 students (Future Projects)

exports.getFutureProjects = async (req, res) => {
    try {
        const projects = await Project.find({
            $or: [
                { students: { $size: 0 } },
                { students: { $exists: false } },
                { students: null }
            ]
        });
        res.status(200).json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// Mentor: Get projects with 1 or more students (Active Dashboard)
exports.getActiveProjects = async (req, res) => {
    try {
        // Finds projects where the students array is NOT empty
        const projects = await Project.find({ "students.0": { $exists: true } });
        res.status(200).json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Student: Get projects assigned to a specific student ID
exports.getStudentProjects = async (req, res) => {
    try {
        const projects = await Project.find({ students: req.params.userId });
        res.status(200).json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addStudentToProject = async (req, res) => {
    try {
        const { projectId, studentId } = req.body;
        
        // Find project and push studentId into the array
        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            { $addToSet: { students: studentId } }, // $addToSet prevents duplicate IDs
            { new: true }
        );

        res.status(200).json({ message: "Student added!", updatedProject });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// Add this to controllers/projectController.js
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });
        res.status(200).json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Backend Route (e.g., projectRoutes.js)
exports.updateProjectRepo = async (req, res) => {
    try {
        const { id } = req.params;
        const { repoLink } = req.body;

        // Find project by ID and update the repoLink field
        const updatedProject = await Project.findByIdAndUpdate(
            id,
            { repoLink: repoLink },
            { new: true, runValidators: true } // Returns the updated document
        );

        if (!updatedProject) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.status(200).json({
            message: "GitHub repository linked successfully",
            project: updatedProject
        });
    } catch (error) {
        console.error("Error updating repo link:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
