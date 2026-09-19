import "dotenv/config";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { XMLParser } from "fast-xml-parser";
import pg from "pg";

const workbookPath = path.resolve("docs/Facebook_Ad_Sales_Call_Tracker (4).xlsx");
const tempZip = path.join(os.tmpdir(), `bekur-workbook-${process.pid}.zip`);
const tempDir = path.join(os.tmpdir(), `bekur-workbook-${process.pid}`);
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

const platformMap = { Facebook: "Facebook", "Facebook & Instagram": "Facebook" };
const stageMap = {
  "New Lead": "New Lead",
  "Attempted Contact": "Attempted Contact",
  Qualified: "Qualified",
  "Demo Scheduled": "Demo Scheduled",
  "Proposal Sent": "Proposal Sent",
  "Closed Won": "Closed Won",
  "Closed Lost": "Closed Lost",
};
const outcomeMap = {
  "Answered - Interested": "Answered - Interested",
  "Answered - Requested Demo": "Answered - Requested Demo",
  "Callback Requested": "Callback Requested",
  "No Answer": "No Answer",
  "Follow-up Scheduled": "Follow-up Scheduled",
  "Converted / Sale": "Converted / Sale",
};

function asArray(value) {
  return value == null ? [] : Array.isArray(value) ? value : [value];
}

function excelValue(cell, sharedStrings) {
  const value = cell?.v;
  if (value == null) return "";
  return cell?.["@_t"] === "s" ? sharedStrings[Number(value)] ?? "" : String(value);
}

function rowsFromSheet(filePath, sharedStrings) {
  const document = parser.parse(fs.readFileSync(filePath, "utf8"));
  return asArray(document.worksheet?.sheetData?.row).map((sheetRow) => {
    const values = {};
    for (const cell of asArray(sheetRow.c)) values[cell["@_r"]?.replace(/\d+$/, "")] = excelValue(cell, sharedStrings);
    return values;
  });
}

function excelDate(value) {
  if (!value || Number(value) === 0) return null;
  return new Date((Number(value) - 25569) * 86400 * 1000).toISOString().slice(0, 10);
}

function excelTimestamp(dateValue, timeValue) {
  if (!dateValue) return null;
  return new Date((Number(dateValue) + Number(timeValue || 0) - 25569) * 86400 * 1000).toISOString();
}

function normalizePhone(phone) {
  return String(phone).replace(/\D/g, "").replace(/^0/, "251");
}

function extractWorkbook() {
  fs.copyFileSync(workbookPath, tempZip);
  execFileSync("powershell", ["-NoProfile", "-Command", `Expand-Archive -LiteralPath '${tempZip}' -DestinationPath '${tempDir}' -Force`], { stdio: "ignore" });
  const sharedDocument = parser.parse(fs.readFileSync(path.join(tempDir, "xl/sharedStrings.xml"), "utf8"));
  const sharedStrings = asArray(sharedDocument.sst?.si).map((item) => {
    if (item.t) return item.t;
    return asArray(item.r).map((run) => run.t ?? "").join("");
  });
  return {
    campaigns: rowsFromSheet(path.join(tempDir, "xl/worksheets/sheet4.xml"), sharedStrings).slice(1),
    clients: rowsFromSheet(path.join(tempDir, "xl/worksheets/sheet5.xml"), sharedStrings).slice(1),
    calls: rowsFromSheet(path.join(tempDir, "xl/worksheets/sheet6.xml"), sharedStrings).slice(1),
  };
}

async function main() {
  const workbook = extractWorkbook();
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();
  const counts = { campaigns: 0, clients: 0, calls: 0, skippedCalls: 0 };
  try {
    await client.query("BEGIN");
    const project = (await client.query(`SELECT id FROM projects WHERE name = $1 ORDER BY id LIMIT 1`, ["Clinic Managment system"])).rows[0];
    if (!project) throw new Error("Project 'Clinic Managment system' was not found");
    const admin = (await client.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, ["ewenetmikiyas@gmail.com"])).rows[0];
    if (!admin) throw new Error("Admin user was not found");

    const campaignIds = new Map();
    for (const row of workbook.campaigns.filter((item) => item.A && item.B)) {
      const platform = platformMap[row.C] ?? "Facebook";
      const existing = (await client.query(`SELECT id FROM campaigns WHERE code = $1`, [row.A])).rows[0];
      const result = existing
        ? existing
        : (await client.query(`INSERT INTO campaigns (code, name, "projectId", platform, status, "startDate", "adSpend") VALUES ($1, $2, $3, $4, 'Active', $5, $6) RETURNING id`, [row.A, row.B, project.id, platform, excelDate(row.E), Number(row.G || 0)])).rows[0];
      campaignIds.set(row.A, result.id);
      if (!existing) counts.campaigns++;
    }

    const clientIds = new Map();
    for (const row of workbook.clients.filter((item) => item.A && item.C && campaignIds.has(item.E))) {
      const existing = (await client.query(`SELECT id FROM clients WHERE code = $1 OR "phoneNormalized" = $2 LIMIT 1`, [row.A, normalizePhone(row.C)])).rows[0];
      const result = existing
        ? existing
        : (await client.query(`INSERT INTO clients (code, "displayName", phone, "phoneNormalized", email, "campaignId", "currentAssignedUserId", "firstContactDate", "pipelineStage", notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`, [row.A, row.B || row.C, row.C, normalizePhone(row.C), row.D || null, campaignIds.get(row.E), admin.id, excelDate(row.F), stageMap[row.G] ?? "New Lead", row.M || null])).rows[0];
      clientIds.set(row.A, result.id);
      if (!existing) counts.clients++;
    }

    for (const row of workbook.calls.filter((item) => item.A)) {
      const clientId = clientIds.get(row.M);
      const campaignId = campaignIds.get(row.F);
      if (!clientId || !campaignId || !row.B) {
        counts.skippedCalls++;
        continue;
      }
      const marker = `[Import ${row.A}]`;
      const duplicate = (await client.query(`SELECT id FROM calls WHERE "outcomeNote" LIKE $1 LIMIT 1`, [`${marker}%`])).rows[0];
      if (duplicate) continue;
      await client.query(`INSERT INTO calls ("clientId", "loggedByUserId", "campaignId", "projectId", "calledAt", outcome, "outcomeNote", "pipelineStageAfter", "dealValue", "nextFollowUpDate") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [clientId, admin.id, campaignId, project.id, excelTimestamp(row.B, row.C), outcomeMap[row.G] ?? "No Answer", `${marker} ${row.L || ""}`.trim(), stageMap[row.H] ?? "New Lead", row.I || null, excelDate(row.J)]);
      counts.calls++;
    }
    await client.query("COMMIT");
    console.log(JSON.stringify(counts));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
    fs.rmSync(tempZip, { force: true });
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});