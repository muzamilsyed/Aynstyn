import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Users, BookOpen, BarChart2, LogOut } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalAssessments: number;
  assessmentsToday: number;
  assessmentsThisWeek: number;
  assessmentsThisMonth: number;
  topSubjects: Array<{name: string, count: number}>;
  assessmentsByDate: Array<{date: string, count: number}>;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      setLocation('/admin/login');
      return;
    }
    
    fetchStats();
  }, [setLocation]);
  
  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          setLocation('/admin/login');
          throw new Error('Your session has expired. Please login again.');
        }
        throw new Error('Failed to fetch admin stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching stats');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setLocation('/admin/login');
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Aynstyn Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-2" />
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                +{stats?.newUsersThisWeek || 0} new this week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-green-500 mr-2" />
                <p className="text-2xl font-bold">{stats?.totalAssessments || 0}</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                +{stats?.assessmentsThisWeek || 0} this week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Popular Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BarChart2 className="h-5 w-5 text-purple-500 mr-2" />
                <p className="text-2xl font-bold">{stats?.topSubjects?.[0]?.name || 'N/A'}</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats?.topSubjects?.[0]?.count || 0} assessments
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Stats</TabsTrigger>
            <TabsTrigger value="assessments">Assessment Stats</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Registration Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-gray-500">
                    {stats?.newUsersToday || 0} new users today<br />
                    {stats?.newUsersThisWeek || 0} new users this week<br />
                    {stats?.newUsersThisMonth || 0} new users this month
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="assessments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-gray-500">
                    {stats?.assessmentsToday || 0} assessments today<br />
                    {stats?.assessmentsThisWeek || 0} assessments this week<br />
                    {stats?.assessmentsThisMonth || 0} assessments this month
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="topics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Popular Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.topSubjects?.map((subject, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{subject.name}</span>
                      <span className="text-gray-500">{subject.count} assessments</span>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}