/**
 * Atlas Framework - Authentication Routes
 * Handles user login, logout, and token verification
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

/**
 * POST /api/auth/login
 * Authenticates user and returns JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    console.log('🔐 Login attempt for:', email);
    
    // TODO: Query PostgreSQL database for user
    // For now, hardcoded demo user
    if (email === 'admin@cloud.dev' && password === 'password') {
      // Generate JWT token
      const token = jwt.sign(
        { 
          email: email, 
          role: 'admin',
          id: 1
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );
      
      console.log('✅ Login successful for:', email);
      
      return res.json({
        success: true,
        token: token,
        user: {
          id: 1,
          email: email,
          role: 'admin',
          name: 'Admin User'
        }
      });
    } else {
      console.log('❌ Invalid credentials for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logs out user (client-side token removal)
 */
router.post('/logout', (req, res) => {
  console.log('👋 User logged out');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth/verify
 * Verifies JWT token validity
 */
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verified for:', decoded.email);
    
    res.json({
      success: true,
      user: decoded
    });
  } catch (error) {
    console.log('❌ Invalid token:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info from token
 */
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // TODO: Fetch user from database
    res.json({
      success: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: 'Admin User'
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

module.exports = router;
