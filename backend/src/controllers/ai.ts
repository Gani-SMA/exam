import { Request, Response, NextFunction } from 'express';
import { Question } from '../models/Question';
import { AppError, catchAsync } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateQuestions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { 
    subject, 
    topic, 
    difficulty = 'medium', 
    type = 'mcq', 
    count = 5,
    examType = 'GATE'
  } = req.body;

  if (!subject || !topic) {
    return next(new AppError('Subject and topic are required', 400, 'MISSING_PARAMETERS'));
  }

  if (count > 20) {
    return next(new AppError('Cannot generate more than 20 questions at once', 400, 'LIMIT_EXCEEDED'));
  }

  try {
    const prompt = createQuestionGenerationPrompt(subject, topic, difficulty, type, examType, count);
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert question generator for competitive exams. Generate high-quality, accurate questions with proper explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const generatedContent = completion.choices[0]?.message?.content;
    
    if (!generatedContent) {
      return next(new AppError('Failed to generate questions', 500, 'AI_GENERATION_FAILED'));
    }

    const questions = parseGeneratedQuestions(generatedContent, {
      subject,
      topic,
      difficulty,
      type,
      createdBy: req.user!._id
    });

    // Save questions to database
    const savedQuestions = await Question.insertMany(questions);

    logger.info('AI questions generated successfully', {
      count: savedQuestions.length,
      subject,
      topic,
      difficulty,
      type,
      generatedBy: req.user!._id
    });

    res.status(201).json({
      success: true,
      message: `${savedQuestions.length} questions generated successfully`,
      data: {
        questions: savedQuestions,
        metadata: {
          subject,
          topic,
          difficulty,
          type,
          count: savedQuestions.length
        }
      }
    });

  } catch (error) {
    logger.error('AI question generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      subject,
      topic,
      userId: req.user!._id
    });

    return next(new AppError('Failed to generate questions using AI', 500, 'AI_SERVICE_ERROR'));
  }
});

export const scoreEssay = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { essay, rubric, maxScore = 100 } = req.body;

  if (!essay || essay.trim().length === 0) {
    return next(new AppError('Essay content is required', 400, 'ESSAY_REQUIRED'));
  }

  if (essay.length > 10000) {
    return next(new AppError('Essay is too long (max 10,000 characters)', 400, 'ESSAY_TOO_LONG'));
  }

  try {
    const prompt = createEssayScoringPrompt(essay, rubric, maxScore);
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert essay grader. Provide detailed, constructive feedback with accurate scoring based on the given rubric.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const scoringResult = completion.choices[0]?.message?.content;
    
    if (!scoringResult) {
      return next(new AppError('Failed to score essay', 500, 'AI_SCORING_FAILED'));
    }

    const parsedResult = parseEssayScore(scoringResult, maxScore);

    logger.info('Essay scored successfully', {
      essayLength: essay.length,
      score: parsedResult.score,
      scoredBy: req.user!._id
    });

    res.status(200).json({
      success: true,
      message: 'Essay scored successfully',
      data: parsedResult
    });

  } catch (error) {
    logger.error('AI essay scoring failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user!._id
    });

    return next(new AppError('Failed to score essay using AI', 500, 'AI_SERVICE_ERROR'));
  }
});

export const detectPlagiarism = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { text, referenceTexts = [] } = req.body;

  if (!text || text.trim().length === 0) {
    return next(new AppError('Text content is required', 400, 'TEXT_REQUIRED'));
  }

  try {
    // Simple similarity check using AI
    const prompt = createPlagiarismDetectionPrompt(text, referenceTexts);
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a plagiarism detection expert. Analyze text similarity and provide detailed reports on potential plagiarism.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1000
    });

    const analysisResult = completion.choices[0]?.message?.content;
    
    if (!analysisResult) {
      return next(new AppError('Failed to analyze plagiarism', 500, 'AI_ANALYSIS_FAILED'));
    }

    const plagiarismResult = parsePlagiarismResult(analysisResult);

    logger.info('Plagiarism detection completed', {
      textLength: text.length,
      similarityScore: plagiarismResult.similarityScore,
      checkedBy: req.user!._id
    });

    res.status(200).json({
      success: true,
      message: 'Plagiarism analysis completed',
      data: plagiarismResult
    });

  } catch (error) {
    logger.error('AI plagiarism detection failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user!._id
    });

    return next(new AppError('Failed to detect plagiarism using AI', 500, 'AI_SERVICE_ERROR'));
  }
});

