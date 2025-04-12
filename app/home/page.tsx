'use client'

import React, { JSX, Suspense, useMemo } from 'react'
import { useFeature } from '@/lib/store'
import dynamic from 'next/dynamic'

// Dynamically import components
const Createmeeting = dynamic(() => import('@/components/meeting/Createmeeting'), {
  suspense: true,
} as any)
const Calender = dynamic(() => import('@/components/meeting/Calender'), {
  suspense: true,
} as any)
const Projects = dynamic(() => import('@/components/pm/Projects'), {
  suspense: true,
} as any)
const Createproject = dynamic(() => import('@/components/pm/Createproject'), {
  suspense: true,
} as any)
const Boards = dynamic(() => import('@/components/whiteboard/boards'), {
  suspense: true,
} as any)
const CreateBoard = dynamic(() => import('@/components/whiteboard/createboard'), {
  suspense: true,
} as any)

// Optional: Home Component
const Home = () => (
  <div className="text-gray-500 text-center text-lg py-10">
    Welcome! Select a feature from the sidebar.
  </div>
)

const Page = () => {
  const { title } = useFeature()

  // Map state to component dynamically
  const componentsMap: { [key: string]: JSX.Element } = {
    boards: <Boards />,
    createboard: <CreateBoard />,
    createmeeting: <Createmeeting />,
    calendar: <Calender />,
    projects: <Projects />,
    createproject: <Createproject />,
    home: <Home />,
  }

  // Get the component based on `title`
  const RenderComponent = useMemo(() => componentsMap[title] || <Home />, [title])

  return (
    <div className="">
      <Suspense fallback={<div className="text-gray-400">Loading feature...</div>}>
        {RenderComponent}
      </Suspense>
    </div>
  )
}

export default Page
