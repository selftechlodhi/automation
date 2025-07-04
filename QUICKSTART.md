# 🚀 Quick Start Guide

Get your AI PR Comment Fixer Bot running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Git installed
- GitHub account with a repository
- OpenAI API key

## Step 1: Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-pr-comment-fixer

# Run the interactive setup
npm run setup
```

The setup script will guide you through configuring:
- GitHub Personal Access Token
- OpenAI API Key
- Webhook URL
- Repository details

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Build the Project

```bash
npm run build
```

## Step 4: Start the Bot

### Option A: Local Development
```bash
npm run dev
```

### Option B: Production
```bash
npm start
```

### Option C: Docker
```bash
docker-compose up -d
```

## Step 5: Set Up GitHub Webhook

1. Go to your repository on GitHub
2. Navigate to Settings → Webhooks
3. Click "Add webhook"
4. Configure:
   - **Payload URL**: `https://your-domain.com/webhook` (or `http://localhost:3000/webhook` for local testing)
   - **Content type**: `application/json`
   - **Secret**: Use the secret generated during setup
   - **Events**: Select "Let me select individual events"
     - ✓ Pull request review comments
     - ✓ Issue comments

## Step 6: Test the Bot

1. Create a pull request in your repository
2. Add a comment like: "Fix the typo: 'recieve' should be 'receive'"
3. Watch the bot process the comment and create a fix branch!

## 🐛 Troubleshooting

### Bot not responding to comments?
- Check the webhook URL is accessible
- Verify the webhook secret matches
- Check bot logs for errors

### AI analysis failing?
- Verify your OpenAI API key is valid
- Check your OpenAI account has credits
- Review the bot logs for API errors

### Git operations failing?
- Ensure your GitHub token has `repo` permissions
- Check the repository exists and is accessible
- Verify Git is properly configured

## 📊 Monitoring

Check if the bot is running:
```bash
curl http://localhost:3000/health
```

View logs:
```bash
# If running locally
npm run dev

# If running with Docker
docker-compose logs -f ai-pr-bot
```

## 🔧 Configuration

All configuration is in the `.env` file. Key settings:

- `GITHUB_TOKEN`: Your GitHub Personal Access Token
- `OPENAI_API_KEY`: Your OpenAI API Key
- `WEBHOOK_URL`: Public URL where GitHub can reach your bot
- `REPO_OWNER` & `REPO_NAME`: The repository to monitor

## 🎯 Next Steps

- [Read the full documentation](README.md)
- [Set up monitoring and alerts](README.md#monitoring)
- [Configure production deployment](README.md#deployment)
- [Customize AI analysis rules](src/services/openai.ts)

---

**Need help?** Check the [troubleshooting section](README.md#troubleshooting) or create an issue! 