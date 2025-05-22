// ===== File: /controllers/taskController.js =====
const UserTask = require('../models/UserTask');
const Content = require('../models/Content'); // To validate contentId if provided
const { validationResult, body } = require('express-validator');

exports.taskValidation = [
    body('title').trim().isLength({ min: 1 }).withMessage('Title is required.'),
    body('description').optional().trim(),
    body('relatedContentId').optional().isMongoId().withMessage('Invalid content ID format.'),
    body('dueDate').optional().isISO8601().toDate().withMessage('Invalid due date format.'),
    body('completed').optional().isBoolean().withMessage('Completed must be a boolean.'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority value.')
];

exports.createTask = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { title, description, relatedContentId, dueDate, priority } = req.body;
        const userId = req.user._id;

        let relatedContentTopic;
        if (relatedContentId) {
            const content = await Content.findById(relatedContentId).select('topic');
            if (!content) {
                return res.status(404).json({ error: 'Related content not found.' });
            }
            relatedContentTopic = content.topic;
        }

        const task = new UserTask({
            userId,
            title,
            description,
            relatedContentId,
            relatedContentTopic,
            dueDate,
            priority
        });

        await task.save();
        res.status(201).json(task);
    } catch (error) {
        console.error('Create Task Error:', error);
        res.status(500).json({ error: 'Failed to create task.' });
    }
};

exports.getUserTasks = async (req, res) => {
    try {
        const userId = req.user._id;
        const { completed, priority, sortBy = 'createdAt:desc', relatedContentId } = req.query;

        const query = { userId };
        if (completed !== undefined) {
            query.completed = completed === 'true';
        }
        if (priority) {
            query.priority = priority;
        }
        if (relatedContentId) {
            query.relatedContentId = relatedContentId;
        }

        const sortOptions = {};
        if (sortBy) {
            const parts = sortBy.split(':');
            sortOptions[parts[0]] = parts[1] === 'desc' ? -1 : 1;
        }


        const tasks = await UserTask.find(query).sort(sortOptions);
        res.json(tasks);
    } catch (error) {
        console.error('Get User Tasks Error:', error);
        res.status(500).json({ error: 'Failed to retrieve tasks.' });
    }
};

exports.getTaskById = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user._id;

        const task = await UserTask.findOne({ _id: taskId, userId });
        if (!task) {
            return res.status(404).json({ error: 'Task not found or not authorized.' });
        }
        res.json(task);
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'Invalid task ID format.' });
        }
        console.error('Get Task By ID Error:', error);
        res.status(500).json({ error: 'Failed to retrieve task.' });
    }
};

exports.updateTask = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const taskId = req.params.id;
        const userId = req.user._id;
        const { title, description, relatedContentId, dueDate, completed, priority } = req.body;

        const task = await UserTask.findOne({ _id: taskId, userId });
        if (!task) {
            return res.status(404).json({ error: 'Task not found or not authorized.' });
        }

        if (title) task.title = title;
        if (description !== undefined) task.description = description;
        if (dueDate !== undefined) task.dueDate = dueDate; // Allow null to clear date
        if (completed !== undefined) task.completed = completed;
        if (priority) task.priority = priority;

        if (relatedContentId !== undefined) { // Allows setting to null or new ID
            if (relatedContentId) {
                const content = await Content.findById(relatedContentId).select('topic');
                if (!content) {
                    return res.status(404).json({ error: 'Related content not found.' });
                }
                task.relatedContentId = relatedContentId;
                task.relatedContentTopic = content.topic;
            } else {
                task.relatedContentId = undefined;
                task.relatedContentTopic = undefined;
            }
        }


        await task.save();
        res.json(task);
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'Invalid task ID format.' });
        }
        console.error('Update Task Error:', error);
        res.status(500).json({ error: 'Failed to update task.' });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user._id;

        const task = await UserTask.findOneAndDelete({ _id: taskId, userId });
        if (!task) {
            return res.status(404).json({ error: 'Task not found or not authorized.' });
        }
        res.json({ message: 'Task deleted successfully.' });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'Invalid task ID format.' });
        }
        console.error('Delete Task Error:', error);
        res.status(500).json({ error: 'Failed to delete task.' });
    }
};


// --- User Learning Progress Endpoints ---
const UserLearningProgress = require('../models/UserLearningProgress');

exports.getLearningProgressForContent = async (req, res) => {
    try {
        const userId = req.user._id;
        const { contentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(contentId)) {
            return res.status(400).json({ error: 'Invalid content ID format.' });
        }

        const progress = await UserLearningProgress.findOne({ userId, contentId });
        if (!progress) {
            // Return a default structure or 204 No Content, or 404 if preferred
            return res.status(200).json({
                userId,
                contentId,
                status: 'not_started',
                timeSpentTotalMs: 0,
                modesUsedFrequency: [],
                lastAccessed: null
            });
        }
        res.json(progress);
    } catch (error) {
        console.error("Error fetching learning progress:", error);
        res.status(500).json({ error: "Failed to fetch learning progress." });
    }
};

exports.getRecentLearningActivity = async (req, res) => {
    try {
        const userId = req.user._id;
        const limit = parseInt(req.query.limit) || 5;

        const recentProgress = await UserLearningProgress.find({ userId, status: { $in: ['in_progress', 'completed'] } })
            .sort({ lastAccessed: -1 })
            .limit(limit)
            .populate('contentId', 'topic originalText tags'); // Populate with content details

        res.json(recentProgress);
    } catch (error) {
        console.error("Error fetching recent learning activity:", error);
        res.status(500).json({ error: "Failed to fetch recent activity." });
    }
};


exports.logContentInteraction = async (req, res) => {
    const { contentId, mode, eventType, durationMs } = req.body; // eventType: 'start' or 'end'
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return res.status(400).json({ error: 'Invalid content ID.' });
    }
    if (!mode || typeof mode !== 'string') {
        return res.status(400).json({ error: 'Mode is required.' });
    }
    if (!['start', 'end'].includes(eventType)) {
        return res.status(400).json({ error: 'Invalid eventType. Must be "start" or "end".' });
    }

    try {
        let progress;
        if (eventType === 'start') {
            progress = await UserLearningProgress.logInteractionStart(userId, contentId, mode);
        } else if (eventType === 'end') {
            if (typeof durationMs !== 'number' || durationMs < 0) {
                return res.status(400).json({ error: 'Valid durationMs is required for "end" event.' });
            }
            progress = await UserLearningProgress.logInteractionEnd(userId, contentId, durationMs);
        }

        if (!progress && eventType === 'end') {
            // This case is handled inside logInteractionEnd, but good to be aware
            return res.status(200).json({ message: "Interaction end logged, but no active start found or duration insignificant." });
        }
        if (!progress) {
            return res.status(404).json({error: "Could not find or update learning progress."})
        }

        res.status(200).json({ message: `Interaction ${eventType} logged successfully.`, progress });
    } catch (error) {
        console.error('Error logging content interaction:', error);
        res.status(500).json({ error: 'Failed to log content interaction.' });
    }
};