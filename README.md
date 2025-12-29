# TaskManager - VS Code Extension

A powerful task management extension for Visual Studio Code with file tracking, cloud synchronization, and offline support.

## Features

### 📋 Task Management
- Create, edit, and delete tasks with rich metadata
- Organize tasks by status (Todo, In Progress, Done, Archived)
- Set priority levels (Low, Medium, High)
- Beautiful, modern UI with dark theme support
- Quick filters and search functionality

### 📁 File Tracking
- Automatic tracking of file changes in your workspace
- Monitor file creation, modification, and access
- Smart filtering of system directories (node_modules, .git, etc.)
- Track file activities for productivity insights

### ☁️ Cloud Synchronization
- Sync tasks and file activities across devices
- Automatic background synchronization every 5 minutes
- Manual sync on demand
- Offline-first architecture - work without internet

### 🔐 Authentication
- Secure user authentication
- User registration and login
- Token-based authentication
- Persistent session management

### 🎨 User Interface
- Access via Activity Bar icon or Command Palette
- Sidebar view for quick access
- Panel view for focused work
- Responsive design with smooth animations
- Real-time statistics and task counters

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions view (Ctrl+Shift+X)
3. Search for "TaskManager"
4. Click Install

### Manual Installation

1. Download the `.vsix` file
2. Open VS Code
3. Go to Extensions view
4. Click "..." menu → "Install from VSIX..."
5. Select the downloaded file

## Quick Start

### First Time Setup

1. **Configure API URL** (if using custom backend):
   - Open Settings (Ctrl+,)
   - Search for `taskmanager.apiUrl`
   - Enter your backend server URL

2. **Register or Login**:
   - Press `Ctrl+Shift+P` (Cmd+Shift+P on Mac)
   - Run "TaskManager: Register to TaskManager" or "TaskManager: Login to TaskManager"
   - Enter your credentials

3. **Open TaskManager**:
   - Click the TaskManager icon in the Activity Bar, or
   - Press `Ctrl+Shift+P` and run "TaskManager: Open TaskManager"

### Creating Your First Task

1. Open TaskManager from the Activity Bar or Command Palette
2. Click "New Task" button
3. Fill in the task details:
   - Title (required)
   - Description (optional)
   - Status
   - Priority
4. Click "Save Task"

## Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `TaskManager: Open TaskManager` | Open task management panel | - |
| `TaskManager: Sync with Server` | Manually sync with backend | - |
| `TaskManager: Login to TaskManager` | Login to your account | - |
| `TaskManager: Register to TaskManager` | Create new account | - |

## Configuration

### Settings

- **`taskmanager.apiUrl`**: Backend API server URL (default: provided server)

### Workspace Settings

You can configure settings per workspace by adding them to `.vscode/settings.json`:

```json
{
  "taskmanager.apiUrl": "https://hjmvhbdp-8080.euw.devtunnels.ms/"
}
```

## Features in Detail

### Task Management

- **Status Management**: Track task progress through different states
- **Priority Levels**: Organize tasks by importance
- **Rich Descriptions**: Add detailed information to tasks
- **Quick Actions**: Edit, complete, archive, or delete tasks with one click

### File Tracking

- **Automatic Tracking**: Files are tracked automatically when you:
  - Create new files
  - Modify existing files
  - Save files
  - Open files
- **Smart Filtering**: System directories are automatically excluded
- **Activity History**: View file modification history

### Synchronization

- **Automatic Sync**: Background synchronization every 5 minutes
- **Manual Sync**: Trigger sync anytime via command
- **Offline Mode**: Create and edit tasks offline, sync when online
- **Conflict Resolution**: Automatic conflict handling

## Requirements

- VS Code version 1.80.0 or higher
- Backend server (optional, for cloud sync)

## Extension Settings

This extension contributes the following settings:

- `taskmanager.apiUrl`: Backend API server URL

## Known Issues

None at this time. Please report issues on [GitHub](https://github.com/pablaofficeal/TaskManeger/issues).

## Release Notes

### 1.4.2
- Added Activity Bar icon for quick access
- Improved sidebar view integration
- Enhanced UI responsiveness
- Bug fixes and performance improvements

### 1.4.1
- Initial release with core features
- Task management
- File tracking
- Cloud synchronization

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the MIT License.

