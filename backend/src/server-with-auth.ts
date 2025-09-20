import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://examplatform.com', 'https://www.examplatform.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Mock user database (in production, use MongoDB)
const users = [
  {
    id: '1',
    email: 'test@test.com',
    password: '123456', // In production, hash this
    firstName: 'Test',
    lastName: 'User',
    role: 'student',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'admin@test.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    createdAt: new Date().toISOString()
  }
];

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to generate JWT token
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: 'Access token is required'
      }
    });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Socket.IO basic setup
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GATE/GRE/TOEFL Examination Platform API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// API Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Examination Platform API is running',
    version: '1.0.0',
    features: {
      authentication: 'Available',
      examEngine: 'Available',
      questionBank: 'Available',
      multiplayer: 'Available',
      ai: 'Available',
      analytics: 'Available'
    }
  });
});

// AUTH ENDPOINTS

// Login endpoint
app.post('/api/auth/login', (req, res): any => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and password are required'
        }
      });
    }

    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Register endpoint
app.post('/api/auth/register', (req, res): any => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'All fields are required'
        }
      });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Create new user
    const newUser = {
      id: (users.length + 1).toString(),
      email,
      password, // In production, hash this
      firstName,
      lastName,
      role: role || 'student',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Generate token
    const token = generateToken(newUser.id);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Get profile endpoint
app.get('/api/auth/profile', authenticateToken, (req: any, res): any => {
  try {
    const user = users.find(u => u.id === req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // In a real app, you might want to blacklist the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// MOCK EXAM ENDPOINTS

// Get exams
app.get('/api/exams', authenticateToken, (req, res) => {
  const mockExams = [
    {
      id: '1',
      title: 'GATE Computer Science Mock Test 1',
      description: 'Comprehensive test covering all CS topics',
      type: 'GATE',
      difficulty: 'Medium',
      duration: 180,
      totalQuestions: 65,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'GRE Quantitative Reasoning Practice',
      description: 'Focus on mathematical problem solving',
      type: 'GRE',
      difficulty: 'Hard',
      duration: 70,
      totalQuestions: 20,
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      title: 'TOEFL Reading Comprehension',
      description: 'Academic reading passages and questions',
      type: 'TOEFL',
      difficulty: 'Medium',
      duration: 60,
      totalQuestions: 30,
      createdAt: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    data: mockExams
  });
});

// Get user stats
app.get('/api/users/stats', authenticateToken, (req, res) => {
  const mockStats = {
    totalExamsTaken: 15,
    averageScore: 78.5,
    totalTimeSpent: 2340, // minutes
    streak: 7,
    rank: 156,
    totalUsers: 5420,
    recentScores: [85, 72, 91, 68, 79],
    subjectPerformance: {
      'Computer Science': 82,
      'Mathematics': 75,
      'English': 88,
      'General Aptitude': 71
    }
  };

  res.json({
    success: true,
    data: mockStats
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Examination Platform API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health',
    status: '/api/status',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        profile: 'GET /api/auth/profile',
        logout: 'POST /api/auth/logout'
      },
      exams: {
        list: 'GET /api/exams',
        stats: 'GET /api/users/stats'
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Can't find ${req.originalUrl} on this server!`,
      timestamp: new Date().toISOString()
    }
  });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong!',
      timestamp: new Date().toISOString()
    }
  });
});

const PORT = process.env.PORT || 5000;

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
  console.log(`🔐 Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`📝 Register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\\n✅ Backend with Authentication is ready!`);
  console.log(`\\n🧪 Test Credentials:`);
  console.log(`   Email: test@test.com`);
  console.log(`   Password: 123456`);
  console.log(`\\n📋 Available endpoints:`)
  console.log(`   GET  /              - API information`)
  console.log(`   GET  /health        - Health check`)
  console.log(`   GET  /api/status    - API status`)
  console.log(`   POST /api/auth/login     - User login`)
  console.log(`   POST /api/auth/register  - User registration`)
  console.log(`   GET  /api/auth/profile   - Get user profile`)
  console.log(`   GET  /api/exams          - Get available exams`)
  console.log(`   GET  /api/users/stats    - Get user statistics`)
});

export { app, io };