import mongoose from 'mongoose';
import { User } from '../models/User';
import { Exam } from '../models/Exam';
import { Question } from '../models/Question';
import { Achievement } from '../models/Achievement';
import { connectDatabase } from '../config/database';
import { logger } from '../utils/logger';

const seedUsers = async () => {
  const users = [
    {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@examplatform.com',
      password: 'Admin123!',
      role: 'admin',
      isEmailVerified: true,
      gamification: {
        level: 10,
        xp: 10000,
        totalXP: 10000,
        streak: { current: 30, longest: 45, lastActivity: new Date() },
        achievements: [],
        badges: []
      },
      statistics: {
        totalExamsTaken: 50,
        totalQuestionsAnswered: 1000,
        totalStudyTime: 500,
        averageScore: 95,
        subjectWiseStats: []
      }
    },
    {
      firstName: 'John',
      lastName: 'Instructor',
      email: 'instructor@examplatform.com',
      password: 'Instructor123!',
      role: 'instructor',
      isEmailVerified: true,
      gamification: {
        level: 8,
        xp: 8000,
        totalXP: 8000,
        streak: { current: 15, longest: 25, lastActivity: new Date() },
        achievements: [],
        badges: []
      },
      statistics: {
        totalExamsTaken: 30,
        totalQuestionsAnswered: 600,
        totalStudyTime: 300,
        averageScore: 88,
        subjectWiseStats: []
      }
    },
    {
      firstName: 'Alice',
      lastName: 'Student',
      email: 'student@examplatform.com',
      password: 'Student123!',
      role: 'student',
      isEmailVerified: true,
      examPreferences: {
        preferredExamTypes: ['GATE', 'GRE'],
        studyGoals: ['Improve Math Skills', 'Master Computer Science']
      },
      gamification: {
        level: 5,
        xp: 5000,
        totalXP: 5000,
        streak: { current: 7, longest: 12, lastActivity: new Date() },
        achievements: [],
        badges: []
      },
      statistics: {
        totalExamsTaken: 20,
        totalQuestionsAnswered: 400,
        totalStudyTime: 200,
        averageScore: 75,
        subjectWiseStats: [
          {
            subject: 'Mathematics',
            questionsAnswered: 150,
            correctAnswers: 120,
            averageTime: 45,
            lastPracticed: new Date()
          },
          {
            subject: 'Computer Science',
            questionsAnswered: 250,
            correctAnswers: 200,
            averageTime: 60,
            lastPracticed: new Date()
          }
        ]
      }
    }
  ];

  for (const userData of users) {
    const existingUser = await User.findOne({ email: userData.email });
    if (!existingUser) {
      await User.create(userData);
      logger.info(`Created user: ${userData.email}`);
    }
  }
};

