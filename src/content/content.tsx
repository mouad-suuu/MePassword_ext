import { LoginFormData, NewEncryptedPassword } from "../services/types";

// Types
interface FormMetadata {
  form: HTMLFormElement;
  usernameField?: HTMLInputElement;
  passwordField: HTMLInputElement;
  submitButton?: HTMLElement;
}

interface CredentialMessage {
  type: "DETECTED_CREDENTIALS";
  payload: {
    website: string;
    user: string;
    password: string;
    formData?: LoginFormData;
  };
}

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
  private observedForms: Set<HTMLFormElement> = new Set();
  private mutationObserver: MutationObserver;
  private floatingButton!: HTMLButtonElement;
  private lastDetectedCredentials: {
    website: string;
    user: string;
    password: string;
    timestamp: number;
  } | null = null;
  private typingTimer: NodeJS.Timeout | null = null;
  private readonly TYPING_TIMEOUT = 5000; // 5 seconds
  public isAutoFilling: boolean = false;

  constructor() {
    // Initialize mutation observer to detect dynamically added forms
    this.mutationObserver = new MutationObserver(
      this.handleDOMChanges.bind(this)
    );
    this.setupMutationObserver();
    this.createFloatingButton();
  }

  // Sets up the mutation observer to watch for changes in the DOM
  private setupMutationObserver(): void {
    this.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  // Finds the username field in the form relative to the password field
  private findUsernameField(
    form: HTMLFormElement,
    passwordField: HTMLInputElement
  ): HTMLInputElement | undefined {
    // First try to find username/email input before the password field
    const allInputs = Array.from(form.getElementsByTagName("input"));
    const passwordIndex = allInputs.indexOf(passwordField);

    // Look for inputs before the password field first
    const previousInputs = allInputs.slice(0, passwordIndex);
    for (const input of previousInputs.reverse()) {
      if (
        input.type === "text" ||
        input.type === "email" ||
        input.name?.toLowerCase().includes("user") ||
        input.name?.toLowerCase().includes("email") ||
        input.id?.toLowerCase().includes("user") ||
        input.id?.toLowerCase().includes("email")
      ) {
        return input as HTMLInputElement;
      }
    }

    // If no username field found before password, check after
    const nextInputs = allInputs.slice(passwordIndex + 1);
    for (const input of nextInputs) {
      if (
        input.type === "text" ||
        input.type === "email" ||
        input.name?.toLowerCase().includes("user") ||
        input.name?.toLowerCase().includes("email") ||
        input.id?.toLowerCase().includes("user") ||
        input.id?.toLowerCase().includes("email")
      ) {
        return input as HTMLInputElement;
      }
    }

    // Fallback to the original selector method
    return (
      form.querySelector<HTMLInputElement>(
        FORM_SELECTORS.USERNAME_INPUTS.join(",")
      ) || undefined
    );
  }

  // Extracts credentials from the form elements
  private extractCredentials(
    formElements: FormMetadata
  ): Partial<NewEncryptedPassword> | null {
    const credentials = {
      website: window.location.origin,
      user: formElements.usernameField?.value || "",
      password: formElements.passwordField?.value || "",
      formData: {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
      },
    };

    return credentials;
  }

  // Notifies about detected credentials and sends a message to the background script
  private async notifyCredentialDetection(
    credentials: NewEncryptedPassword
  ): Promise<void> {
    if (this.isDuplicateCredential(credentials)) {
      return;
    }

    this.lastDetectedCredentials = {
      ...credentials,
      timestamp: Date.now(),
    };

    try {
      if (chrome.runtime && chrome.runtime.id) {
        await chrome.runtime.sendMessage({
          type: "PASSWORD_DETECTED",
          data: credentials,
        });
      } else {
        throw new Error("Extension needs to be reloaded to function properly");
      }
    } catch (error) {
      if (error === "Extension context invalidated.") {
        throw new Error("Please refresh the page to continue using MePassword");
      } else {
        throw new Error("Unable to save credentials. Please try again later");
      }
    }
  }

  // Handles changes in the DOM and processes new elements
  private async handleDOMChanges(mutations: MutationRecord[]): Promise<void> {
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
  private async processNewElement(element: HTMLElement): Promise<void> {
    const forms = element.tagName === "FORM"
      ? [element]
      : Array.from(element.getElementsByTagName("form"));

    for (const form of forms) {
      await this.attachFormListeners(form as HTMLFormElement);
    }

    const passwordFields = Array.from(
      element.querySelectorAll(FORM_SELECTORS.PASSWORD_INPUTS.join(","))
    ) as HTMLInputElement[];

    for (const field of passwordFields) {
      if (!field.form) {
        this.createVirtualForm(field);
      }
    }
  }

  // Creates a virtual form for a password field if it doesn't belong to a form
  private createVirtualForm(passwordField: HTMLInputElement): void {
    const virtualForm = document.createElement("form");
    virtualForm.setAttribute("data-virtual-form", "true");
    passwordField.parentElement?.insertBefore(virtualForm, passwordField);
    virtualForm.appendChild(passwordField.cloneNode(true));
    passwordField.remove();
    this.attachFormListeners(virtualForm);
  }

  // Finds form elements including password and username fields
  private findFormElements(form: HTMLFormElement): FormMetadata {
    const passwordField = form.querySelector<HTMLInputElement>(
      FORM_SELECTORS.PASSWORD_INPUTS.join(",")
    );

    if (!passwordField) {
      throw new Error("No password field found in form");
    }

    const usernameField = this.findUsernameField(form, passwordField);
    const submitButton = form.querySelector(
      FORM_SELECTORS.SUBMIT_BUTTONS.join(",")
    );

    return {
      form,
      usernameField,
      passwordField,
      submitButton: submitButton as HTMLElement,
    };
  }

  // Calculates the distance between an element and the password field
  private getDistanceToPassword(
    element: HTMLElement,
    passwordField: HTMLElement
  ): number {
    const rect1 = element.getBoundingClientRect();
    const rect2 = passwordField.getBoundingClientRect();
    return Math.abs(rect1.top - rect2.top);
  }

  // Attaches event listeners to the form for submission and input changes
  private attachFormListeners(form: HTMLFormElement): void {
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
        } else {
          this.floatingButton.style.display = 'none';
        }

        // Set new timer
        this.typingTimer = setTimeout(() => {
          // Only proceed if we have a password
          if (formElements.passwordField.value) {
            const credentials = this.extractCredentials(formElements);
            if (credentials) {
              this.notifyCredentialDetection(credentials as NewEncryptedPassword);
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

    } catch (error) {
      // Handle error
    }
  }

  // Handles form submission and extracts credentials
  private async handleFormSubmission(
    event: Event,
    formElements: FormMetadata
  ): Promise<void> {
    const credentials = this.extractCredentials(formElements);
    if (credentials?.password) {
      try {
        await this.notifyCredentialDetection(credentials as NewEncryptedPassword);
      } catch (error) {
        // Error message will be handled by notifyCredentialDetection
      }
    }
  }

  // Handles input changes in the password field and notifies credential detection
  private async handleInputChange(formElements: FormMetadata): Promise<void> {
    if (this.isAutoFilling) {
      return;
    }

    const credentials = this.extractCredentials(formElements);
    if (credentials?.password) {
      try {
        await this.notifyCredentialDetection(credentials as NewEncryptedPassword);
      } catch (error) {
        // Error message will be handled by notifyCredentialDetection
      }
    }
  }

  // Creates a floating button for manual credential detection
  private createFloatingButton(): void {
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
  private detectAndSaveCredentials(): void {
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      try {
        const formElements = this.findFormElements(form as HTMLFormElement);
        const credentials = this.extractCredentials(formElements);
        if (credentials?.website && credentials?.password) {
          chrome.runtime.sendMessage({
            type: "PASSWORD_DETECTED",
            data: credentials,
          });
          // Hide button after saving
          this.floatingButton.style.display = 'none';
        }
      } catch (error) {
        // Handle error
      }
    });
  }

  public initialize(): void {
    document.querySelectorAll("form").forEach((form) => {
      this.attachFormListeners(form);
    });

    document
      .querySelectorAll(FORM_SELECTORS.PASSWORD_INPUTS.join(","))
      .forEach((field) => {
        if (!field.closest("form")) {
          this.createVirtualForm(field as HTMLInputElement);
        }
      });
  }

  public setAutoFilling(value: boolean): void {
    this.isAutoFilling = value;
  }

  public getAutoFilling(): boolean {
    return this.isAutoFilling;
  }

  private isDuplicateCredential(newCredentials: NewEncryptedPassword): boolean {
    if (!this.lastDetectedCredentials) return false;

    const timeDiff = Date.now() - this.lastDetectedCredentials.timestamp;
    return (
      timeDiff < this.TYPING_TIMEOUT &&
      this.lastDetectedCredentials.website === newCredentials.website &&
      this.lastDetectedCredentials.user === newCredentials.user &&
      this.lastDetectedCredentials.password === newCredentials.password
    );
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
    const passwordFields = document.querySelectorAll(
      FORM_SELECTORS.PASSWORD_INPUTS.join(",")
    );

    // Find username fields using existing selectors
    const usernameFields = document.querySelectorAll(
      FORM_SELECTORS.USERNAME_INPUTS.join(",")
    );

    // Auto-fill the first matching fields found
    if (passwordFields.length > 0) {
      (passwordFields[0] as HTMLInputElement).value = password;
      // Trigger input event to notify any listeners
      passwordFields[0].dispatchEvent(new Event("input", { bubbles: true }));
    }

    if (usernameFields.length > 0 && user) {
      (usernameFields[0] as HTMLInputElement).value = user;
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
