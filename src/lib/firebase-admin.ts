import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getDataSource } from "@/db/data-source";
import { DeviceToken } from "@/entities";

function getFirebaseApp() {
  const existing = getApps();
  if (existing.length) return existing[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
    }),
  });
}

export async function sendPushToUser(userId: number, payload: { title: string; body: string; url?: string }) {
  const dataSource = await getDataSource();
  const tokenRepo = dataSource.getRepository(DeviceToken);
  const deviceTokens = await tokenRepo.find({ where: { userId } });
  if (!deviceTokens.length) return;

  const messaging = getMessaging(getFirebaseApp());
  const response = await messaging.sendEachForMulticast({
    tokens: deviceTokens.map((deviceToken) => deviceToken.token),
    notification: { title: payload.title, body: payload.body },
    webpush: payload.url ? { fcmOptions: { link: payload.url } } : undefined,
  });

  const staleTokens: string[] = [];
  response.responses.forEach((result, index) => {
    if (!result.success && result.error?.code === "messaging/registration-token-not-registered") {
      staleTokens.push(deviceTokens[index].token);
    }
  });

  for (const token of staleTokens) await tokenRepo.delete({ token });
}
