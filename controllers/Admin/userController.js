const User = require('../../models/userModel');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Superadmin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.status(200).json(users);
    } catch (error) {
        console.error("Error getting all users:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Superadmin
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error getting user by ID:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Create a new user
// @route   POST /api/admin/users
// @access  Superadmin
const createUser = async (req, res) => {
    try {
        const { fullname, email, password, avatar, role, subrole, host, isVerified, expoPushToken, expoPlatform } = req.body;

        if (!fullname || !email || !password) {
            return res.status(400).json({ message: "Please enter all required fields: fullname, email, password" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User with that email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            fullname,
            email,
            password: hashedPassword,
            avatar,
            role: role || 'user', // Default to 'user' if not provided
            subrole,
            host,
            isVerified,
            expoPushToken,
            expoPlatform
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                subrole: user.subrole,
                host: user.host,
                isVerified: user.isVerified,
                expoPushToken: user.expoPushToken,
                expoPlatform: user.expoPlatform
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }

    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Update a user
// @route   PUT /api/admin/users/:id
// @access  Superadmin
const updateUser = async (req, res) => {
    try {
        const { fullname, email, password, avatar, role, subrole, host, isVerified, expoPushToken, expoPlatform } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if email is being changed to an already existing email by another user
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists && emailExists._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: "Email already in use by another user" });
            }
        }

        user.fullname = fullname || user.fullname;
        user.email = email || user.email;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }
        user.avatar = avatar || user.avatar;
        user.role = role || user.role;
        user.subrole = subrole || user.subrole;
        user.host = host || user.host;
        user.isVerified = isVerified !== undefined ? isVerified : user.isVerified;
        user.expoPushToken = expoPushToken || user.expoPushToken;
        user.expoPlatform = expoPlatform || user.expoPlatform;

        const updatedUser = await user.save();

        res.status(200).json({
            _id: updatedUser._id,
            fullname: updatedUser.fullname,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            role: updatedUser.role,
            subrole: updatedUser.subrole,
            host: updatedUser.host,
            isVerified: updatedUser.isVerified,
            expoPushToken: updatedUser.expoPushToken,
            expoPlatform: updatedUser.expoPlatform
        });

    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Superadmin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.deleteOne();
        res.status(200).json({ message: "User removed" });

    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};
