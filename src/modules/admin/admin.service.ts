import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../shared/errors/apiError";
import { auditService } from "../audit/audit.service";
import { notificationsService } from "../notifications/notifications.service";
import type {
  CompanyListQuery,
  UpdateCompanyStatusInput,
  UserListQuery,
} from "./admin.validation";

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

function lastMonths(count: number) {
  const months: string[] = [];
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setMonth(cursor.getMonth() - (count - 1));
  for (let i = 0; i < count; i += 1) {
    months.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

export const adminService = {
  listCompanies(query: CompanyListQuery) {
    const where: Prisma.CompanyWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              {
                owner: {
                  email: { contains: query.search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    };
    return prisma.company.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, assessments: true, jobs: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  },

  async updateCompanyStatus(
    adminId: string,
    companyId: string,
    input: UpdateCompanyStatusInput,
  ) {
    const existing = await prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!existing) throw ApiError.notFound("Company not found");

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        status: input.status,
        rejectionReason:
          input.status === "APPROVED"
            ? null
            : (input.reason ?? existing.rejectionReason),
      },
    });

    await notificationsService.notify(
      company.ownerId,
      "Company request updated",
      `Your company "${company.name}" is now ${company.status.toLowerCase()}.${input.reason ? ` Note: ${input.reason}` : ""}`,
    );
    await auditService.log({
      actorId: adminId,
      action: `company.${input.status.toLowerCase()}`,
      entity: "Company",
      entityId: company.id,
      metadata: { previous: existing.status, reason: input.reason ?? null },
    });
    return company;
  },

  listUsers(query: UserListQuery) {
    const where: Prisma.UserWhereInput = {
      role: query.role ?? { in: ["COMPANY", "CANDIDATE"] },
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    return prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  },

  async updateUserStatus(
    adminId: string,
    userId: string,
    status: "ACTIVE" | "SUSPENDED",
  ) {
    if (adminId === userId)
      throw ApiError.badRequest("You cannot change your own account status");
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw ApiError.notFound("User not found");
    if (target.role === "SUPER_ADMIN")
      throw ApiError.forbidden("Super admin accounts cannot be modified here");

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, name: true, email: true, role: true, status: true },
    });
    await auditService.log({
      actorId: adminId,
      action: `user.${status.toLowerCase()}`,
      entity: "User",
      entityId: userId,
      metadata: { previous: target.status },
    });
    return user;
  },

  listAssessments() {
    return prisma.assessment.findMany({
      include: {
        company: { select: { id: true, name: true } },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  },

  listPayments() {
    return prisma.payment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  },

  auditLogs: (limit = 50) => auditService.recent(limit),

  /** Aggregated numbers for the admin reports page. */
  async reports() {
    const months = lastMonths(6);
    const since = new Date();
    since.setDate(1);
    since.setMonth(since.getMonth() - 5);
    since.setHours(0, 0, 0, 0);

    const [
      usersByRole,
      companiesByStatus,
      assessmentsByStatus,
      applicationsByStatus,
      paymentsByStatus,
      signups,
      paid,
    ] = await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: true }),
      prisma.company.groupBy({ by: ["status"], _count: true }),
      prisma.assessment.groupBy({ by: ["status"], _count: true }),
      prisma.jobApplication.groupBy({ by: ["status"], _count: true }),
      prisma.payment.groupBy({ by: ["status"], _count: true }),
      prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.payment.findMany({
        where: { status: "PAID", createdAt: { gte: since } },
        select: { createdAt: true, amount: true, currency: true },
      }),
    ]);

    const counts = (
      rows: Array<{ _count: number } & Record<string, unknown>>,
      key: string,
    ) => rows.map((row) => ({ label: String(row[key]), value: row._count }));

    const signupsByMonth = months.map((month) => ({
      month,
      users: signups.filter((u) => monthKey(u.createdAt) === month).length,
    }));
    const revenueByMonth = months.map((month) => ({
      month,
      revenue:
        paid
          .filter((p) => monthKey(p.createdAt) === month)
          .reduce((sum, p) => sum + p.amount, 0) / 100,
    }));

    return {
      usersByRole: counts(usersByRole, "role"),
      companiesByStatus: counts(companiesByStatus, "status"),
      assessmentsByStatus: counts(assessmentsByStatus, "status"),
      applicationsByStatus: counts(applicationsByStatus, "status"),
      paymentsByStatus: counts(paymentsByStatus, "status"),
      signupsByMonth,
      revenueByMonth,
      revenueCurrency: paid[0]?.currency ?? null,
    };
  },
};
