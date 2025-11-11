# keyerext

Type definitions and SDK for Keyer extensions.

## Installation

```bash
npm install keyerext --save-dev
```

## Usage

### Create a TypeScript Extension

1. Create your extension directory:
```bash
mkdir my-extension
cd my-extension
```

2. Initialize package.json:
```json
{
  "id": "com.example.my-extension",
  "name": "My Extension",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc"
  },
  "commands": [],
  "devDependencies": {
    "keyerext": "^1.0.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

3. Create tsconfig.json:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["index.ts"]
}
```

4. Create index.ts:
```typescript
import { IExtension, IAction, IStore } from 'keyerext'

class MyExtension implements IExtension {
  store?: IStore

  async onPrepare(): Promise<void> {
    console.log('Extension loaded')

    // Use store to persist data
    const count = this.store?.get('launchCount', 0)
    console.log('Launch count:', count)
  }

  async onSearch(input: string): Promise<IAction[]> {
    return [{
      id: 'com.example.my-action',
      name: 'My Action',
      desc: 'Description',
      typeLabel: 'Custom',
      ext: {
        type: 'my-extension'
      }
    }]
  }

  async doAction(action: IAction): Promise<void> {
    console.log('Action executed:', action)

    // Increment launch count
    const count = this.store?.get('launchCount', 0) as number
    this.store?.set('launchCount', count + 1)
  }
}

export default new MyExtension()
```

### Using Store

The `store` property is automatically injected by the framework when your extension loads. Each extension gets its own isolated storage space.

```typescript
// Save data
this.store?.set('myKey', 'myValue')
this.store?.set('counter', 42)
this.store?.set('config', { theme: 'dark', lang: 'en' })

// Read data
const value = this.store?.get('myKey')  // 'myValue'
const counter = this.store?.get('counter', 0)  // 42, or 0 if not exists
const config = this.store?.get<{theme: string}>('config')

// Delete data
this.store?.delete('myKey')

// Check existence
if (this.store?.has('config')) {
  // ...
}

// Clear all data
this.store?.clear()
```

5. Build:
```bash
npm run build
```

## API

### IExtension

Main interface for Keyer extensions.

```typescript
interface IExtension {
  store?: IStore  // Injected by the framework
  onPrepare(): Promise<void> | void
  onSearch(input: string): Promise<IAction[]> | IAction[]
  doAction(action: IAction): Promise<void> | void
}
```

### IStore

Key-value storage interface for extensions.

```typescript
interface IStore {
  get<T = any>(key: string): T | undefined
  get<T = any>(key: string, defaultValue: T): T
  set(key: string, value: any): void
  delete(key: string): void
  clear(): void
  keys(): string[]
  has(key: string): boolean
}
```

### IAction

Action returned from search results.

```typescript
interface IAction {
  id: string
  name: string
  desc: string
  typeLabel?: string  // Display label like "Command", "System", etc.
  ext?: any  // Custom data passed to doAction
}
```

### ICommand

Basic command definition.

```typescript
interface ICommand {
  id: string
  name: string
  desc: string
}
```

### ExtensionPackage

Extension package.json format.

```typescript
interface ExtensionPackage {
  id: string
  name: string
  version: string
  commands: ICommand[]
  main: string
}
```

## License

MIT
