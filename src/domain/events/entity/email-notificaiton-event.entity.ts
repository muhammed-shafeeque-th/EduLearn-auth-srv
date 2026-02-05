import { EmailNotificationEvent } from '../types/notification-service.events';

export class EmailNotificationEventEntity {
  public constructor(
    public readonly eventId: string,
    public readonly eventType: string,
    public readonly timestamp: number,
    public readonly to: string,
    public readonly userId: string,
    public readonly subject: string,
    public readonly body: string,
    public readonly cc?: string[],
    public readonly bcc?: string[],
    public readonly template?: string,
    public readonly attachments?: string[],
    public readonly priority: 'low' | 'normal' | 'high' = 'normal',
  ) {}

  public toEvent(): EmailNotificationEvent {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      timestamp: this.timestamp,
      eventVersion: '0.0.1',
      source: 'auth-service',
      payload: {
        to: this.to,
        userId: this.userId,
        cc: this.cc,
        bcc: this.bcc,
        subject: this.subject,
        body: this.body,
        template: this.template,
        attachments: this.attachments,
        priority: this.priority,
      },
    };
  }

  /**
   * Validates the required fields and value types of the email notification event.
   * Throws an error if validation fails.
   */
  validate(): void {
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
    if (!this.to || typeof this.to !== 'string' || !this.to.trim()) {
      throw new Error('Invalid or missing "to" field');
    }
    if (!this.subject || typeof this.subject !== 'string') {
      throw new Error('Invalid or missing subject');
    }
    if (!this.body || typeof this.body !== 'string') {
      throw new Error('Invalid or missing body');
    }
    if (this.priority !== 'low' && this.priority !== 'normal' && this.priority !== 'high') {
      throw new Error('Invalid priority');
    }
    if (this.cc && !Array.isArray(this.cc)) {
      throw new Error('cc must be an array of strings');
    }
    if (this.bcc && !Array.isArray(this.bcc)) {
      throw new Error('bcc must be an array of strings');
    }
    if (this.attachments && !Array.isArray(this.attachments)) {
      throw new Error('attachments must be an array of strings');
    }
    // You can add further validation for email address format or other fields here
  }
}
