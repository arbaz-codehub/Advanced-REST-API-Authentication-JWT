const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// JWT secret key should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      const error = new Error("Authentication required");
      error.statusCode = 401;
      throw error;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    error.statusCode = 401;
    next(error);
  }
};

// AsyncHandler for centralised error handling for removing multiple try-catch bolierplates
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Defining Routes for Users
// POST - Single User
router.post(
  "/users",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.create(req.body);
    res.status(201).json({
      success: true,
      data: user,
    });
  })
);

// POST - bulk users
router.post(
  "/users/bulk",
  authenticate,
  asyncHandler(async (req, res) => {
    const users = await User.insertMany(req.body);
    res.status(201).json({
      success: true,
      count: users.length,
      data: users,
    });
  })
);

// GET - All Users
router.get(
  "/users",
  authenticate,
  asyncHandler(async (req, res) => {
    const users = await User.find();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  })
);

// GET - Single User
router.get(
  "/users/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  })
);

// PUT - Update single
router.put(
  "/users/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  })
);

// PUT - Multiple Updates
router.put(
  "/users/bulk",
  authenticate,
  asyncHandler(async (req, res) => {
    const operations = req.body.map((update) => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: update.data },
      },
    }));
    const result = await User.bulkWrite(operations);
    res.status(200).json({
      success: true,
      modified: result.modifiedCount,
    });
  })
);

// DELETE - Single
router.delete(
  "/users/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.deleteById(req.params.id);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      success: true,
      data: {},
    });
  })
);

// DELETE - bulk
router.delete(
  "/users/bulk",
  authenticate,
  asyncHandler(async (req, res) => {
    const users = await User.deleteMany({
      _id: { $in: req.body.ids },
    });
    res.status(200).json({
      success: true,
      deleted: users.deletedCount,
    });
  })
);

// Search API
router.get(
  "/search/:key",
  authenticate,
  asyncHandler(async (req, res) => {
    const searchKey = req.params.key;
    const users = await User.find({
      $or: [
        { name: { $regex: searchKey, $options: "i" } },
        { email: { $regex: searchKey, $options: "i" } },
      ],
    });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  })
);

// Pagination API
router.get(
  "/users/page/:page",
  authenticate,
  asyncHandler(async (req, res) => {
    const page = req.params.page;
    const limit = req.query.limit;
    const startIndex = (page - 1) * limit;

    const users = await User.find().skip(startIndex).limit(limit);

    const total = users.countDocuments();

    res.status(200).json({
      success: true,
      count: users.count,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
      data: users,
    });
  })
);

module.exports = router;

/*
// React code examples for all endpoints:

// 1. Create Single User
const createUser = async (userData) => {
  try {
    const response = await fetch('http://localhost:5300/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if(data.success) {
      // Handle success - e.g. show notification
      console.log('User created:', data.data);
    }
  } catch (error) {
    console.error('Error creating user:', error);
  }
};

// 2. Create Bulk Users
const createBulkUsers = async (usersData) => {
  try {
    const response = await fetch('http://localhost:5300/api/users/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(usersData)
    });
    const data = await response.json();
    if(data.success) {
      console.log(`${data.count} users created`);
    }
  } catch (error) {
    console.error('Error creating bulk users:', error);
  }
};

// 3. Get All Users
const getAllUsers = async () => {
  try {
    const response = await fetch('http://localhost:5300/api/users', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    if(data.success) {
      console.log('All users:', data.data);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

// 4. Search Users
const searchUsers = async (searchKey) => {
  try {
    const response = await fetch(`http://localhost:5300/api/search/${searchKey}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    if(data.success) {
      // Update state with search results
      console.log(`Found ${data.count} users:`, data.data);
    }
  } catch (error) {
    console.error('Error searching users:', error);
  }
};

// 5. Paginated Users List
const getPaginatedUsers = async (page, limit = 10) => {
  try {
    const response = await fetch(
      `http://localhost:5300/api/users/page/${page}?limit=${limit}`, 
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    const data = await response.json();
    if(data.success) {
      // Update state with paginated data
      console.log('Current page:', data.pagination.current);
      console.log('Total pages:', data.pagination.pages);
      console.log('Users:', data.data);
    }
  } catch (error) {
    console.error('Error fetching paginated users:', error);
  }
};

// Example usage in React components:

// Create User Button Click Handler
const handleCreateUser = () => {
  const newUser = {
    name: 'John Doe',
    email: 'john@example.com',
    // other user data
  };
  createUser(newUser);
};

// Create Bulk Users Handler
const handleBulkCreate = () => {
  const users = [
    { name: 'John Doe', email: 'john@example.com' },
    { name: 'Jane Doe', email: 'jane@example.com' }
  ];
  createBulkUsers(users);
};

// Get All Users Handler
const handleGetAllUsers = () => {
  getAllUsers();
};

// Search Input Change Handler
const handleSearch = (event) => {
  searchUsers(event.target.value);
};

// Pagination Click Handler
const handlePageChange = (newPage) => {
  getPaginatedUsers(newPage);
};
*/
