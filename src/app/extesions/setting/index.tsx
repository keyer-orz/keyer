import Main from "./ui";
import { IExtension } from "keyerext/dist";

class Ext implements IExtension {

    run(_: string): React.ReactElement | null {
        return <Main />
    }
    
}

export default {
    "name": "@sysetem#setting",
    "ext": Ext
}
