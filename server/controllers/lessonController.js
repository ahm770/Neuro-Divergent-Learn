// ===== File: /controllers/lessonController.js =====
const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const Course = require('../models/Course');
const Content = require('../models/Content');
// const Quiz = require('../models/Quiz'); // Uncomment when Quiz model exists
// const Assignment = require('../models/Assignment'); // Uncomment when Assignment model exists
const mongoose = require('mongoose');
const { validationResult, body } = require('express-validator');
const logAction = require('../utils/auditLogger');

exports.lessonCreateValidation = [
    body('title').trim().isLength({ min: 3 }).withMessage('Lesson title must be at least 3 characters.'),
    body('moduleId').isMongoId().withMessage('Valid Module ID is required.'),
    body('estimatedCompletionTimeMinutes').optional().isInt({ min: 0 }).withMessage('Estimated time must be a non-negative integer.'),
    body('published').optional().isBoolean()
];

exports.createLesson = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { title, moduleId, estimatedCompletionTimeMinutes, published } = req.body;

        const module = await Module.findById(moduleId).populate({
            path: 'courseId',
            select: 'instructorIds createdBy'
        });

        if (!module) {
            return res.status(404).json({ error: 'Module not found. Cannot create lesson for non-existent module.' });
        }

        const course = module.courseId;
        const isCourseInstructorOrCreator = course.instructorIds.map(id => id.toString()).includes(req.user._id.toString()) || course.createdBy.toString() === req.user._id.toString();
        if (req.user.role !== 'admin' && req.user.role !== 'creator' && !isCourseInstructorOrCreator) {
            return res.status(403).json({ error: 'Not authorized to add lessons to this module.' });
        }
        
        const order = module.lessons.length;

        const lesson = new Lesson({
            title,
            moduleId,
            estimatedCompletionTimeMinutes,
            published: published || false,
            order,
            createdBy: req.user._id,
            lastUpdatedBy: req.user._id
        });
        await lesson.save();

        module.lessons.push(lesson._id);
        module.lastUpdatedBy = req.user._id;
        await module.save();
        await Course.findByIdAndUpdate(module.courseId._id, { lastUpdatedBy: req.user._id });


        await logAction(req.user.id, 'CREATE_LESSON', 'Lesson', lesson._id, { title: lesson.title, moduleId: lesson.moduleId, published: lesson.published }, req.ip);
        const populatedLesson = await Lesson.findById(lesson._id)
            .populate('createdBy', 'name email')
            .populate('moduleId', 'title');
        res.status(201).json(populatedLesson);
    } catch (error) {
        console.error("Create Lesson Error:", error);
        res.status(500).json({ error: 'Failed to create lesson.' });
    }
};

exports.getLessonsByModule = async (req, res) => {
    try {
        const moduleId = req.params.moduleId;
        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            return res.status(400).json({ error: 'Invalid Module ID.' });
        }
        const module = await Module.findById(moduleId)
            .populate({ path: 'courseId', select: 'instructorIds studentIds published createdBy' });
        if (!module) return res.status(404).json({ error: "Module not found."});

        const course = module.courseId;
        const query = { moduleId };

        const isCourseInstructorOrAdminCreator = req.user.role === 'admin' || req.user.role === 'creator' || (course && (course.instructorIds.map(id => id.toString()).includes(req.user._id.toString()) || course.createdBy.toString() === req.user._id.toString()));
        const isEnrolledStudentInPublishedCourseModule = course && course.published && module.published && (course.studentIds.map(id => id.toString()).includes(req.user._id.toString()));

        if (!isCourseInstructorOrAdminCreator && !isEnrolledStudentInPublishedCourseModule) {
            return res.status(403).json({ error: "Not authorized to view lessons for this module." });
        }
        if(!isCourseInstructorOrAdminCreator) {
             query.published = true;
        }
        
        const lessons = await Lesson.find(query)
            .populate('createdBy', 'name email')
            .populate('lastUpdatedBy', 'name email')
            .populate({
                path: 'items.itemId', 
                select: 'title topic itemType keyVocabulary learningObjectives' // Adjust fields
            })
            .sort({ order: 1 });
        res.json(lessons);
    } catch (error) {
        console.error("Get Lessons by Module Error:", error);
        res.status(500).json({ error: 'Failed to retrieve lessons.' });
    }
};

