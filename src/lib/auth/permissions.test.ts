import { describe, expect, it } from "vitest";

import {
  canUpdateOrganization,
  canManageTeam,
  canCreateRetreat,
  canManageRetreat,
  canViewRetreat,
  canArchiveRetreat,
  canViewAuditLog,
  canViewFinancials,
} from "./permissions";

/**
 * Deze tests spiegelen de permissions matrix in docs/security.md 1-op-1, en
 * moeten bij elke wijziging aan de RLS-policies (supabase/migrations/
 * 20260716081524_rls_policies.sql) opnieuw gecontroleerd worden.
 */

describe("canUpdateOrganization", () => {
  it("staat alleen owner toe", () => {
    expect(canUpdateOrganization("owner")).toBe(true);
    expect(canUpdateOrganization("admin")).toBe(false);
    expect(canUpdateOrganization("coordinator")).toBe(false);
    expect(canUpdateOrganization("viewer")).toBe(false);
  });
});

describe("canManageTeam", () => {
  it("staat alleen owner toe", () => {
    expect(canManageTeam("owner")).toBe(true);
    expect(canManageTeam("admin")).toBe(false);
    expect(canManageTeam("coordinator")).toBe(false);
    expect(canManageTeam("viewer")).toBe(false);
  });
});

describe("canCreateRetreat", () => {
  it("staat owner en admin toe, coordinator en viewer niet", () => {
    expect(canCreateRetreat("owner")).toBe(true);
    expect(canCreateRetreat("admin")).toBe(true);
    expect(canCreateRetreat("coordinator")).toBe(false);
    expect(canCreateRetreat("viewer")).toBe(false);
  });
});

describe("canManageRetreat", () => {
  it("owner en admin mogen altijd beheren, ongeacht toewijzing", () => {
    expect(canManageRetreat("owner", false)).toBe(true);
    expect(canManageRetreat("admin", false)).toBe(true);
  });

  it("coordinator mag alleen beheren als toegewezen aan dit retreat", () => {
    expect(canManageRetreat("coordinator", true)).toBe(true);
    expect(canManageRetreat("coordinator", false)).toBe(false);
  });

  it("viewer mag nooit beheren", () => {
    expect(canManageRetreat("viewer", true)).toBe(false);
    expect(canManageRetreat("viewer", false)).toBe(false);
  });
});

describe("canViewRetreat", () => {
  it("owner, admin en viewer zien alle retreats", () => {
    expect(canViewRetreat("owner", false)).toBe(true);
    expect(canViewRetreat("admin", false)).toBe(true);
    expect(canViewRetreat("viewer", false)).toBe(true);
  });

  it("coordinator ziet alleen toegewezen retreats", () => {
    expect(canViewRetreat("coordinator", true)).toBe(true);
    expect(canViewRetreat("coordinator", false)).toBe(false);
  });
});

describe("canArchiveRetreat / canViewAuditLog", () => {
  it("zijn beperkt tot owner en admin", () => {
    for (const fn of [canArchiveRetreat, canViewAuditLog]) {
      expect(fn("owner")).toBe(true);
      expect(fn("admin")).toBe(true);
      expect(fn("coordinator")).toBe(false);
      expect(fn("viewer")).toBe(false);
    }
  });
});

describe("canViewFinancials", () => {
  it("owner, admin en viewer mogen financiële gegevens lezen, coordinator niet", () => {
    expect(canViewFinancials("owner")).toBe(true);
    expect(canViewFinancials("admin")).toBe(true);
    expect(canViewFinancials("viewer")).toBe(true);
    expect(canViewFinancials("coordinator")).toBe(false);
  });
});
