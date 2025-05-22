// ===== File: /controllers/userController.js =====
const User = require('../models/User');
const mongoose = require('mongoose');
const logAction = require('../utils/auditLogger');

exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.search && req.query.search.trim() !== '') {
            const searchRegex = new RegExp(req.query.search.trim(), 'i');
            query.$or = [ { name: searchRegex }, { email: searchRegex } ];
        }
        if (req.query.role && ['user', 'creator', 'admin'].includes(req.query.role)) {
            query.role = req.query.role;
        }

        const sortOptions = {};
        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            sortOptions[parts[0]] = parts[1] === 'desc' ? -1 : 1;
        } else {
            sortOptions.createdAt = -1;
        }

        const users = await User.find(query)
            .select('-password')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);

        res.json({ users, currentPage: page, totalPages, totalUsers });
    } catch (error) {
        console.error("Get All Users Error:", error);
        res.status(500).json({ error: 'Server error fetching users' });
    }
};

exports.getUserById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }
        const user = await User.findById(req.params.id).select('-password');
        if (!user) { return res.status(404).json({ error: 'User not found' }); }
        res.json(user);
    } catch (error) {
        console.error("Get User By ID Error:", error);
        res.status(500).json({ error: 'Server error fetching user' });
    }
};

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
        if (!user) { return res.status(404).json({ error: 'User not found' }); }

        if (user.id.toString() === req.user.id && user.role === 'admin' && role !== 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Cannot remove the last admin role.' });
            }
        }
        
        const oldRole = user.role;
        if (oldRole === role) { // No change
             const userToReturn = user.toObject();
             delete userToReturn.password;
             return res.json(userToReturn);
        }
        user.role = role;
        await user.save();
        
        await logAction(
            req.user.id, 
            'UPDATE_USER_ROLE',
            'User',
            user._id, 
            { targetUserId: user._id.toString(), targetUserEmail: user.email, oldRole: oldRole, newRole: role },
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

exports.deleteUserCtrl = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }
        const userToDelete = await User.findById(req.params.id); // Renamed variable
        if (!userToDelete) { return res.status(404).json({ error: 'User not found' }); }

        if (req.user.id === userToDelete.id.toString()) {
             return res.status(400).json({ error: 'Admin cannot delete themselves.' });
        }
        
        const deletedUserEmail = userToDelete.email;
        const deletedUserId = userToDelete._id.toString(); // Capture ID before deletion
        await userToDelete.deleteOne(); 
        
        await logAction(
            req.user.id, 
            'DELETE_USER',
            'User',
            deletedUserId, // Use the string ID here for consistency if entityId is not always ObjectId
            { targetUserId: deletedUserId, targetUserEmail: deletedUserEmail },
            req.ip
        );

        res.json({ message: 'User removed successfully' });
    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({ error: 'Server error deleting user' });
    }
};