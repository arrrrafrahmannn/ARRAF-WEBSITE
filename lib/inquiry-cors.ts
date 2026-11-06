import { validOrigin } from "./inquiry-validation";

export const pagesOrigin = "https://nurajannatmitu.github.io";

export function validInquiryOrigin(request: Request) {
  return validOrigin(request) || request.headers.get("origin") === pagesOrigin;
}

export function inquiryCors(request: Request, response: Response) {
  const headers = new Headers(response.headers);
  headers.append("Vary", "Origin");
  if (request.headers.get("origin") === pagesOrigin) {
    headers.set("Access-Control-Allow-Origin", pagesOrigin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Max-Age", "600");
  }
  return new Response(response.body, {status: response.status, headers});
}
