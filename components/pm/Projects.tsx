'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Pencil, Trash2, RefreshCcw, Copy, Check, ExternalLink } from 'lucide-react'
import { useCompanyStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import Link from 'next/link'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'

const EditProject = dynamic(() => import('./EditTask'), {
  loading: () => <p className="text-muted-foreground">Loading editor...</p>,
})

const ProjectAnalytics = dynamic(() => import('./Test'), {
  loading: () => <p className="text-muted-foreground">Loading analytics...</p>,
})

type Project = {
  id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  companyId: string
  link: string
  tasks: any[]
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [viewingAnalytics, setViewingAnalytics] = useState<string | null>(null)
  const { selectedCompany } = useCompanyStore()
  const companyId = selectedCompany?.id || ''

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects?companyId=${companyId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error fetching projects')
      setProjects(data)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this project?')
    if (!confirm) return
    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete project')
      toast.success(`Deleted project: ${data.deletedProject.title}`)
      fetchProjects()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const copyToClipboard = async (link: string, id: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(id)
      toast.success('Link copied')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Copy failed')
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setViewingAnalytics(null)
  }

  const handleViewAnalytics = (projectId: string) => {
    setViewingAnalytics(projectId)
    setEditingProject(null)
  }
   
  const handleBackToProjects = () => {
    setEditingProject(null)
    setViewingAnalytics(null)
  }

  useEffect(() => {
    fetchProjects()
  }, [companyId])

  // If viewing analytics mode is active, render the ProjectAnalytics component
  if (viewingAnalytics) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="#" onClick={handleBackToProjects}>Projects</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Analytics</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
  
        <ProjectAnalytics 
          projectId={viewingAnalytics}
          onBack={handleBackToProjects}
        />
      </div>
    )
  }

  // If editing mode is active, render the EditTask component
  if (editingProject) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="#" onClick={handleBackToProjects}>Projects</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="#" onClick={handleBackToProjects}>{editingProject.title}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
  
        <EditProject 
          projectId={editingProject.id}
          initialTitle={editingProject.title}
          initialDescription={editingProject.description}
          onCancel={handleBackToProjects}
          onUpdate={() => {
            fetchProjects()
            setEditingProject(null)
          }}
        />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Projects</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold">Projects</h2>
          <p className="text-muted-foreground mt-1">Manage your projects</p>
        </div>
        <Button 
          onClick={fetchProjects} 
          variant="outline" 
          size="icon" 
          className="rounded-full h-10 w-10"
          disabled={loading}
        >
          <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground animate-pulse">Loading projects...</p>
        </div>
      ) : !projects.length ? (
        <div className="bg-muted/20 rounded-lg p-12 text-center border border-dashed border-muted">
          <h3 className="text-xl font-medium mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first project</p>
          <Button>Create Project</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="group overflow-hidden border hover:shadow-md transition duration-300"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold cursor-pointer hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {project.tasks?.length || 0} tasks
                  </Badge>
                </div>
                
                <p className="text-muted-foreground mb-4">
                  {project.description || "No description provided."}
                </p>

                {project.link && (
                  <div className="flex items-center gap-2 mt-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground truncate flex-1">
                      {project.link}
                    </p>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 rounded-full p-0" 
                      onClick={() => copyToClipboard(project.link, project.id)}
                    >
                      {copiedId === project.id ? 
                        <Check className="h-4 w-4 text-green-500" /> : 
                        <Copy className="h-4 w-4" />
                      }
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 rounded-full p-0" 
                      asChild
                    >
                      <a href={project.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>

              <CardFooter className="p-4 bg-muted/10 border-t flex flex-col justify-between items-start gap-5">
                <div className="text-sm text-muted-foreground">
                  Updated {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleEdit(project)} 
                    className="h-8"
                  >
                    <Pencil className="w-4 h-4 mr-1.5" /> Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleViewAnalytics(project.id)} 
                    className="h-8"
                  >
                    <MagnifyingGlassIcon className="w-4 h-4 mr-1.5" /> Analytics
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleDelete(project.id)} 
                    className="h-8"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}