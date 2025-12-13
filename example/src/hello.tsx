import { Button, Keyer, Image } from 'keyerext';
import { test } from "./test";


export default function hello() {
    console.log("Hello, Keyer!");
    test();

    Keyer.store.set("greeting", "Hello from Keyer Store!");

    return <div>
        <Image src="assets/icon.png" />
        <Button>hello</Button>
    </div>
}