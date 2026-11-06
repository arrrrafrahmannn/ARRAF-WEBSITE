import {createContext, useContext} from "react";

// Pages uses prerendered documents with native navigation. This supplies the
// same pathname contract used by the shared header and scroll renderer.
export const RouteContext = createContext("/");
export function usePathname() { return useContext(RouteContext); }
