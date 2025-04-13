// app/api/projects/members/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Get project members
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      console.log("Project ID is required");
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId },
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

    return NextResponse.json(projectMembers);
  } catch (error) {
    console.error("Project members fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project members" },
      { status: 500 }
    );
  }
}

// Add a member to a project
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.projectId || !body.userId) {
      return NextResponse.json(
        {
          error: "Project ID and User ID are required",
        },
        { status: 400 }
      );
    }

    // Check if the user is already a member of the project
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId: body.projectId,
        userId: body.userId,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        {
          error: "User is already a member of this project",
        },
        { status: 400 }
      );
    }

    // Add the user to the project
    const projectMember = await prisma.projectMember.create({
      data: {
        projectId: body.projectId,
        userId: body.userId,
        role: body.role || "MEMBER",
      },
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

    return NextResponse.json({
      success: true,
      message: "Member added to project successfully",
      projectMember,
    });
  } catch (error) {
    console.error("Add project member error:", error);
    return NextResponse.json(
      {
        error: "Failed to add member to project",
      },
      { status: 500 }
    );
  }
}

// Remove a member from a project
// Fix for the DELETE endpoint in app/api/projects/members/route.ts
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return NextResponse.json(
        {
          error: "Project Member ID is required",
        },
        { status: 400 }
      );
    }

    // Check if the member exists
    const existingMember = await prisma.projectMember.findUnique({
      where: { id: memberId },
      include: {
        tasks: true, // Include tasks to check if member has any assigned tasks
      },
    });

    if (!existingMember) {
      return NextResponse.json(
        {
          error: "Project member not found",
        },
        { status: 404 }
      );
    }

    // First, handle the tasks assigned to this member
    if (existingMember.tasks && existingMember.tasks.length > 0) {
      // Either reassign tasks or update them to have no assignee
      await prisma.task.updateMany({
        where: {
          assignedTo: memberId,
        },
        data: {
          assignedTo: null, // Set to null if your schema allows it
        },
      });
    }

    // Now we can safely delete the project member
    const deletedMember = await prisma.projectMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({
      success: true,
      message: "Member removed from project successfully",
      deletedMember: {
        id: deletedMember.id,
        userId: deletedMember.userId,
        projectId: deletedMember.projectId,
      },
    });
  } catch (error) {
    console.error("Remove project member error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to remove member from project",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
