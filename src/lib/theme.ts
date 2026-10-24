// Theme constants shared by the server layout and the client toggle.
export type Theme = "light" | "dark";
export const THEME_STORAGE_KEY = "sm-theme";
export const THEME_COLOR = { light: "#F8F3EC", dark: "#110D0A" } as const;

// Inline <head> script: applies the saved theme before first paint so there is
// no flash of the wrong colours. Light is the default.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");document.documentElement.setAttribute("data-theme",t==="dark"?"dark":"light")}catch(e){document.documentElement.setAttribute("data-theme","light")}})();`;
