import { LoginFormData, NewEncryptedPassword } from "../services/types";
import NotificationManager from "../popup/notifications/NotificationManager";

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
  private lastDetectedCredentials: Partial<NewEncryptedPassword> | null = null;
  private detectionTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize mutation observer to detect dynamically added forms
    this.mutationObserver = new MutationObserver(
      this.handleDOMChanges.bind(this)
    );
    this.setupMutationObserver();
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
    const { passwordField, usernameField } = formElements;

    if (!passwordField.value) {
      return null;
    }

    const credentials = {
      website: window.location.origin,
      user: usernameField?.value,
      password: passwordField.value,
      formData: {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
      },
    };

    console.log("CONTENT:  Extracted credentials:", {
      ...credentials,
      password: "***", // Hide password in logs
    });

    return credentials;
  }

  // Notifies about detected credentials and sends a message to the background script
  private async notifyCredentialDetection(
    credentials: Partial<NewEncryptedPassword>
  ): Promise<void> {
    if (!credentials.password) return;

    const credentialKey = `${credentials.website}-${credentials.user}-${credentials.password}`;
    if (
      this.lastDetectedCredentials &&
      `${this.lastDetectedCredentials.website}-${this.lastDetectedCredentials.user}-${this.lastDetectedCredentials.password}` ===
        credentialKey
    ) {
      return;
    }

    this.lastDetectedCredentials = credentials;

    try {
      // Show notification
      console.log(
        "================================================================",
        credentials
      );
      await NotificationManager.show({
        website: credentials.website || "",
        user: credentials.user || "",
        password: credentials.password || "",
      });

      // Send message to background script
      const message: CredentialMessage = {
        type: "DETECTED_CREDENTIALS",
        payload: {
          website: credentials.website || "",
          user: credentials.user || "",
          password: credentials.password || "",
          formData: credentials.formData,
        },
      };

      await chrome.runtime.sendMessage(message);
      console.debug("Credential detection message sent successfully");
    } catch (error) {
      console.error("Error in notifyCredentialDetection:", error);
    }
  }

  // Handles changes in the DOM and processes new elements
  private async handleDOMChanges(mutations: MutationRecord[]): Promise<void> {
    console.log("CONTENT:  DOM changes detected:", mutations);
    for (const mutation of mutations) {
      console.log("CONTENT:  Processing mutation:", mutation);
      if (mutation.type === "childList") {
        const addedNodes = Array.from(mutation.addedNodes);
        console.log("CONTENT:  Added nodes:", addedNodes);
        for (const node of addedNodes) {
          if (node instanceof HTMLElement) {
            console.log("CONTENT:  Processing new element:", node);
            await this.processNewElement(node);
          }
        }
      }
    }
  }

  // Processes a new element added to the DOM
  private async processNewElement(element: HTMLElement): Promise<void> {
    console.log("CONTENT:  Processing new element:", element);
    const forms = element.querySelectorAll("form");
    console.log("CONTENT:  Found forms:", forms);
    forms.forEach((form) => {
      console.log("CONTENT:  Attaching listeners to form:", form);
      this.attachFormListeners(form as HTMLFormElement);
    });

    const passwordFields = element.querySelectorAll(
      FORM_SELECTORS.PASSWORD_INPUTS.join(",")
    );
    console.log("CONTENT:  Found password fields:", passwordFields);
    passwordFields.forEach((field) => {
      const parentForm = field.closest("form");
      if (!parentForm) {
        console.log(
          "CONTENT:  Creating virtual form for password field:",
          field
        );
        this.createVirtualForm(field as HTMLInputElement);
      }
    });
  }

  // Creates a virtual form for a password field if it doesn't belong to a form
  private createVirtualForm(passwordField: HTMLInputElement): void {
    console.log(
      "CONTENT:  Creating virtual form for password field:",
      passwordField
    );
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
    console.log("CONTENT:  Attaching form listeners for form:", form);
    if (this.observedForms.has(form)) {
      console.log("CONTENT:  Form already observed:", form);
      return;
    }

    try {
      const formElements = this.findFormElements(form);
      console.log("CONTENT:  Form elements found:", formElements);
      this.observedForms.add(form);

      form.addEventListener("submit", (e) => {
        console.log("CONTENT:  Form submitted:", formElements);
        this.handleFormSubmission(e, formElements);
      });

      formElements.passwordField.addEventListener(
        "input",
        this.debounce(() => {
          console.log(
            "CONTENT:  Input changed in password field:",
            formElements
          );
          this.handleInputChange(formElements);
        }, 500)
      );

      formElements.passwordField.addEventListener("focus", () => {
        console.log("CONTENT:  Password field focused:", formElements);
        this.handlePasswordFocus(formElements);
      });
    } catch (error) {
      console.debug("Failed to attach listeners to form:", error);
    }
  }

  // Handles form submission and extracts credentials
  private async handleFormSubmission(
    event: Event,
    formElements: FormMetadata
  ): Promise<void> {
    console.log("CONTENT:  Handling form submission:", formElements);
    const credentials = this.extractCredentials(formElements);
    if (credentials) {
      console.log("CONTENT:  Extracted credentials:", credentials);
      await this.notifyCredentialDetection(credentials);
    }
  }

  // Handles input changes in the password field and notifies credential detection
  private async handleInputChange(formElements: FormMetadata): Promise<void> {
    console.log("CONTENT:  Handling input change:", formElements);
    const credentials = this.extractCredentials(formElements);
    if (credentials) {
      console.log(
        "CONTENT:  Credentials extracted on input change:",
        credentials
      );
      if (this.detectionTimeout) {
        clearTimeout(this.detectionTimeout);
      }
      this.detectionTimeout = setTimeout(() => {
        console.log(
          "Notifying credential detection after input change:",
          credentials
        );
        this.notifyCredentialDetection(credentials);
      }, 1000);
    }
  }

  // Handles focus event on the password field and notifies credential detection
  private async handlePasswordFocus(formElements: FormMetadata): Promise<void> {
    console.log("CONTENT:  Handling password focus:", formElements);
    const credentials = this.extractCredentials(formElements);
    if (credentials) {
      console.log(
        "Notifying credential detection on password focus:",
        credentials
      );
      await this.notifyCredentialDetection(credentials);
    }
  }

  private debounce(func: Function, wait: number): (...args: any[]) => void {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: any[]) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  public initialize(): void {
    console.log("CONTENT:  Initializing CredentialDetector...");
    document.querySelectorAll("form").forEach((form) => {
      console.log("CONTENT:  Attaching listeners to existing form:", form);
      this.attachFormListeners(form);
    });

    document
      .querySelectorAll(FORM_SELECTORS.PASSWORD_INPUTS.join(","))
      .forEach((field) => {
        if (!field.closest("form")) {
          console.log(
            "Creating virtual form for existing password field:",
            field
          );
          this.createVirtualForm(field as HTMLInputElement);
        }
      });
  }
}

// Initialize the detector
console.log("CONTENT:  Initializing CredentialDetector instance...");
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
