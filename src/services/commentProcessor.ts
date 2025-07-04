import { GitHubService } from './github';
import { OpenAIService } from './openai';
import { GitService } from './git';
import { GitHubWebhookPayload, GitHubComment, GitHubPR, GitHubFile, AIAnalysisResult } from '../types';
import path from 'path';
import fs from 'fs';

export class CommentProcessor {
  private githubService: GitHubService;
  private openaiService: OpenAIService;
  private gitService!: GitService; // Using definite assignment assertion
  private tempDir: string;

  constructor() {
    this.githubService = new GitHubService();
    this.openaiService = new OpenAIService();
    this.tempDir = path.join(process.cwd(), 'temp-repos');
    
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Main method to process a PR comment
   */
  async processComment(payload: GitHubWebhookPayload): Promise<void> {
    try {
      console.log('Processing PR comment...');
      
      if (!payload.comment || !payload.pull_request) {
        console.log('No comment or PR found in payload');
        return;
      }

      const { comment, pull_request, repository } = payload;
      
      console.log(`Processing comment ${comment.id} on PR ${pull_request.number}`);
      console.log(`Repository: ${repository.full_name}`);

      // Skip if comment is from the bot itself
      if (comment.user.login === 'AI Comment Fixer Bot') {
        console.log('Skipping comment from bot itself');
        return;
      }

      // Analyze the comment
      const analysis = await this.analyzeComment(comment, pull_request, repository);
      
      if (!analysis.shouldApply) {
        console.log('Comment should not be applied:', analysis.reasoning);
        await this.addAnalysisComment(comment, pull_request, repository, analysis);
        return;
      }

      // Apply the changes
      await this.applyChanges(comment, pull_request, repository, analysis);
      
    } catch (error) {
      console.error('Error processing comment:', error);
      await this.handleError(payload, error);
    }
  }

  /**
   * Analyze a comment using AI
   */
  private async analyzeComment(
    comment: GitHubComment,
    pr: GitHubPR,
    repository: any
  ): Promise<AIAnalysisResult> {
    console.log('Analyzing comment with AI...');

    // Get PR files
    const files = await this.githubService.getPullRequestFiles(
      repository.owner.login,
      repository.name,
      pr.number
    );

    // Get file contents
    const fileContents = new Map<string, string>();
    for (const file of files) {
      try {
        const content = await this.githubService.getFileContent(
          repository.owner.login,
          repository.name,
          file.filename,
          pr.head.sha
        );
        fileContents.set(file.filename, content);
      } catch (error) {
        console.warn(`Could not fetch content for ${file.filename}:`, error);
        fileContents.set(file.filename, 'File content not available');
      }
    }

    // Analyze with AI
    return await this.openaiService.analyzeComment(comment, pr, files, fileContents);
  }

  /**
   * Apply changes to the codebase
   */
  private async applyChanges(
    comment: GitHubComment,
    pr: GitHubPR,
    repository: any,
    analysis: AIAnalysisResult
  ): Promise<void> {
    console.log('Applying changes...');

    const repoPath = path.join(this.tempDir, `${repository.owner.login}-${repository.name}`);
    this.gitService = new GitService(repoPath);

    try {
      // Setup repository
      await this.gitService.setupRepository(
        repository.owner.login,
        repository.name,
        pr.base.ref
      );

      // Create fix branch
      const fixBranch = await this.gitService.createFixBranch(pr.base.ref, pr.number);
      console.log(`Created fix branch: ${fixBranch}`);

      // Apply changes
      await this.gitService.applyChanges(analysis.changes);

      // Commit changes
      const commitSha = await this.gitService.commitChanges(
        pr.number,
        comment.id,
        analysis.changes
      );
      console.log(`Committed changes: ${commitSha}`);

      // Push changes
      await this.gitService.pushChanges(fixBranch);
      console.log(`Pushed changes to branch: ${fixBranch}`);

      // Add success comment
      await this.addSuccessComment(comment, pr, repository, analysis, fixBranch);

    } catch (error) {
      console.error('Error applying changes:', error);
      throw error;
    }
  }

  /**
   * Add analysis comment when changes are not applied
   */
  private async addAnalysisComment(
    comment: GitHubComment,
    pr: GitHubPR,
    repository: any,
    analysis: AIAnalysisResult
  ): Promise<void> {
    const message = `🤖 **AI Analysis**

**Decision:** ${analysis.shouldApply ? '✅ Will apply' : '❌ Will not apply'}

**Reasoning:** ${analysis.reasoning}

**Confidence:** ${Math.round(analysis.confidence * 100)}%

${analysis.changes.length > 0 ? `**Proposed Changes:**\n${analysis.changes.map(c => `- ${c.filename}: ${c.description}`).join('\n')}` : ''}

---
*This analysis was performed by the AI Comment Fixer Bot*`;

    await this.githubService.createComment(
      repository.owner.login,
      repository.name,
      pr.number,
      message
    );
  }

  /**
   * Add success comment when changes are applied
   */
  private async addSuccessComment(
    comment: GitHubComment,
    pr: GitHubPR,
    repository: any,
    analysis: AIAnalysisResult,
    fixBranch: string
  ): Promise<void> {
    const summary = await this.openaiService.generateChangeSummary(analysis.changes);
    
    const message = `✅ **Changes Applied Successfully**

${summary}

**Branch:** \`${fixBranch}\`
**Confidence:** ${Math.round(analysis.confidence * 100)}%

**Changes Made:**
${analysis.changes.map(c => `- ${c.filename}: ${c.description}`).join('\n')}

**Next Steps:**
1. Review the changes in the new branch
2. Create a new PR from \`${fixBranch}\` to \`${pr.base.ref}\`
3. Or merge the changes directly if approved

---
*Applied by AI Comment Fixer Bot*`;

    await this.githubService.createComment(
      repository.owner.login,
      repository.name,
      pr.number,
      message
    );
  }

  /**
   * Handle errors and add error comment
   */
  private async handleError(payload: GitHubWebhookPayload, error: any): Promise<void> {
    if (!payload.comment || !payload.pull_request) {
      return;
    }

    const errorMessage = `❌ **Error Processing Comment**

An error occurred while processing this comment:

\`\`\`
${error instanceof Error ? error.message : 'Unknown error'}
\`\`\`

**Error Type:** ${error instanceof Error ? error.constructor.name : 'Unknown'}

Please check the bot logs for more details or try again later.

---
*AI Comment Fixer Bot*`;

    try {
      await this.githubService.createComment(
        payload.repository.owner.login,
        payload.repository.name,
        payload.pull_request.number,
        errorMessage
      );
    } catch (commentError) {
      console.error('Failed to add error comment:', commentError);
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanup(): Promise<void> {
    try {
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
        console.log('Cleaned up temporary files');
      }
    } catch (error) {
      console.warn('Failed to cleanup temporary files:', error);
    }
  }
} 