// notifications/NotificationManager.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import AddPasswordDialog from "../components/password/AddPasswordDialog";

class NotificationManager {
  private container: HTMLDivElement | null = null;
  private root: ReturnType<typeof createRoot> | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initializes the notification container and mounts it to the DOM.
   */
  private init() {
    this.container = document.createElement("div");
    this.container.id = "password-manager-notification";
    document.body.appendChild(this.container);
    this.root = createRoot(this.container);
  }

  /**
   * Shows the AddPasswordDialog with pre-filled data.
   *
   * @param prefilledData - Object containing website, username, and optional password.
   */
  public show(prefilledData?: {
    website?: string;
    user?: string;
    password?: string;
  }) {
    const handleClose = () => {
      this.dismiss();
    };

    // Render the AddPasswordDialog with dynamic props
    this.root?.render(
      <AddPasswordDialog
        open={true}
        onClose={handleClose}
        prefilledData={prefilledData}
      />
    );
  }

  /**
   * Dismisses the notification by unmounting it.
   */
  private dismiss() {
    this.root?.render(null);
  }
}

export default new NotificationManager();
