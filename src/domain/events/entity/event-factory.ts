import { v4 as uuidV4 } from 'uuid';
import { EmailNotificationEventEntity } from './email-notificaiton-event.entity';
import { InAppNotificationEventEntity } from './in-app-notification-event.entity';

export class KafkaEventFactory {
  public static createWelcomeNotification(
    userId: string,
    appId?: string,
  ): InAppNotificationEventEntity {
    return new InAppNotificationEventEntity(
      KafkaEventFactory.generateEventId(),
      'UserOnboardingEvent',
      KafkaEventFactory.createTimestamp(),
      userId,
      'Welcome to Our Platform! 🎉',
      'Thanks for joining us! Explore features and get started on your journey.',
      'welcome',
      '/profile',
      'celebration',
      'high',
      appId,
      'user_lifecycle',
    );
  }

  public static createWelcomeEmail(
    to: string,
    userName: string,
    userId: string,
    template: string,
  ): EmailNotificationEventEntity {
    return new EmailNotificationEventEntity(
      KafkaEventFactory.generateEventId(),
      'UserOnboardingEmailEvent',
      KafkaEventFactory.createTimestamp(),
      to,
      userId,
      `Welcome to EduLearn, ${userName}!`,
      template,
      undefined,
      undefined,
      'welcome-email',
      undefined,
      'high',
    );
  }

  private static generateEventId(): string {
    return uuidV4();
  }
  private static createTimestamp(): number {
    return Date.now();
  }
}
