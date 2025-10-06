# Repository Manager for VS Code

A powerful VS Code extension that helps you manage multiple Git repositories from a single interface. Quickly switch between projects, check repository status, and perform common Git operations.

## Features

- 📁 **Automatic Repository Discovery**: Scans configured directories to find all Git repositories
- 🌳 **Tree View Interface**: Browse all your repositories in a clean, organized tree view in the Explorer sidebar
- 🔍 **Repository Status**: See current branch and uncommitted changes at a glance
- 🚀 **Quick Actions**: Open repositories, launch terminals, and manage projects with one click
- 📋 **Repository Details**: View detailed information about each repository including remote URLs and last modified dates
- ⚙️ **Customizable**: Configure scan paths, ignored folders, and scan depth

## Installation

1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P` to open the Quick Open dialog
3. Type `ext install repo-manager` and press Enter
4. Click the Install button

## Usage

### Basic Usage

Once installed, you'll see a new "Repository Manager" section in the Explorer sidebar. The extension will automatically scan for Git repositories in common locations like:
- `~/projects`
- `~/repos`
- `~/work`

### Available Commands

All commands are available through the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **Refresh Repositories**: Re-scan for repositories
- **Open Repository**: Open a repository in the current VS Code window
- **Open in New Window**: Open a repository in a new VS Code window
- **Open in Terminal**: Open a terminal in the repository directory
- **Clone Repository**: Clone a new repository from a URL
- **Add Repository Folder**: Manually add a repository that's outside the scan paths
- **Remove from List**: Remove a manually added repository from the list
- **Show Repository Details**: View detailed information about a repository

### Context Menu Actions

Right-click on any repository in the tree view to access quick actions:
- Open Repository
- Open in New Window
- Open in Terminal
- Show Repository Details
- Remove from List (for manually added repositories)

## Configuration

Configure the extension through VS Code settings (`File > Preferences > Settings` or `Ctrl+,` / `Cmd+,`):

### `repoManager.scanPaths`
- **Type**: Array of strings
- **Default**: `["~/projects", "~/repos", "~/work"]`
- **Description**: Paths to scan for Git repositories. Use `~` for home directory.

### `repoManager.ignoredFolders`
- **Type**: Array of strings
- **Default**: `["node_modules", ".git", "dist", "build"]`
- **Description**: Folders to ignore when scanning for repositories

### `repoManager.maxDepth`
- **Type**: Number
- **Default**: `3`
- **Description**: Maximum depth to scan for repositories

### `repoManager.showRepoStatus`
- **Type**: Boolean
- **Default**: `true`
- **Description**: Show repository status (branch, changes) in the tree view

## Example Configuration

```json
{
    "repoManager.scanPaths": [
        "~/projects",
        "~/work",
        "~/personal",
        "/opt/repos"
    ],
    "repoManager.ignoredFolders": [
        "node_modules",
        ".git",
        "dist",
        "build",
        "vendor"
    ],
    "repoManager.maxDepth": 4,
    "repoManager.showRepoStatus": true
}
```

## Features in Detail

### Repository Status Indicators

- **Branch Name**: Shows the current Git branch
- **Modified Indicator**: A filled circle appears next to repositories with uncommitted changes
- **Icon Color**: Modified repositories show with a different color theme

### Repository Details View

Click "Show Repository Details" to see:
- Full repository path
- Current branch
- Clean/Modified status
- Remote repository URL
- Last modified timestamp

### Smart Scanning

The extension intelligently scans for repositories:
- Avoids scanning ignored folders for better performance
- Respects the maximum depth setting
- Removes duplicate repositories
- Sorts repositories alphabetically

## Tips

1. **Custom Repository Locations**: Use "Add Repository Folder" to add repositories outside your standard directories
2. **Quick Terminal Access**: Right-click and "Open in Terminal" for quick command-line access
3. **Multiple Windows**: Use "Open in New Window" to work on multiple projects simultaneously
4. **Stay Organized**: Configure scan paths to match your project organization structure

## Requirements

- VS Code 1.74.0 or higher
- Git must be installed and available in your system PATH

## Known Issues

- Large repository scans may take a few seconds on first load
- Repository status updates require a manual refresh

## Contributing

Found a bug or have a feature request? Please open an issue on our [GitHub repository](https://github.com/yourusername/repo-manager).

## License

This extension is licensed under the MIT License.