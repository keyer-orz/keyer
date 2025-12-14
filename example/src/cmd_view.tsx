import { Image, VStack, Keyer, Button } from 'keyerext'
import { DemoUI } from './DemoUI'

export default function cmd_view() {
    return <VStack>
        <Image src="assets/icon.png" />
        <DemoUI />
        <Button onClick={() => Keyer.toast.show('info', 'This is a toast message')}>toast</Button>
    </VStack>
}