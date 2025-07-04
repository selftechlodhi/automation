import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { config } from '../config';
import { GitHubPR, GitHubComment, GitHubFile, GitHubWebhookPayload } from '../types';

export class GitHubService {
  private api: AxiosInstance;
  private baseURL = 'https://api.github.com';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `token ${config.github.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AI-PR-Comment-Fixer-Bot'
      }
    });
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', config.github.webhookSecret)
      .update(payload)
      .digest('hex')}`;
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get PR details
   */
  async getPullRequest(owner: string, repo: string, prNumber: number): Promise<GitHubPR> {
    const response = await this.api.get(`/repos/${owner}/${repo}/pulls/${prNumber}`);
    return response.data;
  }

  /**
   * Get PR comments
   */
  async getPullRequestComments(owner: string, repo: string, prNumber: number): Promise<GitHubComment[]> {
    const response = await this.api.get(`/repos/${owner}/${repo}/pulls/${prNumber}/comments`);
    return response.data;
  }

  /**
   * Get PR files
   */
  async getPullRequestFiles(owner: string, repo: string, prNumber: number): Promise<GitHubFile[]> {
    const response = await this.api.get(`/repos/${owner}/${repo}/pulls/${prNumber}/files`);
    return response.data;
  }

  /**
   * Get file content
   */
  async getFileContent(owner: string, repo: string, path: string, ref: string): Promise<string> {
    const response = await this.api.get(`/repos/${owner}/${repo}/contents/${path}`, {
      params: { ref }
    });
    
    // GitHub returns content as base64 encoded
    return Buffer.from(response.data.content, 'base64').toString('utf-8');
  }

  /**
   * Create a comment on PR
   */
  async createComment(owner: string, repo: string, prNumber: number, body: string): Promise<GitHubComment> {
    const response = await this.api.post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
      body
    });
    return response.data;
  }

  /**
   * Update a comment
   */
  async updateComment(owner: string, repo: string, commentId: number, body: string): Promise<GitHubComment> {
    const response = await this.api.patch(`/repos/${owner}/${repo}/pulls/comments/${commentId}`, {
      body
    });
    return response.data;
  }

  /**
   * Get repository details
   */
  async getRepository(owner: string, repo: string): Promise<any> {
    const response = await this.api.get(`/repos/${owner}/${repo}`);
    return response.data;
  }

  /**
   * Get commit details
   */
  async getCommit(owner: string, repo: string, sha: string): Promise<any> {
    const response = await this.api.get(`/repos/${owner}/${repo}/commits/${sha}`);
    return response.data;
  }

  /**
   * Get diff between two commits
   */
  async getDiff(owner: string, repo: string, base: string, head: string): Promise<string> {
    const response = await this.api.get(`/repos/${owner}/${repo}/compare/${base}...${head}`, {
      headers: {
        'Accept': 'application/vnd.github.v3.diff'
      }
    });
    return response.data;
  }
} 