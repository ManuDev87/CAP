import type { Metadata } from "next";
import AppRoot from "@/components/AppRoot";

export const metadata: Metadata = {
  title: "Portal Administrador - Grupo CAP",
};

export default function AdminPage() {
  return <AppRoot portal="admin" />;
}
