"use strict";

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();
router.use((req, res, next) => {
    console.log("ADMIN AUTH RECEIVED:", req.method, req.originalUrl);
    next();
});

// Admin Login API
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check required fields
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required."
            });
        }

        // Read credentials from .env
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const jwtSecret = process.env.JWT_SECRET;

        if (!adminUsername || !adminPassword || !jwtSecret) {
            return res.status(500).json({
                success: false,
                message: "Admin authentication is not configured."
            });
        }

        // Verify username
        if (username !== adminUsername) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        // Verify password
        let passwordMatches = false;

        if (
            adminPassword.startsWith("$2a$") ||
            adminPassword.startsWith("$2b$") ||
            adminPassword.startsWith("$2y$")
        ) {
            passwordMatches = await bcrypt.compare(
                password,
                adminPassword
            );
        } else {
            passwordMatches = password === adminPassword;
        }

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        // Generate authentication token
        const token = jwt.sign(
            {
                username: adminUsername,
                role: "admin"
            },
            jwtSecret,
            {
                expiresIn: "1h"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Admin login successful!",
            token
        });

    } catch (error) {
        console.error("Admin Login Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to log in right now."
        });
    }
});

module.exports = router;