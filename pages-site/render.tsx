import {renderToString} from "react-dom/server";
import {Studio} from "./studio";
export {routes,titleFor} from "./studio";
export function render(route:string){return renderToString(<Studio route={route}/>);}
