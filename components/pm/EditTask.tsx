import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  Search, 
  Plus, 
  CheckCircle2, 
  Circle, 
  MoreHorizontal, 
  Trash2, 
  Archive, 
  CalendarIcon, 
  CheckSquare,
  Users
} from 'lucide-react';
import { useCompanyStore } from '@/lib/store';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type User = {
  id: string;
  name: string;
  email: string;
};

type CompanyMember = {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user: User;
};

type ProjectMember = {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user: User;
};

type MemberView = {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
};

type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string | Date;
  projectId: string;
  assignee?: {
    id: string;
    user: User;
  };
  createdAt: string;
  updatedAt: string;
};

interface EditProjectProps {
  projectId: string;
  initialTitle: string;
  initialDescription?: string;
  onCancel: () => void;
  onUpdate?: (updatedProject: any) => void;
}

const EditProject: React.FC<EditProjectProps> = ({
  projectId,
  initialTitle,
  initialDescription,
  onCancel,
  onUpdate,
}) => {
  const [editTitle, setEditTitle] = useState<string>(initialTitle || '');
  const [editDescription, setEditDescription] = useState<string>(initialDescription || '');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [members, setMembers] = useState<MemberView[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Task management state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState<boolean>(true);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState<boolean>(false);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [assignedMemberId, setAssignedMemberId] = useState<string | undefined>("unassigned");
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [taskFormError, setTaskFormError] = useState<string>('');

  const { selectedCompany } = useCompanyStore();
  const companyId = selectedCompany?.id;

  useEffect(() => {
    if (isModalOpen && companyId) {
      fetchCompanyMembers();
    }
  }, [isModalOpen, companyId]);

  useEffect(() => {
    if (projectId) {
      fetchProjectMembers();
      fetchTasks();
    }
  }, [projectId]);

  // Member management functions
  const fetchCompanyMembers = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/company/members?companyId=${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch members');

      const data: CompanyMember[] = await response.json();
      const transformedMembers: MemberView[] = data.map(member => ({
        id: member.userId,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
      }));
      setMembers(transformedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectMembers = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/projects/members?projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch project members');

      const data: ProjectMember[] = await response.json();
      setProjectMembers(data);
      setSelectedMembers(data.map(member => member.userId));
    } catch (error) {
      console.error('Error fetching project members:', error);
    }
  };

  const toggleMemberSelection = (memberId: string): void => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAddMembers = async (): Promise<void> => {
    try {
      const currentMemberIds = projectMembers.map(member => member.userId);
      const membersToAdd = selectedMembers.filter(id => !currentMemberIds.includes(id));
      const membersToRemove = currentMemberIds.filter(id => !selectedMembers.includes(id));

      const addPromises = membersToAdd.map(userId =>
        fetch('/api/projects/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, userId, role: 'MEMBER' }),
        })
      );

      const removePromises = membersToRemove.map(userId => {
        const memberToRemove = projectMembers.find(member => member.userId === userId);
        if (memberToRemove) {
          return fetch(`/api/projects/members?id=${memberToRemove.id}`, {
            method: 'DELETE',
          });
        }
        return Promise.resolve();
      });

      await Promise.all([...addPromises, ...removePromises]);
      await fetchProjectMembers();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating project members:', error);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!editTitle.trim()) {
      alert('Title is required');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: projectId,
          title: editTitle,
          description: editDescription,
        }),
      });

      if (!response.ok) throw new Error('Failed to update project');

      const data = await response.json();
      if (onUpdate) onUpdate(data.project);
    } catch (error) {
      console.error('Error updating project:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Task management functions
  const fetchTasks = async (): Promise<void> => {
    setIsTasksLoading(true);
    try {
      const response = await fetch(`/api/tasks?projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsTasksLoading(false);
    }
  };

  const handleCreateTask = async (): Promise<void> => {
    if (!taskTitle.trim()) {
      setTaskFormError('Task title is required');
      return;
    }
  
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          dueDate: selectedDate,
          projectId,
          assignedTo: assignedMemberId === "unassigned" ? undefined : assignedMemberId
        }),
      });

      if (!response.ok) throw new Error('Failed to create task');
      
      const data = await response.json();
      setTasks(prev => [data.task, ...prev]);
      resetTaskForm();
      setIsAddTaskOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
      setTaskFormError('Failed to create task. Please try again.');
    }
  };

  const handleToggleTaskCompletion = async (taskId: string, currentStatus: boolean): Promise<void> => {
    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          completed: !currentStatus
        }),
      });
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
      );
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleArchiveTask = async (taskId: string): Promise<void> => {
    try {
      await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          archive: true
        }),
      });
      
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error archiving task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string): Promise<void> => {
    try {
      await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
      
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const resetTaskForm = (): void => {
    setTaskTitle('');
    setTaskDescription('');
    setSelectedDate(undefined);
    setAssignedMemberId("unassigned");
    setTaskFormError('');
  };

  // Helper functions
  const getInitials = (name: string | undefined): string => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (date: Date | string | undefined): string | null => {
    if (!date) return null;
    return format(new Date(date), 'MMM d, yyyy');
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'active') return !task.completed;
    if (taskFilter === 'completed') return task.completed;
    return true;
  });

  const completedTasksCount = tasks.filter(task => task.completed).length;
  const completionPercentage = tasks.length > 0 ? (completedTasksCount / tasks.length) * 100 : 0;

  // Calculate tasks with upcoming deadlines (within the next 3 days)
  const upcomingDeadlines = tasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    return dueDate >= today && dueDate <= threeDaysFromNow;
  }).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4">
      {/* Project Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{editTitle}</h1>
          <p className="text-muted-foreground mt-1">{editDescription || 'No description provided'}</p>
        </div>
        
        {/* Add this new section for the Team Members button */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Team Members
          </Button>
          
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>


      {/* Tasks Section */}
      <div className="mt-8">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold">Tasks</h2>
              <p className="text-muted-foreground text-sm">Manage and track project tasks</p>
            </div>
            <div className="flex  items-center gap-2">
                <Button onClick={() => setIsAddTaskOpen(true)} className="ml-auto">
                  <Plus className="h-4 w-4 mr-2" /> New Task
                </Button>
              <TabsList className="grid grid-cols-3 w-full max-w-xs">
                <TabsTrigger value="all" onClick={() => setTaskFilter('all')}>All</TabsTrigger>
                <TabsTrigger value="active" onClick={() => setTaskFilter('active')}>Active</TabsTrigger>
                <TabsTrigger value="completed" onClick={() => setTaskFilter('completed')}>Completed</TabsTrigger>
              </TabsList>

            </div>
          </div>

          <TabsContent value="all" className="mt-0">
            {renderTasksList(filteredTasks)}
          </TabsContent>
          
          <TabsContent value="active" className="mt-0">
            {renderTasksList(filteredTasks)}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-0">
            {renderTasksList(filteredTasks)}
          </TabsContent>
        </Tabs>
      </div>

      {/* Team Member Section - Optional, can be added if you want to display current members */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Team Members</h2>
            <p className="text-muted-foreground text-sm">People working on this project</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Manage Team
          </Button>
        </div>
        
        {/* Display current team members */}
        <div className="flex flex-wrap gap-2">
          {projectMembers.length > 0 ? (
            projectMembers.map(member => (
              <div key={member.id} className="flex items-center gap-2 bg-muted/30 rounded-full px-3 py-1">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(member.user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{member.user.name}</span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No team members added yet</p>
          )}
        </div>
      </div>

      {/* Members Selection Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Team Members</DialogTitle>
            <DialogDescription>
              Add or remove team members for this project
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email"
              className="pl-10 py-6"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="max-h-80 overflow-y-auto mt-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              </div>
            ) : filteredMembers.length > 0 ? (
              <div className="space-y-1">
                {filteredMembers.map(member => (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors"
                    onClick={() => toggleMemberSelection(member.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-muted">
                        <AvatarFallback className={`${
                          member.role === 'OWNER' ? 'bg-gradient-to-br from-amber-500 to-orange-500' :
                          member.role === 'ADMIN' ? 'bg-gradient-to-br from-blue-500 to-indigo-500' :
                          'bg-gradient-to-br from-slate-500 to-slate-600'
                        } text-white`}>
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {member.role !== 'MEMBER' && (
                        <Badge variant="outline" className={`${
                          member.role === 'OWNER' ? 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400' :
                          'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400'
                        }`}>
                          {member.role === 'OWNER' ? 'Owner' : 'Admin'}
                        </Badge>
                      )}
                      <Checkbox 
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={() => toggleMemberSelection(member.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <p className="text-muted-foreground">No members found</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMembers}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Modal */}
      <Dialog open={isAddTaskOpen} onOpenChange={(open) => {
        setIsAddTaskOpen(open);
        if (!open) resetTaskForm();
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add details and assign your new task
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Task Title*
              </label>
              <Input
                id="title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Enter task title"
                className="py-6"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Add task details (optional)"
                rows={4}
                className="resize-none"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="assignee" className="text-sm font-medium">
                  Assign To
                </label>
                <Select value={assignedMemberId} onValueChange={setAssignedMemberId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {projectMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getInitials(member.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.user.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP') : <span>Set deadline (optional)</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {taskFormError && (
              <p className="text-sm text-destructive">{taskFormError}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderTasksList(tasks: Task[]) {
    if (isTasksLoading) {
      return (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (tasks.length === 0) {
      return (
        <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <CheckSquare className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium">No tasks found</h3>
          <p className="text-muted-foreground mt-2 mb-6">Get started by creating your first task</p>
          <Button onClick={() => setIsAddTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Task
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-1">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center py-2 px-3 hover:bg-muted/10 rounded">
            {/* Completion checkbox */}
            <div onClick={() => handleToggleTaskCompletion(task.id, task.completed)} className="cursor-pointer mr-2">
              {task.completed ? 
                <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                <Circle className="h-4 w-4 text-muted-foreground" />
              }
            </div>
            
            {/* Task title */}
            <span className={`text-sm flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </span>
            
            {/* Optional: Due date (only if present) */}
            {task.dueDate && (
              <span className="text-xs text-muted-foreground mr-3">
                {formatDate(task.dueDate)}
              </span>
            )}
            
            {/* Dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-6 w-6 flex items-center justify-center hover:bg-muted/20 rounded">
                  <MoreHorizontal className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleToggleTaskCompletion(task.id, task.completed)}>
                  {task.completed ? (
                    <>
                      <Circle className="mr-2 h-4 w-4" />
                      <span>Mark as incomplete</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      <span>Mark as complete</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleArchiveTask(task.id)}>
                  <Archive className="mr-2 h-4 w-4" />
                  <span>Archive</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDeleteTask(task.id)} 
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    );
  }
};

export default EditProject;