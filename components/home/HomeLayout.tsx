'use client'
import { Briefcase, Calendar, ChevronDown, ChevronUp, Home, Inbox, List, Notebook, Plus, Search, Settings, User2, Video } from "lucide-react"
import { useCompanyStore, useFeature} from "@/lib/store"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
  SidebarMenuSub,
  SidebarTrigger
} from "@/components/ui/sidebar"

import { useClerk,useUser } from "@clerk/nextjs"

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuContent } from "../ui/dropdown-menu"
import { Avatar } from "../ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
import { useEffect } from "react"

// Menu items.
const features = [
  {
    title: "Home",
    state: "home",
    icon: Home,
    hasSubFeatures: false
  },
  {
    title: "Whiteboard",
    // state: "whiteboard",
    icon: Notebook,
    hasSubFeatures: true,
    subFeatures: [
      { title: "Create New", state: "createboard", icon: Plus },
      { title: "My Boards", state: "boards", icon: List }
    ]
  },
  {
    title: "Meeting",
    // state: "meeting",
    icon: Video,
    hasSubFeatures: true,
    subFeatures: [
      { title: "Create Meeting", state: "createmeeting", icon: Plus },
      { title: "Calendar", state: "calendar", icon: Calendar }
    ]
  },
  {
    title: "Projects",
    icon: Briefcase,
    hasSubFeatures: true,
    subFeatures: [
      { title: "Create or Join", state: "createproject", icon: Plus },
      { title: "My Projects", state: "projects", icon: List }
    ]
  }
]

// Custom component for submenu items with vertical line
// const SidebarMenuSub = ({ children }:any) => {
//   return (
//     <div className="relative pl-3 mt-1 space-y-1">
//       {/* Vertical line */}
//       <div className="absolute top-0 bottom-0 left-2 w-px bg-gray-200 dark:bg-gray-700"></div>
//       {children}
//     </div>
//   )
// }



const SidebarMenuSubItem = ({ icon: Icon, title,state }:any) => {
  const a=useSidebar()
  const {setTitle}=useFeature()
  const setFeature = ({ title }: any) => {
    console.log("Setting title to:", title,state); // ⬅️ log
    setTitle(title);
  };
  
  return (
    <button className="flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    onClick={() => setFeature({ title: state })}
    >
      {Icon && <Icon className={`${a.open?"mr-2":""} size-4`} />}
      <span>{title}</span>
    </button>
  )
}

export function AppSidebar() {
  const {signOut} = useClerk()
  const {user}=useUser()
  const handleSignOut = async () => {
    await signOut()
  }
  const { selectedCompany } = useCompanyStore()
  const a=useSidebar()

  useEffect(() => {console.log(a)},[])
  return (
    <Sidebar collapsible="icon" side="left">
      <SidebarHeader  className="mt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Avatar className="size-6 flex items-center justify-center text-lg bg-blue-600">
                    {selectedCompany?.name[0]}
                  </Avatar>
                  <span>
                    {selectedCompany?.name} <br />
                    {selectedCompany?.role}
                  </span>
                  <ChevronDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                <DropdownMenuItem>
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="text-red-400">Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {features.map((item) => {
                if (!item.hasSubFeatures) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <a>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }
                
                return (
                  <Collapsible key={item.title} className="group/collapsible" >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          <item.icon />
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub >
                          {item.subFeatures?.map((subItem) => (
                            <SidebarMenuSubItem 
                              key={subItem.state} 
                              icon={subItem.icon} 
                              title={a.open ? subItem.title :""} 
                              state={subItem.state}
                            />
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> {user?.fullName}
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-full"
              >
                <DropdownMenuItem>
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <button onClick={()=>handleSignOut()}>Sign out</button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}