const seedQuestions = async () => {
  const questions = [
    {
      type: 'mcq',
      subject: 'Mathematics',
      topic: 'Algebra',
      difficulty: 'easy',
      question: 'What is the value of x in the equation 2x + 5 = 15?',
      options: ['A) 5', 'B) 10', 'C) 7.5', 'D) 2.5'],
      correctAnswer: '0',
      explanation: 'Solving 2x + 5 = 15: 2x = 10, therefore x = 5',
      estimatedTime: 60,
      points: 2,
      tags: ['algebra', 'linear-equations'],
      reviewStatus: 'approved',
      createdBy: new mongoose.Types.ObjectId()
    },
    {
      type: 'mcq',
      subject: 'Computer Science',
      topic: 'Data Structures',
      difficulty: 'medium',
      question: 'Which data structure follows LIFO (Last In First Out) principle?',
      options: ['A) Queue', 'B) Stack', 'C) Array', 'D) Linked List'],
      correctAnswer: '1',
      explanation: 'Stack follows LIFO principle where the last element added is the first one to be removed',
      estimatedTime: 45,
      points: 3,
      tags: ['data-structures', 'stack', 'lifo'],
      reviewStatus: 'approved',
      createdBy: new mongoose.Types.ObjectId()
    },
    {
      type: 'numerical',
      subject: 'Physics',
      topic: 'Mechanics',
      difficulty: 'hard',
      question: 'A ball is thrown vertically upward with an initial velocity of 20 m/s. What is the maximum height reached? (g = 10 m/s²)',
      correctAnswer: '20',
      explanation: 'Using v² = u² + 2as, at maximum height v = 0, so 0 = 400 - 2(10)s, s = 20m',
      estimatedTime: 120,
      points: 5,
      tags: ['mechanics', 'projectile-motion'],
      reviewStatus: 'approved',
      createdBy: new mongoose.Types.ObjectId()
    },
    {
      type: 'essay',
      subject: 'English',
      topic: 'Writing Skills',
      difficulty: 'medium',
      question: 'Write a short essay (200-300 words) on the importance of renewable energy sources.',
      correctAnswer: 'Sample essay about renewable energy importance, environmental benefits, and sustainability.',
      explanation: 'Essays should cover environmental impact, sustainability, economic benefits, and future implications.',
      estimatedTime: 900,
      points: 10,
      tags: ['essay', 'renewable-energy', 'environment'],
      reviewStatus: 'approved',
      createdBy: new mongoose.Types.ObjectId(),
      settings: {
        minWordCount: 200,
        maxWordCount: 300,
        allowPartialCredit: true
      }
    }
  ];

  for (const questionData of questions) {
    const existingQuestion = await Question.findOne({ 
      question: questionData.question 
    });
    if (!existingQuestion) {
      await Question.create(questionData);
      logger.info(`Created question: ${questionData.topic} - ${questionData.difficulty}`);
    }
  }
};

const seedExams = async () => {
  const questions = await Question.find({ reviewStatus: 'approved' }).limit(10);
  const instructor = await User.findOne({ role: 'instructor' });

  if (!instructor || questions.length === 0) {
    logger.warn('Cannot create exams: missing instructor or questions');
    return;
  }

  const exams = [
    {
      title: 'GATE Computer Science Mock Test 1',
      description: 'Comprehensive mock test covering all GATE CS topics',
      type: 'GATE',
      category: 'Computer Science',
      subject: 'Computer Science',
      duration: 180,
      totalQuestions: 10,
      passingScore: 60,
      maxAttempts: 3,
      questionTypes: ['mcq', 'numerical'],
      difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
      questions: questions.slice(0, 10).map(q => q._id),
      isPublic: true,
      settings: {
        shuffleQuestions: true,
        shuffleOptions: true,
        showResults: true,
        allowReview: true,
        allowPause: false,
        allowBackNavigation: true,
        negativeMarking: { enabled: true, penalty: 25 },
        proctoring: { enabled: false, strictMode: false, allowedViolations: 3 },
        adaptiveTesting: { enabled: false, difficultyAdjustment: 0.1 }
      },
      createdBy: instructor._id,
      lastModifiedBy: instructor._id
    },
    {
      title: 'GRE Quantitative Reasoning Practice',
      description: 'Practice test for GRE Quantitative section',
      type: 'GRE',
      category: 'Mathematics',
      subject: 'Mathematics',
      duration: 70,
      totalQuestions: 8,
      passingScore: 70,
      maxAttempts: 5,
      questionTypes: ['mcq', 'numerical'],
      difficultyDistribution: { easy: 25, medium: 50, hard: 25 },
      sections: [
        {
          name: 'Quantitative Reasoning',
          type: 'mcq',
          duration: 35,
          questionCount: 4,
          instructions: 'Answer all questions in this section'
        },
        {
          name: 'Problem Solving',
          type: 'numerical',
          duration: 35,
          questionCount: 4,
          instructions: 'Provide numerical answers'
        }
      ],
      questions: questions.slice(0, 8).map(q => q._id),
      isPublic: true,
      settings: {
        shuffleQuestions: true,
        shuffleOptions: true,
        showResults: true,
        allowReview: true,
        allowPause: true,
        allowBackNavigation: true,
        negativeMarking: { enabled: false, penalty: 0 },
        proctoring: { enabled: true, strictMode: false, allowedViolations: 5 },
        adaptiveTesting: { enabled: true, difficultyAdjustment: 0.2 }
      },
      createdBy: instructor._id,
      lastModifiedBy: instructor._id
    }
  ];

  for (const examData of exams) {
    const existingExam = await Exam.findOne({ title: examData.title });
    if (!existingExam) {
      await Exam.create(examData);
      logger.info(`Created exam: ${examData.title}`);
    }
  }
};

