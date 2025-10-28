import * as cp from 'child_process';
import * as path from 'path';

export class GitService {
  async execGit(args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = cp.spawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => (stdout += String(d)));
      child.stderr.on('data', (d) => (stderr += String(d)));
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve({ stdout, stderr });
        else reject(new Error(stderr || `git ${args.join(' ')} failed with code ${code}`));
      });
    });
  }

  async clone(url: string, parentFolder: string): Promise<string> {
    const name = deriveRepoFolderName(url);
    await this.execGit(['clone', url, name], parentFolder);
    return name;
  }
}

function deriveRepoFolderName(url: string): string {
  const cleaned = url.replace(/[\s"'`]/g, '');
  const withoutGit = cleaned.endsWith('.git') ? cleaned.slice(0, -4) : cleaned;
  const parts = withoutGit.split(/[/:]/).filter(Boolean);
  const final = parts[parts.length - 1] ?? 'repo';
  return final.toLowerCase().replace(/[^a-z0-9._-]/gi, '-');
}
