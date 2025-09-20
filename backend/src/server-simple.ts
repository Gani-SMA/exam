import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'GATE/GRE/TOEFL Examination Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// Basic routes
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working correctly',
    features: [
      'Authentication System',
      'Exam Engine',
      'AI Integration',
      'Gamification',
      'Real-time Features'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 GATE/GRE/TOEFL Examination Platform`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

export default app;