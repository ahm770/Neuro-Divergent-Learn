// ===== File: /controllers/userController.js =====
const User = require('../models/User');
const mongoose = require('mongoose');
const logAction = require('../utils/auditLogger'); // Import the logger

// @desc    Get all users with pagination, filtering, sorting
// @route   GET /api/users
// @access  Admin
exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        // Filtering
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query.$or = [
                { name: searchRegex },
                { email: searchRegex }
            ];
        }
        if (req.query.role && ['user', 'creator', 'admin'].includes(req.query.role)) {
            query.role = req.query.role;
        }
        // Add other filters like date joined range if needed

        // Sorting
        const sortOptions = {};
        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            sortOptions[parts[0]] = parts[1] === 'desc' ? -1 : 1;
        } else {
            sortOptions.createdAt = -1; // Default sort
        }

        const users = await User.find(query)
            .select('-password')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);

        res.json({
            users,
            currentPage: page,
            totalPages,
            totalUsers
        });
    } catch (error) {
        console.error("Get All Users Error:", error);
        res.status(500).json({ error: 'Server error fetching users' });
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin
exports.getUserById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error("Get User By ID Error:", error);
        res.status(500).json({ error: 'Server error fetching user' });
    }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Admin
exports.updateUserRole = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }
        const { role } = req.body;
        if (!['user', 'creator', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role specified' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.id.toString() === req.user.id && user.role === 'admin' && role !== 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Cannot remove the last admin role.' });
            }
        }
        
        const oldRole = user.role; // Capture old role for audit
        user.role = role;
        await user.save();
        
        await logAction(
            req.user.id, 
            'UPDATE_USER_ROLE',
            'User',
            user._id, 
            { targetUserId: user._id.toString(), oldRole: oldRole, newRole: role },
            req.ip
        );

        const userToReturn = user.toObject();
        delete userToReturn.password;
        res.json(userToReturn);
    } catch (error) {
        console.error("Update User Role Error:", error);
        res.status(500).json({ error: 'Server error updating user role' });
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Admin
exports.deleteUserCtrl = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (req.user.id === user.id.toString()) {
             return res.status(400).json({ error: 'Admin cannot delete themselves.' });
        }
        
        const deletedUserEmail = user.email; // For audit log
        await user.deleteOne(); 
        
        await logAction(
            req.user.id, 
            'DELETE_USER',
            'User',
            req.params.id, 
            { targetUserId: req.params.id, email: deletedUserEmail },
            req.ip
        );

        res.json({ message: 'User removed successfully' });
    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({ error: 'Server error deleting user' });
    }
};