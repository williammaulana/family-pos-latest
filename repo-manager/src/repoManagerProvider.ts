import * as vscode from 'vscode';
import { Repository } from './types';
import { RepoScanner } from './repoScanner';
import * as path from 'path';

export class RepoManagerProvider implements vscode.TreeDataProvider<Repository> {
    private _onDidChangeTreeData: vscode.EventEmitter<Repository | undefined | null | void> = new vscode.EventEmitter<Repository | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<Repository | undefined | null | void> = this._onDidChangeTreeData.event;

    private repositories: Repository[] = [];

    constructor(
        private context: vscode.ExtensionContext,
        private repoScanner: RepoScanner
    ) {}

    refresh(): void {
        this.loadRepositories().then(() => {
            this._onDidChangeTreeData.fire();
        });
    }

    getTreeItem(element: Repository): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(element.name, vscode.TreeItemCollapsibleState.None);
        
        // Set description with branch and status
        const showStatus = vscode.workspace.getConfiguration('repoManager').get<boolean>('showRepoStatus', true);
        if (showStatus) {
            const parts: string[] = [];
            if (element.currentBranch) {
                parts.push(`$(git-branch) ${element.currentBranch}`);
            }
            if (element.hasChanges) {
                parts.push('$(circle-filled)');
            }
            treeItem.description = parts.join(' ');
        }
        
        // Set tooltip
        const tooltipParts: string[] = [
            `Path: ${element.path}`,
            `Branch: ${element.currentBranch || 'Unknown'}`
        ];
        
        if (element.hasChanges) {
            tooltipParts.push('Status: Has uncommitted changes');
        } else {
            tooltipParts.push('Status: Clean');
        }
        
        if (element.remoteUrl) {
            tooltipParts.push(`Remote: ${element.remoteUrl}`);
        }
        
        treeItem.tooltip = new vscode.MarkdownString(tooltipParts.join('\n\n'));
        
        // Set context value for menu commands
        treeItem.contextValue = 'repository';
        
        // Set icon
        if (element.hasChanges) {
            treeItem.iconPath = new vscode.ThemeIcon('source-control', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'));
        } else {
            treeItem.iconPath = new vscode.ThemeIcon('source-control');
        }
        
        // Make it clickable
        treeItem.command = {
            command: 'repoManager.openRepo',
            title: 'Open Repository',
            arguments: [element]
        };
        
        return treeItem;
    }

    getChildren(element?: Repository): Thenable<Repository[]> {
        if (!element) {
            // Return root level repositories
            return Promise.resolve(this.repositories);
        }
        return Promise.resolve([]);
    }

    private async loadRepositories(): Promise<void> {
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                title: 'Scanning for repositories...',
                cancellable: false
            }, async () => {
                this.repositories = await this.repoScanner.scanForRepositories();
            });
        } catch (error) {
            console.error('Error loading repositories:', error);
            vscode.window.showErrorMessage('Failed to scan for repositories');
            this.repositories = [];
        }
    }
}