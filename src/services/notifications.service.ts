import "server-only";
import { getDataSource } from "@/db/data-source";
import { DeviceToken, NotificationPreference, User } from "@/entities";
import { categoryDefaults, notificationCategories } from "@/lib/notification-categories";
import { sendPushToUser } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/resend";
import { NotificationEmail } from "@/emails/notification.email";

export async function notify(userIds: number[], categoryId: string, payload: { title: string; body: string; url?: string }) {
  const uniqueUserIds = [...new Set(userIds)];
  if (!uniqueUserIds.length) return;

  const dataSource = await getDataSource();
  const prefs = await dataSource.getRepository(NotificationPreference).find({ where: uniqueUserIds.map((userId) => ({ userId, category: categoryId })) });
  const prefByUser = new Map(prefs.map((pref) => [pref.userId, pref]));
  const defaults = categoryDefaults(categoryId);

  await Promise.all(
    uniqueUserIds.map(async (userId) => {
      const pref = prefByUser.get(userId);
      const channelPush = pref?.channelPush ?? defaults.channelPush;
      const channelEmail = pref?.channelEmail ?? defaults.channelEmail;

      if (channelPush) {
        try {
          await sendPushToUser(userId, payload);
        } catch (error) {
          console.error("Push notification failed", error);
        }
      }

      if (channelEmail) {
        try {
          const user = await dataSource.getRepository(User).findOne({ where: { id: userId }, select: { email: true } });
          if (user) {
            await sendEmail({ to: user.email, subject: payload.title, react: NotificationEmail({ title: payload.title, body: payload.body, actionUrl: payload.url }) });
          }
        } catch (error) {
          console.error("Notification email failed", error);
        }
      }
    }),
  );
}

export async function registerDeviceToken(userId: number, token: string, userAgent: string | null) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(DeviceToken);
  const existing = await repo.findOne({ where: { token } });

  if (existing) {
    existing.userId = userId;
    existing.userAgent = userAgent;
    return repo.save(existing);
  }

  return repo.save(repo.create({ userId, token, userAgent, platform: "web" }));
}

export async function unregisterDeviceToken(userId: number, token: string) {
  const dataSource = await getDataSource();
  await dataSource.getRepository(DeviceToken).delete({ userId, token });
}

export async function listNotificationPreferences(userId: number) {
  const dataSource = await getDataSource();
  const prefs = await dataSource.getRepository(NotificationPreference).find({ where: { userId } });
  const prefByCategory = new Map(prefs.map((pref) => [pref.category, pref]));

  return notificationCategories.map((category) => {
    const pref = prefByCategory.get(category.id);
    return {
      id: category.id,
      label: category.label,
      detail: category.detail,
      channelPush: pref?.channelPush ?? category.defaultPush,
      channelEmail: pref?.channelEmail ?? category.defaultEmail,
    };
  });
}

export async function updateNotificationPreference(userId: number, categoryId: string, input: { channelPush: boolean; channelEmail: boolean }) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(NotificationPreference);
  const existing = await repo.findOne({ where: { userId, category: categoryId } });

  if (existing) {
    existing.channelPush = input.channelPush;
    existing.channelEmail = input.channelEmail;
    return repo.save(existing);
  }

  return repo.save(repo.create({ userId, category: categoryId, channelPush: input.channelPush, channelEmail: input.channelEmail }));
}
