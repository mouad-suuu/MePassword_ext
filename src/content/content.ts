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

  private setupMutationObserver(): void {
    this.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  private async handleDOMChanges(mutations: MutationRecord[]): Promise<void> {
    console.log("DOM changes detected:", mutations);
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        const addedNodes = Array.from(mutation.addedNodes);
        console.log("Added nodes:", addedNodes);
        for (const node of addedNodes) {
          if (node instanceof HTMLElement) {
            await this.processNewElement(node);
          }
        }
      }
    }
  }

  private async processNewElement(element: HTMLElement): Promise<void> {
    console.log("Processing new element:", element);
    // Look for forms within the new element
    const forms = element.querySelectorAll("form");
    forms.forEach((form) => this.attachFormListeners(form as HTMLFormElement));

    // Also look for password fields that might not be in forms
    const passwordFields = element.querySelectorAll(
      FORM_SELECTORS.PASSWORD_INPUTS.join(",")
    );
    passwordFields.forEach((field) => {
      const parentForm = field.closest("form");
      if (!parentForm) {
        this.createVirtualForm(field as HTMLInputElement);
      }
    });
  }

  private createVirtualForm(passwordField: HTMLInputElement): void {
    const virtualForm = document.createElement("form");
    virtualForm.setAttribute("data-virtual-form", "true");
    passwordField.parentElement?.insertBefore(virtualForm, passwordField);
    virtualForm.appendChild(passwordField.cloneNode(true));
    passwordField.remove();
    this.attachFormListeners(virtualForm);
  }

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

  private findUsernameField(
    form: HTMLFormElement,
    passwordField: HTMLInputElement
  ): HTMLInputElement | undefined {
    const inputs = Array.from(
      form.querySelectorAll<HTMLInputElement>(
        FORM_SELECTORS.USERNAME_INPUTS.join(",")
      )
    );

    // Sort inputs by their position in the DOM relative to the password field
    return inputs
      .filter((input) => input !== passwordField)
      .sort((a, b) => {
        const aDistance = this.getDistanceToPassword(a, passwordField);
        const bDistance = this.getDistanceToPassword(b, passwordField);
        return aDistance - bDistance;
      })[0];
  }

  private getDistanceToPassword(
    element: HTMLElement,
    passwordField: HTMLElement
  ): number {
    const rect1 = element.getBoundingClientRect();
    const rect2 = passwordField.getBoundingClientRect();
    return Math.abs(rect1.top - rect2.top);
  }

  private attachFormListeners(form: HTMLFormElement): void {
    if (this.observedForms.has(form)) {
      return;
    }

    try {
      const formElements = this.findFormElements(form);
      this.observedForms.add(form);

      // Listen for form submission
      form.addEventListener("submit", (e) =>
        this.handleFormSubmission(e, formElements)
      );

      // Listen for input changes
      formElements.passwordField.addEventListener(
        "input",
        this.debounce(() => this.handleInputChange(formElements), 500)
      );

      // Listen for password field focus
      formElements.passwordField.addEventListener("focus", () =>
        this.handlePasswordFocus(formElements)
      );
    } catch (error) {
      console.debug("Failed to attach listeners to form:", error);
    }
  }

  private async handleFormSubmission(
    event: Event,
    formElements: FormMetadata
  ): Promise<void> {
    console.log("Form submitted:", formElements);
    const credentials = this.extractCredentials(formElements);
    if (credentials) {
      console.log("Extracted credentials:", credentials);
      await this.notifyCredentialDetection(credentials);
    }
  }

  private async handleInputChange(formElements: FormMetadata): Promise<void> {
    const credentials = this.extractCredentials(formElements);
    if (credentials) {
      if (this.detectionTimeout) {
        clearTimeout(this.detectionTimeout);
      }
      this.detectionTimeout = setTimeout(() => {
        this.notifyCredentialDetection(credentials);
      }, 1000);
    }
  }

  private async handlePasswordFocus(formElements: FormMetadata): Promise<void> {
    // Trigger the password save prompt when focusing on password field
    const credentials = this.extractCredentials(formElements);
    if (credentials) {
      await this.notifyCredentialDetection(credentials);
    }
  }

  private extractCredentials(
    formElements: FormMetadata
  ): Partial<Partial<NewEncryptedPassword>> | null {
    const { passwordField, usernameField } = formElements;

    if (!passwordField.value) {
      return null;
    }

    return {
      website: window.location.origin,
      user: usernameField?.value || "",
      password: passwordField.value,
      formData: {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async notifyCredentialDetection(
    credentials: Partial<NewEncryptedPassword>
  ): Promise<void> {
    console.log("Notifying credential detection:", credentials);
    // Prevent duplicate notifications for the same credentials
    const credentialKey = `${credentials.website}-${credentials.user}-${credentials.password}`;
    if (
      this.lastDetectedCredentials &&
      `${this.lastDetectedCredentials.website}-${this.lastDetectedCredentials.user}-${this.lastDetectedCredentials.password}` ===
        credentialKey
    ) {
      return;
    }

    this.lastDetectedCredentials = credentials;

    // Show notification to user
    NotificationManager.show({
      website: credentials.website,
      user: credentials.user,
      password: credentials.password,
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

    try {
      await chrome.runtime.sendMessage(message);
      console.debug("Credential detection message sent successfully");
    } catch (error) {
      console.error("Failed to send credential detection message:", error);
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
    // Process existing forms
    document.querySelectorAll("form").forEach((form) => {
      this.attachFormListeners(form);
    });

    // Process password fields that might not be in forms
    document
      .querySelectorAll(FORM_SELECTORS.PASSWORD_INPUTS.join(","))
      .forEach((field) => {
        if (!field.closest("form")) {
          this.createVirtualForm(field as HTMLInputElement);
        }
      });
  }
}

// Initialize the detector
const detector = new CredentialDetector();
detector.initialize();

// Re-run initialization when page content changes significantly
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    detector.initialize();
  }
}).observe(document, { subtree: true, childList: true });
