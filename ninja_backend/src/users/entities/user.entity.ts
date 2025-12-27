export enum UserRole {
  OWNER = 'owner',
  AGENT = 'agent',
  DEVELOPER = 'developer',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  teamId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