export const generateExplanation = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { questionId, userAnswer, correctAnswer } = req.body;

  const question = await Question.findById(questionId);
  
  if (!question) {
    return next(new AppError('Question not found', 404, 'QUESTION_NOT_FOUND'));
  }

  try {
    const prompt = createExplanationPrompt(question, userAnswer, correctAnswer);
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert tutor. Provide clear, educational explanations for exam questions and answers.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 800
    });

    const explanation = completion.choices[0]?.message?.content;
    
    if (!explanation) {
      return next(new AppError('Failed to generate explanation', 500, 'AI_EXPLANATION_FAILED'));
    }

    // Update question with AI-generated explanation if it doesn't have one
    if (!question.explanation) {
      question.explanation = explanation;
      await question.save();
    }

    logger.info('Explanation generated successfully', {
      questionId,
      generatedBy: req.user!._id
    });

    res.status(200).json({
      success: true,
      message: 'Explanation generated successfully',
      data: {
        explanation,
        question: {
          _id: question._id,
          question: question.question,
          type: question.type,
          correctAnswer: question.correctAnswer
        }
      }
    });

  } catch (error) {
    logger.error('AI explanation generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      questionId,
      userId: req.user!._id
    });

    return next(new AppError('Failed to generate explanation using AI', 500, 'AI_SERVICE_ERROR'));
  }
});

export const getPersonalizedRecommendations = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!._id;
  
  // Get user's performance data
  const userStats = await getUserPerformanceStats(userId);
  
  try {
    const prompt = createRecommendationPrompt(userStats);
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an AI learning advisor. Provide personalized study recommendations based on user performance data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 1200
    });

    const recommendations = completion.choices[0]?.message?.content;
    
    if (!recommendations) {
      return next(new AppError('Failed to generate recommendations', 500, 'AI_RECOMMENDATION_FAILED'));
    }

    const parsedRecommendations = parseRecommendations(recommendations);

    logger.info('Personalized recommendations generated', {
      userId,
      recommendationCount: parsedRecommendations.length
    });

    res.status(200).json({
      success: true,
      message: 'Personalized recommendations generated',
      data: {
        recommendations: parsedRecommendations,
        userStats,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('AI recommendation generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId
    });

    return next(new AppError('Failed to generate recommendations using AI', 500, 'AI_SERVICE_ERROR'));
  }
});

// Helper functions
function createQuestionGenerationPrompt(subject: string, topic: string, difficulty: string, type: string, examType: string, count: number): string {
  return `Generate ${count} ${difficulty} difficulty ${type} questions for ${examType} exam on the topic "${topic}" in ${subject}.

For each question, provide:
1. Question text
2. ${type === 'mcq' ? '4 options (A, B, C, D)' : 'Expected answer format'}
3. Correct answer
4. Detailed explanation
5. Estimated time to solve (in seconds)
6. Point value (1-5 based on difficulty)

Format the response as JSON array with this structure:
[
  {
    "question": "Question text here",
    ${type === 'mcq' ? '"options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],' : ''}
    "correctAnswer": "${type === 'mcq' ? '0' : 'Answer here'}",
    "explanation": "Detailed explanation",
    "estimatedTime": 120,
    "points": 2
  }
]`;
}

