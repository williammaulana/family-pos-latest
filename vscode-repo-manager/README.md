# Repo Manager (VS Code Extension)

Manage and open your Git repositories from a dedicated Activity Bar view.

## Features

- Repositories view with quick open
- Scan workspace for repos (by finding `.git/config`)
- Add/remove repositories manually
- Clone into selected folder
- Git actions via integrated terminal: Fetch, Pull, Push
- Persistent repo list across sessions (stored in global state)

## Commands

- Repo Manager: Refresh
- Repo Manager: Scan Workspace for Repos
- Repo Manager: Add Repository Folder
- Repo Manager: Clone Repository
- Repo Manager: Open Repository
- Repo Manager: Remove Repository
- Repo Manager: Fetch / Pull / Push

## Settings

- `repoManager.autoScanOnStartup` (boolean, default: true)
- `repoManager.openInNewWindow` (boolean, default: false)
- `repoManager.includeGlobs` (array of globs, default: `["**/.git/config"]`)
- `repoManager.excludeGlobs` (array of globs)

## Development

- Install dependencies: `npm install`
- Build: `npm run compile`
- Watch: `npm run watch`
- Launch Extension: Press F5 from VS Code to launch Extension Development Host.

