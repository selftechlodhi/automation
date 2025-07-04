import { OpenAIService } from '../services/openai';
import { GitHubService } from '../services/github';
import { GitService } from '../services/git';
import { CommentProcessor } from '../services/commentProcessor';
import { GitHubWebhookPayload, GitHubComment, GitHubPR } from '../types';

// Example usage and testing
async function testCommentProcessing() {
  console.log('🧪 Testing AI PR Comment Fixer Bot\n');

  // Example PR comment payload
  const examplePayload: GitHubWebhookPayload = {
    action: 'created',
    comment: {
      id: 123456,
      body: 'Fix the typo in line 15: "recieve" should be "receive"',
      user: {
        login: 'reviewer123'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    pull_request: {
      number: 42,
      title: 'Add user authentication feature',
      body: 'This PR adds user authentication with JWT tokens',
      head: {
        ref: 'feature/auth',
        sha: 'abc123def456',
        repo: {
          full_name: 'example/repo'
        }
      },
      base: {
        ref: 'main',
        sha: 'base123base456',
        repo: {
          full_name: 'example/repo'
        }
      },
      state: 'open',
      mergeable: true
    },
    repository: {
      full_name: 'example/repo',
      name: 'repo',
      owner: {
        login: 'example'
      }
    },
    sender: {
      login: 'reviewer123'
    }
  };

  try {
    // Initialize services
    const commentProcessor = new CommentProcessor();
    
    console.log('📝 Processing example comment...');
    console.log(`Comment: "${examplePayload.comment!.body}"`);
    console.log(`PR: #${examplePayload.pull_request!.number}`);
    console.log(`Repository: ${examplePayload.repository.full_name}\n`);

    // Process the comment
    await commentProcessor.processComment(examplePayload);
    
    console.log('✅ Comment processing completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Example of how to test individual services
async function testOpenAIService() {
  console.log('🤖 Testing OpenAI Service...');
  
  const openaiService = new OpenAIService();
  
  // Example comment analysis
  const exampleComment: GitHubComment = {
    id: 1,
    body: 'Add error handling for the API call',
    user: { login: 'reviewer' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const examplePR: GitHubPR = {
    number: 1,
    title: 'Add API integration',
    body: 'Integrates with external API',
    head: {
      ref: 'feature/api',
      sha: 'head123',
      repo: { full_name: 'test/repo' }
    },
    base: {
      ref: 'main',
      sha: 'base123',
      repo: { full_name: 'test/repo' }
    },
    state: 'open',
    mergeable: true
  };

  const exampleFiles = [
    {
      filename: 'src/api.ts',
      status: 'modified',
      additions: 10,
      deletions: 5,
      changes: 15,
      blob_url: 'https://example.com/blob',
      raw_url: 'https://example.com/raw',
      contents_url: 'https://example.com/contents'
    }
  ];

  const fileContents = new Map<string, string>();
  fileContents.set('src/api.ts', `
async function fetchData() {
  const response = await fetch('/api/data');
  return response.json();
}
  `);

  try {
    const analysis = await openaiService.analyzeComment(
      exampleComment,
      examplePR,
      exampleFiles,
      fileContents
    );

    console.log('Analysis Result:', {
      shouldApply: analysis.shouldApply,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      changesCount: analysis.changes.length
    });
    
  } catch (error) {
    console.error('OpenAI service test failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testCommentProcessing()
    .then(() => testOpenAIService())
    .then(() => {
      console.log('\n🎉 All tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

export { testCommentProcessing, testOpenAIService }; 