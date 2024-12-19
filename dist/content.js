/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!*********************************!*\
  !*** ./src/content/content.tsx ***!
  \*********************************/
__webpack_require__.r(__webpack_exports__);
// Constants for form detection
const FORM_SELECTORS = {
    PASSWORD_INPUTS: [
        'input[type="password"]',
        'input[name*="pass" i]',
        'input[id*="pass" i]',
        'input[class*="pass" i]',
        'input[aria-label*="password" i]',
    ],
    USERNAME_INPUTS: [
        'input[type="text"]',
        'input[type="email"]',
        'input[name*="user" i]',
        'input[name*="email" i]',
        'input[id*="user" i]',
        'input[id*="email" i]',
        'input[class*="user" i]',
        'input[class*="email" i]',
        'input[aria-label*="username" i]',
        'input[aria-label*="email" i]',
    ],
    SUBMIT_BUTTONS: [
        'button[type="submit"]',
        'input[type="submit"]',
        'button[name*="login" i]',
        'button[id*="login" i]',
        'button[class*="login" i]',
        'a[href*="login" i]',
    ],
};
class CredentialDetector {
    constructor() {
        this.observedForms = new Set();
        this.lastDetectedCredentials = null;
        this.typingTimer = null;
        this.TYPING_TIMEOUT = 5000; // 5 seconds
        this.isAutoFilling = false;
        // Initialize mutation observer to detect dynamically added forms
        this.mutationObserver = new MutationObserver(this.handleDOMChanges.bind(this));
        this.setupMutationObserver();
        this.createFloatingButton();
    }
    // Sets up the mutation observer to watch for changes in the DOM
    setupMutationObserver() {
        this.mutationObserver.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    }
    // Finds the username field in the form relative to the password field
    findUsernameField(form, passwordField) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        // First try to find username/email input before the password field
        const allInputs = Array.from(form.getElementsByTagName("input"));
        const passwordIndex = allInputs.indexOf(passwordField);
        // Look for inputs before the password field first
        const previousInputs = allInputs.slice(0, passwordIndex);
        for (const input of previousInputs.reverse()) {
            if (input.type === "text" ||
                input.type === "email" ||
                ((_a = input.name) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes("user")) ||
                ((_b = input.name) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes("email")) ||
                ((_c = input.id) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes("user")) ||
                ((_d = input.id) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes("email"))) {
                return input;
            }
        }
        // If no username field found before password, check after
        const nextInputs = allInputs.slice(passwordIndex + 1);
        for (const input of nextInputs) {
            if (input.type === "text" ||
                input.type === "email" ||
                ((_e = input.name) === null || _e === void 0 ? void 0 : _e.toLowerCase().includes("user")) ||
                ((_f = input.name) === null || _f === void 0 ? void 0 : _f.toLowerCase().includes("email")) ||
                ((_g = input.id) === null || _g === void 0 ? void 0 : _g.toLowerCase().includes("user")) ||
                ((_h = input.id) === null || _h === void 0 ? void 0 : _h.toLowerCase().includes("email"))) {
                return input;
            }
        }
        // Fallback to the original selector method
        return (form.querySelector(FORM_SELECTORS.USERNAME_INPUTS.join(",")) || undefined);
    }
    // Extracts credentials from the form elements
    extractCredentials(formElements) {
        var _a, _b;
        const credentials = {
            website: window.location.origin,
            user: ((_a = formElements.usernameField) === null || _a === void 0 ? void 0 : _a.value) || "",
            password: ((_b = formElements.passwordField) === null || _b === void 0 ? void 0 : _b.value) || "",
            formData: {
                url: window.location.href,
                title: document.title,
                timestamp: new Date().toISOString(),
            },
        };
        return credentials;
    }
    // Notifies about detected credentials and sends a message to the background script
    async notifyCredentialDetection(credentials) {
        if (this.isDuplicateCredential(credentials)) {
            return;
        }
        this.lastDetectedCredentials = Object.assign(Object.assign({}, credentials), { timestamp: Date.now() });
        try {
            if (chrome.runtime && chrome.runtime.id) {
                await chrome.runtime.sendMessage({
                    type: "PASSWORD_DETECTED",
                    data: credentials,
                });
            }
            else {
                throw new Error("Extension needs to be reloaded to function properly");
            }
        }
        catch (error) {
            if (error === "Extension context invalidated.") {
                throw new Error("Please refresh the page to continue using MePassword");
            }
            else {
                throw new Error("Unable to save credentials. Please try again later");
            }
        }
    }
    // Handles changes in the DOM and processes new elements
    async handleDOMChanges(mutations) {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                const addedNodes = Array.from(mutation.addedNodes);
                for (const node of addedNodes) {
                    if (node instanceof HTMLElement) {
                        await this.processNewElement(node);
                    }
                }
            }
        }
    }
    // Processes a new element added to the DOM
    async processNewElement(element) {
        const forms = element.tagName === "FORM"
            ? [element]
            : Array.from(element.getElementsByTagName("form"));
        for (const form of forms) {
            await this.attachFormListeners(form);
        }
        const passwordFields = Array.from(element.querySelectorAll(FORM_SELECTORS.PASSWORD_INPUTS.join(",")));
        for (const field of passwordFields) {
            if (!field.form) {
                this.createVirtualForm(field);
            }
        }
    }
    // Creates a virtual form for a password field if it doesn't belong to a form
    createVirtualForm(passwordField) {
        var _a;
        const virtualForm = document.createElement("form");
        virtualForm.setAttribute("data-virtual-form", "true");
        (_a = passwordField.parentElement) === null || _a === void 0 ? void 0 : _a.insertBefore(virtualForm, passwordField);
        virtualForm.appendChild(passwordField.cloneNode(true));
        passwordField.remove();
        this.attachFormListeners(virtualForm);
    }
    // Finds form elements including password and username fields
    findFormElements(form) {
        const passwordField = form.querySelector(FORM_SELECTORS.PASSWORD_INPUTS.join(","));
        if (!passwordField) {
            throw new Error("No password field found in form");
        }
        const usernameField = this.findUsernameField(form, passwordField);
        const submitButton = form.querySelector(FORM_SELECTORS.SUBMIT_BUTTONS.join(","));
        return {
            form,
            usernameField,
            passwordField,
            submitButton: submitButton,
        };
    }
    // Calculates the distance between an element and the password field
    getDistanceToPassword(element, passwordField) {
        const rect1 = element.getBoundingClientRect();
        const rect2 = passwordField.getBoundingClientRect();
        return Math.abs(rect1.top - rect2.top);
    }
    // Attaches event listeners to the form for submission and input changes
    attachFormListeners(form) {
        if (this.observedForms.has(form)) {
            return;
        }
        try {
            const formElements = this.findFormElements(form);
            this.observedForms.add(form);
            // Handle input changes with timer
            const handleInput = () => {
                // Clear any existing timer
                if (this.typingTimer) {
                    clearTimeout(this.typingTimer);
                }
                // Show/hide save button based on password content
                if (formElements.passwordField.value) {
                    this.floatingButton.style.display = 'block';
                }
                else {
                    this.floatingButton.style.display = 'none';
                }
                // Set new timer
                this.typingTimer = setTimeout(() => {
                    // Only proceed if we have a password
                    if (formElements.passwordField.value) {
                        const credentials = this.extractCredentials(formElements);
                        if (credentials) {
                            this.notifyCredentialDetection(credentials);
                        }
                    }
                }, this.TYPING_TIMEOUT);
            };
            // Add input listeners to both password and username fields
            formElements.passwordField.addEventListener("input", handleInput);
            if (formElements.usernameField) {
                formElements.usernameField.addEventListener("input", handleInput);
            }
            // Keep the submit handler
            form.addEventListener("submit", (e) => {
                if (this.typingTimer) {
                    clearTimeout(this.typingTimer);
                }
                this.handleFormSubmission(e, formElements);
            });
        }
        catch (error) {
            // Handle error
        }
    }
    // Handles form submission and extracts credentials
    async handleFormSubmission(event, formElements) {
        const credentials = this.extractCredentials(formElements);
        if (credentials === null || credentials === void 0 ? void 0 : credentials.password) {
            try {
                await this.notifyCredentialDetection(credentials);
            }
            catch (error) {
                // Error message will be handled by notifyCredentialDetection
            }
        }
    }
    // Handles input changes in the password field and notifies credential detection
    async handleInputChange(formElements) {
        if (this.isAutoFilling) {
            return;
        }
        const credentials = this.extractCredentials(formElements);
        if (credentials === null || credentials === void 0 ? void 0 : credentials.password) {
            try {
                await this.notifyCredentialDetection(credentials);
            }
            catch (error) {
                // Error message will be handled by notifyCredentialDetection
            }
        }
    }
    // Creates a floating button for manual credential detection
    createFloatingButton() {
        this.floatingButton = document.createElement('button');
        this.floatingButton.innerHTML = 'Save Password';
        this.floatingButton.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 10000;
      padding: 10px 20px;
      font-size: 14px;
      border-radius: 8px;
      border: none;
      background: #007bff;
      color: white;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      display: none;
    `;
        this.floatingButton.addEventListener('mouseover', () => {
            this.floatingButton.style.transform = 'scale(1.05)';
            this.floatingButton.style.background = '#0056b3';
        });
        this.floatingButton.addEventListener('mouseout', () => {
            this.floatingButton.style.transform = 'scale(1)';
            this.floatingButton.style.background = '#007bff';
        });
        this.floatingButton.addEventListener('click', () => {
            if (this.typingTimer) {
                clearTimeout(this.typingTimer);
            }
            this.detectAndSaveCredentials();
        });
        document.body.appendChild(this.floatingButton);
    }
    // Detects and saves credentials manually
    detectAndSaveCredentials() {
        const forms = document.querySelectorAll("form");
        forms.forEach((form) => {
            try {
                const formElements = this.findFormElements(form);
                const credentials = this.extractCredentials(formElements);
                if ((credentials === null || credentials === void 0 ? void 0 : credentials.website) && (credentials === null || credentials === void 0 ? void 0 : credentials.password)) {
                    chrome.runtime.sendMessage({
                        type: "PASSWORD_DETECTED",
                        data: credentials,
                    });
                    // Hide button after saving
                    this.floatingButton.style.display = 'none';
                }
            }
            catch (error) {
                // Handle error
            }
        });
    }
    initialize() {
        document.querySelectorAll("form").forEach((form) => {
            this.attachFormListeners(form);
        });
        document
            .querySelectorAll(FORM_SELECTORS.PASSWORD_INPUTS.join(","))
            .forEach((field) => {
            if (!field.closest("form")) {
                this.createVirtualForm(field);
            }
        });
    }
    setAutoFilling(value) {
        this.isAutoFilling = value;
    }
    getAutoFilling() {
        return this.isAutoFilling;
    }
    isDuplicateCredential(newCredentials) {
        if (!this.lastDetectedCredentials)
            return false;
        const timeDiff = Date.now() - this.lastDetectedCredentials.timestamp;
        return (timeDiff < this.TYPING_TIMEOUT &&
            this.lastDetectedCredentials.website === newCredentials.website &&
            this.lastDetectedCredentials.user === newCredentials.user &&
            this.lastDetectedCredentials.password === newCredentials.password);
    }
}
// Initialize the detector
const detector = new CredentialDetector();
detector.initialize();
// Re-initialize on URL changes
let lastUrl = location.href;
new MutationObserver(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        detector.initialize();
    }
}).observe(document, { subtree: true, childList: true });
// Add this to your content script, before the detector initialization
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "AUTO_FILL_CREDENTIALS") {
        const { user, password } = message.data;
        // Set the auto-filling flag
        detector.setAutoFilling(true);
        // Find password fields using existing selectors
        const passwordFields = document.querySelectorAll(FORM_SELECTORS.PASSWORD_INPUTS.join(","));
        // Find username fields using existing selectors
        const usernameFields = document.querySelectorAll(FORM_SELECTORS.USERNAME_INPUTS.join(","));
        // Auto-fill the first matching fields found
        if (passwordFields.length > 0) {
            passwordFields[0].value = password;
            // Trigger input event to notify any listeners
            passwordFields[0].dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (usernameFields.length > 0 && user) {
            usernameFields[0].value = user;
            // Trigger input event to notify any listeners
            usernameFields[0].dispatchEvent(new Event("input", { bubbles: true }));
        }
        // Reset the auto-filling flag after a short delay
        setTimeout(() => {
            detector.setAutoFilling(false);
        }, 1000);
        sendResponse({ success: true });
    }
});


/******/ })()
;
//# sourceMappingURL=content.js.map