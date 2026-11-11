import { prisma } from '../../config/prisma';
import { type Actor, isAdmin } from '../../shared/utils/actor';

export const resultsService = {
  listMine(candidateId: string) {
    return prisma.assessmentResult.findMany({
      where: { candidateId },
      include: {
        assessment: { select: { id: true, title: true, passMarks: true, company: { select: { name: true } } } },
        attempt: { select: { submittedAt: true, status: true } },
      },
      orderBy: { attempt: { submittedAt: 'desc' } },
    });
  },

  listForCompany(actor: Actor) {
    return prisma.assessmentResult.findMany({
      where: { assessment: isAdmin(actor) ? {} : { companyId: actor.companyId ?? '__none__' } },
      include: {
        assessment: { select: { id: true, title: true } },
        candidate: { select: { id: true, name: true, email: true } },
        attempt: { select: { submittedAt: true } },
      },
      orderBy: { attempt: { submittedAt: 'desc' } },
      take: 200,
    });
  },
};
