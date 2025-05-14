const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Ensure environment variables are loaded
dotenv.config();

// Debug: Log auth-related environment variables
console.log('Environment variables check:');
console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('FACEBOOK_APP_ID exists:', !!process.env.FACEBOOK_APP_ID);
console.log('FACEBOOK_APP_SECRET exists:', !!process.env.FACEBOOK_APP_SECRET);
console.log('BASE_URL:', process.env.BASE_URL || 'http://localhost:5000');

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Only setup Google Strategy if credentials exist
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('Initializing Google Strategy with callback URL:', `${process.env.BASE_URL || 'http://localhost:5000'}`);
  
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL || 'http://localhost:5000'}`,
      userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
      profileFields: ['id', 'displayName', 'emails', 'photos']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google authentication callback received with profile ID:', profile.id);
        
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
          console.log('Existing user found with Google ID:', profile.id);
          return done(null, user);
        }
        
        // Check if user exists with the same email
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;
        if (!email) {
          console.error('No email found from Google account');
          return done(new Error('No email found from Google account'), null);
        }
        
        user = await User.findOne({ email });
        
        if (user) {
          console.log('Existing user found with email:', email, 'Linking Google account');
          // Link Google account to existing user
          user.googleId = profile.id;
          user.authProvider = 'google';
          user.avatarUrl = user.avatarUrl || (profile.photos && profile.photos[0] && profile.photos[0].value);
          user.isVerified = true; // Auto-verify user from Google
          await user.save();
          return done(null, user);
        }
        
        console.log('Creating new user from Google account with email:', email);
        // Create new user
        const newUser = await User.create({
          googleId: profile.id,
          email: email,
          fullName: profile.displayName || 'Google User',
          avatarUrl: profile.photos && profile.photos[0] && profile.photos[0].value,
          authProvider: 'google',
          isVerified: true, // Auto-verify Google users
          roleType: 'user',
          phoneNumber: '0000000000', // Placeholder
          dateOfBirth: new Date('1990-01-01'), // Placeholder
          gender: 'other' // Placeholder
        });
        
        return done(null, newUser);
      } catch (error) {
        console.error('Google authentication error:', error);
        return done(error, null);
      }
    }
  ));
} else {
  console.warn('Google authentication is disabled: Missing client ID or secret');
}

// Only setup Facebook Strategy if credentials exist
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  console.log('Initializing Facebook Strategy with callback URL:', `${process.env.BASE_URL || 'http://localhost:5000'}/`);
  
  passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.BASE_URL || 'http://localhost:5000'}/`,
      profileFields: ['id', 'displayName', 'email', 'photos']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Facebook authentication callback received with profile ID:', profile.id);
        
        // Check if user already exists
        let user = await User.findOne({ facebookId: profile.id });
        
        if (user) {
          console.log('Existing user found with Facebook ID:', profile.id);
          return done(null, user);
        }
        
        // Check if user exists with the same email
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;
        if (!email) {
          console.error('No email found from Facebook account');
          return done(new Error('No email found from Facebook account'), null);
        }
        
        user = await User.findOne({ email });
        
        if (user) {
          console.log('Existing user found with email:', email, 'Linking Facebook account');
          // Link Facebook account to existing user
          user.facebookId = profile.id;
          user.authProvider = 'facebook';
          user.avatarUrl = user.avatarUrl || (profile.photos && profile.photos[0] && profile.photos[0].value);
          user.isVerified = true; // Auto-verify user from Facebook
          await user.save();
          return done(null, user);
        }
        
        console.log('Creating new user from Facebook account with email:', email);
        // Create new user
        const newUser = await User.create({
          facebookId: profile.id,
          email: email,
          fullName: profile.displayName || 'Facebook User',
          avatarUrl: profile.photos && profile.photos[0] && profile.photos[0].value,
          authProvider: 'facebook',
          isVerified: true, // Auto-verify Facebook users
          roleType: 'user',
          phoneNumber: '0000000000', // Placeholder
          dateOfBirth: new Date('1990-01-01'), // Placeholder
          gender: 'other' // Placeholder
        });
        
        return done(null, newUser);
      } catch (error) {
        console.error('Facebook authentication error:', error);
        return done(error, null);
      }
    }
  ));
} else {
  console.warn('Facebook authentication is disabled: Missing app ID or secret');
}

module.exports = passport; 