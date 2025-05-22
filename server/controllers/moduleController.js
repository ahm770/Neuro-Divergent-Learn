// ===== File: /controllers/moduleController.js =====
const Module = require('../models/Module');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const mongoose = require('mongoose');
const { validationResult, body } = require('express-validator');
const logAction = require('../utils/auditLogger');

exports.moduleCreateValidation = [
    body('title').trim().isLength({ min: 3 }).withMessage('Module title must be at least 3 characters.'),
    body('description').optional().trim(),
    body('courseId').isMongoId().withMessage('Valid Course ID is required.'),
    body('moduleLearningObjectives').optional().isArray().withMessage('Module learning objectives must be an array of strings.'),
    body('moduleLearningObjectives.*').optional().isString().trim(),
    body('published').optional().isBoolean()
];

exports.createModule = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { title, description, courseId, moduleLearningObjectives, published } = req.body;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found. Cannot create module for non-existent course.' });
        }

        const isCourseInstructor = course.instructorIds.map(id => id.toString()).includes(req.user._id.toString());
        if (req.user.role !== 'admin' && req.user.role !== 'creator' && !isCourseInstructor) {
            return res.status(403).json({ error: 'Not authorized to add modules to this course.' });
        }
        
        const order = course.modules.length; // New module gets next order number

        const module = new Module({
            title,
            description,
            courseId,
            moduleLearningObjectives: moduleLearningObjectives || [],
            published: published || false,
            order,
            createdBy: req.user._id,
            lastUpdatedBy: req.user._id
        });
        await module.save();

        // Add module to course's module list and update course's lastUpdatedBy
        course.modules.push(module._id);
        course.lastUpdatedBy = req.user._id;
        await course.save();

        await logAction(req.user.id, 'CREATE_MODULE', 'Module', module._id, { title: module.title, courseId: module.courseId, published: module.published }, req.ip);
        const populatedModule = await Module.findById(module._id)
            .populate('createdBy', 'name email')
            .populate('courseId', 'title slug');
        res.status(201).json(populatedModule);
    } catch (error) {
        console.error("Create Module Error:", error);
        res.status(500).json({ error: 'Failed to create module.' });
    }
};

exports.getModulesByCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ error: 'Invalid Course ID.' });
        }
        const course = await Course.findById(courseId).select('instructorIds studentIds published createdBy');
        if (!course) return res.status(404).json({ error: "Course not found."});

        const query = { courseId };
        const isCourseInstructor = course.instructorIds.map(id => id.toString()).includes(req.user._id.toString());
        const isEnrolledStudent = course.studentIds.map(id => id.toString()).includes(req.user._id.toString());

        // Authorization to list modules
        if (req.user.role !== 'admin' && req.user.role !== 'creator' && !isCourseInstructor && !isEnrolledStudent) {
            return res.status(403).json({ error: "Not authorized to view modules for this course." });
        }
        // Students only see published modules of published courses they are in
        if (req.user.role === 'user' && (!course.published || !isEnrolledStudent)) {
             return res.status(403).json({ error: "Not authorized or course/module is not available." });
        }
        if (req.user.role === 'user') { // Applies to enrolled students viewing published course
            query.published = true;
        }
        
        const modules = await Module.find(query)
            .populate('createdBy', 'name email')
            .populate('lastUpdatedBy', 'name email')
            .populate({
                path: 'lessons',
                match: (req.user.role === 'user') ? { published: true } : {},
                options: { sort: { order: 1 } },
                select: 'title published order items', // Select necessary fields for lesson list
                populate: {
                    path: 'items.itemId',
                    select: 'title topic' // Adjust as needed
                }
            })
            .sort({ order: 1 });
        res.json(modules);
    } catch (error) {
        console.error("Get Modules by Course Error:", error);
        res.status(500).json({ error: 'Failed to retrieve modules.' });
    }
};

