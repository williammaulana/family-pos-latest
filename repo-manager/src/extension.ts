import * as vscode from 'vscode';
import { RepoManagerProvider } from './repoManagerProvider';
import { RepoScanner } from './repoScanner';
import { Repository } from './types';
import * as path from 'path';
import * as os from 'os';

export function activate(context: vscode.ExtensionContext) {
    console.log('Repository Manager is now active!');

    const repoScanner = new RepoScanner(context);
    const repoManagerProvider = new RepoManagerProvider(context, repoScanner);
    
    // Register the tree data provider
    vscode.window.registerTreeDataProvider('repoManagerView', repoManagerProvider);
    
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('repoManager.refresh', () => {
            repoManagerProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('repoManager.openRepo', (repo: Repository) => {
            const uri = vscode.Uri.file(repo.path);
            vscode.commands.executeCommand('vscode.openFolder', uri, false);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('repoManager.openInNewWindow', (repo: Repository) => {
            const uri = vscode.Uri.file(repo.path);
            vscode.commands.executeCommand('vscode.openFolder', uri, true);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('repoManager.openInTerminal', (repo: Repository) => {
            const terminal = vscode.window.createTerminal({
                name: `Terminal: ${repo.name}`,
                cwd: repo.path
            });
            terminal.show();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('repoManager.cloneRepo', async () => {
            const repoUrl = await vscode.window.showInputBox({
                prompt: 'Enter repository URL to clone',
                placeHolder: 'https://github.com/user/repo.git'
            });

            if (!repoUrl) {
                return;
            }

            const scanPaths = vscode.workspace.getConfiguration('repoManager').get<string[]>('scanPaths', ['~/projects']);
            const defaultPath = scanPaths[0].replace('~', os.homedir());
            
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                defaultUri: vscode.Uri.file(defaultPath),
                openLabel: 'Select Clone Location'
            });

            if (!folderUri || folderUri.length === 0) {
                return;
            }

            const clonePath = folderUri[0].fsPath;
            const repoName = path.basename(repoUrl, '.git');
            
            const terminal = vscode.window.createTerminal({
                name: 'Git Clone',
                cwd: clonePath
            });
            
            terminal.sendText(`git clone ${repoUrl}`);
            terminal.show();
            
            // Refresh after a delay to allow clone to complete
            setTimeout(() => {
                repoManagerProvider.refresh();
            }, 5000);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('repoManager.addFolder', async () => {
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select Repository Folder'
            });

            if (!folderUri || folderUri.length === 0) {
                return;
            }

            const folderPath = folderUri[0].fsPath;
            await repoScanner.addCustomRepo(folderPath);
            repoManagerProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('repoManager.removeRepo', async (repo: Repository) => {
            const answer = await vscode.window.showInformationMessage(
                `Remove "${repo.name}" from the repository list?`,
                'Yes',
                'No'
            );

            if (answer === 'Yes') {
                await repoScanner.removeRepo(repo.path);
                repoManagerProvider.refresh();
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('repoManager.showRepoDetails', async (repo: Repository) => {
            const panel = vscode.window.createWebviewPanel(
                'repoDetails',
                `Repository: ${repo.name}`,
                vscode.ViewColumn.One,
                {
                    enableScripts: true
                }
            );

            panel.webview.html = getRepoDetailsHtml(repo);
        })
    );

    // Initial scan
    repoManagerProvider.refresh();
}

function getRepoDetailsHtml(repo: Repository): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Repository Details</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
                line-height: 1.6;
            }
            h1 {
                color: var(--vscode-titleBar-activeForeground);
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 10px;
            }
            .info-section {
                margin: 20px 0;
                padding: 15px;
                background-color: var(--vscode-editor-inactiveSelectionBackground);
                border-radius: 5px;
            }
            .info-item {
                margin: 10px 0;
            }
            .label {
                font-weight: bold;
                color: var(--vscode-textLink-foreground);
            }
            .status {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 3px;
                font-size: 12px;
            }
            .status.clean {
                background-color: var(--vscode-terminal-ansiGreen);
                color: var(--vscode-editor-background);
            }
            .status.dirty {
                background-color: var(--vscode-terminal-ansiYellow);
                color: var(--vscode-editor-background);
            }
        </style>
    </head>
    <body>
        <h1>${repo.name}</h1>
        
        <div class="info-section">
            <div class="info-item">
                <span class="label">Path:</span> ${repo.path}
            </div>
            <div class="info-item">
                <span class="label">Current Branch:</span> ${repo.currentBranch || 'Unknown'}
            </div>
            <div class="info-item">
                <span class="label">Status:</span> 
                <span class="status ${repo.hasChanges ? 'dirty' : 'clean'}">
                    ${repo.hasChanges ? 'Modified' : 'Clean'}
                </span>
            </div>
            ${repo.remoteUrl ? `
            <div class="info-item">
                <span class="label">Remote URL:</span> ${repo.remoteUrl}
            </div>
            ` : ''}
            <div class="info-item">
                <span class="label">Last Modified:</span> ${repo.lastModified ? new Date(repo.lastModified).toLocaleString() : 'Unknown'}
            </div>
        </div>
    </body>
    </html>`;
}

export function deactivate() {}