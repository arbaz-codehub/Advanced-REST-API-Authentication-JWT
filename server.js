// Importing necessary modules
const express = require("express");
const cors = require("cors");
require("./db/dbConfig");

// Creating an express app
const app = express();

const corsOptions = {
  origin: "https://localhost:5174", // allowing this domain only for making requests
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowing these http emthods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed Headers
};

// Handling some middlewares
app.use(express.json()); // For parsing data sent from client side
app.use(cors(corsOptions)); // For handling CORS policy efficiently on both server and client side

// creating errorHandler for Error Handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || "Server Error",
  });
};

// Importing and Configuring Routes
const userRoutes = require("./routes/Users");
const authRoutes = require("./routes/Auth");
app.use("/api/", userRoutes, authRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Creating PORT
const PORT = process.env.PORT || 5300;
app.listen(PORT, () => console.log("Server is running at port ", PORT));
