import { InAppNotificationEvent } from '../types/in-app-notification.event';

export class InAppNotificationEventEntity {
  public constructor(
    public readonly eventId: string,
    public readonly eventType: string,
    public readonly timestamp: number,
    public readonly userId: string,
    public readonly title: string,
    public readonly message: string,
    public readonly type: string,
    public readonly actionUrl?: string,
    public readonly icon?: string,
    public readonly priority: 'low' | 'normal' | 'high' = 'normal',
    public readonly appId?: string,
    public readonly category?: string,
  ) {}

  public toEvent(): InAppNotificationEvent {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      timestamp: this.timestamp,
      eventVersion: '0.0.1',
      source: 'auth-service',
      payload: {
        userId: this.userId,
        title: this.title,
        message: this.message,
        type: this.type,
        actionUrl: this.actionUrl,
        icon: this.icon,
        priority: this.priority,
        appId: this.appId,
        category: this.category,
      },
    };
  }

  public validate(): void {
    if (!this.eventId || typeof this.eventId !== 'string' || !this.eventId.trim()) {
      throw new Error('Invalid or missing eventId');
    }
    if (!this.eventType || typeof this.eventType !== 'string' || !this.eventType.trim()) {
      throw new Error('Invalid or missing eventType');
    }
    if (
      typeof this.timestamp !== 'number' ||
      !Number.isFinite(this.timestamp) ||
      this.timestamp <= 0
    ) {
      throw new Error('Invalid or missing timestamp');
    }
    if (!this.userId || typeof this.userId !== 'string' || !this.userId.trim()) {
      throw new Error('Invalid or missing userId');
    }
    if (!this.title || typeof this.title !== 'string' || !this.title.trim()) {
      throw new Error('Invalid or missing title');
    }
    if (!this.message || typeof this.message !== 'string' || !this.message.trim()) {
      throw new Error('Invalid or missing message');
    }
    if (!this.type || typeof this.type !== 'string' || !this.type.trim()) {
      throw new Error('Invalid or missing type');
    }
    if (this.priority !== 'low' && this.priority !== 'normal' && this.priority !== 'high') {
      throw new Error('Invalid priority');
    }
    // Further validation can be added for other fields if desired
  }
}
