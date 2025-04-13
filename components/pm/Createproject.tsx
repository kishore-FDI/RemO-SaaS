'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Plus, LogIn } from 'lucide-react'
import { toast } from 'sonner' // or your notification lib
import { useCompanyStore,useFeature } from '@/lib/store'
export default function ProjectAccessPanel() {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const {setSelectedFeature} = useFeature() // Zustand store for feature ID
  const {selectedCompany} = useCompanyStore() // Zustand store for company ID
  const companyId = selectedCompany?.id // replace with actual logic (useUser, Zustand, or props)

  const handleCreateProject = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          companyId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project')
      }

      toast.success(`🎉 Project "${data.title}" created!`)
      // Optional: redirect to project page or reset form
      setTitle('')
      setDescription('')
      setSelectedFeature("projects")
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#1c1c1e] rounded-2xl shadow-xl p-8 border border-border">
          <h1 className="text-3xl font-bold text-center text-white mb-2">
            Welcome to <span className="text-primary">TestingC0</span>'s Workspace
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            {mode === 'create'
              ? 'Start something new by creating a project'
              : 'Join an existing project with a code or invite link'}
          </p>

          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(val) => setMode(val as 'create' | 'join')}
            className="flex justify-center mb-6"
          >
            <ToggleGroupItem value="create" className="px-6">
              <Plus className="mr-2 h-4 w-4" /> Create
            </ToggleGroupItem>
            <ToggleGroupItem value="join" className="px-6">
              <LogIn className="mr-2 h-4 w-4" /> Join
            </ToggleGroupItem>
          </ToggleGroup>

          {mode === 'create' ? (
            <div className="space-y-4">
              <Input
                placeholder="Project Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                placeholder="Project Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button
                className="w-full"
                disabled={!title || loading}
                onClick={handleCreateProject}
              >
                <Plus className="mr-2 h-4 w-4" />{' '}
                {loading ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                placeholder="Enter Project ID or Invite Link"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <Button
                className="w-full"
                variant="secondary"
                disabled={!joinCode}
                onClick={() => {
                  // handleJoinProject
                }}
              >
                <LogIn className="mr-2 h-4 w-4" /> Join Project
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
