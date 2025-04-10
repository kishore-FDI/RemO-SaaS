import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function createTRPCContext() {
  const authData = await auth();

  return {
    auth: authData,
    prisma,
  };
}
