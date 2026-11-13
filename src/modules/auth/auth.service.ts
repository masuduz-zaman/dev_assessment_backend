import type { Role, User } from "@prisma/client";
import { env } from "../../config/env";
import { googleClient } from "../../config/google";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../shared/errors/apiError.js";
import { comparePassword, hashPassword } from "../../shared/utils/password";
import { createSlug } from "../../shared/utils/slug";
import { signAccessToken } from "../../shared/utils/token";
import { ROLES } from "../../constants/roles";
import type {
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
} from "./auth.validation";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: User["status"];
  avatarUrl: string | null;
}

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  avatarUrl: user.avatarUrl,
});

async function assertCanSignIn(user: User) {
  if (user.status !== "ACTIVE")
    throw ApiError.forbidden("Your account is not active. Contact support");
  if (user.role === ROLES.COMPANY) {
    const company = await prisma.company.findUnique({
      where: { ownerId: user.id },
    });
    if (company && company.status !== "APPROVED") {
      throw ApiError.forbidden(
        company.status === "PENDING"
          ? "Your company request is awaiting Super Admin approval"
          : `Your company access is ${company.status.toLowerCase()}`,
      );
    }
  }
}

const issueSession = (user: User) => ({
  token: signAccessToken({ id: user.id, role: user.role }),
  user: toPublicUser(user),
});

function createRoleProfile(input: {
  role: Role;
  name: string;
  companyName?: string;
}) {
  if (input.role === ROLES.COMPANY) {
    const companyName = input.companyName ?? `${input.name}'s Company`;
    return {
      company: { create: { name: companyName, slug: createSlug(companyName) } },
    };
  }
  return { candidate: { create: {} } };
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing)
      throw ApiError.conflict("An account with this email already exists");

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: input.role,
        ...createRoleProfile(input),
      },
    });

    return {
      user: toPublicUser(user),
      requiresApproval: user.role === ROLES.COMPANY,
    };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) throw ApiError.unauthorized("Invalid email or password");
    if (!user.passwordHash)
      throw ApiError.unauthorized(
        'This account uses Google sign-in. Choose "Continue with Google"',
      );
    if (!(await comparePassword(input.password, user.passwordHash)))
      throw ApiError.unauthorized("Invalid email or password");

    await assertCanSignIn(user);
    return issueSession(user);
  },

  async loginWithGoogle(input: GoogleLoginInput) {
    if (!googleClient || !env.GOOGLE_CLIENT_ID)
      throw ApiError.unavailable(
        "Google sign-in is not configured on this server",
      );

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: input.idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw ApiError.unauthorized("Google sign-in could not be verified");
    }
    if (!payload?.email || !payload.sub)
      throw ApiError.unauthorized(
        "Google account did not return an email address",
      );
    if (!payload.email_verified)
      throw ApiError.unauthorized("Your Google email address is not verified");

    const email = payload.email.toLowerCase();
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: payload.sub }, { email }] },
    });
    let created = false;

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: payload.name ?? email.split("@")[0],
          email,
          googleId: payload.sub,
          emailVerified: true,
          avatarUrl: payload.picture,
          role: input.role,
          ...createRoleProfile({
            role: input.role,
            name: payload.name ?? email,
            companyName: input.companyName,
          }),
        },
      });
      created = true;
    } else if (
      !user.googleId ||
      !user.emailVerified ||
      (!user.avatarUrl && payload.picture)
    ) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId ?? payload.sub,
          emailVerified: true,
          avatarUrl: user.avatarUrl ?? payload.picture,
        },
      });
    }

    if (created && user.role === ROLES.COMPANY) {
      return {
        token: null,
        user: toPublicUser(user),
        requiresApproval: true,
        created,
      };
    }

    await assertCanSignIn(user);
    return { ...issueSession(user), requiresApproval: false, created };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        candidate: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            website: true,
            logoUrl: true,
            status: true,
          },
        },
      },
    });
    if (!user) throw ApiError.notFound("User not found");
    return user;
  },

  googleConfig() {
    return {
      enabled: Boolean(env.GOOGLE_CLIENT_ID),
      clientId: env.GOOGLE_CLIENT_ID ?? null,
    };
  },
};
