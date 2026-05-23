export interface Notification {
  id: string;

  teamId: string;

  userId?: string | null;

  actorUserId?: string | null;

  type: string;

  category?: string | null;

  priority?: string;

  title: string;

  message?: string | null;

  url?: string | null;

  entityType?: string | null;

  entityId?: string | null;

  icon?: string | null;

  imageUrl?: string | null;

  actionLabel?: string | null;

  actionUrl?: string | null;

  isRead: boolean;

  readAt?: Date | null;

  metadata?: Record<string, any>;

  createdAt: Date;

  deletedAt?: Date | null;
}
