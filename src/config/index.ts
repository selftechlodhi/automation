import dotenv from 'dotenv';
import { Config } from '../types';

dotenv.config();

function validateConfig(): Config {
  const requiredEnvVars = [
    'GITHUB_TOKEN',
    'GITHUB_WEBHOOK_SECRET',
    'OPENAI_API_KEY',
    'GIT_USER_NAME',
    'GIT_USER_EMAIL',
    'REPO_OWNER',
    'REPO_NAME'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    github: {
      token: process.env.GITHUB_TOKEN!,
      webhookSecret: process.env.GITHUB_WEBHOOK_SECRET!,
      appId: process.env.GITHUB_APP_ID || '',
      privateKey: process.env.GITHUB_PRIVATE_KEY || '',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      model: process.env.OPENAI_MODEL || 'gpt-4',
    },
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
      webhookUrl: process.env.WEBHOOK_URL || 'http://localhost:3000/webhook',
    },
    git: {
      userName: process.env.GIT_USER_NAME!,
      userEmail: process.env.GIT_USER_EMAIL!,
      token: process.env.GITHUB_TOKEN!,
    },
    repo: {
      owner: process.env.REPO_OWNER!,
      name: process.env.REPO_NAME!,
    },
  };
}

export const config = validateConfig(); 