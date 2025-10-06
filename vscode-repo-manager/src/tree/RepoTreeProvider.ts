import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitService } from '../git/GitService';

export type GitAction = 'fetch' | 'pull' | 'push';

export interface RepoItem extends vscode.TreeItem {
  repoPath: string;
}

interface StoredState {
  repos: string[];
}

export class RepoTreeProvider implements vscode.TreeDataProvider<RepoItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<RepoItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<RepoItem | undefined | void> = this._onDidChangeTreeData.event;

  private repos: string[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly gitService: GitService
  ) {
    const state = this.getState();
    this.repos = [...new Set(state.repos.filter((p) => !!p))].sort();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
    this.saveState();
  }

  getTreeItem(element: RepoItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<RepoItem[]> {
    if (!this.repos.length) {
      const item = new vscode.TreeItem('No repositories', vscode.TreeItemCollapsibleState.None);
      item.iconPath = new vscode.ThemeIcon('warning');
      item.tooltip = 'Use the + button to add a repository or scan the workspace.';
      return Promise.resolve([]);
    }

    const items = this.repos.map((repoPath) => this.createRepoItem(repoPath));
    return Promise.resolve(items);
  }

  private createRepoItem(repoPath: string): RepoItem {
    const repoName = path.basename(repoPath);
    const item = new vscode.TreeItem(repoName, vscode.TreeItemCollapsibleState.None) as RepoItem;
    item.contextValue = 'repoItem';
    item.resourceUri = vscode.Uri.file(repoPath);
    item.tooltip = repoPath;
    item.iconPath = new vscode.ThemeIcon('source-control');
    (item as RepoItem).repoPath = repoPath;
    item.command = {
      title: 'Open Repository',
      command: 'repoManager.openRepo',
      arguments: [item],
    };
    return item as RepoItem;
  }

  async addRepo(): Promise<void> {
    const selected = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: 'Select Repository Folder',
    });
    if (!selected || !selected[0]) return;
    const repoPath = selected[0].fsPath;
    if (!this.isGitRepo(repoPath)) {
      const pick = await vscode.window.showWarningMessage(
        'Selected folder does not appear to be a Git repository. Add anyway?',
        'Add',
        'Cancel'
      );
      if (pick !== 'Add') return;
    }
    this.repos = [...new Set([...this.repos, repoPath])].sort();
    this.refresh();
  }

  async removeRepo(item: RepoItem): Promise<void> {
    this.repos = this.repos.filter((p) => p !== item.repoPath);
    this.refresh();
  }

  async openRepo(item: RepoItem): Promise<void> {
    const openInNew = vscode.workspace.getConfiguration('repoManager').get<boolean>('openInNewWindow', false);
    await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(item.repoPath), openInNew);
  }

  async cloneRepo(): Promise<void> {
    const url = await vscode.window.showInputBox({
      prompt: 'Enter Git clone URL',
      placeHolder: 'https://github.com/owner/repo.git or git@github.com:owner/repo.git',
      ignoreFocusOut: true,
      validateInput: (value) => (value.trim().length === 0 ? 'URL is required' : undefined),
    });
    if (!url) return;

    const targetFolder = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: 'Select destination folder',
    });
    if (!targetFolder || !targetFolder[0]) return;

    const parent = targetFolder[0].fsPath;
    const name = await this.gitService.clone(url, parent);
    const repoPath = path.join(parent, name);
    if (fs.existsSync(repoPath)) {
      this.repos = [...new Set([...this.repos, repoPath])].sort();
      this.refresh();
      const open = await vscode.window.showInformationMessage('Repository cloned. Open it now?', 'Open', 'Later');
      if (open === 'Open') {
        await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(repoPath), true);
      }
    }
  }

  async gitAction(item: RepoItem, action: 'fetch' | 'pull' | 'push'): Promise<void> {
    const repoPath = item.repoPath;
    const terminalName = `Repo Manager: ${action} ${path.basename(repoPath)}`;
    const terminal = vscode.window.createTerminal({ name: terminalName, cwd: repoPath });
    terminal.show(true);
    switch (action) {
      case 'fetch':
        terminal.sendText('git fetch --all --prune');
        break;
      case 'pull':
        terminal.sendText('git pull --ff-only');
        break;
      case 'push':
        terminal.sendText('git push');
        break;
    }
  }

  async scanWorkspaceRepos(): Promise<void> {
    const includeGlobs = vscode.workspace.getConfiguration('repoManager').get<string[]>('includeGlobs', ['**/.git/config']);
    const excludeGlobs = vscode.workspace.getConfiguration('repoManager').get<string[]>('excludeGlobs', [
      '**/node_modules/**',
      '**/.git/**',
      '**/out/**',
      '**/dist/**',
      '**/.next/**',
    ]);

    const folders = vscode.workspace.workspaceFolders ?? [];
    const found = new Set<string>(this.repos);

    for (const folder of folders) {
      const uris = await vscode.workspace.findFiles(
        new vscode.RelativePattern(folder, includeGlobs[0]),
        new vscode.RelativePattern(folder, `{${excludeGlobs.join(',')}}`),
        1000
      );
      for (const uri of uris) {
        const repoPath = path.dirname(path.dirname(uri.fsPath));
        if (this.isGitRepo(repoPath)) {
          found.add(repoPath);
        }
      }
    }

    this.repos = Array.from(found).sort();
    this.refresh();
    vscode.window.showInformationMessage(`Repo Manager: found ${this.repos.length} repositories`);
  }

  private isGitRepo(folderPath: string): boolean {
    try {
      return fs.existsSync(path.join(folderPath, '.git'));
    } catch {
      return false;
    }
  }

  private getState(): StoredState {
    const raw = this.context.globalState.get<string>('repos', '[]');
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return { repos: parsed.filter((p) => typeof p === 'string') };
      }
      return { repos: [] };
    } catch {
      return { repos: [] };
    }
  }

  private saveState(): void {
    this.context.globalState.update('repos', JSON.stringify(this.repos));
  }
}
