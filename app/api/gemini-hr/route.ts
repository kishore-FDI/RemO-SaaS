// app/api/gemini-hr/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {prisma} from '@/lib/prisma';
import { ProjectRole } from '@prisma/client';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Define the type of actions the HR can take
type HRAction = {
  action: 'ADD_MEMBER' | 'REMOVE_MEMBER' | 'CHANGE_ROLE' | 'ADD_TASK' | 'ASSIGN_TASK' | 'MARK_COMPLETED' | 'DELETE_TASK' | 'NONE';
  userId?: string;
  userName?: string;
  userEmail?: string;
  role?: ProjectRole;
  taskId?: string;
  taskTitle?: string;
  taskDescription?: string;
  dueDate?: string;
  assigneeId?: string;
  completed?: boolean;
  deleteAllTasks?: boolean; // Optional flag to delete all tasks
};

export async function POST(request: NextRequest) {
  try {
    const { text, projectId, projectMembers } = await request.json();
    
    if (!text || !projectId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    // First, get the project details for context
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        tasks: true,
        company: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Format context data for Gemini
    const projectContext = {
      projectId: project.id,
      projectTitle: project.title,
      projectDescription: project.description,
      companyName: project.company.name,
      members: project.members.map(m => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
      tasks: project.tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        completed: t.completed,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        assignedTo: t.assignedTo,
      })),
      companyMembers: project.company.members.map(m => ({
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
      })),
    };
    
    // Create the prompt for Gemini
    const prompt = `
You are an HR assistant for a project management system. Your job is to help manage team members and tasks for projects.

Current project context:
${JSON.stringify(projectContext, null, 2)}

The user said: "${text}"

Respond naturally as an HR assistant and determine if any actions need to be taken based on the user's request.
If actions are needed, include a JSON block in your response with the following format:

{
  "actions": [
    {
      "action": "ADD_MEMBER" | "REMOVE_MEMBER" | "CHANGE_ROLE" | "ADD_TASK" | "ASSIGN_TASK" | "MARK_COMPLETED" | "DELETE_TASK" | "NONE",
      // For member actions
      "userId": "user-id", // Required for existing users
      "userName": "User Name", // Required for new users
      "userEmail": "user@email.com", // Required for new users
      "role": "OWNER" | "ADMIN" | "MEMBER", // Required for ADD_MEMBER and CHANGE_ROLE
      
      // For task actions
      "taskId": "task-id", // Required for existing tasks
      "taskTitle": "Task Title", // Required for new tasks
      "taskDescription": "Task Description", // Optional for new tasks
      "dueDate": "2024-04-30", // Optional ISO date string
      "assigneeId": "member-id", // Optional for assigning tasks
      "completed": true | false, // Required for MARK_COMPLETED
      
      // For DELETE_TASK
      "deleteAllTasks": true | false // Set to true to delete all tasks in the project
    }
  ]
}

Don't mention this JSON in your conversational response. Only include the JSON block after your natural response.
`;

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Extract any JSON actions from the response
    let jsonActions: { actions: HRAction[] } | null = null;
    let conversationalResponse = response;
    
    // Look for JSON pattern in the response
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                      response.match(/\{[\s\S]*?"actions"[\s\S]*?\}/);
    
    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        jsonActions = JSON.parse(jsonStr);
        // Remove the JSON from the conversational response
        conversationalResponse = response.replace(jsonMatch[0], '').trim();
      } catch (error) {
        console.error('Error parsing JSON from Gemini response:', error);
      }
    }
    
    let projectUpdated = false;
    
    // Process actions if any
    if (jsonActions && jsonActions.actions && jsonActions.actions.length > 0) {
      for (const action of jsonActions.actions) {
        switch (action.action) {
          case 'ADD_MEMBER':
            if (action.userId) {
              // Add existing user to project
              await prisma.projectMember.create({
                data: {
                  projectId,
                  userId: action.userId,
                  role: action.role || 'MEMBER',
                },
              });
              projectUpdated = true;
            } else if (action.userName && action.userEmail) {
              // Check if user exists
              let user = await prisma.user.findUnique({
                where: { email: action.userEmail },
              });
              
              if (!user) {
                // Create new user
                user = await prisma.user.create({
                  data: {
                    name: action.userName,
                    email: action.userEmail,
                  },
                });
              }
              
              // Add to project
              await prisma.projectMember.create({
                data: {
                  projectId,
                  userId: user.id,
                  role: action.role || 'MEMBER',
                },
              });
              projectUpdated = true;
            }
            break;
            
          case 'REMOVE_MEMBER':
            if (action.userId) {
              const member = await prisma.projectMember.findFirst({
                where: {
                  projectId,
                  userId: action.userId,
                },
              });
              
              if (member) {
                await prisma.projectMember.delete({
                  where: { id: member.id },
                });
                projectUpdated = true;
              }
            }
            break;
            
          case 'CHANGE_ROLE':
            if (action.userId && action.role) {
              const member = await prisma.projectMember.findFirst({
                where: {
                  projectId,
                  userId: action.userId,
                },
              });
              
              if (member) {
                await prisma.projectMember.update({
                  where: { id: member.id },
                  data: { role: action.role },
                });
                projectUpdated = true;
              }
            }
            break;
            
          case 'ADD_TASK':
            if (action.taskTitle) {
              // Use the tasks API instead of direct Prisma calls
              const response = await fetch(`http://localhost:3000/api/tasks`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  title: action.taskTitle,
                  description: action.taskDescription,
                  dueDate: action.dueDate,
                  projectId,
                  assignedTo: action.assigneeId,
                }),
              });
              
              if (response.ok) {
                projectUpdated = true;
              } else {
                console.error('Failed to create task via API');
              }
            }
            break;
            
          case 'ASSIGN_TASK':
            if (action.taskId && action.assigneeId) {
              // Instead of direct update, use API or a more careful approach
              // Check if assignee is valid first
              const assignee = await prisma.projectMember.findUnique({
                where: { id: action.assigneeId },
              });
              
              if (assignee) {
                const task = await prisma.task.findUnique({
                  where: { id: action.taskId },
                });
                
                if (task) {
                  // Update the task via API call or with proper connect syntax
                  await prisma.task.update({
                    where: { id: action.taskId },
                    data: {
                      assignee: {
                        connect: { id: action.assigneeId }
                      }
                    },
                  });
                  projectUpdated = true;
                }
              }
            }
            break;
            
          case 'MARK_COMPLETED':
            if (action.taskId !== undefined && action.completed !== undefined) {
              // Use the task API to mark task as completed
              const response = await fetch(`http://localhost:3000/api/tasks`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  taskId: action.taskId,
                  completed: action.completed,
                }),
              });
              
              if (response.ok) {
                projectUpdated = true;
              } else {
                console.error('Failed to update task completion status via API');
              }
            }
            break;
            
          case 'DELETE_TASK':
            if (action.deleteAllTasks) {
              // Delete all tasks for the project
              await prisma.task.deleteMany({
                where: { projectId },
              });
              projectUpdated = true;
            } else if (action.taskId) {
              // Delete a specific task
              await prisma.task.delete({
                where: { id: action.taskId },
              });
              projectUpdated = true;
            }
            break;
        }
      }
    }
    
    return NextResponse.json({
      response: conversationalResponse,
      projectUpdated,
    });
  } catch (error) {
    console.error('Error in Gemini HR assistant:', error);
    return NextResponse.json({ 
      response: "I'm sorry, but I encountered an error while processing your request. Please try again or contact technical support if the issue persists.",
      error: 'Failed to process request'
    }, { status: 500 });
  }
}