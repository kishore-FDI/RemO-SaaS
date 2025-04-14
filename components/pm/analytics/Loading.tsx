import React from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'


const Loading = () => {
  return (
    <div className="space-y-8">
    <div className="flex justify-between items-center">
      <div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-72 mt-2" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <Card key={i} className="p-6">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="h-72">
            <Skeleton className="w-full h-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
  )
}

export const Error = ({error,fetchAnalytics}:any) => {
  return(
    <div className="bg-red-50 rounded-lg p-6 border border-red-200">
    <h3 className="text-lg font-medium text-red-800 mb-2">Error loading analytics</h3>
    <p className="text-red-600">{error}</p>
    <Button onClick={fetchAnalytics} variant="outline" className="mt-4">
      <RefreshCcw className="w-4 h-4 mr-2" /> Try Again
    </Button>
  </div>
  )
}


export default Loading