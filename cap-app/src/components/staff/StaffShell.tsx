"use client";

import type { ReactNode } from "react";
import { IconLogout, IconSearch } from "@/components/icons";

export type StaffNavItem = {
  id: string;
  label: string;
  icon: ReactNode;
};

export function matchesStaffQuery(
  query: string,
  ...parts: Array<string | undefined>
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return parts.some((part) => (part ?? "").toLowerCase().includes(needle));
}

export function StaffSearch({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label className="staff-search">
      <span className="sr-only">{label}</span>
      <IconSearch className="staff-search-icon" />
      <input
        type="search"
        className="input staff-search-field"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </label>
  );
}

type StaffShellProps = {
  brand: string;
  eyebrow: string;
  userName?: string;
  userRole?: string;
  items: StaffNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onLogout: () => void;
  title: string;
  subtitle?: string;
  headerAction?: ReactNode;
  children: ReactNode;
};

export default function StaffShell({
  brand,
  eyebrow,
  userName,
  userRole,
  items,
  activeId,
  onSelect,
  onLogout,
  title,
  subtitle,
  headerAction,
  children,
}: StaffShellProps) {
  return (
    <div className="staff-shell">
      <aside className="staff-sidebar">
        <div className="staff-brand">
          <span className="staff-brand-mark">CAP</span>
          <div className="min-w-0">
            <p className="staff-brand-name">{brand}</p>
            <p className="staff-brand-sub">{eyebrow}</p>
          </div>
        </div>
        <nav className="staff-nav" aria-label="Secciones del panel">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`staff-nav-btn ${activeId === item.id ? "is-active" : ""}`}
              onClick={() => onSelect(item.id)}
            >
              <span className="staff-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="staff-sidebar-foot">
          {(userName || userRole) && (
            <div className="staff-user">
              {userName ? <p className="staff-user-name">{userName}</p> : null}
              {userRole ? <p className="staff-user-role">{userRole}</p> : null}
            </div>
          )}
          <button type="button" className="staff-logout" onClick={onLogout}>
            <IconLogout className="text-base" /> Salir
          </button>
        </div>
      </aside>

      <div className="staff-main">
        <nav className="staff-mobile-nav" aria-label="Secciones">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`staff-mobile-btn ${activeId === item.id ? "is-active" : ""}`}
              onClick={() => onSelect(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <header className="staff-topbar">
          <div className="min-w-0">
            <h1 className="staff-title">{title}</h1>
            {subtitle ? <p className="staff-subtitle">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {headerAction}
            {(userName || userRole) && (
              <div className="staff-user staff-user-top md:hidden">
                {userName ? <p className="staff-user-name">{userName}</p> : null}
                {userRole ? <p className="staff-user-role">{userRole}</p> : null}
              </div>
            )}
            <button
              type="button"
              className="staff-logout md:hidden"
              onClick={onLogout}
            >
              <IconLogout className="text-base" /> Salir
            </button>
          </div>
        </header>
        <div className="staff-content">{children}</div>
      </div>
    </div>
  );
}
