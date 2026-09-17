import "dotenv/config";
import bcrypt from "bcryptjs";
import { AppDataSource } from "./data-source";
import { CallOutcome, CampaignPlatform, CampaignStatus, PipelineStage, ProjectStatus } from "../entities/enums";
import { User } from "../entities/user.entity";
import { Role } from "../entities/role.entity";
import { Project } from "../entities/project.entity";
import { Campaign } from "../entities/campaign.entity";
import { Client } from "../entities/client.entity";
import { Call } from "../entities/call.entity";

const adminEmail = "ewenetmikiyas@gmail.com";
const adminPassword = "Bekur-Admin-2026!";

async function main() {
  const dataSource = await AppDataSource.initialize();

  const roleRepo = dataSource.getRepository(Role);
  const administratorRole = await roleRepo.findOneOrFail({ where: { code: "administrator" } });

  const userRepo = dataSource.getRepository(User);
  const existingAdmin = await userRepo.findOne({ where: { email: adminEmail } });
  const admin =
    existingAdmin ??
    (await userRepo.save(
      userRepo.create({
        code: "USR-ADMIN",
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        fullName: "Amanuel Mekonnen",
        roleId: administratorRole.id,
        active: true,
      }),
    ));

  const projectRepo = dataSource.getRepository(Project);
  let project = await projectRepo.findOne({ where: { name: "Clinic Growth" } });
  if (!project) {
    project = await projectRepo.save(
      projectRepo.create({
        code: "PRJ-001",
        name: "Clinic Growth",
        description: "Facebook and Instagram lead generation for independent clinics in Addis Ababa.",
        status: ProjectStatus.ACTIVE,
        revenueTarget: "60000",
        ownerName: admin.fullName,
      }),
    );
  }

  const campaignRepo = dataSource.getRepository(Campaign);
  let campaign = await campaignRepo.findOne({ where: { name: "September Messages" } });
  if (!campaign) {
    campaign = await campaignRepo.save(
      campaignRepo.create({
        code: "CMP-001",
        name: "September Messages",
        projectId: project.id,
        platform: CampaignPlatform.INSTAGRAM,
        status: CampaignStatus.ACTIVE,
        adSpend: "1240",
      }),
    );
  }

  const clientRepo = dataSource.getRepository(Client);
  const seedClients = [
    { name: "Mekdes Tadesse", business: "Addis Family Clinic", phone: "+251912487310", stage: PipelineStage.PROPOSAL_SENT },
    { name: "Samuel Bekele", business: "Lalibela Medical Center", phone: "+251923441908", stage: PipelineStage.DEMO_SCHEDULED },
    { name: "Hana Girma", business: "Orbit Dental Care", phone: "+251938094162", stage: PipelineStage.QUALIFIED },
  ];

  for (const seedClient of seedClients) {
    const existing = await clientRepo.findOne({ where: { phone: seedClient.phone } });
    if (existing) continue;

    const client = await clientRepo.save(
      clientRepo.create({
        code: `CL-${Math.floor(Math.random() * 900 + 100)}`,
        displayName: seedClient.name,
        phone: seedClient.phone,
        businessName: seedClient.business,
        campaignId: campaign.id,
        currentAssignedUserId: admin.id,
        firstContactDate: new Date().toISOString().slice(0, 10),
        pipelineStage: seedClient.stage,
      }),
    );

    const callRepo = dataSource.getRepository(Call);
    await callRepo.save(
      callRepo.create({
        clientId: client.id,
        loggedByUserId: admin.id,
        campaignId: campaign.id,
        projectId: project.id,
        calledAt: new Date(),
        outcome: CallOutcome.ANSWERED_INTERESTED,
        outcomeNote: "Seed data — first contact logged automatically.",
        pipelineStageAfter: seedClient.stage,
      }),
    );
  }

  console.log("Seed complete.");
  console.log(`Admin login: ${adminEmail} / ${existingAdmin ? "(unchanged, already existed)" : adminPassword}`);
  await dataSource.destroy();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
