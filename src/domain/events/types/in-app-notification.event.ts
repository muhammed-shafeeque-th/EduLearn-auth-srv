/* eslint-disable @typescript-eslint/no-empty-object-type */
import { BaseEvent } from './base-event';

export interface InAppNotificationEvent
  extends BaseEvent<{
    userId: string;
    title: string;
    message: string;
    type: string;
    actionUrl?: string;
    icon?: string;
    priority?: 'low' | 'normal' | 'high';
    appId?: string;
    category?: string;
  }> {}
