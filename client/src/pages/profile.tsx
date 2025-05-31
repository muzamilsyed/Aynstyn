import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useFirebaseAuth } from '@/components/firebase-auth-provider';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clipboard, User2, BarChart, BookOpen, Clock, CreditCard, Coins } from 'lucide-react';
import { format } from 'date-fns';

interface Assessment {
  id: number;
  subject: string;
  score: number;
  createdAt: string;
  inputType: string;
  input: string;
}

interface CreditsResponse {
  success: boolean;
  credits: number;
}

// Function to determine user's current plan based on credits
const getUserPlan = (credits: number) => {
  if (credits <= 5) return { name: 'Spark', color: 'bg-green-100 text-green-800', icon: '🎯' };
  if (credits <= 25) return { name: 'Explorer', color: 'bg-blue-100 text-blue-800', icon: '🚀' };
  if (credits <= 60) return { name: 'Genius', color: 'bg-purple-100 text-purple-800', icon: '⭐' };
  return { name: 'Enterprise', color: 'bg-gray-100 text-gray-800', icon: '🏢' };
};

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { user, loading, logOut } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect to auth page if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Fetch user's assessments
  const { data, isLoading: isLoadingAssessments } = useQuery<{assessments: Assessment[]}>({
    queryKey: ['/api/user/assessments'],
    enabled: !!user,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch when component mounts
  });
  
  // Extract assessments from response
  const assessments = data?.assessments;
  
  // Fetch user credits
  const { data: creditsData, isLoading: isLoadingCredits } = useQuery<CreditsResponse>({
    queryKey: ['/api/payments/credits'],
    enabled: !!user,
  });

  // Show loading state while auth state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no user is logged in (and we haven't redirected yet), don't show anything
  if (!user) {
    return null;
  }

  const userInitials = user?.displayName 
    ? user.displayName.charAt(0).toUpperCase() 
    : user.email 
      ? user.email.charAt(0).toUpperCase() 
      : 'U';

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return 'Unknown date';
    }
  };

  // Calculate assessment stats
  const normalizeScore = (score: number) => {
    // If score is already in percentage form (>1), keep it as is
    // If score is in decimal form (0-1), convert to percentage
    return score > 1 ? score : score * 100;
  };

  const stats = {
    total: assessments?.length || 0,
    subjects: assessments 
      ? new Set(assessments.map(a => a.subject)).size
      : 0,
    avgScore: assessments?.length 
      ? assessments.reduce((sum, a) => sum + normalizeScore(a.score), 0) / assessments.length 
      : 0,
    lastAssessment: assessments?.length 
      ? formatDate(assessments[0].createdAt)
      : 'No assessments yet'
  };

  return (
    <div className="container max-w-6xl py-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start mb-8">
        <Avatar className="h-24 w-24 border-4 border-background">
          {user.photoURL ? (
            <AvatarImage src={user.photoURL} alt={user.displayName || "User"} />
          ) : null}
          <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold mb-1">
            {user.displayName || user.email?.split('@')[0] || "User"}
          </h1>
          <p className="text-muted-foreground mb-3">{user.email}</p>
          
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {stats.total > 0 && (
              <Badge variant="secondary" className="px-3 py-1">
                {stats.total} Assessments
              </Badge>
            )}
            {stats.subjects > 0 && (
              <Badge variant="secondary" className="px-3 py-1">
                {stats.subjects} Subjects
              </Badge>
            )}
            <Badge variant="outline" className="px-3 py-1">
              Member since {user.metadata?.creationTime ? formatDate(user.metadata.creationTime) : 'Recently'}
            </Badge>
            {!isLoadingCredits && creditsData?.credits !== undefined && (
              <Badge variant="secondary" className={`px-3 py-1 ${getUserPlan(creditsData.credits).color}`}>
                <span className="mr-1">{getUserPlan(creditsData.credits).icon}</span>
                {getUserPlan(creditsData.credits).name} Plan
              </Badge>
            )}
            <Badge variant="secondary" className="px-3 py-1 bg-amber-100 text-amber-800 hover:bg-amber-200">
              <Coins className="h-3.5 w-3.5 mr-1" />
              {isLoadingCredits ? '...' : `${creditsData?.credits || 0} Credits`}
            </Badge>
          </div>
        </div>
        
        <Button variant="outline" onClick={async () => {
          await logOut();
          navigate('/');
        }}>
          Sign Out
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:inline-grid md:grid-cols-3 mb-6">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User2 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="assessments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Clipboard className="h-4 w-4 mr-2" />
            My Assessments
          </TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart className="h-4 w-4 mr-2" />
            Progress
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Subjects Covered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.subjects}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(stats.avgScore)}%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Last Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-medium">{stats.lastAssessment}</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest assessments and progress</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAssessments ? (
                <div className="py-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading your activity...</p>
                </div>
              ) : assessments && assessments.length > 0 ? (
                <div className="space-y-4">
                  {assessments.slice(0, 5).map((assessment) => (
                    <div key={assessment.id} className="flex items-start gap-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{assessment.subject}</h4>
                          <span className="text-sm text-muted-foreground">
                            Score: {Math.round(normalizeScore(assessment.score))}%
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {assessment.input.substring(0, 100)}...
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(assessment.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Clipboard className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-lg font-medium mb-1">No assessments yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Take your first assessment to track your knowledge and progress.
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/assessment')}>
                    Start Assessment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Assessments Tab */}
        <TabsContent value="assessments">
          <Card>
            <CardHeader>
              <CardTitle>My Assessments</CardTitle>
              <CardDescription>View all your completed assessments</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAssessments ? (
                <div className="py-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading your assessments...</p>
                </div>
              ) : assessments && assessments.length > 0 ? (
                <div className="space-y-6">
                  {assessments.map((assessment) => (
                    <div key={assessment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{assessment.subject}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {formatDate(assessment.createdAt)}
                            </span>
                            <Badge variant={assessment.inputType === 'text' ? 'outline' : 'secondary'}>
                              {assessment.inputType === 'text' ? 'Text' : 'Audio'}
                            </Badge>
                          </div>
                        </div>
                        <Badge className={`px-2 py-1 ${
                          normalizeScore(assessment.score) >= 80 ? 'bg-green-500' :
                          normalizeScore(assessment.score) >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}>
                          {Math.round(normalizeScore(assessment.score))}%
                        </Badge>
                      </div>
                      <Separator className="mb-3" />
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                        {assessment.input}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          // Create a new assessment result object with the enhanced feedback
                          const assessmentResult = {
                            assessmentId: assessment.id,
                            subject: assessment.subject,
                            score: assessment.score,
                            coveredTopics: assessment.coveredTopics || [],
                            missingTopics: assessment.missingTopics || [],
                            topicCoverage: assessment.topicCoverage || [],
                            feedback: assessment.feedback || "No feedback available",
                            aynstynSummary: null, // Will be populated from stored data
                            createdAt: assessment.createdAt,
                            input: assessment.input,
                            inputType: assessment.inputType || 'text'
                          };
                          
                          // Store in localStorage for the assessment page to pick up
                          localStorage.setItem('viewAssessmentData', JSON.stringify(assessmentResult));
                          navigate(`/assessment/${assessment.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Clipboard className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-lg font-medium mb-1">No assessments yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Take your first assessment to track your knowledge and progress.
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/assessment')}>
                    Start Assessment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Progress Tab */}
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Progress</CardTitle>
              <CardDescription>Track your learning progress over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <BarChart className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-lg font-medium mb-1">Progress tracking coming soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We're building enhanced analytics to help you visualize your progress across different subjects.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}