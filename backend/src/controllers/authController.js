import User from '../models/User.js';
import generateToken from '../config/generateToken.js';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('roleId');

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.roleId.name,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
export const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id).populate('roleId');

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.roleId ? user.roleId.name : null,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res) => {
    // On the backend, logout is usually handled by the client discarding the token.
    // We can implement a blacklist if needed, but for now, we'll just send a success message.
    res.status(200).json({ message: 'User logged out' });
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res) => {
    // Simple implementation: Client sends existing token, we return a new one if it's still valid
    // Usually this would involve a separate refresh token stored in DB/Cookie.
    res.status(501).json({ message: 'Refresh token logic not yet implemented' });
};