exports.getModuleById = async (req, res) => {
    try {
        const moduleId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            return res.status(400).json({ error: 'Invalid Module ID.' });
        }
        const module = await Module.findById(moduleId)
            .populate('createdBy', 'name email')
            .populate('lastUpdatedBy', 'name email')
            .populate({ path: 'courseId', select: 'title slug instructorIds studentIds published createdBy' })
            .populate({
                path: 'lessons',
                match: (req.user.role === 'user' && !req.query.manageView) ? { published: true } : {},
                options: { sort: { order: 1 } },
                populate: {
                    path: 'items.itemId',
                    select: 'title topic originalText itemType'
                }
            });

        if (!module) {
            return res.status(404).json({ error: 'Module not found.' });
        }
        
        const course = module.courseId; // Populated course
        const isCourseInstructor = course && course.instructorIds.map(id => id.toString()).includes(req.user._id.toString());
        const isEnrolledStudent = course && course.studentIds.map(id => id.toString()).includes(req.user._id.toString());

        const isAuthorized = req.user.role === 'admin' || 
                             req.user.role === 'creator' ||
                             isCourseInstructor ||
                             (course && course.published && module.published && isEnrolledStudent);

        if (!isAuthorized) {
            return res.status(403).json({ error: 'Not authorized to view this module.' });
        }
        
        // Filter lessons again for student view if match didn't catch it (belt and suspenders)
        if (req.user.role === 'user' && !req.query.manageView && module.lessons) {
            module.lessons = module.lessons.filter(lesson => lesson.published);
        }

        res.json(module);
    } catch (error) {
        console.error("Get Module By ID Error:", error);
        res.status(500).json({ error: 'Failed to retrieve module.' });
    }
};

exports.updateModule = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const moduleId = req.params.id;
        const { title, description, moduleLearningObjectives, published, order } = req.body;

        let module = await Module.findById(moduleId).populate('courseId', 'instructorIds');
        if (!module) return res.status(404).json({ error: "Module not found." });

        const course = module.courseId;
        const isCourseInstructor = course.instructorIds.map(id => id.toString()).includes(req.user._id.toString());
        if (req.user.role !== 'admin' && req.user.role !== 'creator' && !isCourseInstructor) {
            return res.status(403).json({ error: 'Not authorized to update this module.' });
        }
        
        const oldValues = { title: module.title, description: module.description, published: module.published, order: module.order };
        const changes = {};

        if (title && title !== module.title) { module.title = title; changes.title = { old: oldValues.title, new: module.title };}
        if (description !== undefined && description !== module.description) { module.description = description; changes.description = "modified"; }
        if (moduleLearningObjectives !== undefined) {
            if (JSON.stringify(module.moduleLearningObjectives.slice().sort()) !== JSON.stringify(moduleLearningObjectives.slice().sort())) {
                module.moduleLearningObjectives = moduleLearningObjectives;
                changes.moduleLearningObjectives = "modified";
            }
        }
        if (published !== undefined && published !== module.published) { module.published = published; changes.published = { old: oldValues.published, new: module.published };}
        if (order !== undefined && typeof order === 'number' && order !== module.order) {
            module.order = order;
            changes.order = { old: oldValues.order, new: module.order };
            // If order changes, sibling modules in the same course might need their orders adjusted.
            // This is complex and often handled by a dedicated reorder endpoint.
            // For now, this directly sets the order.
        }

        if (Object.keys(changes).length > 0) {
            module.lastUpdatedBy = req.user._id;
            await module.save();
            
            // Update course's lastUpdatedBy timestamp as well
            await Course.findByIdAndUpdate(module.courseId._id, { lastUpdatedBy: req.user._id });

            await logAction(req.user.id, 'UPDATE_MODULE', 'Module', module._id, { changes }, req.ip);
        }
        const populatedModule = await Module.findById(module._id)
            .populate('createdBy', 'name email')
            .populate('lastUpdatedBy', 'name email')
            .populate('courseId', 'title slug');
        res.json(populatedModule);

    } catch (error) {
        console.error("Update Module Error:", error);
        res.status(500).json({ error: 'Failed to update module.' });
    }
};

