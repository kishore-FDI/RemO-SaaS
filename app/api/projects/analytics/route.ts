// app/api/projects/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user using Clerk
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get projectId and timeRange from request parameters
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const timeRange = searchParams.get('timeRange') || '14days'
    
    // Parse the time range
    const daysToInclude = timeRange === '7days' ? 7 : 
                         timeRange === '30days' ? 30 : 14; // Default to 14 days

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Fetch the project with tasks
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            assignee: {
              include: {
                user: true
              }
            }
          }
        },
        members: {
          include: {
            user: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user has access to this project
    const userIsMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId
      }
    })

    const userIsCompanyMember = await prisma.companyMember.findFirst({
      where: {
        companyId: project.companyId,
        userId
      }
    })

    if (!userIsMember && !userIsCompanyMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Calculate task metrics
    const taskMetrics = {
      total: project.tasks.length,
      completed: project.tasks.filter(task => task.completed).length,
      incomplete: project.tasks.filter(task => !task.completed && !task.archived).length,
      archived: project.tasks.filter(task => task.archived).length
    }

    // Calculate tasks by due date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)
    
    const endOfWeek = new Date(today)
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
    
    const tasksByDueDate = {
      overdue: project.tasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < today && !task.completed
      ).length,
      dueToday: project.tasks.filter(task => 
        task.dueDate && 
        new Date(task.dueDate) >= today && 
        new Date(task.dueDate) <= endOfToday && 
        !task.completed
      ).length,
      dueThisWeek: project.tasks.filter(task => 
        task.dueDate && 
        new Date(task.dueDate) > endOfToday && 
        new Date(task.dueDate) <= endOfWeek && 
        !task.completed
      ).length,
      dueLater: project.tasks.filter(task => 
        task.dueDate && new Date(task.dueDate) > endOfWeek && !task.completed
      ).length,
      noDueDate: project.tasks.filter(task => !task.dueDate && !task.completed).length
    }

    // Calculate task activity over time (based on requested timeRange)
    const dates = []
    for (let i = daysToInclude - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      dates.push(date)
    }

    const taskActivityOverTime = dates.map(date => {
      const nextDay = new Date(date)
      nextDay.setDate(date.getDate() + 1)
      
      const dateString = date.toISOString().split('T')[0]
      
      return {
        date: dateString,
        created: project.tasks.filter(task => {
          const createdDate = new Date(task.createdAt)
          return createdDate >= date && createdDate < nextDay
        }).length,
        completed: project.tasks.filter(task => {
          if (!task.completed) return false
          // For completed tasks, we're approximating completion date using updatedAt
          const completedDate = new Date(task.updatedAt)
          return completedDate >= date && completedDate < nextDay && task.completed
        }).length
      }
    })

    // Calculate member performance with enhanced metrics
    const memberPerformance = project.members.map(member => {
      const memberTasks = project.tasks.filter(task => 
        task.assignedTo === member.id
      )
      
      const tasksAssigned = memberTasks.length
      const tasksCompleted = memberTasks.filter(task => task.completed).length
      
      // Calculate average completion time (in days)
      let avgCompletionTime = null
      const completedTasks = memberTasks.filter(task => task.completed)
      
      if (completedTasks.length > 0) {
        const totalCompletionTime = completedTasks.reduce((sum, task) => {
          const createdDate = new Date(task.createdAt).getTime()
          const completedDate = new Date(task.updatedAt).getTime()
          return sum + (completedDate - createdDate) / (1000 * 60 * 60 * 24) // Convert ms to days
        }, 0)
        
        avgCompletionTime = Math.round((totalCompletionTime / completedTasks.length) * 10) / 10 // Round to 1 decimal
      }
      
      // Tasks overdue
      const tasksOverdue = memberTasks.filter(task => 
        !task.completed && task.dueDate && new Date(task.dueDate) < today
      ).length
      
      return {
        userId: member.userId,
        name: member.user.name,
        tasksAssigned,
        tasksCompleted,
        avgCompletionTime,
        tasksOverdue
      }
    }).filter(member => member.tasksAssigned > 0)

    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      taskMetrics,
      tasksByDueDate,
      taskActivityOverTime,
      memberPerformance
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}