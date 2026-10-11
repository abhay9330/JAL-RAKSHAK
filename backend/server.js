"use strict";

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Complaint = require("./complaint");
const adminAuth = require("./adminAuth");

require("dotenv").config({
    path: __dirname + "/.env"
});

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:5501",
    "http://localhost:5501",
    "https://jal-rakshak-backend.vercel.app"
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests without an Origin header, such as health checks.
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "1mb" }));

// Home route
app.get("/", (req, res) => {
    res.send("Jal Rakshak Backend is Running!");
});

// API health check
app.get("/api", (req, res) => {
    res.json({
        success: true,
        message: "Jal Rakshak API is working!"
    });
});

// Monitor admin API requests
app.use("/api/admin", (req, res, next) => {
    console.log(
        "ADMIN REQUEST RECEIVED:",
        req.method,
        req.originalUrl
    );
    next();
});

// Admin authentication routes
app.use("/api/admin", adminAuth);

console.log("ADMIN ROUTER MOUNTED");

// Verify admin JWT
function verifyAdmin(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Admin login required."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required."
            });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired admin token. Please log in again."
        });
    }
}

// Submit complaint
app.post("/api/complaints", async (req, res) => {
    try {
        const {
            referenceNumber,
            name,
            phone,
            email,
            location,
            landmark,
            leakageType,
            priority,
            duration,
            description,
            imageName,
            imageSize,
            submittedAt
        } = req.body;

        if (!referenceNumber || !name || !location || !description) {
            return res.status(400).json({
                success: false,
                message: "Reference number, name, location and description are required."
            });
        }

        const complaint = await Complaint.create({
            referenceNumber,
            name,
            phone,
            email,
            location,
            landmark,
            leakageType,
            priority,
            duration,
            description,
            imageName,
            imageSize,
            submittedAt
        });

        console.log("Complaint saved:", complaint._id);

        return res.status(201).json({
            success: true,
            message: "Complaint saved successfully in MongoDB!",
            complaint
        });
    } catch (error) {
        console.error("Complaint Save Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This reference number already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Could not save complaint in the database."
        });
    }
});

// Get all complaints for admin dashboard
app.get("/api/complaints", async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .select(
                "referenceNumber location leakageType priority status submittedAt"
            )
            .sort({ submittedAt: -1 });

        return res.status(200).json({
            success: true,
            count: complaints.length,
            complaints
        });
    } catch (error) {
        console.error("Fetch Complaints Error:", error);

        return res.status(500).json({
            success: false,
            message: "Could not fetch complaints."
        });
    }
});

// Update complaint status (admin only)
app.patch(
    "/api/complaints/:referenceNumber/status",
    verifyAdmin,
    async (req, res) => {
        try {
            const referenceNumber = req.params.referenceNumber.trim();
            const { status } = req.body;

            const allowedStatuses = [
                "Pending",
                "In Progress",
                "Resolved"
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status. Use Pending, In Progress or Resolved."
                });
            }

            const complaint = await Complaint.findOneAndUpdate(
                { referenceNumber },
                { $set: { status } },
                {
                    new: true,
                    runValidators: true
                }
            ).select(
                "referenceNumber location leakageType priority status submittedAt"
            );

            if (!complaint) {
                return res.status(404).json({
                    success: false,
                    message: "Complaint not found."
                });
            }

            console.log(
                `Complaint ${referenceNumber} status updated to ${status}`
            );

            return res.status(200).json({
                success: true,
                message: "Complaint status updated successfully!",
                complaint
            });
        } catch (error) {
            console.error("Status Update Error:", error);

            return res.status(500).json({
                success: false,
                message: "Could not update complaint status."
            });
        }
    }
);

// Track complaint by reference number
app.get("/api/complaints/:referenceNumber", async (req, res) => {
    try {
        const referenceNumber = req.params.referenceNumber.trim();

        const complaint = await Complaint.findOne({
            referenceNumber
        }).select(
            "referenceNumber location leakageType priority status submittedAt"
        );

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found. Please check your reference number."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Complaint found successfully!",
            complaint
        });
    } catch (error) {
        console.error("Complaint Tracking Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to track complaint right now."
        });
    }
});

// Handle unknown routes
app.use((req, res) => {
    console.log("UNMATCHED ROUTE:", req.method, req.originalUrl);

    return res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

// General error handler
app.use((err, req, res, next) => {
    console.error("Server Error:", err.message);

    if (res.headersSent) {
        return next(err);
    }

    return res.status(500).json({
        success: false,
        message: "An internal server error occurred."
    });
});

// Connect MongoDB, then start server
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully!");

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Jal Rakshak server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB Connection Error:", error.message);
        process.exit(1);
    });