exports.getLessonById = async (req, res) => {
    try {
        const lessonId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            return res.status(400).json({ error: 'Invalid Lesson ID.' });
        }
        const lesson = await Lesson.findById(lessonId)
            .populate('createdBy', 'name email')
            .populate('lastUpdatedBy', 'name email')
            .populate({
                path: 'moduleId',
                populate: {
                    path: 'courseId',
                    select: 'instructorIds studentIds published createdBy title slug'
                }
            })
            .populate('items.itemId'); 

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found.' });
        }
        
        const module = lesson.moduleId;
        const course = module.courseId;

        const isCourseInstructorOrAdminCreator = req.user.role === 'admin' || req.user.role === 'creator' || (course && (course.instructorIds.map(id => id.toString()).includes(req.user._id.toString()) || course.createdBy.toString() === req.user._id.toString()));
        const isEnrolledStudentInPublishedCourseModuleLesson = course && course.published && module.published && lesson.published && (course.studentIds.map(id => id.toString()).includes(req.user._id.toString()));

        if (!isCourseInstructorOrAdminCreator && !isEnrolledStudentInPublishedCourseModuleLesson) {
            return res.status(403).json({ error: 'Not authorized to view this lesson.' });
        }
        
        res.json(lesson);
    } catch (error) {
        console.error("Get Lesson By ID Error:", error);
        res.status(500).json({ error: 'Failed to retrieve lesson.' });
    }
};

exports.updateLesson = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const lessonId = req.params.id;
        const { title, estimatedCompletionTimeMinutes, published, order } = req.body;

        let lesson = await Lesson.findById(lessonId).populate({
            path: 'moduleId',
            populate: { path: 'courseId', select: 'instructorIds createdBy' }
        });
        if (!lesson) return res.status(404).json({ error: "Lesson not found." });

        const course = lesson.moduleId.courseId;
        const isCourseInstructorOrCreator = course.instructorIds.map(id => id.toString()).includes(req.user._id.toString()) || course.createdBy.toString() === req.user._id.toString();
        if (req.user.role !== 'admin' && req.user.role !== 'creator' && !isCourseInstructorOrCreator) {
            return res.status(403).json({ error: 'Not authorized to update this lesson.' });
        }

        const oldValues = { title: lesson.title, published: lesson.published, order: lesson.order };
        const changes = {};

        if (title && title !== lesson.title) { lesson.title = title; changes.title = { old: oldValues.title, new: lesson.title }; }
        if (estimatedCompletionTimeMinutes !== undefined) lesson.estimatedCompletionTimeMinutes = estimatedCompletionTimeMinutes; // Not tracking for audit
        if (published !== undefined && published !== lesson.published) { lesson.published = published; changes.published = { old: oldValues.published, new: lesson.published };}
        if (order !== undefined && typeof order === 'number' && order !== lesson.order) {
             lesson.order = order; changes.order = { old: oldValues.order, new: lesson.order };
        }
        
        if (Object.keys(changes).length > 0) {
            lesson.lastUpdatedBy = req.user._id;
            await lesson.save();
            await Module.findByIdAndUpdate(lesson.moduleId._id, { lastUpdatedBy: req.user._id });
            await Course.findByIdAndUpdate(lesson.moduleId.courseId._id, { lastUpdatedBy: req.user._id });

            await logAction(req.user.id, 'UPDATE_LESSON', 'Lesson', lesson._id, { changes }, req.ip);
        }
        const populatedLesson = await Lesson.findById(lesson._id)
            .populate('createdBy', 'name email')
            .populate('lastUpdatedBy', 'name email')
            .populate('moduleId', 'title');
        res.json(populatedLesson);

    } catch (error) {
        console.error("Update Lesson Error:", error);
        res.status(500).json({ error: 'Failed to update lesson.' });
    }
};

