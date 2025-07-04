#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('🤖 AI PR Comment Fixer Bot Setup\n');
  console.log('This script will help you configure the bot.\n');

  const envPath = path.join(process.cwd(), '.env');
  
  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('\n📋 Required Configuration:\n');

  // GitHub Configuration
  console.log('🔑 GitHub Configuration:');
  const githubToken = await question('GitHub Personal Access Token: ');
  const webhookSecret = crypto.randomBytes(32).toString('hex');
  console.log(`Generated webhook secret: ${webhookSecret}`);
  
  const githubAppId = await question('GitHub App ID (optional, press Enter to skip): ');
  const githubPrivateKey = await question('GitHub App Private Key (optional, press Enter to skip): ');

  // OpenAI Configuration
  console.log('\n🤖 OpenAI Configuration:');
  const openaiApiKey = await question('OpenAI API Key: ');
  const openaiModel = await question('OpenAI Model (default: gpt-4): ') || 'gpt-4';

  // Server Configuration
  console.log('\n🌐 Server Configuration:');
  const port = await question('Server Port (default: 3000): ') || '3000';
  const webhookUrl = await question('Webhook URL (e.g., https://your-domain.com/webhook): ');

  // Git Configuration
  console.log('\n📝 Git Configuration:');
  const gitUserName = await question('Git User Name (default: AI Comment Fixer Bot): ') || 'AI Comment Fixer Bot';
  const gitUserEmail = await question('Git User Email: ');

  // Repository Configuration
  console.log('\n📦 Repository Configuration:');
  const repoOwner = await question('Repository Owner (GitHub username): ');
  const repoName = await question('Repository Name: ');

  // Generate .env content
  const envContent = `# GitHub Configuration
GITHUB_TOKEN=${githubToken}
GITHUB_WEBHOOK_SECRET=${webhookSecret}
GITHUB_APP_ID=${githubAppId}
GITHUB_PRIVATE_KEY=${githubPrivateKey}

# OpenAI Configuration
OPENAI_API_KEY=${openaiApiKey}
OPENAI_MODEL=${openaiModel}

# Server Configuration
PORT=${port}
WEBHOOK_URL=${webhookUrl}

# Git Configuration
GIT_USER_NAME=${gitUserName}
GIT_USER_EMAIL=${gitUserEmail}

# Repository Configuration
REPO_OWNER=${repoOwner}
REPO_NAME=${repoName}
`;

  // Write .env file
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ Configuration saved to .env file');

  // Generate webhook secret for user
  console.log('\n🔐 Webhook Secret Generated:');
  console.log(`Use this secret when setting up your GitHub webhook: ${webhookSecret}`);

  // Next steps
  console.log('\n📋 Next Steps:');
  console.log('1. Set up GitHub webhook:');
  console.log(`   - URL: ${webhookUrl}`);
  console.log(`   - Secret: ${webhookSecret}`);
  console.log('   - Events: Pull request review comments, Issue comments');
  console.log('\n2. Install dependencies:');
  console.log('   npm install');
  console.log('\n3. Build the project:');
  console.log('   npm run build');
  console.log('\n4. Start the bot:');
  console.log('   npm run dev');
  console.log('\n5. Test the webhook:');
  console.log('   - Create a PR comment');
  console.log('   - Check bot logs for processing');

  rl.close();
}

setup().catch(console.error); 