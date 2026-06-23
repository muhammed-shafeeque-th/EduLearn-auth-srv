import { JwtPayload } from 'jsonwebtoken';

export interface StandardJwtClaims {
  iat?: number;
  iss: string;
  aud: string;
  jti: string;
  exp?: number;
  sub?: string;
}

export enum Permissions {
  // Navigation & Generic Access
  DASHBOARD_ACCESS = 'dashboard:access',

  // Profile & Account Management
  USER_PROFILE_VIEW = 'user:profile:view',
  PROFILE_UPDATE = 'profile:update',
  ACCOUNT_DELETE = 'account:delete',

  // Course Management
  COURSE_CREATE = 'course:create',
  COURSE_UPDATE = 'course:update',
  COURSE_DELETE_OWN = 'course:delete:own',
  COURSE_DELETE_ANY = 'course:delete:any',
  COURSE_VIEW = 'course:view',
  COURSE_ENROLL = 'course:enroll',
  COURSE_PUBLISH = 'course:publish',
  COURSE_ARCHIVE = 'course:archive',
  COURSE_CONTENT_MANAGE = 'course:content:manage',
  COURSE_CONTENT_VIEW = 'course:content:view',

  // Learning & Assessments
  QUIZ_MANAGE = 'quiz:manage',
  QUIZ_TAKE = 'quiz:take',
  CERTIFICATE_MANAGE = 'certificate:manage',
  CERTIFICATE_VIEW = 'certificate:view',
  PROGRESS_VIEW_OWN = 'progress:view:own',
  PROGRESS_VIEW_ALL = 'progress:view:all',

  // Commerce (Cart, Wishlist, Checkout)
  CART_MANAGE = 'cart:manage',
  WISHLIST_MANAGE = 'wishlist:manage',
  CHECKOUT_PROCESS = 'checkout:process',
  ORDER_VIEW_OWN = 'order:view:own',
  ORDER_VIEW_ALL = 'order:view:all',
  REFUND_REQUEST = 'refund:request',
  REFUND_PROCESS = 'refund:process',

  // Finance & Revenue
  REVENUE_VIEW_OWN = 'revenue:view:own',
  REVENUE_VIEW_ALL = 'revenue:view:all',
  PAYOUT_REQUEST = 'payout:request',
  PAYOUT_MANAGE = 'payout:manage',
  TRANSACTION_VIEW_OWN = 'transaction:view:own',
  TRANSACTION_VIEW_ALL = 'transaction:view:all',

  // User & Administrative Management
  USER_VIEW = 'user:view',
  USER_BLOCK = 'user:block',
  USER_MANAGE = 'user:manage',
  INSTRUCTOR_APPROVE = 'instructor:approve',
  INSTRUCTOR_BLOCK = 'instructor:block',

  // Content Taxonomy
  CATEGORY_MANAGE = 'category:manage',
  TAG_MANAGE = 'tag:manage',

  // Community & Social
  DISCUSSION_READ = 'discussion:read',
  DISCUSSION_WRITE = 'discussion:write',
  DISCUSSION_MODERATE = 'discussion:moderate',
  REVIEW_CREATE = 'review:create',
  REVIEW_MANAGE = 'review:manage',

  // Analytics
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_VIEW_ALL = 'analytics:view:all',

  // Communications & System
  NOTIFICATION_MANAGE = 'notification:manage',
  SETTINGS_MANAGE = 'settings:manage',
  SYSTEM_LOGS_VIEW = 'system:logs:view',
  API_KEYS_MANAGE = 'api_keys:manage',

  // Frontend Dashboards
  INSTRUCTOR_DASHBOARD = 'instructor:dashboard',
  ADMIN_DASHBOARD = 'admin:dashboard',
}

export const RolePermissions = {
  student: [
    Permissions.USER_PROFILE_VIEW,
    Permissions.PROFILE_UPDATE,
    Permissions.COURSE_VIEW,
    Permissions.COURSE_ENROLL,
    Permissions.COURSE_CONTENT_VIEW,
    Permissions.QUIZ_TAKE,
    Permissions.CERTIFICATE_VIEW,
    Permissions.PROGRESS_VIEW_OWN,
    Permissions.CART_MANAGE,
    Permissions.WISHLIST_MANAGE,
    Permissions.CHECKOUT_PROCESS,
    Permissions.ORDER_VIEW_OWN,
    Permissions.REFUND_REQUEST,
    Permissions.DISCUSSION_READ,
    Permissions.DISCUSSION_WRITE,
    Permissions.REVIEW_CREATE,
  ],
  instructor: [
    Permissions.INSTRUCTOR_DASHBOARD,
    Permissions.PROFILE_UPDATE,
    Permissions.COURSE_CREATE,
    // Permissions.COURSE_UPDATE,
    Permissions.COURSE_DELETE_OWN,
    // Permissions.COURSE_VIEW,
    // Permissions.COURSE_PUBLISH,
    // Permissions.COURSE_ARCHIVE,
    Permissions.COURSE_CONTENT_MANAGE,
    Permissions.QUIZ_MANAGE,
    Permissions.PROGRESS_VIEW_ALL,
    Permissions.REVENUE_VIEW_OWN,
    Permissions.PAYOUT_REQUEST,
    Permissions.ANALYTICS_VIEW,
    Permissions.TRANSACTION_VIEW_OWN,
    Permissions.DISCUSSION_READ,
    Permissions.DISCUSSION_WRITE,
    Permissions.REVIEW_MANAGE,
  ],
  admin: [
    Permissions.ADMIN_DASHBOARD,
    Permissions.PROFILE_UPDATE,
    Permissions.USER_VIEW,
    Permissions.USER_BLOCK,
    Permissions.USER_MANAGE,
    Permissions.INSTRUCTOR_APPROVE,
    Permissions.INSTRUCTOR_BLOCK,
    Permissions.COURSE_DELETE_ANY,
    Permissions.CATEGORY_MANAGE,
    Permissions.ANALYTICS_VIEW,
    // Permissions.TAG_MANAGE,
    // Permissions.DISCUSSION_MODERATE,
    // Permissions.REVENUE_VIEW_ALL,
    // Permissions.PAYOUT_MANAGE,
    // Permissions.ORDER_VIEW_ALL,
    // Permissions.TRANSACTION_VIEW_ALL,
    // Permissions.REFUND_PROCESS,
    Permissions.ANALYTICS_VIEW_ALL,
    // Permissions.REVIEW_MANAGE,
    // Permissions.SETTINGS_MANAGE,
    // Permissions.NOTIFICATION_MANAGE,
    // Permissions.SYSTEM_LOGS_VIEW,
    // Permissions.API_KEYS_MANAGE,
  ],
};

export interface CustomJwtClaims {
  userId: string;
  roles: string[];
  permissions: string[];
  username: string;
  avatar?: string;
  email: string;
  keyId?: string;
  expiry?: number;
  sessionId?: string;
  deviceId?: string;
  tokenType?: 'access' | 'refresh';
}

export interface IJwtPayload extends JwtPayload, CustomJwtClaims {}