exports.deleteLesson = async (req, res) => {
    try {
        const lessonId = req.params.id;
        const lesson = await Lesson.findById(lessonId).populate({
            path: 'moduleId',
            select: 'lessons courseId',
            populate: { path: 'courseId', select: 'instructorIds createdBy' }
        });
        if (!lesson) return res.status(404).json({ error: "Lesson not found." });

        const module = lesson.moduleId;
        const course = module.courseId;
        const isCourseInstructorOrCreator = course.instructorIds.map(id => id.toString()).includes(req.user._id.toString()) || course.createdBy.toString() === req.user._id.toString();
        if (req.user.role !== 'admin' && req.user.role !== 'creator' && !isCourseInstructorOrCreator) {
            return res.status(403).json({ error: 'Not authorized to delete this lesson.' });
        }
        
        const deletedTitle = lesson.title;
        const parentModuleId = lesson.moduleId._id;

        // Remove lesson reference from parent module
        await Module.findByIdAndUpdate(parentModuleId, {
            $pull: { lessons: lessonId },
            lastUpdatedBy: req.user._id
        });
        await Course.findByIdAndUpdate(lesson.moduleId.courseId._id, { lastUpdatedBy: req.user._id });
        
        // Lesson items are just references, so deleting the lesson doesn't delete the underlying Content/Quiz/Assignment docs.
        // This is generally desired behavior for reusability of content.
        await lesson.remove(); // Using .remove() though no specific pre-remove hook for Lesson currently

        await logAction(req.user.id, 'DELETE_LESSON', 'Lesson', lessonId, { title: deletedTitle, moduleId: parentModuleId }, req.ip);
        res.json({ message: `Lesson "${deletedTitle}" deleted successfully.` });

    } catch (error) {
        console.error("Delete Lesson Error:", error);
        res.status(500).json({ error: 'Failed to delete lesson.' });
    }
};


// --- Lesson Item Management ---
exports.lessonItemValidation = [
    body('itemType').isIn(['Content', 'Quiz', 'Assignment', 'ExternalLink', 'Discussion']).withMessage('Invalid item type.'),
    body('itemId').isMongoId().withMessage('Valid Item ID is required.'),
    body('titleOverride').optional().trim()
];

const getItemModel = (itemType) => {
    switch (itemType) {
        case 'Content': return Content;
        // case 'Quiz': return Quiz;
        // case 'Assignment': return Assignment;
        default: return null;
    }
};

