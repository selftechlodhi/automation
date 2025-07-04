import express from 'express';
import bodyParser from 'body-parser';
import { config } from './config';
import { GitHubService } from './services/github';
import { CommentProcessor } from './services/commentProcessor';
import { GitHubWebhookPayload } from './types';

const app = express();
const githubService = new GitHubService();
const commentProcessor = new CommentProcessor();

// Extend Express Request interface to include rawBody
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

// Middleware
app.use(bodyParser.json({ verify: (req: any, res, buf) => {
  req.rawBody = buf;
}}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// GitHub webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    const event = req.headers['x-github-event'] as string;
    
    console.log(`Received ${event} event`);

    // Verify webhook signature
    if (!signature || !req.rawBody || !githubService.verifyWebhookSignature(req.rawBody.toString(), signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Handle different event types
    switch (event) {
      case 'pull_request_review_comment':
      case 'issue_comment':
        await handleCommentEvent(req.body);
        break;
      
      case 'ping':
        console.log('Webhook ping received');
        break;
      
      default:
        console.log(`Unhandled event type: ${event}`);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    // console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle comment events
async function handleCommentEvent(payload: GitHubWebhookPayload): Promise<void> {
  // Only process new comments
  if (payload.action !== 'created') {
    console.log(`Skipping ${payload.action} action`);
    return;
  }

  // Only process PR comments (not issue comments)
  if (!payload.pull_request) {
    console.log('Skipping non-PR comment');
    return;
  }

  // Process the comment asynchronously
  setImmediate(async () => {
    try {
      await commentProcessor.processComment(payload);
    } catch (error) {
      console.error('Error processing comment:', error);
    }
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await commentProcessor.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await commentProcessor.cleanup();
  process.exit(0);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`🚀 AI PR Comment Fixer Bot started on port ${PORT}`);
  console.log(`📡 Webhook URL: ${config.server.webhookUrl}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Repository: ${config.repo.owner}/${config.repo.name}`);
  console.log(`🤖 OpenAI Model: ${config.openai.model}`);
});

export default app; 