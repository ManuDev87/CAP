import type { Metadata } from "next";
import AppRoot from "@/components/AppRoot";

export const metadata: Metadata = {
  title: "Portal Profesor - Grupo CAP",
};

export default function ProfesorPage() {
  return <AppRoot portal="profesor" />;
}
