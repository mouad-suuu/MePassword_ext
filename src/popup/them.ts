export const theme = {
  colors: {
    // Background colors
    bg: {
      primary: "#0f172a", // Dark slate
      secondary: "#1e293b", // Lighter slate
      accent: "#020617", // Darkest slate
      overlay: "rgba(0, 0, 0, 0.3)",
    },
    // Text colors
    text: {
      primary: "#f1f5f9", // Light gray
      secondary: "#94a3b8", // Medium gray
      accent: "#00ffff", // Cyan
      disabled: "#475569", // Slate
    },
    // Border colors
    border: {
      primary: "#475569", // Slate
      hover: "#00ffff", // Cyan
      active: "#0099ff", // Blue
      light: "rgba(71, 85, 105, 0.5)",
    },
    // Accent colors
    accent: {
      primary: "#00ffff", // Cyan
      secondary: "#ff00ff", // Magenta
      blue: "#0099ff", // Blue
    },
    // Status colors
    status: {
      error: "#ff0000",
      success: "#00ff00",
      warning: "#ffff00",
    },
    // Gradient definitions
    gradient: {
      primary: "linear-gradient(to right, #00ffff, #0099ff)",
      secondary: "linear-gradient(to right, #ff00ff, #0099ff)",
    },
  },
  // Typography
  text: {
    heading:
      "text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent",
    subheading: "text-xl font-semibold text-slate-300",
    body: "text-slate-300",
    small: "text-sm text-slate-400",
  },
};
