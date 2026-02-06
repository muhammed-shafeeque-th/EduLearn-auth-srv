import { JwtPayload } from 'jsonwebtoken';

export interface StandardJwtClaims {
  iat?: number;
  iss: string;
  aud: string;
  jti: string;
  exp?: number;
  sub?: string;
}

export interface CustomJwtClaims {
  userId: string;
  role: string;
  username: string;
  avatar?: string;
  email: string;
  keyId?: string;
  expiry?: number;
  sessionId?: string;
  deviceId?: string;
  tokenType?: 'access' | 'refresh';
  permissions?: [];
}

export interface IJwtPayload extends JwtPayload, CustomJwtClaims {}
