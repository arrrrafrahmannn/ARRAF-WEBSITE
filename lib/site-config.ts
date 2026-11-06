declare const __PAGES_BUILD__: boolean;

export const pagesBuild = typeof __PAGES_BUILD__ !== "undefined" && __PAGES_BUILD__;
export const pagesBase = "/ARRAF-WEBSITE";
export const backendOrigin = "https://arrafed-research-studio.chatgpt-team-4613.chatgpt.site";
export const inquiryEndpoint = pagesBuild ? `${backendOrigin}/api/inquiries` : "/api/inquiries";

export function siteHref(href: string | undefined) {
  if (!pagesBuild || !href?.startsWith("/") || href.startsWith("//")) return href;
  if (href === "/admin" || href.startsWith("/admin/")) return `${backendOrigin}${href}`;
  return `${pagesBase}${href}`;
}
