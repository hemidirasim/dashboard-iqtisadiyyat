export const ROLE_LABEL: Record<number, "reporter" | "editor" | "admin"> = {
  0: "reporter",
  1: "editor",
  2: "admin",
};

export type RoleName = (typeof ROLE_LABEL)[number];




