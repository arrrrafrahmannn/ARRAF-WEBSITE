import "@/app/globals.css";
import "@/app/liquid-glass.css";
import "@/app/material-field.css";
import "@/app/typography.css";
import "@/app/menu-light.css";
import {hydrateRoot} from "react-dom/client";
import {Studio} from "./studio";

const root=document.getElementById("studio")!;
hydrateRoot(root,<Studio route={root.dataset.route??"/"}/>);
