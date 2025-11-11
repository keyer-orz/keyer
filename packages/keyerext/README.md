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
import { IExtension, IAction } from 'keyerext'

class MyExtension implements IExtension {
  async onPrepare(): Promise<void> {
    console.log('Extension loaded')
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
  }
}

export default new MyExtension()
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
  onPrepare(): Promise<void> | void
  onSearch(input: string): Promise<IAction[]> | IAction[]
  doAction(action: IAction): Promise<void> | void
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
