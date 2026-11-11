import { prisma } from "../../config/prisma";
import { ApiError } from "../../shared/errors/apiError";
import { ROLES } from "../../constants/roles";

async function adminDashboard() {
  const [
    users,
    companies,
    candidates,
    assessments,
    pendingCompanies,
    jobs,
    applications,
    paidPayments,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.user.count({ where: { role: ROLES.CANDIDATE } }),
    prisma.assessment.count(),
    prisma.company.count({ where: { status: "PENDING" } }),
    prisma.jobPosition.count(),
    prisma.jobApplication.count(),
    prisma.payment.groupBy({
      by: ["currency"],
      where: { status: "PAID" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    role: ROLES.SUPER_ADMIN,
    stats: {
      users,
      companies,
      candidates,
      assessments,
      pendingCompanies,
      jobs,
      applications,
    },
    revenue: paidPayments.map((row) => ({
      currency: row.currency,
      amount: row._sum.amount ?? 0,
      payments: row._count,
    })),
    recentUsers,
  };
}

async function companyDashboard(companyId?: string) {
  if (!companyId) throw ApiError.forbidden("Company context missing");
  const [
    assessments,
    published,
    jobs,
    openJobs,
    applications,
    members,
    pendingEvaluations,
    recentApplications,
  ] = await Promise.all([
    prisma.assessment.count({ where: { companyId } }),
    prisma.assessment.count({ where: { companyId, status: "PUBLISHED" } }),
    prisma.jobPosition.count({ where: { companyId } }),
    prisma.jobPosition.count({ where: { companyId, status: "OPEN" } }),
    prisma.jobApplication.count({ where: { job: { companyId } } }),
    prisma.companyMember.count({ where: { companyId } }),
    prisma.assessmentResult.count({
      where: { status: "PENDING", assessment: { companyId } },
    }),
    prisma.jobApplication.findMany({
      where: { job: { companyId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        job: { select: { title: true } },
        candidate: { select: { name: true } },
      },
    }),
  ]);

  return {
    role: ROLES.COMPANY,
    stats: {
      assessments,
      publishedAssessments: published,
      jobs,
      openJobs,
      applications,
      employees: members,
      pendingEvaluations,
    },
    recentApplications,
  };
}

async function candidateDashboard(userId: string) {
  const [
    attempts,
    applications,
    pendingOffers,
    unreadNotifications,
    results,
    ranking,
  ] = await Promise.all([
    prisma.assessmentAttempt.count({ where: { candidateId: userId } }),
    prisma.jobApplication.count({ where: { candidateId: userId } }),
    prisma.employmentOffer.count({
      where: { candidateId: userId, status: "SENT" },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
    prisma.assessmentResult.findMany({
      where: { candidateId: userId },
      orderBy: { id: "desc" },
      take: 20,
      include: { assessment: { select: { id: true, title: true } } },
    }),
    prisma.candidateRanking.findUnique({
      where: {
        candidateId_companyId: { candidateId: userId, companyId: "PUBLIC" },
      },
    }),
  ]);

  const finished = results.filter((r) => r.status !== "PENDING");
  const passed = finished.filter((r) => r.status === "PASSED").length;
  const averageScore = finished.length
    ? finished.reduce((sum, r) => sum + r.percentage, 0) / finished.length
    : 0;
  const position = ranking
    ? (await prisma.candidateRanking.count({
        where: { companyId: "PUBLIC", percentage: { gt: ranking.percentage } },
      })) + 1
    : null;

  return {
    role: ROLES.CANDIDATE,
    stats: {
      attempts,
      passed,
      averageScore: Math.round(averageScore * 10) / 10,
      applications,
      pendingOffers,
      unreadNotifications,
    },
    ranking: ranking
      ? {
          position,
          percentage: ranking.percentage,
          passedCount: ranking.passedCount,
        }
      : null,
    recentResults: results.slice(0, 5).map((r) => ({
      id: r.id,
      title: r.assessment.title,
      assessmentId: r.assessment.id,
      percentage: r.percentage,
      status: r.status,
    })),
  };
}

export const dashboardService = {
  forUser(user: { id: string; role: string }, companyId?: string) {
    if (user.role === ROLES.SUPER_ADMIN) return adminDashboard();
    if (user.role === ROLES.COMPANY) return companyDashboard(companyId);
    return candidateDashboard(user.id);
  },
};
