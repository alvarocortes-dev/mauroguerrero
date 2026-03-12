"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Initial check
    const storageKey = "theme-preference";
    const getColorPreference = () => {
      if (typeof window !== "undefined" && localStorage.getItem(storageKey))
        return localStorage.getItem(storageKey) as "light" | "dark";
      else
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    };

    const currentTheme = getColorPreference();
    setTheme(currentTheme);
    reflectPreference(currentTheme);

    // Sync with system changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = ({ matches: isDark }: MediaQueryListEvent) => {
      const newTheme = isDark ? "dark" : "light";
      setTheme(newTheme);
      setPreference(newTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setPreference = (newTheme: "light" | "dark") => {
    const storageKey = "theme-preference";
    localStorage.setItem(storageKey, newTheme);
    reflectPreference(newTheme);
  };

  const reflectPreference = (newTheme: "light" | "dark") => {
    document.firstElementChild?.setAttribute("data-theme", newTheme);
    document
      .querySelector("#theme-toggle")
      ?.setAttribute("aria-label", newTheme);
  };

  const onClick = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    setPreference(newTheme);
  };

  return (
    <button
      className="theme-toggle"
      id="theme-toggle"
      title="Toggles light & dark"
      aria-label={theme}
      aria-live="polite"
      onClick={onClick}
    >
      <svg
        className="sun-and-moon"
        aria-hidden="true"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <mask className="moon" id="moon-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <circle cx="24" cy="10" r="6" fill="black" />
        </mask>
        <circle
          className="sun"
          cx="12"
          cy="12"
          r="6"
          mask="url(#moon-mask)"
          fill="currentColor"
        />
        <g className="sun-beams" stroke="currentColor">
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </g>
      </svg>
    </button>
  );
}
