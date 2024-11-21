// import React from "react";
// import { createRoot } from "react-dom/client";
// import AddPasswordDialogProps from "../components/notifications/savePassword";
// import { SessionProvider } from "../../context/SessionContext";

// class NotificationManager {
//   private static instance: NotificationManager;
//   private container: HTMLDivElement | null = null;
//   private root: ReturnType<typeof createRoot> | null = null;

//   constructor() {
//     if (NotificationManager.instance) {
//       return NotificationManager.instance;
//     }
//     NotificationManager.instance = this;
//     this.init();
//   }

//   private init() {
//     const existingContainer = document.getElementById(
//       "password-manager-notification"
//     );
//     if (existingContainer) {
//       existingContainer.remove();
//     }

//     this.container = document.createElement("div");
//     this.container.id = "password-manager-notification";
//     document.body.appendChild(this.container);
//     this.root = createRoot(this.container);
//   }

//   public async show(prefilledData: {
//     website: string;
//     user: string;
//     password: string;
//   }): Promise<void> {
//     return new Promise((resolve) => {
//       const handleClose = () => {
//         this.dismiss();
//         resolve();
//       };
//       console.log("=========================================", prefilledData);
//       if (!this.root) {
//         this.init();
//       }

//       this.root?.render(
//         <React.StrictMode>
//           <AddPasswordDialogProps
//             open={true}
//             onClose={handleClose}
//             prefilledData={{
//               website: prefilledData.website,
//               username: prefilledData.user,
//               password: prefilledData.password,
//             }}
//           />
//         </React.StrictMode>
//       );
//     });
//   }

//   private dismiss() {
//     this.root?.render(null);
//   }
// }

// export default new NotificationManager();
