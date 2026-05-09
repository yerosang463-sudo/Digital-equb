const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { pool } = require('../config/db');

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000, // 10 seconds
  socketTimeout: 15000, // 15 seconds
});

/**
 * @route   POST /api/contact
 * @desc    Submit a contact inquiry
 * @access  Public
 */
router.post('/', async (req, res, next) => {
  const { name, email, message } = req.body;

  // Basic validation
  if (!email || !message) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide both an email and a message.' 
    });
  }

  try {
    // 1. Store in Database
    const [result] = await pool.execute(
      'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
      [name || 'Anonymous', email, message]
    );

    // 2. Send Email via Gmail SMTP
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact Inquiry from ${name || 'Anonymous'}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #1E3A8A;">New Contact Message</h2>
          <p><strong>Name:</strong> ${name || 'Anonymous'}</p>
          <p><strong>Email:</strong> ${email}</p>
          <hr />
          <p><strong>Message:</strong></p>
          <p style="background: #f9f9f9; padding: 15px; border-left: 4px solid #1E3A8A;">${message}</p>
        </div>
      `,
    };

    // Send Email via Gmail SMTP
    try {
      await transporter.sendMail(mailOptions);
      console.log('Contact email sent successfully to:', process.env.ADMIN_EMAIL);
    } catch (emailError) {
      console.error('Nodemailer Error:', emailError.message);
      console.error('Email configuration check:');
      console.error('EMAIL_USER:', process.env.EMAIL_USER);
      console.error('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
      
      // Still return success since message was stored in database
      res.status(201).json({
        success: true,
        message: 'Your message has been received! (Email delivery failed, but message stored)',
        id: result.insertId,
        warning: 'Email delivery failed. Please contact support directly.'
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Your message has been received! We will contact you soon.',
      id: result.insertId
    });
  } catch (error) {
    // Check if table exists (in case user hasn't run the migration yet)
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('Contact messages table missing. Falling back to success response (simulation).');
      return res.status(201).json({
        success: true,
        message: 'Inquiry received (storage simulated).',
        note: 'Contact messages table not found. Please run migration_v3.sql.'
      });
    }
    next(error);
  }
});

module.exports = router;
