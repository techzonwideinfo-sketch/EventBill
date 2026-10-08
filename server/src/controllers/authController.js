import User from '../models/User.js';
import EventType from '../models/EventType.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });
};

export const register = async (req, res) => {
  try {
    let { name, email, mobile, password } = req.body;
    email = email.toLowerCase().trim();
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: 'User already exists' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, mobile, password: hashedPassword });
    
    // Seed default event types for the new user
    const defaultEvents = [
      { name: 'Marriage', tamilName: 'திருமணம்' },
      { name: 'Engagement', tamilName: 'நிச்சயதார்த்தம்' },
      { name: 'Reception', tamilName: 'வரவேற்பு' },
      { name: 'Housewarming', tamilName: 'வீட்டு விழா' },
      { name: 'Baby Shower', tamilName: 'குழந்தை பிறப்பு விழா' },
      { name: 'Birthday', tamilName: 'பிறந்தநாள்' },
      { name: 'Naming Ceremony', tamilName: 'பெயர் சூட்டும் விழா' },
      { name: 'Anniversary', tamilName: 'திருமண நாள் விழா' },
      { name: 'Other', tamilName: 'மற்றவை' }
    ].map(e => ({ ...e, userId: user._id, isActive: true }));
    
    await EventType.insertMany(defaultEvents);

    res.status(201).json({ success: true, data: { _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) }});
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'An unexpected error occurred during registration.' });
  }
};

export const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.toLowerCase().trim();
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({ success: true, data: { _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) }});
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'An unexpected error occurred during login.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ success: false, message: 'An unexpected error occurred while fetching user profile.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, mobile } = req.body;
    if (!name || !name.trim()) return res.status(422).json({ success: false, message: 'Name is required' });
    if (!mobile || !mobile.trim()) return res.status(422).json({ success: false, message: 'Mobile is required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.name = name.trim();
    user.mobile = mobile.trim();
    await user.save();

    res.json({ success: true, data: { _id: user._id, name: user.name, email: user.email, mobile: user.mobile } });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'An unexpected error occurred updating profile.' });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(422).json({ success: false, message: 'Current and new password are required' });
    if (newPassword.length < 6) return res.status(422).json({ success: false, message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ success: false, message: 'An unexpected error occurred updating password.' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Please provide an email' });
    
    email = email.toLowerCase().trim();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'There is no user with that email' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save();

    const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : 'http://localhost:5173';
    // Use hash router format for Electron compatibility
    const resetUrl = `${clientUrl}/#/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'MOI BILL Password Reset',
        message
      });

      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'An unexpected error occurred' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, data: { _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) } });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'An unexpected error occurred' });
  }
};
