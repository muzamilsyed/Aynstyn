import { useState, useEffect } from "react";
import SubjectSelector from "@/components/subject-selector";
import InputSection from "@/components/input-section";
import ResultsSection from "@/components/results-section";
import HtmlAssessmentViewer from "@/components/html-assessment-viewer";
import RelatedResources from "@/components/related-resources";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AssessmentLimitNotice from "@/components/assessment-limit-notice";
import LowCreditNotice from "@/components/low-credit-notice";
import RegistrationModal from "@/components/registration-modal";
import { useFirebaseAuth } from "@/components/firebase-auth-provider";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getAuth } from "firebase/auth";

export type AssessmentResult = {
  assessmentId: number;
  subject: string;
  score: number; // Score is stored as a decimal between 0 and 1
  coveredTopics: {
    name: string;
    description: string;
  }[];
  missingTopics: {
    name: string;
    description: string;
    overview?: string;
    keyPoints?: string[];
  }[];
  topicCoverage: {
    name: string;
    percentage: number;
  }[];
  feedback: string;
  aynstynSummary?: {
    enhancedFeedback: string;
    learningPath: string[];
    nextSteps: string[];
    resourceRecommendations: string[];
  };
  createdAt?: string; // ISO date string for when the assessment was created
  userInput?: string; // The user's original input text
  transcribedText?: string; // For audio input transcriptions
  inputType?: string;
  input?: string;
  detectedLanguage?: string; // The detected language of the input (e.g., 'en', 'hi', 'es')
};

interface AssessmentProps {
  id?: string;
}

