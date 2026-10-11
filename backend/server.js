"use strict";

const API_URL = "https://jal-rakshak-api.onrender.com/api/complaints";

// Generate a unique complaint reference number
function generateReferenceNumber() {
    return "JR" + Date.now().toString().slice(-10);
}

// Show message on the page
function showMessage(message, type = "info") {
    const messageBox =
        document.getElementById("messageBox") ||
        document.getElementById("responseMessage");

    if (messageBox) {
        messageBox.textContent = message;
        messageBox.className = type;
        messageBox.style.display = "block";
    } else {
        alert(message);
    }
}

// Safely read API responses
async function readResponse(response) {
    const text = await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        data = { message: text || "Invalid server response." };
    }

    if (!response.ok) {
        throw new Error(
            data.message || `Request failed (${response.status})`
        );
    }

    return data;
}

// Submit a complaint
async function submitComplaint(event) {
    if (event) event.preventDefault();

    const form = document.getElementById("complaintForm");

    if (!form) {
        showMessage("Complaint form was not found.", "error");
        return;
    }

    const getValue = (name) => {
        const field = form.elements.namedItem(name);
        return field ? field.value.trim() : "";
    };

    const name = getValue("name");
    const phone = getValue("phone");
    const email = getValue("email");
    const location = getValue("location");
    const landmark = getValue("landmark");
    const leakageType = getValue("leakageType");
    const priority = getValue("priority") || "Medium";
    const duration = getValue("duration");
    const description = getValue("description");

    if (!name || !location || !description) {
        showMessage(
            "Please fill in your name, location and description.",
            "error"
        );
        return;
    }

    const imageInput = form.querySelector('input[type="file"]');
    const image = imageInput?.files?.[0];

    const complaint = {
        referenceNumber: generateReferenceNumber(),
        name,
        phone,
        email,
        location,
        landmark,
        leakageType,
        priority,
        duration,
        description,
        imageName: image ? image.name : "",
        imageSize: image ? image.size : 0,
        submittedAt: new Date().toISOString()
    };

    const submitButton = form.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

    try {
        showMessage("Submitting your complaint...", "info");

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(complaint)
        });

        const data = await readResponse(response);

        if (!data.success) {
            throw new Error(
                data.message || "Complaint submission failed."
            );
        }

        showMessage(
            `Complaint submitted successfully!\nReference Number: ${complaint.referenceNumber}`,
            "success"
        );

        const referenceField =
            document.getElementById("referenceNumber") ||
            document.getElementById("trackingNumber");

        if (referenceField) {
            referenceField.value = complaint.referenceNumber;
        }

        form.reset();

    } catch (error) {
        console.error("Complaint submission error:", error);

        if (error instanceof TypeError) {
            showMessage(
                "Could not connect to the server. Please check the backend and CORS settings.",
                "error"
            );
        } else {
            showMessage(
                error.message || "Unable to submit your complaint.",
                "error"
            );
        }
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

// Track a complaint using its reference number
async function trackComplaint(event) {
    if (event) event.preventDefault();

    const referenceField =
        document.getElementById("referenceNumber") ||
        document.getElementById("trackingNumber");

    const referenceNumber = referenceField
        ? referenceField.value.trim()
        : "";

    if (!referenceNumber) {
        showMessage("Please enter your complaint reference number.", "error");
        return;
    }

    try {
        showMessage("Searching for your complaint...", "info");

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(referenceNumber)}`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json"
                }
            }
        );

        const data = await readResponse(response);

        if (!data.success || !data.complaint) {
            throw new Error(data.message || "Complaint not found.");
        }

        const complaint = data.complaint;

        showMessage(
            `Complaint Found!\n` +
            `Reference Number: ${complaint.referenceNumber}\n` +
            `Location: ${complaint.location}\n` +
            `Type: ${complaint.leakageType || "Not specified"}\n` +
            `Priority: ${complaint.priority || "Not specified"}\n` +
            `Status: ${complaint.status || "Pending"}\n` +
            `Submitted: ${complaint.submittedAt || "Not available"}`,
            "success"
        );

    } catch (error) {
        console.error("Complaint tracking error:", error);

        if (error instanceof TypeError) {
            showMessage(
                "Could not connect to the server. Please check the backend and CORS settings.",
                "error"
            );
        } else {
            showMessage(error.message, "error");
        }
    }
}

// Connect event listeners after the page loads
document.addEventListener("DOMContentLoaded", function () {
    const complaintForm = document.getElementById("complaintForm");

    if (complaintForm) {
        complaintForm.addEventListener("submit", submitComplaint);
    }

    const trackingForm =
        document.getElementById("trackingForm");

    if (trackingForm) {
        trackingForm.addEventListener("submit", trackComplaint);
    }

    const trackButton =
        document.getElementById("trackComplaintButton") ||
        document.getElementById("trackButton");

    if (trackButton && !trackingForm) {
        trackButton.addEventListener("click", trackComplaint);
    }
});
