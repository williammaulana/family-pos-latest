import * as vscode from 'vscode';
import { RepoTreeProvider, RepoItem } from './tree/RepoTreeProvider';
import { GitService } from './git/GitService';

export async function activate(context: vscode.ExtensionContext) {
  const gitService = new GitService();
  const tree = new RepoTreeProvider(context, gitService);
  const treeView = vscode.window.createTreeView('repoManager.repos', {
    treeDataProvider: tree,
    showCollapseAll: false,
  });

  context.subscriptions.push(treeView);

  context.subscriptions.push(
    vscode.commands.registerCommand('repoManager.refresh', () => tree.refresh()),
    vscode.commands.registerCommand('repoManager.scanWorkspaceRepos', async () => {
      await tree.scanWorkspaceRepos();
    }),
    vscode.commands.registerCommand('repoManager.addRepo', async () => {
      await tree.addRepo();
    }),
    vscode.commands.registerCommand('repoManager.removeRepo', async (item: RepoItem) => {
      await tree.removeRepo(item);
    }),
    vscode.commands.registerCommand('repoManager.openRepo', async (item: RepoItem) => {
      await tree.openRepo(item);
    }),
    vscode.commands.registerCommand('repoManager.cloneRepo', async () => {
      await tree.cloneRepo();
    }),
    vscode.commands.registerCommand('repoManager.fetchRepo', async (item: RepoItem) => {
      await tree.gitAction(item, 'fetch');
    }),
    vscode.commands.registerCommand('repoManager.pullRepo', async (item: RepoItem) => {
      await tree.gitAction(item, 'pull');
    }),
    vscode.commands.registerCommand('repoManager.pushRepo', async (item: RepoItem) => {
      await tree.gitAction(item, 'push');
    })
  );

  const autoScan = vscode.workspace.getConfiguration('repoManager').get<boolean>('autoScanOnStartup', true);
  if (autoScan) {
    setTimeout(() => tree.scanWorkspaceRepos(), 500);
  }
}

export function deactivate() {
  // noop
}