exports.addItemToLesson = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const lessonId = req.params.lessonId;
        const { itemType, itemId, titleOverride } = req.body;

        let lesson = await Lesson.findById(lessonId).populate({
            path: 'moduleId',
            populate: { path: 'courseId', select: 'instructorIds createdBy' }
        });
        if (!lesson) return res.status(404).json({ error: "Lesson not found." });
        
        const course = lesson.moduleId.courseId;
        const isCourseInstructorOrCreator = course.instructorIds.map(id => id.toString()).includes(req.user._id.toString()) || course.createdBy.toString() === req.user._id.toString();
        if (req.user.role !== 'admin' && req.user.role !== 'creator' && !isCourseInstructorOrCreator) {
            return res.status(403).json({ error: 'Not authorized to modify this lesson.' });
        }
        
        const ItemModel = getItemModel(itemType);
        if (!ItemModel && itemType !== 'ExternalLink' && itemType !== 'Discussion') { // Allow non-model types for now
            return res.status(400).json({ error: `Linking of item type '${itemType}' is not fully supported yet or model missing.` });
        }
        
        let itemExists;
        if (ItemModel) {
            itemExists = await ItemModel.findById(itemId);
            if (!itemExists) return res.status(404).json({ error: `${itemType} with ID ${itemId} not found.` });
        } else if (itemType === 'ExternalLink' || itemType === 'Discussion') {
            // For these types, itemId might not be a Mongoose ObjectId if it's just a URL or a placeholder
            // For now, let's assume itemId is still an ObjectId that points to some other record if needed
            // or we need a different validation path if itemId can be a string URL for 'ExternalLink'
            // This part needs more definition for ExternalLink/Discussion if itemId isn't an ObjectId
            if (!mongoose.Types.ObjectId.isValid(itemId) && itemType !== 'ExternalLink'){ // Allow non-ObjectId for ExternalLink if itemId is the URL itself
                 // return res.status(400).json({ error: `ItemID must be a valid ID for ${itemType}.` });
            }
             // For ExternalLink, the 'itemId' might be the URL itself or a placeholder, and 'titleOverride' the display text
             // itemExists can be a placeholder object for logging
             itemExists = { title: titleOverride || itemId, _id: itemId };
        }


        const existingItemIndex = lesson.items.findIndex(item => item.itemId.toString() === itemId.toString() && item.itemType === itemType);
        if (existingItemIndex > -1) {
            return res.status(400).json({ error: `${itemType} is already in this lesson.` });
        }
        
        const order = lesson.items.length;

        lesson.items.push({ itemType, itemId, titleOverride, order });
        lesson.lastUpdatedBy = req.user._id;
        await lesson.save();
        
        await Module.findByIdAndUpdate(lesson.moduleId._id, { lastUpdatedBy: req.user._id });
        await Course.findByIdAndUpdate(lesson.moduleId.courseId._id, { lastUpdatedBy: req.user._id });

        await logAction(req.user.id, 'ADD_ITEM_TO_LESSON', 'Lesson', lessonId, { itemType, itemId: itemId.toString(), itemTitle: itemExists?.title || itemExists?.topic || titleOverride }, req.ip);
        const populatedLesson = await Lesson.findById(lessonId).populate('items.itemId');
        res.status(200).json(populatedLesson);

    } catch (error) {
        console.error("Add item to lesson error:", error);
        res.status(500).json({ error: "Failed to add item to lesson." });
    }
};

exports.removeItemFromLesson = async (req, res) => {
    try {
        const lessonId = req.params.lessonId;
        // Item is identified by its own itemId AND itemType within the lesson's items array.
        // The client needs to send which specific sub-item (by its itemId and itemType) to remove.
        const { lessonItemId } = req.body; // This should be the _id of the subdocument in the items array for direct removal.
                                          // OR, if removing by itemId and itemType: const { itemId, itemType } = req.body;
                                          
        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            return res.status(400).json({ error: "Invalid lesson ID."});
        }

        let lesson = await Lesson.findById(lessonId).populate({
            path: 'moduleId',
            populate: { path: 'courseId', select: 'instructorIds createdBy' }
        });
        if (!lesson) return res.status(404).json({ error: "Lesson not found." });

        const course = lesson.moduleId.courseId;
        const isCourseInstructorOrCreator = course.instructorIds.map(id => id.toString()).includes(req.user._id.toString()) || course.createdBy.toString() === req.user._id.toString();
        if (req.user.role !== 'admin' && req.user.role !== 'creator' && !isCourseInstructorOrCreator) {
            return res.status(403).json({ error: 'Not authorized to modify this lesson.' });
        }
        
        // Option 1: Remove by _id of the subdocument (if subdocuments have _id, which they don't by default with {_id: false})
        // If lessonItemSchema had _id: true (default), then lessonItemId would be that _id.
        // lesson.items.id(lessonItemId).remove(); // Mongoose subdocument removal

        // Option 2: Remove by combination of itemId and itemType (more robust if subdoc _id is not stable or available)
        const { itemId, itemType } = req.body; // Expect these if not using subdocument _id
        if (!itemId || !itemType) {
            return res.status(400).json({error: "itemId and itemType are required to identify the lesson item."})
        }

        const itemIndex = lesson.items.findIndex(item => item.itemId.toString() === itemId.toString() && item.itemType === itemType);
        if (itemIndex === -1) {
            return res.status(404).json({ error: "Item not found in this lesson." });
        }
        const removedItemDetails = lesson.items[itemIndex];
        lesson.items.splice(itemIndex, 1);
        
        // Re-order remaining items
        lesson.items.forEach((item, index) => item.order = index);

        lesson.lastUpdatedBy = req.user._id;
        await lesson.save();
        
        await Module.findByIdAndUpdate(lesson.moduleId._id, { lastUpdatedBy: req.user._id });
        await Course.findByIdAndUpdate(lesson.moduleId.courseId._id, { lastUpdatedBy: req.user._id });

        await logAction(req.user.id, 'REMOVE_ITEM_FROM_LESSON', 'Lesson', lessonId, { itemType: removedItemDetails.itemType, itemId: removedItemDetails.itemId.toString() }, req.ip);
        const populatedLesson = await Lesson.findById(lessonId).populate('items.itemId');
        res.status(200).json(populatedLesson);

    } catch (error) {
        console.error("Remove item from lesson error:", error);
        res.status(500).json({ error: "Failed to remove item from lesson." });
    }
};


