import * as React from "react";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2/index";

const ThemeSwitcher = () => {
  const [isDarkTheme, setIsDarkTheme] = React.useState(false);

  React.useEffect(() => {
    const storedTheme = localStorage.getItem("color-theme");
    const prefersDarkScheme = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (storedTheme === "dark" || (!storedTheme && prefersDarkScheme)) {
      setIsDarkTheme(true);
    }
  }, []);

  const handleToggleClick = () => {
    setIsDarkTheme((prevIsDarkTheme) => {
      const isDark = !prevIsDarkTheme;

      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      localStorage.setItem("color-theme", isDark ? "dark" : "light");
      return isDark;
    });
  };

  return (
    <button
      id="theme-toggle"
      className="[&svg]:stroke-2"
      onClick={handleToggleClick}
    >
      <span
        id="theme-toggle-dark-icon"
        className={!isDarkTheme ? "hidden" : ""}
      >
        <HiOutlineMoon size="1.2rem" />
        <span className="sr-only">Dark Mode</span>
      </span>
      <span
        id="theme-toggle-light-icon"
        className={isDarkTheme ? "hidden" : ""}
      >
        <HiOutlineSun size="1.2rem" />
        <span className="sr-only">Light Mode</span>
      </span>
    </button>
  );
};

export default ThemeSwitcher;
