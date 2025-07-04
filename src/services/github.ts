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
  verifyWebhookSignature(payload: Buffer, signature: string): boolean {
    // Compute the expected signature (hex string)
    const expectedSignature = crypto
      .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET || 'd1169ad263cd1fcbbdf23f47a8089e839b2f7665eecbb2f3993845226655f620')
      .update(payload)
      .digest('hex');
  
    // Remove 'sha256=' prefix if present
    const signatureHex = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  
    try {
      // Compare using timingSafeEqual
      return crypto.timingSafeEqual(
        Buffer.from(signatureHex, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (e) {
      // If lengths don't match, timingSafeEqual throws
      console.log('verifyWebhookSignature error:', e);
      return false;
    }
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