exports.updateLessonItemsOrder = async (req, res) => {
    try {
        const lessonId = req.params.lessonId;
        // orderedLessonItemSubdocuments should be array of { itemId, itemType, titleOverride (optional) }
        const { orderedLessonItemSubdocuments } = req.body; 

        if (!Array.isArray(orderedLessonItemSubdocuments)) {
            return res.status(400).json({ error: "Invalid lesson items array."});
        }
        
        for (const item of orderedLessonItemSubdocuments) {
            if (!item.itemId || !item.itemType || (item.itemId && !mongoose.Types.ObjectId.isValid(item.itemId.toString()) && item.itemType !== 'ExternalLink') ) { // Allow non-ObjectId for ExternalLink if itemId is the URL
                 return res.status(400).json({ error: `Each lesson item must have a valid itemId (unless ExternalLink with URL as ID) and itemType. Problem with: ${JSON.stringify(item)}`});
            }
        }

        let lesson = await Lesson.findById(lessonId).populate({
            path: 'moduleId',
            populate: { path: 'courseId', select: 'instructorIds createdBy' }
        });
        if (!lesson) return res.status(404).json({ error: "Lesson not found." });
        
        const course = lesson.moduleId.courseId;
        const isCourseInstructorOrCreator = course.instructorIds.map(id => id.toString()).includes(req.user._id.toString()) || course.createdBy.toString() === req.user._id.toString();
        if (req.user.role !== 'admin' && req.user.role !== 'creator' && !isCourseInstructorOrCreator) {
            return res.status(403).json({ error: 'Not authorized to modify this lesson.' });
        }

        // Ensure all items in orderedLessonItemSubdocuments are currently in the lesson
        const currentItemUniqueKeys = lesson.items.map(li => `${li.itemType}-${li.itemId.toString()}`);
        const providedItemUniqueKeys = orderedLessonItemSubdocuments.map(li => `${li.itemType}-${li.itemId.toString()}`);

        if (currentItemUniqueKeys.length !== providedItemUniqueKeys.length || !providedItemUniqueKeys.every(key => currentItemUniqueKeys.includes(key))) {
            return res.status(400).json({ error: "Lesson item list mismatch. Ensure all and only current lesson items are provided in the new order." });
        }
        
        lesson.items = orderedLessonItemSubdocuments.map((itemData, index) => ({
            itemType: itemData.itemType,
            itemId: itemData.itemType === 'ExternalLink' ? itemData.itemId : new mongoose.Types.ObjectId(itemData.itemId), // Handle ExternalLink itemId potentially being a string URL
            titleOverride: itemData.titleOverride,
            order: index 
        }));

        lesson.lastUpdatedBy = req.user._id;
        await lesson.save();
        
        await Module.findByIdAndUpdate(lesson.moduleId._id, { lastUpdatedBy: req.user._id });
        await Course.findByIdAndUpdate(lesson.moduleId.courseId._id, { lastUpdatedBy: req.user._id });
        
        await logAction(req.user.id, 'REORDER_LESSON_ITEMS', 'Lesson', lessonId, { newOrderCount: orderedLessonItemSubdocuments.length }, req.ip);
        const populatedLesson = await Lesson.findById(lessonId).populate('items.itemId');
        res.status(200).json(populatedLesson);
    } catch (error) {
        console.error("Reorder lesson items error:", error);
        res.status(500).json({ error: "Failed to reorder lesson items." });
    }
};