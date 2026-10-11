"use strict";

/* =========================================
   JAL RAKSHAK - FRONTEND JAVASCRIPT
========================================= */

// Backend API URL
const API_URL = "http://localhost:3000/api/complaints";

// Get HTML elements
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

const complaintForm = document.getElementById("complaint-form");

const imageInput = document.getElementById("image");
const imagePreview = document.getElementById("image-preview");
const fileName = document.getElementById("file-name");

const removeImageButton = document.getElementById("remove-image");
const uploadBox = document.getElementById("upload-box");

const formMessage = document.getElementById("form-message");
const submitButton = document.getElementById("submit-button");

const currentYear = document.getElementById("current-year");

// Track Complaint elements
const trackForm = document.getElementById("track-form");
const trackingReference = document.getElementById("tracking-reference");
const trackingResult = document.getElementById("tracking-result");
const trackButton = document.getElementById("track-button");


/* =========================================
   1. FOOTER YEAR
========================================= */

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}


/* =========================================
   2. MOBILE NAVIGATION
========================================= */

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function () {
        const isOpen = navLinks.classList.toggle("active");

        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            navLinks.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");
        });
    });
}


/* =========================================
   3. COMPLAINT FORM MESSAGES
========================================= */

function showMessage(message, type) {
    if (!formMessage) return;

    formMessage.textContent = message;
    formMessage.className = "form-message " + type;
}

function clearMessage() {
    if (!formMessage) return;

    formMessage.textContent = "";
    formMessage.className = "form-message";
}


/* =========================================
   4. IMAGE PREVIEW
========================================= */

let selectedImageURL = null;

function clearImagePreview() {
    if (selectedImageURL) {
        URL.revokeObjectURL(selectedImageURL);
        selectedImageURL = null;
    }

    if (imagePreview) {
        imagePreview.removeAttribute("src");
        imagePreview.hidden = true;
    }

    if (fileName) {
        fileName.textContent = "";
    }

    if (removeImageButton) {
        removeImageButton.hidden = true;
    }
}

function handleImageSelection(file) {
    if (!file) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        clearImagePreview();

        if (imageInput) imageInput.value = "";

        showMessage(
            "Please select a JPG, PNG, or WebP image.",
            "error"
        );

        return;
    }

    const maximumSize = 5 * 1024 * 1024;

    if (file.size > maximumSize) {
        clearImagePreview();

        if (imageInput) imageInput.value = "";

        showMessage(
            "The selected photo is larger than 5 MB. Please choose a smaller image.",
            "error"
        );

        return;
    }

    clearImagePreview();

    if (!imagePreview) {
        showMessage("Image preview element not found.", "error");
        return;
    }

    selectedImageURL = URL.createObjectURL(file);

    imagePreview.src = selectedImageURL;
    imagePreview.hidden = false;

    if (fileName) {
        fileName.textContent = "Selected photo: " + file.name;
    }

    if (removeImageButton) {
        removeImageButton.hidden = false;
    }

    clearMessage();
}

if (imageInput) {
    imageInput.addEventListener("change", function () {
        const file = imageInput.files
            ? imageInput.files[0]
            : null;

        handleImageSelection(file);
    });
}


/* =========================================
   5. REMOVE PHOTO
========================================= */

if (removeImageButton && imageInput) {
    removeImageButton.addEventListener("click", function () {
        imageInput.value = "";

        clearImagePreview();
        clearMessage();
    });
}


/* =========================================
   6. DRAG AND DROP PHOTO
========================================= */

if (uploadBox && imageInput) {
    uploadBox.addEventListener("dragover", function (event) {
        event.preventDefault();
        uploadBox.classList.add("drag-over");
    });

    uploadBox.addEventListener("dragleave", function (event) {
        if (!uploadBox.contains(event.relatedTarget)) {
            uploadBox.classList.remove("drag-over");
        }
    });

    uploadBox.addEventListener("drop", function (event) {
        event.preventDefault();

        uploadBox.classList.remove("drag-over");

        const files = event.dataTransfer
            ? event.dataTransfer.files
            : null;

        if (!files || files.length === 0) return;

        const file = files[0];

        try {
            const transfer = new DataTransfer();

            transfer.items.add(file);
            imageInput.files = transfer.files;
        } catch (error) {
            console.warn(
                "Could not assign dropped file to input.",
                error
            );
        }

        handleImageSelection(file);
    });
}


/* =========================================
   7. GENERATE REFERENCE NUMBER
========================================= */

function generateReferenceNumber() {
    const randomPart = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    const timePart = Date.now().toString().slice(-6);

    return "JR-" + timePart + "-" + randomPart;
}


/* =========================================
   8. SUBMIT COMPLAINT TO BACKEND
========================================= */

