// app/api/projects/[projectId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = await params.projectId;
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const members = await prisma.projectMember.findMany({
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
    
    const tasks = await prisma.task.findMany({
      where: { projectId, archived: false },
    });
    
    return NextResponse.json({
      project,
      members,
      tasks,
    });
  } catch (error) {
    console.error('Error fetching project data:', error);
    return NextResponse.json({ error: 'Failed to fetch project data' }, { status: 500 });
  }
}