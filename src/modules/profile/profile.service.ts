import { prisma } from "../../config/prisma";
import { ApiError } from "../../shared/errors/apiError.js";
import { ROLES } from "../../constants/roles";
import { authService } from "../auth/auth.service";
import type { UpdateProfileInput } from "./profile.validation";

export const profileService = {
  get: (userId: string) => authService.me(userId),

  async update(user: { id: string; role: string }, input: UpdateProfileInput) {
    if (input.name)
      await prisma.user.update({
        where: { id: user.id },
        data: { name: input.name },
      });

    if (user.role === ROLES.CANDIDATE) {
      const { headline, bio, location, phone, cvUrl, portfolioUrl, skills } =
        input;
      const data = {
        headline,
        bio,
        location,
        phone,
        cvUrl,
        portfolioUrl,
        skills,
      };
      await prisma.candidateProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...data },
        update: data,
      });
    } else if (user.role === ROLES.COMPANY) {
      const company = await prisma.company.findUnique({
        where: { ownerId: user.id },
      });
      const wantsCompanyChange = [
        input.companyName,
        input.description,
        input.website,
        input.logoUrl,
      ].some((v) => v !== undefined);
      if (wantsCompanyChange) {
        if (!company)
          throw ApiError.forbidden(
            "Only the company owner can edit company details",
          );
        await prisma.company.update({
          where: { id: company.id },
          data: {
            name: input.companyName,
            description: input.description,
            website: input.website,
            logoUrl: input.logoUrl,
          },
        });
      }
    }

    return authService.me(user.id);
  },
};
