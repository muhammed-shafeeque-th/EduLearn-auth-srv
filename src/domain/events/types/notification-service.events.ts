/* eslint-disable @typescript-eslint/no-empty-object-type */
import { BaseEvent } from './base-event';

export interface EmailNotificationEvent
  extends BaseEvent<{
    to: string;
    userId: string;
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    template?: string;
    attachments?: string[];
    priority?: 'low' | 'normal' | 'high';
  }> {}

export interface OtpRequestEvent
  extends BaseEvent<{
    userId: string;
    username: string;
    phoneNumber?: string;
    email: string;
    otpChannel: string;
    otpPurpose?: 'registration' | 'login' | 'password-reset' | '2fa';
    expiresIn?: number; // seconds
    requestSource?: string;
    ip?: string;
    userAgent?: string;
  }> {}
export interface OtpVerifiedEvent
  extends BaseEvent<{
    userId: string;
    username: string;
    email: string;
    status: string;
  }> {}

export interface ForgotPasswordRequestEvent
  extends BaseEvent<{
    userId: string;
    username: string;
    email: string;
    resetLink: string;
    expiryMinutes: number;
    requestSource?: string;
    ip?: string;
    userAgent?: string;
  }> {}
