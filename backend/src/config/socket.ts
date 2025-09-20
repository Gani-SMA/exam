import { Server } from 'socket.io';
import { logger } from '@/utils/logger';

export const initializeSocketIO = (io: Server): void => {
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
    });

    // Placeholder event handlers
    socket.on('join-exam', (examId: string) => {
      socket.join(`exam-${examId}`);
      logger.info(`User ${socket.id} joined exam ${examId}`);
    });

    socket.on('leave-exam', (examId: string) => {
      socket.leave(`exam-${examId}`);
      logger.info(`User ${socket.id} left exam ${examId}`);
    });
  });
};