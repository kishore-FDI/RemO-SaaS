// app/api/company/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  console.log("Fetching companies for user:", userId);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all companies where the user is a member and include the role
    const userCompanies = await prisma.companyMember.findMany({
      where: { userId },
      select: {
        role: true, // ✅ Fetch role from CompanyMember
        company: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            ownerId: true, // ✅ Fetch ownerId to verify ownership
          },
        },
      },
    });

    // Fix the role assignment
    const companies = userCompanies.map(({ company, role }) => ({
      id: company.id,
      name: company.name,
      role: company.ownerId === userId ? "OWNER" : role, // ✅ If user is owner, set role to OWNER
      createdAt: company.createdAt,
    }));

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { message: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
