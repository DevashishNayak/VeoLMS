import { describe, expect, it } from "vitest";
import { resolveLessonAccess } from "@/lib/access";

describe("resolveLessonAccess", () => {
  it("allows preview for anonymous viewers", () => {
    expect(
      resolveLessonAccess({
        isPreview: true,
        instructorId: "inst_1",
        enrolled: false,
      })
    ).toBe(true);
  });

  it("blocks paid lessons without enrollment", () => {
    expect(
      resolveLessonAccess({
        isPreview: false,
        userId: "user_1",
        role: "STUDENT",
        instructorId: "inst_1",
        enrolled: false,
      })
    ).toBe(false);
  });

  it("allows enrolled students and staff", () => {
    expect(
      resolveLessonAccess({
        isPreview: false,
        userId: "user_1",
        role: "STUDENT",
        instructorId: "inst_1",
        enrolled: true,
      })
    ).toBe(true);

    expect(
      resolveLessonAccess({
        isPreview: false,
        userId: "admin_1",
        role: "ADMIN",
        instructorId: "inst_1",
        enrolled: false,
      })
    ).toBe(true);

    expect(
      resolveLessonAccess({
        isPreview: false,
        userId: "inst_1",
        role: "INSTRUCTOR",
        instructorId: "inst_1",
        enrolled: false,
      })
    ).toBe(true);

    expect(
      resolveLessonAccess({
        isPreview: false,
        userId: "inst_other",
        role: "INSTRUCTOR",
        instructorId: "inst_1",
        enrolled: false,
      })
    ).toBe(false);
  });
});