exports.deleteModule = async (req, res) => {
    try {
        const moduleId = req.params.id;
        const module = await Module.findById(moduleId).populate('courseId', 'instructorIds modules createdBy');
        if (!module) return res.status(404).json({ error: "Module not found." });

        const course = module.courseId;
        const isCourseInstructorOrCreator = course.instructorIds.map(id => id.toString()).includes(req.user._id.toString()) || course.createdBy.toString() === req.user._id.toString();

        if (req.user.role !== 'admin' && req.user.role !== 'creator' && !isCourseInstructorOrCreator) {
            return res.status(403).json({ error: 'Not authorized to delete this module. Must be admin, course creator, or instructor.' });
        }
        
        const deletedTitle = module.title;
        const parentCourseId = module.courseId._id;
        const lessonCount = module.lessons.length;

        // Remove module reference from parent course
        await Course.findByIdAndUpdate(parentCourseId, {
            $pull: { modules: moduleId },
            lastUpdatedBy: req.user._id
        });

        // The `pre('remove')` hook on Module model will delete associated Lessons.
        await module.remove(); // Use .remove() to trigger middleware

        await logAction(req.user.id, 'DELETE_MODULE', 'Module', moduleId, { title: deletedTitle, courseId: parentCourseId, deletedLessonsCount: lessonCount }, req.ip);
        res.json({ message: `Module "${deletedTitle}" and its lessons deleted successfully.` });

    } catch (error) {
        console.error("Delete Module Error:", error);
        res.status(500).json({ error: 'Failed to delete module.' });
    }
};


// --- Lesson Management within a Module ---
exports.addLessonToModule = async (req, res) => {
    try {
        const moduleId = req.params.moduleId;
        const { lessonId } = req.body; 

        if (!mongoose.Types.ObjectId.isValid(lessonId) || !mongoose.Types.ObjectId.isValid(moduleId)) {
            return res.status(400).json({ error: "Invalid module or lesson ID." });
        }

        const module = await Module.findById(moduleId).populate('courseId', 'instructorIds createdBy');
        if (!module) return res.status(404).json({ error: "Module not found." });

        const course = module.courseId;
        const isCourseInstructorOrCreator = course.instructorIds.map(id => id.toString()).includes(req.user._id.toString()) || course.createdBy.toString() === req.user._id.toString();
        if (req.user.role !== 'admin' && req.user.role !== 'creator' && !isCourseInstructorOrCreator) {
            return res.status(403).json({ error: 'Not authorized to modify this module.' });
        }

        const lessonToAdd = await Lesson.findById(lessonId);
        if (!lessonToAdd) {
            return res.status(404).json({ error: "Lesson to add not found."});
        }
        if(lessonToAdd.moduleId.toString() !== moduleId) {
            return res.status(400).json({ error: "Lesson does not belong to this module. Update lesson's moduleId first if moving."});
        }
        
        if (module.lessons.map(id => id.toString()).includes(lessonId)) {
            return res.status(400).json({ error: "Lesson already in this module's list." });
        }
        
        lessonToAdd.order = module.lessons.length;
        await lessonToAdd.save();

        module.lessons.push(lessonId);
        module.lastUpdatedBy = req.user._id;
        await module.save();
        
        // Update course's lastUpdatedBy timestamp
        await Course.findByIdAndUpdate(module.courseId._id, { lastUpdatedBy: req.user._id });

        await logAction(req.user.id, 'ADD_LESSON_TO_MODULE', 'Module', moduleId, { lessonId, lessonTitle: lessonToAdd.title }, req.ip);
        const populatedModule = await Module.findById(moduleId).populate({ path: 'lessons', options: { sort: {order: 1 }}});
        res.status(200).json(populatedModule);
    } catch (error) {
        console.error("Add lesson to module error:", error);
        res.status(500).json({ error: "Failed to add lesson to module." });
    }
};