export default function Assessment({ id }: AssessmentProps) {
  // Debug logging for the ID parameter
  console.log("=== ASSESSMENT COMPONENT DEBUG ===");
  console.log("ID parameter received:", id);
  console.log("ID type:", typeof id);
  console.log("ID exists:", !!id);
  
  // Get saved values from local storage to persist across sessions and page refreshes
  const savedSubject = localStorage.getItem('currentAssessmentSubject') || "";
  const [subject, setSubject] = useState<string>(savedSubject);
  const [isAssessing, setIsAssessing] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useFirebaseAuth();
  
  // Debug user state
  console.log("User exists:", !!user);
  console.log("User email:", user?.email);
  
  // Pass the saved input to the InputSection component
  const savedInput = localStorage.getItem('currentAssessmentInput') || "";
  
  // Enhanced auth detection - close modal and auto-process assessment
  useEffect(() => {
    if (user && showRegistrationModal) {
      console.log("User authentication detected, closing modal and processing assessment");
      setShowRegistrationModal(false);
      
      // Only show authentication toast when modal was actually showing
      // This prevents showing the toast when already logged in users press analyze
      toast({
        title: "Authentication Successful",
        description: "Processing your assessment now...",
        duration: 3000,
      });
      
      // Check if we have saved assessment data to process
      const savedInput = localStorage.getItem('currentAssessmentInput');
      const savedInputType = localStorage.getItem('currentAssessmentInputType') || "text";
      const savedSubj = localStorage.getItem('currentAssessmentSubject') || subject;
      
      if (savedInput && !isAssessing) {
        // Set a short delay to ensure the modal is fully closed
        setTimeout(() => {
          console.log("Auto-processing assessment after login");
          // Process the saved assessment
          handleSubmit(savedInput, savedInputType as "text" | "audio");
        }, 800);
      }
    }
  }, [user, showRegistrationModal, isAssessing]);
  
  // Trigger assessment when authentication succeeds
  const handleAuthSuccess = () => {
    console.log("Auth success handler triggered");
    
    // Short delay to ensure auth is fully processed
    setTimeout(() => {
      // Get the saved assessment data
      const savedInput = localStorage.getItem('currentAssessmentInput');
      const savedInputType = localStorage.getItem('currentAssessmentInputType') || "text";
      
      if (savedInput) {
        console.log("Auto-processing from success handler");
        handleSubmit(savedInput, savedInputType as "text" | "audio");
      } else {
        console.log("No saved input found in success handler");
      }
    }, 500);
  };
  
  // Get the specific assessment directly using the individual assessment endpoint
  const { data: assessmentData, isLoading: isLoadingAssessment, error: assessmentError } = useQuery({
    queryKey: [`/api/assessment/${id}`],
    enabled: !!id && !!user,
    retry: false,
  });

  console.log("Processing assessment data:", assessmentData);
  console.log("Assessment data loaded:", !!assessmentData);

  // Force invalidate cache when component mounts with an ID
  useEffect(() => {
    if (id && user) {
      console.log("Invalidating cache for assessment:", id);
      queryClient.invalidateQueries({ queryKey: [`/api/assessment/${id}`] });
    }
  }, [id, user]);

  // Debug the query state
  useEffect(() => {
    console.log("=== QUERY DEBUG ===");
    console.log("ID:", id);
    console.log("User:", !!user);
    console.log("Query enabled:", !!id && !!user);
    console.log("Is loading:", isLoadingAssessment);
    console.log("Has error:", !!assessmentError);
    console.log("Has data:", !!assessmentData);
    if (assessmentError) {
      console.log("Error:", assessmentError);
    }
  }, [id, user, isLoadingAssessment, assessmentError, assessmentData]);

  // Handle assessment data when loaded
  useEffect(() => {
    if (assessmentData && typeof assessmentData === 'object') {
      console.log("Processing assessment data:", assessmentData);
      console.log("Raw assessment data structure:", assessmentData);
      
      const data = assessmentData as any; // Type assertion to handle the API response
      console.log("Raw feedback content:", data.feedback);
      
      // Extract enhanced feedback from the stored JSON structure
      let enhancedFeedback = null;
      let extractedAynstynSummary = null;
      
      try {
        // Try to parse the feedback field as JSON to extract aynstynSummary
        const feedbackData = JSON.parse(data.feedback);
        if (feedbackData.aynstynSummary && feedbackData.aynstynSummary.enhancedFeedback) {
          enhancedFeedback = feedbackData.aynstynSummary.enhancedFeedback;
          extractedAynstynSummary = feedbackData.aynstynSummary;
          console.log("✅ Extracted enhanced feedback from stored data:", enhancedFeedback.substring(0, 100) + "...");
        }
      } catch (e) {
        console.log("Could not parse feedback as JSON, using as plain text");
      }
      
      // Use the authentic assessment data exactly as originally generated
      const coveredTopics = data.coveredTopics || [];
      const missingTopics = data.missingTopics || [];
      const topicCoverage = data.topicCoverage || [];
      
      // Use the extracted aynstynSummary with enhanced feedback if available
      const finalAynstynSummary = extractedAynstynSummary || data.aynstynSummary;
      
      console.log("Authentic covered topics:", coveredTopics);
      console.log("Authentic missing topics:", missingTopics);
      console.log("Authentic topic coverage:", topicCoverage);
      console.log("Authentic aynstyn summary:", finalAynstynSummary);

      // Convert the assessment data to our format using authentic data
      const processedData = {
        assessmentId: parseInt(data.id || id || "0"),
        id: parseInt(data.id || id || "0"),
        subject: data.subject || "Subject",
        score: data.score || 0,
        coveredTopics: coveredTopics,
        missingTopics: missingTopics,
        topicCoverage: topicCoverage,
        feedback: data.feedback || "Assessment details loaded",
        aynstynSummary: finalAynstynSummary,
        createdAt: data.createdAt || new Date().toISOString(),
        input: data.userInput || data.transcribedText || data.input || "",
        inputType: "text"
      };
      
      console.log("Processed data for display:", processedData);
      setResult(processedData);
    }
  }, [assessmentData, id]);

  // Show error state
  if (id && assessmentError) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load assessment details</p>
          <button 
            onClick={() => navigate('/profile')} 
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (input: string, inputType: "text" | "audio") => {
    if (!subject) {
      toast({
        title: "Subject Required",
        description: "Please select or enter a subject for assessment.",
        variant: "destructive",
      });
      return;
    }

    if (!input) {
      toast({
        title: "Input Required",
        description: "Please provide your understanding via text or audio.",
        variant: "destructive",
      });
      return;
    }

    setIsAssessing(true);
    
    try {
      // Get the current user's ID token if available
      let headers: Record<string, string> = { "Content-Type": "application/json" };
      
      if (user) {
        const idToken = await user.getIdToken();
        headers["Authorization"] = `Bearer ${idToken}`;
      }
      
      // Make a manual fetch request to handle the 402 status properly
      const response = await fetch("/api/assess", {
        method: "POST",
        headers,
        body: JSON.stringify({ subject, input, inputType }),
        credentials: "include"
      });
      
      // Store this input for later processing after login/register
      if (response.status === 402) {
        const limitData = await response.json();
        
        // Only proceed if registration modal isn't already showing
        if (!showRegistrationModal) {
          console.log("Storing pending assessment before registration");
          
          // Clear any existing pending assessment first
          localStorage.removeItem('pendingAssessment');
          
          // Store the current assessment to process it after successful login/registration
          localStorage.setItem('pendingAssessment', JSON.stringify({
            subject,
            input,
            inputType
          }));
          
          // Store current input in local storage to keep it across sessions and refreshes
          localStorage.setItem('currentAssessmentInput', input);
          localStorage.setItem('currentAssessmentSubject', subject);
          localStorage.setItem('currentAssessmentInputType', inputType);
          
          // Show the registration modal, allowing users to continue their assessment flow after login
          setShowRegistrationModal(true);
        } else {
          console.log("Registration modal already open, not storing duplicate assessment");
        }
        
        setIsAssessing(false);
        return;
      }
      
      // Handle credit-related errors
      if (response.status === 402 && (await response.clone().json()).error === "No credits remaining") {
        toast({
          title: "No Credits Remaining",
          description: "You need to purchase credits to continue analyzing. Your content has been saved.",
          variant: "destructive",
          duration: 5000,
        });
        setIsAssessing(false);
        return;
      }
      
      // For other errors
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // For successful response
      const data = await response.json();
      // For text input, ensure userInput is stored properly
      if (inputType === "text") {
        data.userInput = input;
      }
      // For audio input, we'll use the transcribedText from the server response
      setResult(data);
      
      // Clear the input and subject after successful analysis
      localStorage.removeItem('currentAssessmentInput');
      localStorage.removeItem('currentAssessmentSubject');
      localStorage.removeItem('currentAssessmentInputType');
      
      // Reset state to clear the form
      setSubject("");
      
      // Invalidate both assessments and credits queries to refresh all data
      queryClient.invalidateQueries({ queryKey: ['/api/user/assessments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/credits'] });
    } catch (error) {
      console.error("Assessment error:", error);
      toast({
        title: "Assessment Failed",
        description: "There was an error analyzing your input. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssessing(false);
    }
  };

  // Show loading state while fetching an assessment by ID
  if (id && isLoadingAssessment) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Registration Modal - shown when non-authenticated users try to analyze */}
      <RegistrationModal 
        isOpen={showRegistrationModal} 
        onClose={() => setShowRegistrationModal(false)}
        onSuccess={handleAuthSuccess}
      />
      
      {!id && (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Know What You Don't Know. Conquer Any Challenge Or Role</h1>
            <p className="text-gray-600 max-w-3xl">
            Whether you're dissecting economic principles or preparing to embody a new role (like a Product manager), clearly define what you know. Our AI analysis pinpoints the areas to improvise on, empowering you to learn with precision & quickly.
            </p>
          </div>

          <SubjectSelector subject={subject} onSubjectChange={setSubject} />
          
          {/* Assessment limit notice - now hidden for better UX */}
          <AssessmentLimitNotice />
          
          {/* Low credit notice for logged in users */}
          {user && <LowCreditNotice />}
        </>
      )}
      
      {!result ? (
        !id && (
          <InputSection 
            onSubmit={handleSubmit} 
            isLoading={isAssessing}
            initialInput={savedInput}
          />
        )
      ) : (
        <ResultsSection result={result} />
      )}
    </div>
  );
}
