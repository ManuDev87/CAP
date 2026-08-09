import type { SessionUser } from "@/lib/types";

export type Portal = "alumno" | "profesor" | "admin";

export const PORTAL_LABELS: Record<Portal, string> = {
  alumno: "Portal Alumno",
  profesor: "Portal Profesor",
  admin: "Portal Administrador",
};

export const PORTAL_PATHS: Record<Portal, string> = {
  alumno: "/alumno",
  profesor: "/profesor",
  admin: "/admin",
};

export function portalForRole(role: SessionUser["role"]): Portal {
  if (role === "root") return "admin";
  if (role === "teacher") return "profesor";
  return "alumno";
}

export function roleMatchesPortal(
  role: SessionUser["role"],
  portal: Portal
): boolean {
  return portalForRole(role) === portal;
}

export function wrongPortalMessage(portal: Portal): string {
  if (portal === "alumno") {
    return "Este usuario no pertenece al portal del alumno";
  }
  if (portal === "profesor") {
    return "Este usuario no pertenece al portal del profesor";
  }
  return "Este usuario no pertenece al portal de administrador";
}
