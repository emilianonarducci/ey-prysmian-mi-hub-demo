// Demo user store (localStorage). In production this is replaced by Azure Entra ID.
import { BUSINESS_UNITS } from "./bus";

export type Role = "admin" | "user";

export interface DemoUser {
  email: string;
  password: string;          // plain text — demo only
  buId: string | null;       // null for admins with cross-BU visibility
  role: Role;
  displayName?: string;
}

const STORAGE_KEY = "mi_hub_users_v1";

const SEED: DemoUser[] = [
  { email: "ey.demo@prysmian.com", password: "EYDemo2026!", buId: null,         role: "admin", displayName: "EY Demo Admin" },
  { email: "ic.user@prysmian.com", password: "Prysmian2026!", buId: "ic",        role: "user",  displayName: "I&C Sales Manager" },
  { email: "mining.user@prysmian.com", password: "Prysmian2026!", buId: "mining", role: "user", displayName: "Mining BU Lead" },
  { email: "automotive.user@prysmian.com", password: "Prysmian2026!", buId: "automotive", role: "user", displayName: "Automotive Account Director" },
];

export function loadUsers(): DemoUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {/* ignore */}
  saveUsers(SEED);
  return SEED;
}

export function saveUsers(users: DemoUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function findUser(email: string): DemoUser | undefined {
  return loadUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
}

export function authenticate(email: string, password: string): DemoUser | null {
  const u = findUser(email);
  if (!u || u.password !== password) return null;
  return u;
}

export function addUser(u: DemoUser): { ok: boolean; error?: string } {
  const users = loadUsers();
  if (users.some((x) => x.email.toLowerCase() === u.email.toLowerCase())) {
    return { ok: false, error: "Email already exists" };
  }
  if (u.buId && !BUSINESS_UNITS.some((b) => b.id === u.buId)) {
    return { ok: false, error: "Unknown business unit" };
  }
  users.push(u);
  saveUsers(users);
  return { ok: true };
}

export function updateUserBu(email: string, buId: string | null) {
  const users = loadUsers();
  const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
  if (!u) return;
  u.buId = buId;
  saveUsers(users);
}

export function removeUser(email: string) {
  const users = loadUsers().filter((u) => u.email.toLowerCase() !== email.toLowerCase());
  saveUsers(users);
}

// Session helpers
export function currentSession() {
  return {
    email: sessionStorage.getItem("mi_hub_user"),
    buId:  sessionStorage.getItem("mi_hub_bu"),
    role:  (sessionStorage.getItem("mi_hub_role") as Role | null) ?? "user",
  };
}