if (complaintForm) {
    complaintForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        clearMessage();

        if (!imageInput || !submitButton) {
            showMessage(
                "A required form element is missing. Please check the HTML IDs.",
                "error"
            );

            return;
        }

        if (!complaintForm.checkValidity()) {
            complaintForm.reportValidity();

            showMessage(
                "Please complete all required fields correctly.",
                "error"
            );

            return;
        }

        const selectedFile = imageInput.files
            ? imageInput.files[0]
            : null;

        if (!selectedFile) {
            showMessage(
                "Please upload a photograph of the water leakage.",
                "error"
            );

            imageInput.focus();
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(selectedFile.type)) {
            showMessage(
                "Please upload a JPG, PNG, or WebP image.",
                "error"
            );

            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            showMessage(
                "The photo must be smaller than 5 MB.",
                "error"
            );

            return;
        }

        // Only the photo name and size are sent.
        // The actual image file is not uploaded yet.

        const complaintData = {
            referenceNumber: generateReferenceNumber(),

            name:
                document.getElementById("name")?.value.trim() || "",

            phone:
                document.getElementById("phone")?.value.trim() || "",

            email:
                document.getElementById("email")?.value.trim() || "",

            location:
                document.getElementById("location")?.value.trim() || "",

            landmark:
                document.getElementById("landmark")?.value.trim() || "",

            leakageType:
                document.getElementById("leak-type")?.value || "",

            priority:
                document.getElementById("priority")?.value || "",

            duration:
                document.getElementById("duration")?.value || "",

            description:
                document.getElementById("description")?.value.trim() || "",

            imageName: selectedFile.name,
            imageSize: selectedFile.size,
            submittedAt: new Date().toISOString()
        };

        submitButton.disabled = true;

        const originalButtonText = submitButton.textContent;

        submitButton.textContent = "Submitting...";

        showMessage(
            "Sending your complaint to Jal Rakshak...",
            "info"
        );

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(complaintData)
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "The server could not accept the complaint."
                );
            }

            const savedReference =
                result.complaint?.referenceNumber ||
                complaintData.referenceNumber;

            showMessage(
                "Complaint submitted and saved successfully! " +
                "Your reference number is " +
                savedReference +
                ". Keep this number to track your complaint.",
                "success"
            );

            console.log(
                "Jal Rakshak backend response:",
                result
            );

            // Put the reference number into the tracking form.
            if (trackingReference) {
                trackingReference.value = savedReference;
            }

            if (formMessage) {
                formMessage.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }

        } catch (error) {
            console.error(
                "Complaint submission failed:",
                error
            );

            showMessage(
                error.message ||
                "Could not connect to the backend. Make sure the server is running at localhost:3000 and try again.",
                "error"
            );

        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}


/* =========================================
   9. CLEAR COMPLAINT ERRORS WHILE TYPING
========================================= */

if (complaintForm) {
    complaintForm.addEventListener("input", function () {
        if (
            formMessage &&
            formMessage.classList.contains("error")
        ) {
            clearMessage();
        }
    });
}


/* =========================================
   10. TRACK COMPLAINT
========================================= */

function showTrackingMessage(message, type) {
    if (!trackingResult) return;

    trackingResult.replaceChildren();

    const messageElement = document.createElement("p");
    messageElement.className = type;
    messageElement.textContent = message;

    trackingResult.appendChild(messageElement);
}

function formatTrackingDate(dateValue) {
    if (!dateValue) return "Not available";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function displayComplaintDetails(complaint) {
    if (!trackingResult) return;

    trackingResult.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "Complaint Details";

    const details = [
        ["Reference Number", complaint.referenceNumber],
        ["Location", complaint.location],
        ["Leakage Type", complaint.leakageType],
        ["Priority", complaint.priority],
        ["Status", complaint.status],
        ["Submitted On", formatTrackingDate(complaint.submittedAt)]
    ];

    const list = document.createElement("dl");
    list.className = "tracking-details";

    details.forEach(function ([label, value]) {
        const term = document.createElement("dt");
        term.textContent = label;

        const description = document.createElement("dd");
        description.textContent =
            value !== undefined && value !== null && value !== ""
                ? String(value)
                : "Not available";

        if (label === "Status") {
            description.classList.add("tracking-status");

            const normalizedStatus = String(value || "").toLowerCase();

            if (normalizedStatus === "resolved") {
                description.classList.add("status-resolved");
            } else if (normalizedStatus === "in progress") {
                description.classList.add("status-in-progress");
            } else {
                description.classList.add("status-pending");
            }
        }

        list.appendChild(term);
        list.appendChild(description);
    });

    const note = document.createElement("p");
    note.textContent =
        "This is the latest status saved in the Jal Rakshak database.";

    trackingResult.appendChild(heading);
    trackingResult.appendChild(list);
    trackingResult.appendChild(note);
}

if (trackForm && trackingReference && trackButton && trackingResult) {
    trackForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const referenceNumber = trackingReference.value.trim();

        trackingResult.replaceChildren();

        if (!referenceNumber) {
            showTrackingMessage(
                "Please enter your complaint reference number.",
                "error"
            );

            trackingReference.focus();
            return;
        }

        const originalButtonText = trackButton.textContent;

        trackButton.disabled = true;
        trackButton.textContent = "Searching...";

        showTrackingMessage(
            "Searching for your complaint...",
            "info"
        );

        try {
            const response = await fetch(
                API_URL + "/" + encodeURIComponent(referenceNumber)
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Complaint could not be found."
                );
            }

            if (!result.complaint) {
                throw new Error(
                    "The server did not return complaint details."
                );
            }

            displayComplaintDetails(result.complaint);

        } catch (error) {
            console.error(
                "Complaint tracking failed:",
                error
            );

            showTrackingMessage(
                error.message ||
                "Could not connect to the server. Please make sure the backend is running and try again.",
                "error"
            );

        } finally {
            trackButton.disabled = false;
            trackButton.textContent = originalButtonText;
        }
    });

    trackingReference.addEventListener("input", function () {
        trackingResult.replaceChildren();
    });
}


/* =========================================
   11. SMOOTH NAVIGATION
========================================= */

document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
        const targetID = link.getAttribute("href");

        if (!targetID || targetID === "#") return;

        const targetElement = document.querySelector(targetID);

        if (!targetElement) return;

        event.preventDefault();

        targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        if (history.replaceState) {
            history.replaceState(null, "", targetID);
        }
    });
});


/* =========================================
   12. INITIALIZATION
========================================= */

console.log(
    "%cJal Rakshak JavaScript Loaded Successfully!",
    "color: #0877d9; font-size: 16px; font-weight: bold;"
);