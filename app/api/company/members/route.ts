// app/api/company/members/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get company members
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    const companyMembers = await prisma.companyMember.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(companyMembers);
  } catch (error) {
    console.error("Company members fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch company members" },
      { status: 500 }
    );
  }
}