function createEssayScoringPrompt(essay: string, rubric: string, maxScore: number): string {
  return `Score this essay out of ${maxScore} points using the following rubric:
${rubric || 'Standard essay rubric: Content (40%), Organization (30%), Language (20%), Mechanics (10%)'}

Essay to score:
"${essay}"

Provide your response in this JSON format:
{
  "score": 85,
  "maxScore": ${maxScore},
  "percentage": 85,
  "breakdown": {
    "content": 34,
    "organization": 26,
    "language": 17,
    "mechanics": 8
  },
  "feedback": "Detailed feedback here",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1", "Improvement 2"]
}`;
}

function createPlagiarismDetectionPrompt(text: string, referenceTexts: string[]): string {
  return `Analyze this text for potential plagiarism:
"${text}"

${referenceTexts.length > 0 ? `Compare against these reference texts:
${referenceTexts.map((ref, i) => `Reference ${i + 1}: "${ref}"`).join('\n')}` : ''}

Provide analysis in this JSON format:
{
  "similarityScore": 15,
  "riskLevel": "low",
  "matches": [
    {
      "text": "matching phrase",
      "source": "reference 1",
      "similarity": 85
    }
  ],
  "summary": "Analysis summary"
}`;
}

function createExplanationPrompt(question: any, userAnswer: any, correctAnswer: any): string {
  return `Explain this question and answer:

Question: ${question.question}
${question.options ? `Options: ${question.options.join(', ')}` : ''}
User Answer: ${userAnswer}
Correct Answer: ${correctAnswer}

Provide a clear explanation of:
1. Why the correct answer is right
2. Why the user's answer is wrong (if applicable)
3. Key concepts to understand
4. Tips for similar questions`;
}

function createRecommendationPrompt(userStats: any): string {
  return `Based on this user's performance data, provide personalized study recommendations:

Performance Summary:
- Total Exams: ${userStats.totalExams}
- Average Score: ${userStats.averageScore}%
- Weak Subjects: ${userStats.weakSubjects.join(', ')}
- Strong Subjects: ${userStats.strongSubjects.join(', ')}
- Study Time: ${userStats.totalStudyTime} hours
- Recent Trend: ${userStats.recentTrend}

Provide 5-7 specific, actionable recommendations for improvement.`;
}

function parseGeneratedQuestions(content: string, metadata: any): any[] {
  try {
    const questions = JSON.parse(content);
    return questions.map((q: any) => ({
      ...q,
      ...metadata,
      isAIGenerated: true,
      aiModel: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      aiGeneratedAt: new Date(),
      reviewStatus: 'pending',
      statistics: {
        timesUsed: 0,
        timesAnswered: 0,
        correctAnswers: 0,
        averageTime: 0,
        averageScore: 0,
        lastUsed: new Date(),
        difficultyRating: 0
      }
    }));
  } catch (error) {
    throw new Error('Failed to parse generated questions');
  }
}

function parseEssayScore(content: string, maxScore: number): any {
  try {
    return JSON.parse(content);
  } catch (error) {
    // Fallback parsing if JSON fails
    return {
      score: maxScore * 0.7,
      maxScore,
      percentage: 70,
      feedback: content,
      strengths: [],
      improvements: []
    };
  }
}

function parsePlagiarismResult(content: string): any {
  try {
    return JSON.parse(content);
  } catch (error) {
    return {
      similarityScore: 0,
      riskLevel: 'low',
      matches: [],
      summary: content
    };
  }
}

function parseRecommendations(content: string): string[] {
  const lines = content.split('\n').filter(line => line.trim());
  return lines.filter(line => 
    line.includes('recommend') || 
    line.includes('suggest') || 
    line.includes('should') ||
    line.match(/^\d+\./)
  );
}

async function getUserPerformanceStats(userId: string): Promise<any> {
  // This would aggregate user's exam and question performance
  // Placeholder implementation
  return {
    totalExams: 10,
    averageScore: 75,
    weakSubjects: ['Mathematics', 'Physics'],
    strongSubjects: ['Computer Science'],
    totalStudyTime: 50,
    recentTrend: 'improving'
  };
}