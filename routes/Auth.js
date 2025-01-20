const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); // Import JWT for token generation

// JWT secret key should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// AsyncHandler for centralised error handling for removing multiple try-catch bolierplates
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Route: Admin Registration
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    // Creating Admin
    const admin = await Admin.create({
      ...req.body,
      password: hashedPassword,
    });

    // Generate JWT token with admin id
    const token = jwt.sign(
      { id: admin._id },
      JWT_SECRET,
      { expiresIn: "24h" } // Token expires in 24 hours
    );

    // Removing password from the Response Object
    const { password, ...responseAdmin } = admin.toObject();

    // Return admin data with JWT token
    res.status(201).json({
      success: true,
      data: responseAdmin,
      token: token,
    });
  })
);

// Login Api
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required",
      });
    }

    // Find admin by Email
    const admin = await Admin.findOne({ email });

    // Check if admin exists
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    // Compare provided password with hashed password in db
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    // Generate JWT token upon successful login
    const token = jwt.sign(
      { id: admin._id },
      JWT_SECRET,
      { expiresIn: "24h" } // Token expires in 24 hours
    );

    // If successful login, respond with admin data (without password) and token
    const adminData = admin.toObject();
    delete adminData.password;
    res.status(200).json({
      success: true,
      message: "Login Successful",
      data: adminData,
      token: token,
    });
  })
);

module.exports = router;

// The code looks correct and ready for frontend integration. The Auth routes provide:

// 1. Registration endpoint (/register):
//    - Accepts admin details including password
//    - Hashes password securely
//    - Creates admin in database
//    - Returns admin data with JWT token

// 2. Login endpoint (/login):
//    - Validates email/password
//    - Checks credentials against database
//    - Returns admin data with JWT token on success

// Frontend can now:
// - Make POST requests to /api/register and /api/login
// - Store returned JWT token for authenticated requests
// - Use token in Authorization header for protected routes
// - Handle success/error responses appropriately

// Example frontend usage:
/*
fetch('/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'password123'
  })
})
.then(res => res.json())
.then(data => {
  if(data.success) {
    localStorage.setItem('token', data.token);
    // Redirect to dashboard etc
  }
});
*/

/*
// React code examples for Auth endpoints:

// Admin data interface example:
// adminData = {
//   name: string,          // Full name of admin
//   email: string,         // Email address
//   password: string,      // Password (will be hashed on server)
//   role: string,          // Optional role (e.g. 'admin', 'super-admin')
//   department: string,    // Optional department
//   phoneNumber: string,   // Optional contact number
//   isActive: boolean      // Account status
// }

// Login credentials interface:
// credentials = {
//   email: string,     // Registered email
//   password: string   // Account password
// }

// 1. Register Admin
const registerAdmin = async (adminData) => {
  try {
    const response = await fetch('http://localhost:5300/api/register', {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(adminData)
    });
    const data = await response.json();
    if(data.success) {
      // Store token
      localStorage.setItem('token', data.token);
      // Store admin data or update state
      console.log('Registration successful:', data.data);
      // Redirect to dashboard etc
    }
  } catch (error) {
    console.error('Registration failed:', error);
  }
};

// 2. Login Admin
const loginAdmin = async (credentials) => {
  try {
    const response = await fetch('http://localhost:5300/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if(data.success) {
      // Store token
      localStorage.setItem('token', data.token);
      // Store admin data or update state
      console.log('Login successful:', data.data);
      // Redirect to dashboard etc
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Example usage in React components:

// Register Form Submit Handler
const handleRegister = (event) => {
  event.preventDefault();
  const adminData = {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'securepassword123',
    role: 'admin',
    department: 'IT',
    phoneNumber: '+1234567890',
    isActive: true
  };
  registerAdmin(adminData);
};

// Login Form Submit Handler  
const handleLogin = (event) => {
  event.preventDefault();
  const credentials = {
    email: 'admin@example.com',
    password: 'securepassword123'
  };
  loginAdmin(credentials);
};
*/
