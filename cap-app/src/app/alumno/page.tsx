import type { Metadata } from "next";
import AppRoot from "@/components/AppRoot";

export const metadata: Metadata = {
  title: "Portal Alumno - Grupo CAP",
};

export default function AlumnoPage() {
  return <AppRoot portal="alumno" />;
}
