(() => {
  const THEME_PARAM = "theme";
  const DARK = "dark";
  const LABEL_SELECTOR = "[data-theme-label]";

  const syncInternalLinksWithTheme = (theme) => {
    const links = document.querySelectorAll("a[href]");

    for (const link of links) {
      const rawHref = link.getAttribute("href");
      if (!rawHref) continue;

      // Ignore in-page anchors and non-HTTP(S) schemes.
      if (rawHref.startsWith("#")) continue;
      if (/^(mailto:|tel:|javascript:)/i.test(rawHref)) continue;

      let url;
      try {
        url = new URL(rawHref, window.location.href);
      } catch {
        continue;
      }

      // Only mutate same-origin links.
      if (url.origin !== window.location.origin) continue;

      const params = url.searchParams;

      // Keep theme param consistent with current selection.
      if (theme === DARK) {
        if (!params.has(THEME_PARAM)) params.set(THEME_PARAM, DARK);
      } else {
        params.delete(THEME_PARAM);
      }

      // Only write back if it actually changed.
      const nextHref = url.pathname + (params.toString() ? `?${params.toString()}` : "") + (url.hash || "");
      if (rawHref !== nextHref) link.setAttribute("href", nextHref);
    }
  };

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
    syncInternalLinksWithTheme(next);
  };

  // Init
  const initialTheme = getThemeFromUrl();
  setThemeOnDocument(initialTheme);
  syncInternalLinksWithTheme(initialTheme);

  const btn = document.querySelector("[data-theme-toggle]");
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleTheme();
    });
  }
})();
