import * as React from "react";

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
      className="[&svg]:stroke-2 rounded-sm text-gray-500 hover:text-gray-900 transition-all dark:hover:text-gray-50"
      onClick={handleToggleClick}
    >
      {isDarkTheme ? "dark" : "light"}
    </button>
  );
};

export default ThemeSwitcher;
