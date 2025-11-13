# Keyer

<div align="center">
  <h3>⚡ A powerful command launcher for macOS</h3>
  <p>Quick access to commands, scripts, and system preferences with global shortcuts</p>
</div>

## ✨ Features

- 🚀 **Fast Command Launcher** - Quickly search and execute commands with keyboard
- ⌨️ **Global Shortcuts** - Trigger commands from anywhere with custom hotkeys
- 🔌 **Extensible Architecture** - Support for TypeScript extensions and shell scripts
- 🎨 **Modern UI** - Clean, Raycast-style interface with dark/light theme
- 💾 **Persistent Storage** - Extension-specific data storage with JSON backend
- 🔍 **Smart Search** - Fuzzy matching across commands, extensions, and scripts

## 📦 Installation

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build
```

## 🎮 Usage

### Main Window
- Press `Shift+Space` to open the command launcher (customizable)
- Type to search for commands
- Use `↑`/`↓` or mouse to navigate
- Press `Enter` or click to execute
- Press `Esc` to navigate back or close

### Settings
- Click the ⚙️ icon or search "Settings"
- Configure theme, shortcuts, and extensions
- Enable/disable commands
- Bind custom global shortcuts to commands

## 🔧 Architecture

### Command System

Commands are the core abstraction in Keyer. Each command implements:

```typescript
interface IAction {
  id: string          // Unique identifier (e.g., "com.keyer.calculator")
  key: string         // Search keyword
  name: string        // Display name
  desc?: string       // Description
  typeLabel?: string  // Type badge (Command/Script/System)
}
```

### Extension Types

#### 1. TypeScript Extensions

Located in `extensions/` directory. Each extension exports an `IExtension`:

```typescript
interface IExtension {
  // Lifecycle
  onPrepare(): Promise<void>

  // Search
  onSearch(input: string): IAction[] | Promise<IAction[]>

  // Execution
  doAction(action: IAction): ExtensionUIResult | Promise<ExtensionUIResult>

  // Live preview (optional)
  onPreview?(input: string): ExtensionUIResult | Promise<ExtensionUIResult>
}

type ExtensionUIResult =
  | null                       // Close window
  | React.ComponentType<any>   // Show secondary panel (component)
  | React.ReactElement         // Show secondary panel (element)
```

**Example: Calculator Extension**

```typescript
class CalculatorExtension implements IExtension {
  async onPrepare() {
    // Initialize extension
  }

  onSearch(input: string): IAction[] {
    // Return calculator command
    return [{
      id: 'calculator',
      name: 'Calculator',
      desc: 'Perform calculations',
      typeLabel: 'Command'
    }]
  }

  async doAction(action: IAction) {
    // Return React component for calculator UI
    return CalculatorPanel
  }

  async onPreview(input: string) {
    // Live calculation preview
    if (/^\d+[\+\-\*\/]\d+$/.test(input)) {
      return <div>Result: {eval(input)}</div>
    }
    return null
  }
}
```

#### 2. Shell Scripts

Located in `scripts/` directory. Metadata via comments:

```bash
#!/bin/bash
# @keyer.id com.keyer.finder-to-terminal
# @keyer.name Open in Terminal
# @keyer.desc Open current Finder location in Terminal

osascript -e 'tell application "Finder"
  set currentPath to POSIX path of (target of front window as alias)
  tell application "Terminal"
    activate
    do script "cd " & quoted form of currentPath
  end tell
end tell'
```

## 🎨 Built-in Extensions

### Calculator
- Quick calculations with live preview
- Support for basic arithmetic operations
- Keyboard-friendly interface

### Clipboard History
- Track and search clipboard history
- Support for text and images
- Preview panel with metadata
- Persistent storage

### App Launcher
- Search and launch macOS applications
- English and Chinese search support
- Filter by categories (Utilities, etc.)

### System Preferences
- Quick access to system settings
- Network, Wi-Fi, Bluetooth, etc.
- Deep links to specific preference panes

## ⚙️ Configuration

Configuration is stored in `~/Library/Application Support/keyer/config.json`:

```json
{
  "theme": "dark",
  "globalShortcut": "Shift+Space",
  "shortcuts": {
    "calculator": "⌘⇧C",
    "clipboard-history": "⌘⇧V"
  },
  "enabledCommands": {
    "calculator": true,
    "clipboard-history": true
  }
}
```

## 🔑 Keyboard Shortcuts

### Global
- `Shift+Space` - Open/close launcher
- Custom shortcuts - Trigger specific commands

### In Launcher
- `↑`/`↓` - Navigate through results
- `Enter` - Execute selected command
- `Esc` - Navigate back / Clear input / Close window
- Type to search

### In Settings
- `Esc` - Return to main window
- Click hotkey field - Record custom shortcut

## 🛠️ Development

### Creating an Extension

1. Create a new directory in `extensions/`
2. Add `package.json`:

```json
{
  "name": "my-extension",
  "title": "My Extension",
  "description": "Description of my extension",
  "version": "1.0.0",
  "main": "index.ts",
  "commands": [
    {
      "id": "my-command",
      "name": "My Command",
      "desc": "Command description"
    }
  ]
}
```

3. Implement `index.ts`:

```typescript
import { IExtension, IAction } from 'keyerext'

export default class MyExtension implements IExtension {
  async onPrepare() {}

  onSearch(input: string): IAction[] {
    return [{
      id: 'my-command',
      name: 'My Command',
      desc: 'Command description',
      typeLabel: 'Command'
    }]
  }

  async doAction(action: IAction) {
    // Do something
    return null // Close window
  }
}
```

4. Build extension:

```bash
cd extensions/my-extension
npm run build
```

### Creating a Script

1. Create a shell script in `scripts/`
2. Add metadata comments
3. Make it executable: `chmod +x script.sh`

See `samples/blank-plugin/` for a complete template.

## 🏗️ Tech Stack

- **Electron** - Cross-platform desktop framework
- **React** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **keyerext** - Custom UI component library

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 🙏 Acknowledgments

Inspired by [Raycast](https://raycast.com/) and [Alfred](https://www.alfredapp.com/).
