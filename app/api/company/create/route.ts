// app/api/company/route.ts
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { userId } = await auth();
  const User = await currentUser();
  console.log("Authenticated User ID:", userId, " ", User);

  if (!userId || User === null) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  console.log(body)
  const { name } = body;

  if (!name || name.trim() === "") {
    return NextResponse.json(
      { message: "Company name is required" },
      { status: 400 }
    );
  }

  // Ensure the user exists in the database.
  let user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.log("User not found in the database. Creating user...");
    user = await prisma.user.create({
      data: {
        id: userId,
        name: User?.fullName || "", // Replace with actual name if available
        email: User?.emailAddresses[0].emailAddress || "", // Temporary email (replace as needed)
      },
    });
  }
  console.log(user)
  // Check if the company already exists (by name and owner)
  const existingCompany = await prisma.company.findFirst({
    where: {
      AND: [{ name }, { ownerId: userId }],
    },
  });

  if (existingCompany) {
    return NextResponse.json(
      { message: "A company with this name already exists" },
      { status: 409 }
    );
  }

  // Create the company and set the current user as the owner.
  const company = await prisma.company.create({
    data: {
      name,
      ownerId: user.id, // Correct FK reference
      members: {
        create: {
          userId: user.id, // Also use the correct id
        },
      },
    },
  });
  

  console.log("Company created:", company);
  return NextResponse.json({
    message: "Company created successfully",
    company: {
      id: company.id,
      name: company.name,
      role: "owner", // Explicitly returning the role as owner
      createdAt: company.createdAt,
      inviteCode: company.inviteCode,
    },
  });
}
