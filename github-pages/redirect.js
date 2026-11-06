// GitHub Pages is the public entry point. The full app needs a Worker runtime.
(() => {
  const target = new URL("https://arrafed-research-studio.chatgpt-team-4613.chatgpt.site/");
  if (window.location.origin === target.origin) return;
  const base = "/ARRAF-WEBSITE";
  const pathname = window.location.pathname;
  let route = pathname === base || pathname.startsWith(`${base}/`)
    ? pathname.slice(base.length) || "/"
    : "/";
  route = route.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  if (route === "/packages") route = "/pricing";
  // Assign pathname, rather than parsing it as a URL, to prevent open redirects.
  target.pathname = route;
  target.search = window.location.search;
  target.hash = window.location.hash;
  window.location.replace(target.href);
})();
