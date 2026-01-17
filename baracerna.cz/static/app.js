(() => {
  const THEME_PARAM = "theme";
  const DARK = "dark";
  const LABEL_SELECTOR = "[data-theme-label]";

  const getThemeFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get(THEME_PARAM) === DARK ? DARK : "light";
  };

  const setThemeOnDocument = (theme) => {
    if (theme === DARK) document.documentElement.dataset.theme = DARK;
    else delete document.documentElement.dataset.theme;

    const btn = document.querySelector("[data-theme-toggle]");
    if (btn) {
      const isDark = theme === DARK;
      btn.setAttribute("aria-pressed", String(isDark));
      btn.setAttribute("data-theme", isDark ? DARK : "light");
      const label = btn.querySelector(LABEL_SELECTOR);
      if (label) label.textContent = isDark ? "dark mode" : "light mode";
    }
  };

  const updateUrlThemeParam = (theme) => {
    const url = new URL(window.location.href);
    // Preserve all existing query params; only toggle `theme`.
    const params = new URLSearchParams(url.search);
    if (theme === DARK) params.set(THEME_PARAM, DARK);
    else params.delete(THEME_PARAM);
    url.search = params.toString();
    window.history.replaceState({}, "", url);
  };

  const toggleTheme = () => {
    const current = getThemeFromUrl();
    const next = current === DARK ? "light" : DARK;
    updateUrlThemeParam(next);
    setThemeOnDocument(next);
  };

  // Init
  setThemeOnDocument(getThemeFromUrl());

  const btn = document.querySelector("[data-theme-toggle]");
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleTheme();
    });
  }
})();
