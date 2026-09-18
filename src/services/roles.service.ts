import "server-only";
import { getDataSource } from "@/db/data-source";
import { Permission, Role, User } from "@/entities";
import { permissionCatalog, type PermissionKey } from "@/lib/permissions";

export async function listRoles() {
  const dataSource = await getDataSource();
  const roles = await dataSource.getRepository(Role).find({ relations: { permissions: true }, order: { createdAt: "ASC" } });
  const memberCounts = await dataSource.getRepository(User).createQueryBuilder("user").select("user.roleId", "roleId").addSelect("COUNT(*)", "count").groupBy("user.roleId").getRawMany<{ roleId: number; count: string }>();
  const countByRole = new Map(memberCounts.map((row) => [row.roleId, Number(row.count)]));

  return roles.map((role) => ({
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    memberCount: countByRole.get(role.id) ?? 0,
    permissionKeys: role.permissions.map((permission) => permission.key) as PermissionKey[],
  }));
}

export async function getRole(id: number) {
  const dataSource = await getDataSource();
  const role = await dataSource.getRepository(Role).findOneOrFail({ where: { id }, relations: { permissions: true } });
  return { id: role.id, code: role.code, name: role.name, description: role.description, isSystem: role.isSystem, permissionKeys: role.permissions.map((permission) => permission.key) as PermissionKey[] };
}

export async function listRolesForPreview() {
  const dataSource = await getDataSource();
  const roles = await dataSource.getRepository(Role).find({ relations: { permissions: true }, order: { createdAt: "ASC" } });
  return roles.map((role) => ({ code: role.code, name: role.name, permissionKeys: role.permissions.map((permission) => permission.key) as PermissionKey[] }));
}

export function listPermissionCatalog() {
  return permissionCatalog.map((permission) => ({ ...permission }));
}

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createRole(input: { name: string; description?: string; permissionKeys: PermissionKey[] }) {
  const dataSource = await getDataSource();
  const roleRepo = dataSource.getRepository(Role);

  const code = slugify(input.name);
  if (!code) throw new Error("Enter a role name.");

  const existing = await roleRepo.findOne({ where: [{ code }, { name: input.name }] });
  if (existing) throw new Error("A role with this name already exists.");

  const permissions = input.permissionKeys.length ? await dataSource.getRepository(Permission).find({ where: input.permissionKeys.map((key) => ({ key })) }) : [];

  return roleRepo.save(roleRepo.create({ code, name: input.name, description: input.description || null, isSystem: false, permissions }));
}

export async function renameRole(id: number, name: string) {
  const dataSource = await getDataSource();
  const roleRepo = dataSource.getRepository(Role);
  const role = await roleRepo.findOneOrFail({ where: { id } });
  if (role.isSystem) throw new Error("The system Administrator role can't be renamed.");

  role.name = name;
  return roleRepo.save(role);
}

export async function updateRolePermissions(id: number, permissionKeys: PermissionKey[]) {
  const dataSource = await getDataSource();
  const roleRepo = dataSource.getRepository(Role);
  const role = await roleRepo.findOneOrFail({ where: { id }, relations: { permissions: true } });
  if (role.isSystem) throw new Error("The system Administrator role's permissions can't be changed.");

  const permissions = permissionKeys.length ? await dataSource.getRepository(Permission).find({ where: permissionKeys.map((key) => ({ key })) }) : [];
  role.permissions = permissions;
  return roleRepo.save(role);
}

export async function deleteRole(id: number) {
  const dataSource = await getDataSource();
  const roleRepo = dataSource.getRepository(Role);
  const role = await roleRepo.findOneOrFail({ where: { id } });
  if (role.isSystem) throw new Error("The system Administrator role can't be deleted.");

  const memberCount = await dataSource.getRepository(User).count({ where: { roleId: id } });
  if (memberCount > 0) throw new Error(`Reassign the ${memberCount} teammate${memberCount === 1 ? "" : "s"} on this role before deleting it.`);

  await roleRepo.delete(id);
}

export async function resolveRoleId(code: string) {
  const dataSource = await getDataSource();
  const role = await dataSource.getRepository(Role).findOne({ where: { code }, select: { id: true } });
  return role?.id ?? null;
}

export async function countUsersWithPermission(key: PermissionKey) {
  const dataSource = await getDataSource();
  return dataSource
    .getRepository(User)
    .createQueryBuilder("user")
    .innerJoin("user.role", "role")
    .innerJoin("role.permissions", "permission")
    .where("permission.key = :key", { key })
    .getCount();
}

export async function listUserIdsWithPermission(key: PermissionKey) {
  const dataSource = await getDataSource();
  const rows = await dataSource
    .getRepository(User)
    .createQueryBuilder("user")
    .select("user.id", "id")
    .innerJoin("user.role", "role")
    .innerJoin("role.permissions", "permission")
    .where("permission.key = :key", { key })
    .andWhere("user.active = true")
    .getRawMany<{ id: number }>();

  return rows.map((row) => row.id);
}

export async function assignUserRole(userId: number, roleId: number) {
  const dataSource = await getDataSource();
  const userRepo = dataSource.getRepository(User);
  const user = await userRepo.findOneOrFail({ where: { id: userId }, relations: { role: { permissions: true } } });

  const currentHasRolesManage = user.role.permissions.some((permission) => permission.key === "roles:manage");
  if (currentHasRolesManage) {
    const newRole = await dataSource.getRepository(Role).findOneOrFail({ where: { id: roleId }, relations: { permissions: true } });
    const newHasRolesManage = newRole.permissions.some((permission) => permission.key === "roles:manage");
    if (!newHasRolesManage) {
      const adminCount = await countUsersWithPermission("roles:manage");
      if (adminCount <= 1) throw new Error("This is the last teammate who can manage roles — assign someone else first.");
    }
  }

  user.roleId = roleId;
  return userRepo.save(user);
}
