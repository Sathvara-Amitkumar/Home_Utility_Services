const express = require("express");
const mysql = require('mysql2/promise');
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
require('dotenv').config();

const app = express();

// Session store configuration
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '@error_404...',
  database: process.env.DB_NAME || 'hus'
});

// Session middleware configuration
app.use(session({
  key: process.env.SESSION_KEY || '277e6b731141140aec51a1420097aa21c3d3830658edc4a7e9c5a678ff157a5e',
  secret: process.env.SESSION_SECRET || '04fe2fff57ed79fe654b24c84d1766f2c24aaa44c2e0d6eea4fd5017f9f5cfb294dcff6abc18c74ac33da7f02522c5789bb5961ccec8fb57782dbd7333af33ae',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
}));

app.use(cors({
  origin: 'http://localhost:5000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.static('public')); 

let db;

(async () => {
  try {
    db = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "@error_404...",
      database: "hus",
    });
    console.log("Connected to MySQL database.");
  }
  catch (err) {
    console.error("Database connection failed:", err);
  }
})();

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// SIGNUP
app.post("/signup", async (req, res) => {
  const { username, mobile, password, userType } = req.body;

  if (!username || !mobile || !password || !userType) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO users (username, mobile, password, userType) VALUES (?, ?, ?, ?)", [
      username,
      mobile,
      hashedPassword,
      userType,
    ]);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
});

app.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

    if (rows.length === 0) {
      return res.status(401).json({ status: "error", message: "User not found", needsRegistration: true });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: "error", message: "Invalid password" });
    }

    // Create session
    req.session.user = {
      id: user.id,
      username: user.username,
      userType: user.userType
    };

    res.status(200).json({
      status: "success",
      user: {
        id: user.id,
        username: user.username,
        email: user.username,
        userType: user.userType,
      },
    });
  } catch (err) {
    console.error("Signin Error:", err);
    res.status(500).json({ status: "error", message: "Server error during signin" });
  }
});

// Logout endpoint
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.clearCookie('session_cookie_name');
    res.status(200).json({ message: "Logged out successfully" });
  });
});

// Protected route example
app.get("/api/protected", requireAuth, (req, res) => {
  res.json({ message: "This is a protected route", user: req.session.user });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Admin Dashboard APIs
// ✅ Using async/await for Promise-based MySQL
app.get("/api/users", requireAuth, async (req, res) => {
  try {
    const [results] = await db.query("SELECT COUNT(*) as count FROM users WHERE userType = 'user'");
    res.json({ count: results[0].count });
  } catch (err) {
    console.error("Error fetching user count:", err);
    res.status(500).json({ error: "Failed to fetch user count" });
  }
});

app.get("/api/providers", requireAuth, async (req, res) => {
  try {
    const [results] = await db.query("SELECT COUNT(*) as count FROM users WHERE userType = 'ServiceProvider'");
    res.json({ count: results[0].count });
  } catch (err) {
    console.error("Error fetching provider count:", err);
    res.status(500).json({ error: "Failed to fetch provider count" });
  } 
});

// Get all users
app.get('/api/usersdata', requireAuth, async (req, res) => {
  try {
      const [rows] = await db.query('SELECT id, username, mobile, created_at FROM users');
      res.json(rows);
  } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching users');
  }
});

// Delete user by ID
app.delete('/api/users/:id', requireAuth, async (req, res) => {
  try {
      const userId = req.params.id;
      await db.query('DELETE FROM users WHERE id = ?', [userId]);
      res.sendStatus(200);
  } catch (err) {
      console.error(err);
      res.status(500).send('Error deleting user');
  }
});

app.get("/api/bookings/active", (req, res) => {
  const sql = "SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch active bookings" });
    }
    res.json({ count: results[0].count });
  });
});

app.get("/api/services", (req, res) => {
  const sql = "SELECT COUNT(*) as count FROM services";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch services count" });
    }
    res.json({ count: results[0].count });
  });
});

app.get("/api/bookings/recent", (req, res) => {
  const sql = `
    SELECT b.*, u.username as customerName, s.name as serviceName 
    FROM bookings b 
    JOIN users u ON b.user_id = u.id 
    JOIN services s ON b.service_id = s.id 
    ORDER BY b.created_at DESC 
    LIMIT 5
  `;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch recent bookings" });
    }
    res.json(results);
  });
});

app.delete("/api/bookings/:id", (req, res) => {
  const sql = "DELETE FROM bookings WHERE id = ?";
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Failed to delete booking" });
    }
    res.json({ message: "Booking deleted successfully" });
  });
});

// Create booking
app.post("/api/bookings", requireAuth, async (req, res) => {
  try {
    const { userId, service, name, email, phone, date, time, address, notes } = req.body;

    // Validate required fields
    if (!userId || !service || !name || !email || !phone || !date || !time || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Insert booking into database
    const [result] = await db.query(
      "INSERT INTO bookings (user_id, service, name, email, phone, booking_date, booking_time, address, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
      [userId, service, name, email, phone, date, time, address, notes]
    );

    res.status(201).json({ 
      message: "Booking created successfully",
      bookingId: result.insertId 
    });
  } catch (err) {
    console.error("Booking Error:", err);
    res.status(500).json({ message: "Server error during booking" });
  }
});
