import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Repository } from './types';
import simpleGit, { SimpleGit } from 'simple-git';

export class RepoScanner {
    private customRepos: string[] = [];
    
    constructor(private context: vscode.ExtensionContext) {
        this.loadCustomRepos();
    }

    async scanForRepositories(): Promise<Repository[]> {
        const config = vscode.workspace.getConfiguration('repoManager');
        const scanPaths = config.get<string[]>('scanPaths', ['~/projects', '~/repos', '~/work']);
        const ignoredFolders = config.get<string[]>('ignoredFolders', ['node_modules', '.git', 'dist', 'build']);
        const maxDepth = config.get<number>('maxDepth', 3);
        
        const repositories: Repository[] = [];
        
        // Scan configured paths
        for (const scanPath of scanPaths) {
            const expandedPath = scanPath.replace('~', os.homedir());
            if (fs.existsSync(expandedPath)) {
                const foundRepos = await this.scanDirectory(expandedPath, ignoredFolders, maxDepth);
                repositories.push(...foundRepos);
            }
        }
        
        // Add custom repositories
        for (const customRepoPath of this.customRepos) {
            if (fs.existsSync(customRepoPath) && await this.isGitRepository(customRepoPath)) {
                const repo = await this.createRepository(customRepoPath, true);
                if (repo) {
                    repositories.push(repo);
                }
            }
        }
        
        // Remove duplicates
        const uniqueRepos = repositories.filter((repo, index, self) =>
            index === self.findIndex((r) => r.path === repo.path)
        );
        
        // Sort by name
        uniqueRepos.sort((a, b) => a.name.localeCompare(b.name));
        
        return uniqueRepos;
    }

    private async scanDirectory(dirPath: string, ignoredFolders: string[], maxDepth: number, currentDepth: number = 0): Promise<Repository[]> {
        const repositories: Repository[] = [];
        
        if (currentDepth >= maxDepth) {
            return repositories;
        }
        
        try {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                if (!entry.isDirectory() || ignoredFolders.includes(entry.name)) {
                    continue;
                }
                
                const fullPath = path.join(dirPath, entry.name);
                
                if (await this.isGitRepository(fullPath)) {
                    const repo = await this.createRepository(fullPath);
                    if (repo) {
                        repositories.push(repo);
                    }
                } else {
                    // Recursively scan subdirectories
                    const subRepos = await this.scanDirectory(fullPath, ignoredFolders, maxDepth, currentDepth + 1);
                    repositories.push(...subRepos);
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${dirPath}:`, error);
        }
        
        return repositories;
    }

    private async isGitRepository(dirPath: string): Promise<boolean> {
        try {
            const gitPath = path.join(dirPath, '.git');
            const stats = await fs.promises.stat(gitPath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }

    private async createRepository(repoPath: string, isCustom: boolean = false): Promise<Repository | null> {
        try {
            const git: SimpleGit = simpleGit(repoPath);
            const name = path.basename(repoPath);
            
            let currentBranch: string | undefined;
            let hasChanges = false;
            let remoteUrl: string | undefined;
            
            try {
                // Get current branch
                const branchSummary = await git.branchLocal();
                currentBranch = branchSummary.current;
                
                // Check for changes
                const status = await git.status();
                hasChanges = !status.isClean();
                
                // Get remote URL
                const remotes = await git.getRemotes(true);
                if (remotes.length > 0) {
                    remoteUrl = remotes[0].refs.fetch;
                }
            } catch (error) {
                console.error(`Error getting git info for ${repoPath}:`, error);
            }
            
            // Get last modified time
            const stats = await fs.promises.stat(repoPath);
            
            return {
                name,
                path: repoPath,
                currentBranch,
                hasChanges,
                remoteUrl,
                lastModified: stats.mtime.getTime(),
                isCustom
            };
        } catch (error) {
            console.error(`Error creating repository object for ${repoPath}:`, error);
            return null;
        }
    }

    async addCustomRepo(repoPath: string): Promise<void> {
        if (!this.customRepos.includes(repoPath)) {
            this.customRepos.push(repoPath);
            await this.saveCustomRepos();
        }
    }

    async removeRepo(repoPath: string): Promise<void> {
        const index = this.customRepos.indexOf(repoPath);
        if (index > -1) {
            this.customRepos.splice(index, 1);
            await this.saveCustomRepos();
        }
    }

    private loadCustomRepos(): void {
        const saved = this.context.globalState.get<string[]>('customRepos', []);
        this.customRepos = saved;
    }

    private async saveCustomRepos(): Promise<void> {
        await this.context.globalState.update('customRepos', this.customRepos);
    }
}