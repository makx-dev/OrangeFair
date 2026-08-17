const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'development_secret_change_me',
    { expiresIn: '7d' }
  );
}

const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role });

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed.', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!user.passwordHash) {
       return res.status(401).json({ message: 'Please sign in with Google.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed.', error: error.message });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { token, role } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Google token is required.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, 
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;
    
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        googleId,
        role: role || 'rider',
      });
    } else if (!user.googleId) {
      // Link Google account to existing user if they signed up with email/password previously
      user.googleId = googleId;
      await user.save();
    }
    
    const sessionToken = signToken(user);
    
    return res.json({
      token: sessionToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({ message: 'Google authentication failed.', error: error.message });
  }
};

exports.devLogin = async (req, res) => {
  try {
    let user = await User.findOne({ email: 'rider1@prototype.local' });
    if (!user) {
      user = await User.create({
        name: 'Dev Rider',
        email: 'rider1@prototype.local',
        role: 'rider'
      });
    }
    const token = signToken(user);
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Dev login failed', error: error.message });
  }
};
