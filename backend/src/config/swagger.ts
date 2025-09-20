import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Online Examination & Gamified Quiz Platform API',
      version: '1.0.0',
      description: 'A comprehensive API for GATE/GRE/TOEFL examination platform with gamification features',
      contact: {
        name: 'API Support',
        email: 'support@examplatform.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.examplatform.com' 
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            role: { type: 'string', enum: ['student', 'educator', 'admin'], example: 'student' },
            isVerified: { type: 'boolean', example: true },
            isActive: { type: 'boolean', example: true },
            stats: {
              type: 'object',
              properties: {
                totalExams: { type: 'number', example: 5 },
                averageScore: { type: 'number', example: 85.5 },
                streak: { type: 'number', example: 7 },
                level: { type: 'number', example: 3 },
                xp: { type: 'number', example: 1250 }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Question: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            examType: { type: 'string', enum: ['GATE', 'GRE', 'TOEFL'], example: 'GATE' },
            subject: { type: 'string', example: 'Mathematics' },
            topic: { type: 'string', example: 'Calculus' },
            type: { type: 'string', enum: ['mcq', 'numerical', 'essay'], example: 'mcq' },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'], example: 'medium' },
            question: { type: 'string', example: 'What is the derivative of x²?' },
            options: { type: 'array', items: { type: 'string' }, example: ['2x', 'x', '2', 'x²'] },
            correctAnswer: { type: 'string', example: '2x' },
            explanation: { type: 'string', example: 'The derivative of x² is 2x using the power rule.' },
            points: { type: 'number', example: 2 },
            tags: { type: 'array', items: { type: 'string' }, example: ['calculus', 'derivatives'] },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Exam: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'GATE Mathematics Mock Test 1' },
            description: { type: 'string', example: 'Comprehensive test covering all mathematics topics' },
            type: { type: 'string', enum: ['GATE', 'GRE', 'TOEFL'], example: 'GATE' },
            duration: { type: 'number', example: 180 },
            totalMarks: { type: 'number', example: 100 },
            passingMarks: { type: 'number', example: 40 },
            questions: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean', example: true },
            isPublic: { type: 'boolean', example: true },
            maxAttempts: { type: 'number', example: 3 },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        ExamSession: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            examId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            status: { type: 'string', enum: ['active', 'completed', 'paused'], example: 'active' },
            startTime: { type: 'string', format: 'date-time' },
            timeRemaining: { type: 'number', example: 7200 },
            currentQuestionIndex: { type: 'number', example: 5 },
            score: { type: 'number', example: 85 },
            percentage: { type: 'number', example: 85.5 }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
            error: { type: 'string', example: 'Error message' }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Please provide a valid email' }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts'
  ]
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger page
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0 }
      .swagger-ui .info .title { color: #3b82f6 }
    `,
    customSiteTitle: 'Exam Platform API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    }
  }));

  // Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log(`📚 Swagger documentation available at /api-docs`);
};