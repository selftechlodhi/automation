export interface GitHubComment {
  id: number;
  body: string;
  user: {
    login: string;
  };
  created_at: string;
  updated_at: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  body: string;
  head: {
    ref: string;
    sha: string;
    repo: {
      full_name: string;
    };
  };
  base: {
    ref: string;
    sha: string;
    repo: {
      full_name: string;
    };
  };
  state: string;
  mergeable: boolean;
}

export interface GitHubFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string;
}

export interface GitHubWebhookPayload {
  action: string;
  comment?: GitHubComment;
  pull_request?: GitHubPR;
  repository: {
    full_name: string;
    name: string;
    owner: {
      login: string;
    };
  };
  sender: {
    login: string;
  };
}

export interface CodeChange {
  filename: string;
  content: string;
  lineNumber?: number;
  description: string;
}

export interface AIAnalysisResult {
  shouldApply: boolean;
  changes: CodeChange[];
  reasoning: string;
  confidence: number;
}

export interface GitConfig {
  userName: string;
  userEmail: string;
  token: string;
}

export interface Config {
  github: {
    token: string;
    webhookSecret: string;
    appId: string;
    privateKey: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
  server: {
    port: number;
    webhookUrl: string;
  };
  git: GitConfig;
  repo: {
    owner: string;
    name: string;
  };
} 