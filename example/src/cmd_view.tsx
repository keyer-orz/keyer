import { Image, VStack } from 'keyerext'
import { DemoUI } from './DemoUI'

export default function cmd_view() {
    return <VStack>
        <Image src="assets/icon.png" />
        <DemoUI />
    </VStack>
}