import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tasks?projectId=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  try {
    const tasks = await prisma.task.findMany({
      where: {
        projectId: projectId || undefined,
        archived: false,
      },
      include: {
        assignee: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks
export async function POST(request: Request) {
  try {
    const { title, description, dueDate, projectId, assignedTo } =
      await request.json();
      console.log(request)
    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        project: {
          connect: { id: projectId },
        },
        assignee: assignedTo ? { connect: { id: assignedTo } } : undefined,
      },
      include: {
        assignee: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks
export async function PATCH(request: Request) {
  try {
    const { taskId, completed } = await request.json();

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { completed },
    });

    return NextResponse.json({ updatedTask });
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks
export async function DELETE(request: Request) {
  try {
    const { taskId, archive = false } = await request.json();

    if (archive) {
      const archivedTask = await prisma.task.update({
        where: { id: taskId },
        data: { archived: true },
      });
      return NextResponse.json({ archivedTask });
    } else {
      await prisma.task.delete({ where: { id: taskId } });
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Error deleting/archiving task:", error);
    return NextResponse.json(
      { error: "Failed to delete or archive task" },
      { status: 500 }
    );
  }
}
