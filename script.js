"use strict";

const API_URL = "https://jal-rakshak-api.onrender.com/api/complaints";

document.addEventListener("DOMContentLoaded", () => {
    const complaintForm = document.getElementById("complaint-form");
    const trackingForm = document.getElementById("track-form");

    const formMessage = document.getElementById("form-message");
    const trackingResult = document.getElementById("tracking-result");

    const submitButton = document.getElementById("submit-button");
    const trackButton = document.getElementById("track-button");

    const imageInput = document.getElementById("image");
    const fileName = document.getElementById("file-name");
    const imagePreview = document.getElementById("image-preview");
    const removeImageButton = document.getElementById("remove-image");

    function showMessage(element, message, type = "info") {
        if (!element) return;

        element.textContent = message;
        element.className = `form-message ${type}`;
        element.style.display = "block";
    }

    async function apiRequest(url, options = {}) {
        const response = await fetch(url, options);

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error("Server returned an invalid response.");
        }

        if (!response.ok) {
            throw new Error(data.message || `Server error: ${response.status}`);
        }

        return data;
    }

    // Photo preview and validation
    let imagePreviewUrl = null;

    if (imageInput) {
        imageInput.addEventListener("change", () => {
            const file = imageInput.files[0];

            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
                imagePreviewUrl = null;
            }

            if (!file) {
                if (fileName) fileName.textContent = "";
                if (imagePreview) imagePreview.hidden = true;
                if (removeImageButton) removeImageButton.hidden = true;
                return;
            }

            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];

            if (!allowedTypes.includes(file.type)) {
                showMessage(
                    formMessage,
                    "Please select a JPG, PNG or WebP image.",
                    "error"
                );
                imageInput.value = "";
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                showMessage(
                    formMessage,
                    "Photo size must be 5 MB or less.",
                    "error"
                );
                imageInput.value = "";
                return;
            }

            if (fileName) {
                fileName.textContent = `Selected: ${file.name}`;
            }

            if (imagePreview) {
                imagePreviewUrl = URL.createObjectURL(file);
                imagePreview.src = imagePreviewUrl;
                imagePreview.hidden = false;
            }

            if (removeImageButton) {
                removeImageButton.hidden = false;
            }
        });
    }

    if (removeImageButton) {
        removeImageButton.addEventListener("click", () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
                imagePreviewUrl = null;
            }

            if (imageInput) imageInput.value = "";
            if (fileName) fileName.textContent = "";

            if (imagePreview) {
                imagePreview.removeAttribute("src");
                imagePreview.hidden = true;
            }

            removeImageButton.hidden = true;
        });
    }

    // Submit complaint
    if (complaintForm) {
        complaintForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (!complaintForm.checkValidity()) {
                complaintForm.reportValidity();
                return;
            }

            const formData = new FormData(complaintForm);
            const photo = imageInput?.files?.[0];

            const complaint = {
                referenceNumber: "JR" + Date.now(),
                name: String(formData.get("name") || "").trim(),
                phone: String(formData.get("phone") || "").trim(),
                email: String(formData.get("email") || "").trim(),
                location: String(formData.get("location") || "").trim(),
                landmark: String(formData.get("landmark") || "").trim(),
                leakageType: String(formData.get("leak-type") || ""),
                priority: String(formData.get("priority") || "medium"),
                duration: String(formData.get("duration") || ""),
                description: String(formData.get("description") || "").trim(),
                imageName: photo ? photo.name : "",
                imageSize: photo ? photo.size : 0,
                submittedAt: new Date().toISOString()
            };

            try {
                if (submitButton) submitButton.disabled = true;

                showMessage(
                    formMessage,
                    "Submitting your complaint...",
                    "info"
                );

                const data = await apiRequest(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(complaint)
                });

                if (!data.success) {
                    throw new Error(data.message || "Complaint submission failed.");
                }

                showMessage(
                    formMessage,
                    `Complaint submitted successfully! Your reference number is ${complaint.referenceNumber}. Please save it to track your complaint.`,
                    "success"
                );

                complaintForm.reset();

                if (fileName) fileName.textContent = "";

                if (imagePreviewUrl) {
                    URL.revokeObjectURL(imagePreviewUrl);
                    imagePreviewUrl = null;
                }

                if (imagePreview) {
                    imagePreview.removeAttribute("src");
                    imagePreview.hidden = true;
                }

                if (removeImageButton) {
                    removeImageButton.hidden = true;
                }

                const trackingReference =
                    document.getElementById("tracking-reference");

                if (trackingReference) {
                    trackingReference.value = complaint.referenceNumber;
                }

            } catch (error) {
                console.error("Complaint submission error:", error);

                showMessage(
                    formMessage,
                    error instanceof TypeError
                        ? "Could not connect to the server. Please check backend and CORS settings."
                        : error.message,
                    "error"
                );
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        });
    }

    // Track complaint
    if (trackingForm) {
        trackingForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const referenceInput =
                document.getElementById("tracking-reference");

            const referenceNumber = referenceInput?.value.trim();

            if (!referenceNumber) {
                showMessage(
                    trackingResult,
                    "Please enter your complaint reference number.",
                    "error"
                );
                return;
            }

            try {
                if (trackButton) trackButton.disabled = true;

                showMessage(
                    trackingResult,
                    "Searching for your complaint...",
                    "info"
                );

                const data = await apiRequest(
                    `${API_URL}/${encodeURIComponent(referenceNumber)}`
                );

                if (!data.success || !data.complaint) {
                    throw new Error(data.message || "Complaint not found.");
                }

                const complaint = data.complaint;

                showMessage(
                    trackingResult,
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

                showMessage(
                    trackingResult,
                    error instanceof TypeError
                        ? "Could not connect to the server. Please check backend and CORS settings."
                        : error.message,
                    "error"
                );
            } finally {
                if (trackButton) trackButton.disabled = false;
            }
        });
    }

    // Mobile navigation menu
    const menuToggle = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("active");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
        });

        navLinks.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("active");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    // Current year in footer
    const yearElement = document.getElementById("current-year");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});
