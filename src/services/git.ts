import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { CodeChange } from '../types';

export class GitService {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    
    const gitOptions: SimpleGitOptions = {
      baseDir: repoPath,
      binary: 'git',
      maxConcurrentProcesses: 6,
      trimmed: false,
      config: [],
    };

    this.git = simpleGit(gitOptions);
  }

  /**
   * Clone repository if it doesn't exist, or pull latest changes
   */
  async setupRepository(owner: string, repo: string, branch: string = 'main'): Promise<void> {
    const repoUrl = `https://${config.git.token}@github.com/${owner}/${repo}.git`;
    
    if (!fs.existsSync(this.repoPath)) {
      console.log(`Cloning repository ${owner}/${repo}...`);
      await this.git.clone(repoUrl, this.repoPath);
    } else {
      console.log(`Repository already exists, pulling latest changes...`);
      await this.git.pull();
    }

    // Configure git user
    await this.git.addConfig('user.name', config.git.userName);
    await this.git.addConfig('user.email', config.git.userEmail);

    // Checkout the target branch
    try {
      await this.git.checkout(branch);
    } catch (error) {
      console.log(`Branch ${branch} doesn't exist, creating it...`);
      await this.git.checkoutLocalBranch(branch);
    }
  }

  /**
   * Create a new branch for the fix
   */
  async createFixBranch(baseBranch: string, prNumber: number): Promise<string> {
    const branchName = `fix/pr-${prNumber}-${Date.now()}`;
    
    // Ensure we're on the base branch
    await this.git.checkout(baseBranch);
    await this.git.pull();
    
    // Create and checkout new branch
    await this.git.checkoutLocalBranch(branchName);
    
    return branchName;
  }

  /**
   * Apply code changes to files
   */
  async applyChanges(changes: CodeChange[]): Promise<void> {
    for (const change of changes) {
      const filePath = path.join(this.repoPath, change.filename);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write the new content
      fs.writeFileSync(filePath, change.content, 'utf-8');
      console.log(`Applied changes to ${change.filename}`);
    }
  }

  /**
   * Stage and commit changes
   */
  async commitChanges(prNumber: number, commentId: number, changes: CodeChange[]): Promise<string> {
    // Stage all changed files
    const changedFiles = changes.map(change => change.filename);
    await this.git.add(changedFiles);

    // Check if there are any changes to commit
    const status = await this.git.status();
    if (status.modified.length === 0 && status.created.length === 0) {
      throw new Error('No changes to commit');
    }

    // Create commit message
    const changeDescriptions = changes.map(change => 
      `- ${change.filename}: ${change.description}`
    ).join('\n');

    const commitMessage = `fix: Apply PR comment suggestions

PR: #${prNumber}
Comment: #${commentId}

Changes:
${changeDescriptions}

Applied by AI Comment Fixer Bot`;

    // Commit changes
    const result = await this.git.commit(commitMessage);
    return result.commit;
  }

  /**
   * Push changes to remote repository
   */
  async pushChanges(branchName: string): Promise<void> {
    await this.git.push('origin', branchName);
    console.log(`Pushed changes to branch: ${branchName}`);
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    const result = await this.git.branch();
    return result.current;
  }

  /**
   * Get repository status
   */
  async getStatus(): Promise<any> {
    return await this.git.status();
  }

  /**
   * Get diff of staged changes
   */
  async getStagedDiff(): Promise<string> {
    return await this.git.diff(['--cached']);
  }

  /**
   * Get diff of unstaged changes
   */
  async getUnstagedDiff(): Promise<string> {
    return await this.git.diff();
  }

  /**
   * Reset repository to clean state
   */
  async reset(): Promise<void> {
    await this.git.reset(['--hard']);
    await this.git.clean('f', ['-d']);
  }

  /**
   * Checkout a specific commit
   */
  async checkoutCommit(sha: string): Promise<void> {
    await this.git.checkout(sha);
  }

  /**
   * Get commit history
   */
  async getLog(limit: number = 10): Promise<any[]> {
    const result = await this.git.log(['--oneline', `-${limit}`]);
    return [...result.all];
  }

  /**
   * Check if repository is clean (no uncommitted changes)
   */
  async isClean(): Promise<boolean> {
    const status = await this.git.status();
    return status.isClean();
  }

  /**
   * Get file content at a specific commit
   */
  async getFileContent(filename: string, ref: string = 'HEAD'): Promise<string> {
    try {
      const result = await this.git.show([`${ref}:${filename}`]);
      return result;
    } catch (error) {
      throw new Error(`File ${filename} not found at ${ref}`);
    }
  }
} 