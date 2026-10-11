"use strict";

const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
    {
        referenceNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            default: "",
            trim: true
        },

        email: {
            type: String,
            default: "",
            trim: true,
            lowercase: true
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        landmark: {
            type: String,
            default: "",
            trim: true
        },

        leakageType: {
            type: String,
            default: ""
        },

        priority: {
            type: String,
            default: "Medium"
        },

        // Complaint Tracking Status
        status: {
            type: String,
            enum: ["Pending", "In Progress", "Resolved"],
            default: "Pending"
        },

        duration: {
            type: String,
            default: ""
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        imageName: {
            type: String,
            default: ""
        },

        imageSize: {
            type: Number,
            default: 0
        },

        submittedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Complaint",
    complaintSchema
);