// In your server/company.ts file
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod'; // Make sure you have zod installed for validation

export const companyRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;

    const userCompanies = await ctx.prisma.companyMember.findMany({
      where: { userId },
      select: {
        role: true,
        company: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            ownerId: true,
          },
        },
      },
    });

    const companies = userCompanies.map(({ company, role }) => ({
      id: company.id,
      name: company.name,
      role: company.ownerId === userId ? "OWNER" : role,
      createdAt: company.createdAt,
    }));

    return companies;
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      
      // Create new company
      const company = await ctx.prisma.company.create({
        data: {
          name: input.name,
          ownerId: userId,
          inviteCode: generateInviteCode(), // You'll need to implement this function
          members: {
            create: {
              userId,
              role: 'OWNER',
            },
          },
        },
      });
      
      return {
        company: {
          id: company.id,
          name: company.name,
          inviteCode: company.inviteCode,
        }
      };
    }),
    
  join: protectedProcedure
    .input(z.object({ inviteCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      
      // Find company by invite code
      const company = await ctx.prisma.company.findUnique({
        where: { inviteCode: input.inviteCode },
      });
      
      if (!company) {
        throw new Error('Invalid invite code');
      }
      
      // Check if user is already a member
      const existingMembership = await ctx.prisma.companyMember.findUnique({
        where: {
          userId_companyId: {
            userId,
            companyId: company.id,
          },
        },
      });
      
      if (existingMembership) {
        throw new Error('You are already a member of this company');
      }
      
      // Add user to company
      await ctx.prisma.companyMember.create({
        data: {
          userId,
          companyId: company.id,
          role: 'MEMBER', // Default role for joined users
        },
      });
      
      return { success: true };
    }),
});

// Helper function to generate a random invite code
function generateInviteCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}