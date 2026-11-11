import { prisma } from "../../config/prisma";
import { ApiError } from "../../shared/errors/apiError";

export const notificationsService = {
  /** Used by other modules to push an in-app notification to a user. */
  notify(userId: string, title: string, message: string) {
    return prisma.notification.create({ data: { userId, title, message } });
  },

  notifyMany(userIds: string[], title: string, message: string) {
    if (userIds.length === 0) return Promise.resolve({ count: 0 });
    return prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, title, message })),
    });
  },

  async list(userId: string) {
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { items, unread };
  },

  async markRead(userId: string, id: string) {
    const result = await prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (result.count === 0) {
      const exists = await prisma.notification.findFirst({
        where: { id, userId },
      });
      if (!exists) throw ApiError.notFound("Notification not found");
    }
    return { id, read: true };
  },

  async markAllRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  },
};
