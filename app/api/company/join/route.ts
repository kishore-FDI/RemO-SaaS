// app/api/company/join/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { userId } = await auth();
  console.log("Join request from user ID:", userId);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { inviteCode } = body;

  if (!inviteCode) {
    return NextResponse.json(
      { message: "Invite code is required" },
      { status: 400 }
    );
  }

  try {
    // Deal with invite code validation errors here
    const company = await prisma.company.findFirst({
      where: { inviteCode },
    });

    if (!company) {
      return NextResponse.json(
        { message: "Invalid invite code" },
        { status: 404 }
      );
    }

    // Check if user already is a member of this company
    const existingMembership = await prisma.companyMember.findFirst({
      where: {
        userId,
        companyId: company.id,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { message: "You are already a member of this company" },
        { status: 409 }
      );
    }

    // Ensure the user exists in the database
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          name: "Unknown User", // Replace with actual name if available
          email: `${userId}@example.com`, // Temporary email
        },
      });
    }

    // Add user to company members
    await prisma.companyMember.create({
      data: {
        userId,
        companyId: company.id,
        // role: "member", // Default role for joined members
      },
    });

    return NextResponse.json({
      message: "Successfully joined company",
      company: {
        id: company.id,
        name: company.name,
      },
    });
  } catch (error) {
    console.error("Error joining company:", error);
    return NextResponse.json(
      { message: "Failed to join company" },
      { status: 500 }
    );
  }
}