exports.removeLessonFromModule = async (req, res) => {
    try {
        const moduleId = req.params.moduleId;
        const { lessonId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(lessonId) || !mongoose.Types.ObjectId.isValid(moduleId)) {
            return res.status(400).json({ error: "Invalid module or lesson ID." });
        }

        const module = await Module.findById(moduleId).populate('courseId', 'instructorIds createdBy');
        if (!module) return res.status(404).json({ error: "Module not found." });

        const course = module.courseId;
        const isCourseInstructorOrCreator = course.instructorIds.map(id => id.toString()).includes(req.user._id.toString()) || course.createdBy.toString() === req.user._id.toString();
        if (req.user.role !== 'admin' && req.user.role !== 'creator' && !isCourseInstructorOrCreator) {
            return res.status(403).json({ error: 'Not authorized to modify this module.' });
        }
        
        const lessonIndex = module.lessons.map(id => id.toString()).indexOf(lessonId);
        if (lessonIndex === -1) {
            return res.status(404).json({ error: "Lesson not found in this module's list." });
        }

        module.lessons.splice(lessonIndex, 1);
        // Re-order subsequent lessons
        for (let i = lessonIndex; i < module.lessons.length; i++) {
            const lessIdToUpdate = module.lessons[i];
            await Lesson.findByIdAndUpdate(lessIdToUpdate, { order: i });
        }

        module.lastUpdatedBy = req.user._id;
        await module.save();
        await Course.findByIdAndUpdate(module.courseId._id, { lastUpdatedBy: req.user._id });
        
        // This does not delete the Lesson document itself.
        await logAction(req.user.id, 'REMOVE_LESSON_FROM_MODULE', 'Module', moduleId, { lessonId }, req.ip);
        const populatedModule = await Module.findById(moduleId).populate({ path: 'lessons', options: { sort: {order: 1 }}});
        res.status(200).json(populatedModule);
    } catch (error) {
        console.error("Remove lesson from module error:", error);
        res.status(500).json({ error: "Failed to remove lesson from module." });
    }
};


exports.updateLessonsOrderInModule = async (req, res) => {
    try {
        const moduleId = req.params.moduleId;
        const { orderedLessonIds } = req.body;

        if (!Array.isArray(orderedLessonIds) || !orderedLessonIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
            return res.status(400).json({ error: "Invalid lesson IDs array." });
        }

        const module = await Module.findById(moduleId).populate('courseId', 'instructorIds createdBy');
        if (!module) return res.status(404).json({ error: "Module not found." });

        const course = module.courseId;
        const isCourseInstructorOrCreator = course.instructorIds.map(id => id.toString()).includes(req.user._id.toString()) || course.createdBy.toString() === req.user._id.toString();
        if (req.user.role !== 'admin' && req.user.role !== 'creator' && !isCourseInstructorOrCreator) {
            return res.status(403).json({ error: 'Not authorized to modify this module.' });
        }
        
        const currentLessonIdsInModule = module.lessons.map(id => id.toString());
        const allProvidedIdsAreValidAndInModule = orderedLessonIds.every(id => currentLessonIdsInModule.includes(id.toString()));

        if (orderedLessonIds.length !== currentLessonIdsInModule.length || !allProvidedIdsAreValidAndInModule) {
            return res.status(400).json({ error: "Lesson list mismatch. Ensure all and only current module lessons are provided." });
        }

        module.lessons = orderedLessonIds.map(id => new mongoose.Types.ObjectId(id));
        module.lastUpdatedBy = req.user._id;
        await module.save();

        await Promise.all(orderedLessonIds.map(async (lessonId, index) => {
            await Lesson.findByIdAndUpdate(lessonId, { order: index, lastUpdatedBy: req.user._id });
        }));
        
        await Course.findByIdAndUpdate(module.courseId._id, { lastUpdatedBy: req.user._id });

        await logAction(req.user.id, 'REORDER_MODULE_LESSONS', 'Module', moduleId, { newOrderCount: orderedLessonIds.length }, req.ip);
        const populatedModule = await Module.findById(moduleId).populate({ path: 'lessons', options: { sort: { order: 1 } } });
        res.status(200).json(populatedModule);
    } catch (error) {
        console.error("Reorder lessons error:", error);
        res.status(500).json({ error: "Failed to reorder lessons." });
    }
};