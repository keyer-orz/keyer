export default function InlineAction(input: string) {
    console.log("InlineAction input:", input)
    if (input === '1+1=') {
        return <div>hello: 2</div> // this will be rendered in the inline main panel
    } else {
        return null
    }
}