import OpenAI from 'openai';
import { config } from '../config';
import { GitHubComment, GitHubPR, GitHubFile, AIAnalysisResult, CodeChange } from '../types';

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  /**
   * Analyze a PR comment and determine if it should be applied
   */
  async analyzeComment(
    comment: GitHubComment,
    pr: GitHubPR,
    files: GitHubFile[],
    fileContents: Map<string, string>
  ): Promise<AIAnalysisResult> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(comment, pr, files, fileContents);

    try {
      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from OpenAI');
      }

      return this.parseAIResponse(result);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        shouldApply: false,
        changes: [],
        reasoning: `Error analyzing comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0
      };
    }
  }

  private buildSystemPrompt(): string {
    return `You are an AI code reviewer and fixer. Your job is to analyze GitHub PR comments and determine if they should be automatically applied.

IMPORTANT RULES:
1. Only apply changes that are CLEAR and UNAMBIGUOUS code improvements
2. Do NOT apply subjective style changes or opinion-based suggestions
3. Do NOT apply changes that require business logic decisions
4. Focus on: bug fixes, syntax errors, obvious improvements, security issues
5. If unsure, set shouldApply to false
6. Always provide clear reasoning for your decision

RESPONSE FORMAT (JSON):
{
  "shouldApply": boolean,
  "confidence": number (0-1),
  "reasoning": "string explaining your decision",
  "changes": [
    {
      "filename": "string",
      "content": "complete file content after changes",
      "description": "what was changed and why"
    }
  ]
}`;
  }

  private buildUserPrompt(
    comment: GitHubComment,
    pr: GitHubPR,
    files: GitHubFile[],
    fileContents: Map<string, string>
  ): string {
    const fileInfo = files.map(file => {
      const content = fileContents.get(file.filename) || 'File not found';
      return `\n--- ${file.filename} ---\n${content}\n---`;
    }).join('\n');

    return `PR TITLE: ${pr.title}
PR DESCRIPTION: ${pr.body}

COMMENT: ${comment.body}
COMMENT AUTHOR: ${comment.user.login}

FILES IN PR:
${fileInfo}

Please analyze this comment and determine if it should be automatically applied. Consider:
1. Is the comment clear and actionable?
2. Is it a technical improvement that can be automated?
3. Does it require subjective decisions or business logic?
4. Is it safe to apply without human review?

Respond with the JSON format specified in the system prompt.`;
  }

  private parseAIResponse(response: string): AIAnalysisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (typeof parsed.shouldApply !== 'boolean') {
        throw new Error('Invalid shouldApply field');
      }

      if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
        throw new Error('Invalid confidence field');
      }

      if (typeof parsed.reasoning !== 'string') {
        throw new Error('Invalid reasoning field');
      }

      if (!Array.isArray(parsed.changes)) {
        throw new Error('Invalid changes field');
      }

      // Validate each change
      const changes: CodeChange[] = parsed.changes.map((change: any, index: number) => {
        if (typeof change.filename !== 'string') {
          throw new Error(`Invalid filename in change ${index}`);
        }
        if (typeof change.content !== 'string') {
          throw new Error(`Invalid content in change ${index}`);
        }
        if (typeof change.description !== 'string') {
          throw new Error(`Invalid description in change ${index}`);
        }

        return {
          filename: change.filename,
          content: change.content,
          description: change.description,
          lineNumber: change.lineNumber
        };
      });

      return {
        shouldApply: parsed.shouldApply,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        changes
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Raw response:', response);
      
      return {
        shouldApply: false,
        changes: [],
        reasoning: `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0
      };
    }
  }

  /**
   * Generate a summary of applied changes
   */
  async generateChangeSummary(changes: CodeChange[]): Promise<string> {
    const changeDescriptions = changes.map(change => 
      `- ${change.filename}: ${change.description}`
    ).join('\n');

    const prompt = `Generate a brief, professional summary of the following code changes for a GitHub PR comment:

${changeDescriptions}

The summary should be:
- Concise (1-2 sentences)
- Professional
- Focus on the improvements made
- Suitable for a PR comment

Summary:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      });

      return response.choices[0]?.message?.content || 'Applied suggested changes';
    } catch (error) {
      console.error('Error generating change summary:', error);
      return 'Applied suggested changes';
    }
  }
} 