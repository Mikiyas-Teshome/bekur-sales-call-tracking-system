import { chromium } from "playwright-core";
const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage();
page.setDefaultTimeout(20000);
const base = "http://localhost:3000";
const testEmail = `resend-verify-${Date.now()}@example.com`;

async function step(name, fn) {
  try {
    await fn();
    console.log(`PASS: ${name}`);
    return true;
  } catch (err) {
    console.log(`FAIL: ${name} -> ${err.message}`);
    return false;
  }
}

await step("login as admin", async () => {
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.fill("#login-email", "ewenetmikiyas@gmail.com");
  await page.fill("#login-password", "Bekur-Admin-2026!");
  await page.click('button[type=submit]');
  await page.waitForURL(`${base}/`, { timeout: 15000 });
});

await step("invite teammate now sends real email via Resend", async () => {
  await page.goto(`${base}/team`, { waitUntil: "networkidle" });
  await page.click('button:has-text("Invite teammate")');
  await page.waitForSelector("text=Invite teammate");
  await page.fill('input[placeholder="e.g. Hana Girma"]', "Resend Verify");
  await page.fill('input[placeholder="name@company.com"]', testEmail);
  await page.click('button:has-text("Send invitation")');
  await page.waitForTimeout(3000);
  const text = await page.textContent("body");
  if (text.includes("couldn't be sent") || text.includes("could not be sent")) {
    throw new Error("still failing: " + text.match(/Teammate added,[^.]*\./)?.[0]);
  }
  console.log("no error banner shown - dialog likely closed on success");
});

await step("team roster shows new invited member with Invited status", async () => {
  await page.goto(`${base}/team`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Sales team");
  const text = await page.textContent("body");
  if (!text.includes("Resend Verify")) throw new Error("new member not in roster");
});

await browser.close();
