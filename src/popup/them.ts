export const cyberpunkTheme = {
  colors: {
    primary: {
      DEFAULT: "#00ffff", // cyan
      hover: "#00cccc",
      light: "#66ffff",
      dark: "#009999",
    },
    secondary: {
      DEFAULT: "#ff00ff", // magenta
      hover: "#cc00cc",
      light: "#ff66ff",
      dark: "#990099",
    },
    accent: {
      DEFAULT: "#0099ff", // blue
      hover: "#0077cc",
      light: "#66c1ff",
      dark: "#004d99",
    },
    background: {
      DEFAULT: "#0f172a", // slate-900
      lighter: "#1e293b", // slate-800
      darker: "#020617", // slate-950
      overlay: "rgba(0, 0, 0, 0.3)",
    },
    text: {
      primary: "#f1f5f9", // slate-100
      secondary: "#94a3b8", // slate-400
      accent: "#00ffff", // cyan
      disabled: "#475569", // slate-600
    },
    border: {
      DEFAULT: "#475569", // slate-600
      hover: "#00ffff", // cyan
      active: "#0099ff", // blue
      light: "rgba(71, 85, 105, 0.5)", // slate-600/50
    },
    gradient: {
      primary: {
        from: "#00ffff", // cyan
        to: "#0099ff", // blue
      },
      secondary: {
        from: "#ff00ff", // magenta
        to: "#0099ff", // blue
      },
    },
    status: {
      error: "#ff0000",
      success: "#00ff00",
      warning: "#ffff00",
    },
  },
  animation: {
    timing: {
      fast: "200ms",
      normal: "300ms",
      slow: "500ms",
    },
  },
};

export type CyberpunkTheme = typeof cyberpunkTheme;
