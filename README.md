# AI PR Comment Fixer Bot

An intelligent GitHub bot that automatically analyzes PR comments and applies code fixes using OpenAI's GPT models. This bot listens for GitHub webhooks, processes PR comments, and automatically creates fix branches with the suggested changes.

## 🚀 Features

- **Automatic Comment Analysis**: Uses OpenAI GPT to understand PR comments and determine if they should be applied
- **Smart Code Fixes**: Applies only clear, unambiguous technical improvements
- **GitHub Integration**: Full GitHub API integration with webhook support
- **TypeScript Support**: Built with TypeScript for type safety and better development experience
- **Automatic Branching**: Creates new branches for fixes to maintain clean history
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Error Handling**: Robust error handling with informative GitHub comments

## 🏗️ Architecture

```
GitHub Webhook → Express Server → Comment Processor → AI Analysis → Git Operations
```

### Components

1. **Webhook Server** (`src/index.ts`): Express server that receives GitHub webhooks
2. **GitHub Service** (`src/services/github.ts`): Handles GitHub API interactions
3. **OpenAI Service** (`src/services/openai.ts`): Manages AI analysis and code generation
4. **Git Service** (`src/services/git.ts`): Handles repository operations
5. **Comment Processor** (`src/services/commentProcessor.ts`): Orchestrates the entire workflow

## 📋 Prerequisites

- Node.js 18+ 
- Git
- GitHub Personal Access Token
- OpenAI API Key
- Publicly accessible webhook URL (for production)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-pr-comment-fixer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # GitHub Configuration
   GITHUB_TOKEN=your_github_personal_access_token
   GITHUB_WEBHOOK_SECRET=your_webhook_secret
   GITHUB_APP_ID=your_github_app_id
   GITHUB_PRIVATE_KEY=your_github_app_private_key

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL=gpt-4

   # Server Configuration
   PORT=3000
   WEBHOOK_URL=https://your-domain.com/webhook

   # Git Configuration
   GIT_USER_NAME=AI Comment Fixer Bot
   GIT_USER_EMAIL=bot@your-domain.com

   # Repository Configuration
   REPO_OWNER=your_github_username
   REPO_NAME=your_repository_name
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## 🔧 Configuration

### GitHub Setup

1. **Create a Personal Access Token**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate a new token with these permissions:
     - `repo` (Full control of private repositories)
     - `read:org` (Read organization data)
     - `write:discussion` (Write discussion comments)

2. **Set up Webhook**
   - Go to your repository Settings → Webhooks
   - Add webhook with:
     - Payload URL: `https://your-domain.com/webhook`
     - Content type: `application/json`
     - Secret: Generate a random secret and add it to `.env`
     - Events: Select "Let me select individual events"
       - ✓ Pull request review comments
       - ✓ Issue comments

3. **Generate Webhook Secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### OpenAI Setup

1. **Get API Key**
   - Sign up at [OpenAI](https://platform.openai.com/)
   - Create an API key in your account settings
   - Add it to `.env` as `OPENAI_API_KEY`

## 🚀 Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Watch Mode (Development)
```bash
npm run watch
```

## 🔄 How It Works

1. **Webhook Reception**: GitHub sends webhook when a PR comment is created
2. **Signature Verification**: Bot verifies webhook signature for security
3. **Comment Analysis**: OpenAI analyzes the comment to determine if it should be applied
4. **Decision Making**: Bot decides whether to apply changes based on AI analysis
5. **Code Application**: If approved, bot creates a new branch and applies changes
6. **Git Operations**: Changes are committed and pushed to the new branch
7. **Feedback**: Bot adds a comment with results and next steps

## 🤖 AI Analysis Rules

The bot only applies changes that are:
- ✅ Clear and unambiguous code improvements
- ✅ Bug fixes and syntax errors
- ✅ Security issues
- ✅ Obvious technical improvements

The bot does NOT apply:
- ❌ Subjective style changes
- ❌ Opinion-based suggestions
- ❌ Business logic decisions
- ❌ Changes requiring human judgment

## 📝 Example Workflow

1. **Developer creates PR** with some code
2. **Reviewer comments**: "Fix the typo in line 15: 'recieve' should be 'receive'"
3. **Bot analyzes comment** using OpenAI
4. **Bot determines** this is a clear fix that should be applied
5. **Bot creates branch** `fix/pr-123-1234567890`
6. **Bot applies fix** and commits changes
7. **Bot pushes branch** and adds comment with summary
8. **Developer can review** and merge the fix branch

## 🧪 Testing

```bash
# Run tests
npm test

# Test webhook locally (requires ngrok or similar)
ngrok http 3000
# Then update your GitHub webhook URL to the ngrok URL
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### Logs
The bot provides detailed logging for:
- Webhook events received
- AI analysis results
- Git operations
- Errors and exceptions

## 🔒 Security

- **Webhook Signature Verification**: All webhooks are verified using HMAC-SHA256
- **Environment Variables**: Sensitive data stored in environment variables
- **Error Handling**: Comprehensive error handling prevents information leakage
- **Rate Limiting**: Consider implementing rate limiting for production use

## 🚨 Troubleshooting

### Common Issues

1. **Webhook not received**
   - Check webhook URL is accessible
   - Verify webhook secret matches
   - Check GitHub webhook delivery logs

2. **AI analysis fails**
   - Verify OpenAI API key is valid
   - Check API quota and billing
   - Review OpenAI API error logs

3. **Git operations fail**
   - Verify GitHub token has correct permissions
   - Check repository access
   - Ensure Git is properly configured

4. **Build errors**
   - Ensure Node.js version is 18+
   - Clear `node_modules` and reinstall
   - Check TypeScript configuration

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=* npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- GitHub API for webhook and repository access
- OpenAI for AI analysis capabilities
- Express.js for web server framework
- Simple Git for Git operations

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review GitHub issues
3. Create a new issue with detailed information

---

**Note**: This bot is designed for educational and development purposes. Use in production at your own risk and ensure proper testing and monitoring. 