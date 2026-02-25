const crypto = require('crypto');
const express = require("express");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");

const app = express();

app.use(bodyParser.json());

// Serve static files from current directory
app.use(express.static(__dirname));

// Generate a secure random session secret
const sessionSecret = crypto.randomBytes(64).toString('hex');

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

/*
  When user clicks "Security"
  This generates a secret and QR
*/
app.get("/api/2fa/setup", async (req, res) => {
  const secret = speakeasy.generateSecret({
    length: 20,
    name: "Blockvance",
  });

  req.session.temp2FASecret = secret.base32;

  const qrCodeImage = await QRCode.toDataURL(secret.otpauth_url);

  res.json({
    qrCode: qrCodeImage,
    manualCode: secret.base32,
  });
});

/*
  Verify code and enable 2FA
*/
app.post("/api/2fa/verify", (req, res) => {
  const { token } = req.body;
  const secret = req.session.temp2FASecret;
  
  if (!secret) {
    return res.json({ success: false, message: "No pending 2FA setup found" });
  }
  
  if (!token || !/^\d{6}$/.test(token)) {
    return res.json({ success: false, message: "Invalid token format. Must be 6 digits." });
  }

  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: token,
    window: 1,
  });

  if (verified) {
    req.session.is2FAEnabled = true;
    req.session.user2FASecret = secret;
    // Clear temp secret
    req.session.temp2FASecret = null;
    // Clear any failed attempts
    req.session.verifyAttempts = null;
    return res.json({ success: true });
  } else {
    // Track failed attempts
    req.session.verifyAttempts = (req.session.verifyAttempts || 0) + 1;
    
    // If too many failed attempts, clear the temp secret
    if (req.session.verifyAttempts >= 5) {
      req.session.temp2FASecret = null;
      return res.json({ success: false, message: "Too many failed attempts. Please restart 2FA setup." });
    }
    
    return res.json({ success: false, message: "Invalid token" });
  }
});

/*
  Check 2FA status
*/
app.get("/api/2fa/status", (req, res) => {
  res.json({
    enabled: req.session.is2FAEnabled || false,
  });
});

/*
  Request 2FA reset (sends verification code to email)
*/
app.post("/api/2fa/reset-request", (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.json({ success: false, message: "Email is required" });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.json({ success: false, message: "Invalid email format" });
  }
  
  // Generate a 6-digit reset code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store reset code in session (in production, send via email)
  req.session.passwordResetCode = resetCode;
  req.session.passwordResetEmail = email;
  req.session.passwordResetExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
  req.session.passwordResetAttempts = 0; // Track failed attempts
  
  // In production, you would send this code via email
  console.log(`2FA Reset Code for ${email}: ${resetCode}`);
  
  // For demo purposes only - in production, remove demoCode from response
  const isDemoMode = process.env.NODE_ENV !== 'production';
  
  res.json({ 
    success: true, 
    message: "Reset code sent to your email",
    ...(isDemoMode && { demoCode: resetCode })
  });
});

/*
  Verify 2FA reset code and disable 2FA
*/
app.post("/api/2fa/reset-verify", (req, res) => {
  const { email, code, newToken } = req.body;
  
  if (!email || !code || !newToken) {
    return res.json({ success: false, message: "All fields are required" });
  }
  
  // Check for too many failed attempts
  if (req.session.passwordResetAttempts && req.session.passwordResetAttempts >= 5) {
    return res.json({ success: false, message: "Too many failed attempts. Please request a new reset code." });
  }
  
  // Verify the reset code
  if (req.session.passwordResetCode !== code) {
    // Increment failed attempts
    req.session.passwordResetAttempts = (req.session.passwordResetAttempts || 0) + 1;
    return res.json({ success: false, message: "Invalid reset code" });
  }
  
  // Check if code has expired
  if (Date.now() > req.session.passwordResetExpiry) {
    return res.json({ success: false, message: "Reset code has expired" });
  }
  
  // Verify the email matches
  if (req.session.passwordResetEmail !== email) {
    return res.json({ success: false, message: "Email mismatch" });
  }
  
  // Validate the new token format (must be 6 digits)
  if (!/^\d{6}$/.test(newToken)) {
    return res.json({ success: false, message: "Invalid token format. Must be 6 digits." });
  }
  
  // Generate new 2FA secret
  const secret = speakeasy.generateSecret({
    length: 20,
    name: "Blockvance",
  });
  
  // Verify the new token works
  const verified = speakeasy.totp.verify({
    secret: secret.base32,
    encoding: "base32",
    token: newToken,
    window: 1,
  });
  
  if (!verified) {
    return res.json({ success: false, message: "Invalid authentication token" });
  }
  
  // Reset 2FA - disable it
  req.session.is2FAEnabled = false;
  req.session.user2FASecret = null;
  
  // Clear reset session data
  req.session.passwordResetCode = null;
  req.session.passwordResetEmail = null;
  req.session.passwordResetExpiry = null;
  req.session.passwordResetAttempts = null;
  
  res.json({ 
    success: true, 
    message: "2FA has been reset successfully. Please set up 2FA again on your next login."
  });
});

const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT}/dashboard.html to access the dashboard`);
});