const seedAchievements = async () => {
  const achievements = [
    {
      name: 'First Steps',
      description: 'Complete your first exam',
      category: 'exam',
      type: 'milestone',
      criteria: {
        type: 'exam_count',
        value: 1,
        operator: 'gte'
      },
      rewards: {
        xp: 100,
        badge: {
          name: 'Beginner',
          icon: '🎯',
          color: '#4CAF50'
        }
      },
      icon: '🎯',
      color: '#4CAF50',
      rarity: 'common'
    },
    {
      name: 'Perfect Score',
      description: 'Score 100% in any exam',
      category: 'score',
      type: 'rare',
      criteria: {
        type: 'score_threshold',
        value: 100,
        operator: 'gte'
      },
      rewards: {
        xp: 500,
        badge: {
          name: 'Perfectionist',
          icon: '💯',
          color: '#FFD700'
        }
      },
      icon: '💯',
      color: '#FFD700',
      rarity: 'epic'
    },
    {
      name: 'Study Streak',
      description: 'Maintain a 7-day study streak',
      category: 'streak',
      type: 'progressive',
      criteria: {
        type: 'streak_days',
        value: 7,
        operator: 'gte'
      },
      rewards: {
        xp: 200,
        badge: {
          name: 'Consistent Learner',
          icon: '🔥',
          color: '#FF5722'
        }
      },
      icon: '🔥',
      color: '#FF5722',
      rarity: 'uncommon'
    },
    {
      name: 'Battle Champion',
      description: 'Win 10 quiz battles',
      category: 'social',
      type: 'milestone',
      criteria: {
        type: 'battle_wins',
        value: 10,
        operator: 'gte'
      },
      rewards: {
        xp: 300,
        badge: {
          name: 'Battle Master',
          icon: '⚔️',
          color: '#9C27B0'
        }
      },
      icon: '⚔️',
      color: '#9C27B0',
      rarity: 'rare'
    },
    {
      name: 'Speed Demon',
      description: 'Complete an exam in under 50% of allocated time',
      category: 'speed',
      type: 'rare',
      criteria: {
        type: 'time_limit',
        value: 50,
        operator: 'lte'
      },
      rewards: {
        xp: 250,
        badge: {
          name: 'Lightning Fast',
          icon: '⚡',
          color: '#2196F3'
        }
      },
      icon: '⚡',
      color: '#2196F3',
      rarity: 'rare'
    }
  ];

  for (const achievementData of achievements) {
    const existingAchievement = await Achievement.findOne({ 
      name: achievementData.name 
    });
    if (!existingAchievement) {
      await Achievement.create(achievementData);
      logger.info(`Created achievement: ${achievementData.name}`);
    }
  }
};

const seedDatabase = async () => {
  try {
    await connectDatabase();
    
    logger.info('Starting database seeding...');
    
    await seedUsers();
    await seedQuestions();
    await seedExams();
    await seedAchievements();
    
    logger.info('Database seeding completed successfully!');
    
    // Display summary
    const [userCount, questionCount, examCount, achievementCount] = await Promise.all([
      User.countDocuments(),
      Question.countDocuments(),
      Exam.countDocuments(),
      Achievement.countDocuments()
    ]);
    
    logger.info('Database Summary:', {
      users: userCount,
      questions: questionCount,
      exams: examCount,
      achievements: achievementCount
    });
    
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };