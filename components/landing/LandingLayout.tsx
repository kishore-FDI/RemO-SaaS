'use client'
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/home/LandingButton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from './components/Navbar';

// Define types
type TeamAnalyticsData = {
  name: string;
  productivity: number;
  engagement: number;
};

type OfficeMetric = {
  id: number;
  metric: string;
  value: number;
  change: number;
  icon: string;
};

const Home = () => {
  // Mock data for charts
  const [analyticsData, setAnalyticsData] = useState<TeamAnalyticsData[]>([
    { name: 'Mon', productivity: 78, engagement: 65 },
    { name: 'Tue', productivity: 82, engagement: 72 },
    { name: 'Wed', productivity: 76, engagement: 68 },
    { name: 'Thu', productivity: 84, engagement: 75 },
    { name: 'Fri', productivity: 90, engagement: 81 },
    { name: 'Sat', productivity: 65, engagement: 60 },
    { name: 'Sun', productivity: 50, engagement: 45 },
  ]);
  
  const [officeMetrics, setOfficeMetrics] = useState<OfficeMetric[]>([
    { id: 1, metric: 'Active Users', value: 42, change: 8, icon: '👥' },
    { id: 2, metric: 'Meetings', value: 12, change: -3, icon: '🗓️' },
    { id: 3, metric: 'Avg Focus Time', value: 4.2, change: 0.5, icon: '⏱️' },
  ]);
  
  
  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalyticsData(prevData => 
        prevData.map(item => ({
          ...item,
          productivity: Math.min(100, Math.max(40, item.productivity + Math.random() * 6 - 3)),
          engagement: Math.min(100, Math.max(40, item.engagement + Math.random() * 6 - 3))
        }))
      );
      
      setOfficeMetrics(prevMetrics => 
        prevMetrics.map(metric => ({
          ...metric,
          value: metric.id === 1 ? Math.floor(Math.random() * 10) + 40 : 
                 metric.id === 2 ? Math.floor(Math.random() * 5) + 10 :
                 Math.floor(Math.random() * 10) / 10 + 4,
          change: Math.floor(Math.random() * 10) - 5
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="min-h-screen bg-[#030004] ">
      {/* Navigation */}
      <Navbar/>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-20 pb-32">
        <div className="flex flex-col xl:flex-row gap-12 items-center">
          <div className="md:w-1/2 space-y-6">
            <div className="inline-block px-4 py-2 rounded-full bg-gray-900 text-sm font-medium text-violet-400 mb-4">
              Redefining Remote Workspaces
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Virtualize Your Office With <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-transparent bg-clip-text">AI-Powered</span> Analytics
            </h1>
            <p className="text-gray-400 text-lg max-w-lg">
              RemO creates immersive virtual offices with real-time insights and AI-driven optimization to boost productivity and team connectivity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button className="bg-violet-600 hover:bg-violet-700 text-white text-lg py-6 px-8">
                Get Started Free
              </Button>
              <Button variant="outline" className="text-white border-gray-800 hover:bg-gray-900 text-lg py-6 px-8">
                Schedule Demo
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-6">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                <div className="w-8 h-8 rounded-full bg-gray-600"></div>
                <div className="w-8 h-8 rounded-full bg-gray-500"></div>
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-xs font-medium text-gray-900">+</div>
              </div>
              <p className="text-gray-400 text-sm">
                Trusted by <span className="text-white font-medium">500+</span> teams worldwide
              </p>
            </div>
          </div>

          <div className="lg:w-1/2">
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-white">Team Analytics</h2>
                <span className="text-sm text-gray-400">This Week</span>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analyticsData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        border: '1px solid #334155',
                        borderRadius: '0.5rem'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="productivity" 
                      stroke="#8b5cf6" 
                      strokeWidth={2} 
                      dot={{ r: 4 }}
                      activeDot={{ r: 6, fill: '#a78bfa' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="engagement" 
                      stroke="#6366f1" 
                      strokeWidth={2} 
                      dot={{ r: 4 }}
                      activeDot={{ r: 6, fill: '#818cf8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {officeMetrics.map((metric) => (
                  <div key={metric.id} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{metric.icon}</span>
                        <div>
                          <p className="text-gray-400 text-sm">{metric.metric}</p>
                          <p className="text-white font-semibold text-lg">{metric.value}{metric.id === 3 ? 'h' : ''}</p>
                        </div>
                      </div>
                      <div className={`flex items-center ${metric.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gradient-to-b from-purple-950/15 to-purple-900/5 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Revolutionize how your team works remotely with our comprehensive suite of tools
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 relative overflow-hidden group hover:shadow-lg hover:shadow-violet-500/10 transition duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="w-14 h-14 bg-violet-600 rounded-lg flex items-center justify-center mb-6 relative z-10">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 relative z-10">3D Virtual Office</h3>
              <p className="text-gray-400 mb-6 relative z-10">
                Immersive digital workspace with customizable environments that recreate the in-office experience.
              </p>
              <ul className="space-y-2 text-gray-400 text-sm relative z-10">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-violet-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Customizable office layouts
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-violet-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Personal avatars
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 relative overflow-hidden group hover:shadow-lg hover:shadow-violet-500/10 transition duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="w-14 h-14 bg-violet-600 rounded-lg flex items-center justify-center mb-6 relative z-10">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 relative z-10">AI Analytics</h3>
              <p className="text-gray-400 mb-6 relative z-10">
                Data-driven insights on team performance, communication patterns, and productivity metrics.
              </p>
              <ul className="space-y-2 text-gray-400 text-sm relative z-10">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-violet-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Real-time performance tracking
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-violet-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Productivity optimization
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 relative overflow-hidden group hover:shadow-lg hover:shadow-violet-500/10 transition duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="w-14 h-14 bg-violet-600 rounded-lg flex items-center justify-center mb-6 relative z-10">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 relative z-10">Team Collaboration</h3>
              <p className="text-gray-400 mb-6 relative z-10">
                Seamless communication tools integrated with your virtual environment for effortless teamwork.
              </p>
              <ul className="space-y-2 text-gray-400 text-sm relative z-10">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-violet-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Proximity-based chat
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-violet-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Virtual meeting rooms
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 relative overflow-hidden group hover:shadow-lg hover:shadow-violet-500/10 transition duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="w-14 h-14 bg-violet-600 rounded-lg flex items-center justify-center mb-6 relative z-10">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 relative z-10">Enterprise Security</h3>
              <p className="text-gray-400 mb-6 relative z-10">
                Complete protection for your virtual workplace with end-to-end encryption and privacy controls.
              </p>
              <ul className="space-y-2 text-gray-400 text-sm relative z-10">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-violet-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  End-to-end encryption
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-violet-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Role-based access control
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
       <section id="how-it-works" className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">How RemO Works</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Get up and running with our intuitive platform in minutes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mb-6">
              1
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Sign Up & Setup</h3>
            <p className="text-gray-400">
              Create your account and configure your virtual office space to match your team's needs.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mb-6">
              2
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Invite Your Team</h3>
            <p className="text-gray-400">
              Add team members to your virtual office and designate spaces for different departments.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mb-6">
              3
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Analyze & Optimize</h3>
            <p className="text-gray-400">
              Use AI-powered insights to improve workflows, collaboration, and overall productivity.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section - Updated color scheme */}
      <section id="pricing" className="bg-gradient-to-b from-purple-950/15 to-purple-900/5 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Choose the plan that fits your team's size and needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black p-8 rounded-xl border border-gray-800 relative overflow-hidden transition-all duration-300 hover:border-pink-500/30 hover:shadow-lg hover:shadow-pink-500/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-b from-pink-500/10 to-transparent -mr-10 -mt-10 rounded-full blur-xl"></div>
              <div className="text-pink-400 font-medium mb-4 relative z-10">Starter</div>
              <div className="mb-6 relative z-10">
                <span className="text-4xl font-bold text-white">$12</span>
                <span className="text-gray-400"> / user / month</span>
              </div>
              <ul className="space-y-4 mb-8 relative z-10">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-pink-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-300">Virtual Office Space</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-pink-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-300">Virtual Office Space</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-pink-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-300">Basic Analytics</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-pink-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-300">Up to 10 team members</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-pink-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-300">5GB storage</span>
                </li>
              </ul>
              <Button className="w-full bg-gray-800 text-white hover:bg-gray-700">Get Started</Button>
            </div>
            
            <div className="bg-gradient-to-b from-gray-800 to-black p-8 rounded-xl border-2 border-purple-500/30 relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-b from-purple-600/20 to-transparent -mr-10 -mt-10 rounded-full blur-xl"></div>
              <div className="absolute -top-4 -right-4">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold py-1 px-3 rounded-bl-lg rounded-br-lg">
                  MOST POPULAR
                </div>
              </div>
              <div className="text-purple-400 font-medium mb-4 relative z-10">Pro</div>
              <div className="mb-6 relative z-10">
                <span className="text-4xl font-bold text-white">$29</span>
                <span className="text-gray-400"> / user / month</span>
              </div>
              <ul className="space-y-4 mb-8 relative z-10">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-300">Everything in Starter</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-300">Advanced AI Analytics</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-300">Custom office layouts</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-300">Up to 50 team members</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-300">25GB storage</span>
                </li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90">Get Started</Button>
            </div>
            
            <div className="bg-black p-8 rounded-xl border border-gray-800 relative overflow-hidden transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-b from-purple-600/10 to-transparent -mr-10 -mt-10 rounded-full blur-xl"></div>
              <div className="text-purple-400 font-medium mb-4 relative z-10">Enterprise</div>
              <div className="mb-6 relative z-10">
                <span className="text-4xl font-bold text-white">$49</span>
                <span className="text-gray-400"> / user / month</span>
              </div>
              <ul className="space-y-4 mb-8 relative z-10">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-300">Everything in Pro</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-300">Advanced security</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-300">Dedicated support</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-300">Unlimited team members</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-300">100GB storage</span>
                </li>
              </ul>
              <Button className="w-full bg-gray-800 text-white hover:bg-gray-700">Contact Sales</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="font-bold text-white text-xl">RemO</div>
                <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-transparent bg-clip-text text-sm font-medium">BETA</span>
                </div>
              <p className="text-gray-400 mb-4">
                Next-generation virtual office platform powered by AI and immersive technology.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Case Studies</a></li>
                <li><a href="#" className="hover:text-white transition">Reviews</a></li>
                <li><a href="#" className="hover:text-white transition">Updates</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Press</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">API</a></li>
                <li><a href="#" className="hover:text-white transition">Community</a></li>
                <li><a href="#" className="hover:text-white transition">Partners</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 RemO. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <a href="#" className="hover:text-white transition">Terms of Service</a>
              <a href="#" className="hover:text-white transition">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Add a simple animation for the pulse effect */}
      <style jsx global>{`
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
          }
          
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(74, 222, 128, 0);
          }
          
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
