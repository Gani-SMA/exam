import { User } from '../models/User';
import { sendEmail } from './email';
import { socketUtils } from '../config/socket';
import { logger } from './logger';

interface NotificationData {
  userId: string;
  type: 'achievement' | 'exam_reminder' | 'battle_invite' | 'friend_request' | 'system';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high';
}

export const sendNotification = async (notification: NotificationData, io?: any): Promise<void> => {
  try {
    const user = await User.findById(notification.userId);
    
    if (!user) {
      logger.warn('User not found for notification', { userId: notification.userId });
      return;
    }

    // Send real-time notification if user is online
    if (io) {
      socketUtils.sendToUser(io, notification.userId, 'notification', {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        timestamp: new Date()
      });
    }

    // Send email notification if enabled
    if (user.settings.notifications.email && shouldSendEmail(notification.type, user)) {
      await sendEmailNotification(user, notification);
    }

    logger.info('Notification sent successfully', {
      userId: notification.userId,
      type: notification.type,
      title: notification.title
    });

  } catch (error) {
    logger.error('Failed to send notification', {
      userId: notification.userId,
      type: notification.type,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const sendBulkNotifications = async (notifications: NotificationData[], io?: any): Promise<void> => {
  const promises = notifications.map(notification => sendNotification(notification, io));
  await Promise.allSettled(promises);
};

const shouldSendEmail = (type: string, user: any): boolean => {
  switch (type) {
    case 'achievement':
      return user.settings.notifications.achievementAlerts;
    case 'exam_reminder':
      return user.settings.notifications.examReminders;
    case 'battle_invite':
    case 'friend_request':
      return user.settings.notifications.email;
    case 'system':
      return true;
    default:
      return false;
  }
};

const sendEmailNotification = async (user: any, notification: NotificationData): Promise<void> => {
  let template = 'notification';
  let subject = notification.title;

  switch (notification.type) {
    case 'achievement':
      template = 'achievementUnlocked';
      subject = `🏆 Achievement Unlocked: ${notification.data?.achievementName || 'New Achievement'}`;
      break;
    case 'exam_reminder':
      template = 'examReminder';
      subject = `📚 Exam Reminder: ${notification.data?.examTitle || 'Upcoming Exam'}`;
      break;
    default:
      template = 'notification';
  }

  await sendEmail({
    to: user.email,
    subject,
    template,
    data: {
      firstName: user.firstName,
      title: notification.title,
      message: notification.message,
      ...notification.data
    }
  });
};

// Specific notification functions
export const notifyAchievementUnlocked = async (userId: string, achievement: any, io?: any): Promise<void> => {
  await sendNotification({
    userId,
    type: 'achievement',
    title: 'Achievement Unlocked!',
    message: `Congratulations! You've earned the "${achievement.name}" achievement.`,
    data: {
      achievementId: achievement._id,
      achievementName: achievement.name,
      achievementDescription: achievement.description,
      achievementIcon: achievement.icon,
      xpEarned: achievement.rewards.xp,
      badgeEarned: achievement.rewards.badge?.name
    },
    priority: 'medium'
  }, io);
};

export const notifyExamReminder = async (userId: string, exam: any, reminderTime: string, io?: any): Promise<void> => {
  await sendNotification({
    userId,
    type: 'exam_reminder',
    title: 'Exam Reminder',
    message: `Your exam "${exam.title}" starts ${reminderTime}.`,
    data: {
      examId: exam._id,
      examTitle: exam.title,
      examType: exam.type,
      examDate: exam.scheduledStart,
      examTime: exam.scheduledStart,
      duration: exam.duration,
      description: exam.description,
      examUrl: `${process.env.FRONTEND_URL}/exams/${exam._id}`
    },
    priority: 'high'
  }, io);
};

export const notifyBattleInvite = async (userId: string, battle: any, invitedBy: any, io?: any): Promise<void> => {
  await sendNotification({
    userId,
    type: 'battle_invite',
    title: 'Battle Invitation',
    message: `${invitedBy.firstName} ${invitedBy.lastName} invited you to join a quiz battle!`,
    data: {
      battleId: battle._id,
      battleTitle: battle.title,
      battleType: battle.type,
      subject: battle.subject,
      invitedBy: {
        id: invitedBy._id,
        name: `${invitedBy.firstName} ${invitedBy.lastName}`,
        avatar: invitedBy.avatar
      },
      battleUrl: `${process.env.FRONTEND_URL}/battles/${battle._id}`
    },
    priority: 'medium'
  }, io);
};

export const notifyFriendRequest = async (userId: string, requester: any, io?: any): Promise<void> => {
  await sendNotification({
    userId,
    type: 'friend_request',
    title: 'New Friend Request',
    message: `${requester.firstName} ${requester.lastName} sent you a friend request.`,
    data: {
      requesterId: requester._id,
      requesterName: `${requester.firstName} ${requester.lastName}`,
      requesterAvatar: requester.avatar,
      requesterLevel: requester.gamification.level
    },
    priority: 'low'
  }, io);
};

export const notifySystemMessage = async (userId: string, title: string, message: string, data?: any, io?: any): Promise<void> => {
  await sendNotification({
    userId,
    type: 'system',
    title,
    message,
    data,
    priority: 'high'
  }, io);
};