import type { AnchorHTMLAttributes } from "react";
import { siteHref } from "@/lib/site-config";

export default function SiteLink({href, ...props}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} href={siteHref(href)} />;
}
