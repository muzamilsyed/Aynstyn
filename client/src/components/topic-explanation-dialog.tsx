import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TopicExplanationDialogProps {
  topicName: string;
  topicDescription: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
}

export default function TopicExplanationDialog({
  topicName,
  topicDescription,
  isOpen,
  onOpenChange,
  subject
}: TopicExplanationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [overview, setOverview] = useState<string | null>(null);
  const [keyPoints, setKeyPoints] = useState<string[] | null>(null);
  const { toast } = useToast();

  const fetchExplanation = async () => {
    if (overview && keyPoints) return; // Don't fetch if we already have the data
    
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/explain-topic", {
        subject,
        topicName,
        topicDescription
      });
      
      const data = await response.json();
      setOverview(data.overview);
      setKeyPoints(data.keyPoints);
    } catch (error) {
      console.error("Failed to fetch explanation:", error);
      toast({
        title: "Failed to load topic overview",
        description: "There was an error generating the content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch the explanation when the dialog opens
  if (isOpen && (!overview || !keyPoints) && !isLoading) {
    fetchExplanation();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
            {topicName}
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            {topicDescription}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin mb-4" />
              <p className="text-gray-600">Loading topic overview...</p>
            </div>
          ) : overview && keyPoints ? (
            <div className="prose prose-gray max-w-none">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Topic Overview</h3>
                <p className="text-gray-700 mb-6">{overview}</p>
                
                <h4 className="text-base font-medium text-gray-900 mb-3">Key Points to Explore</h4>
                <ul className="space-y-3">
                  {keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center mt-0.5 mr-2">
                        <span className="text-primary-700 text-xs font-bold">{index + 1}</span>
                      </div>
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Learn More</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <a 
                      href={`https://en.wikipedia.org/wiki/${encodeURIComponent(topicName)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      Wikipedia: {topicName}
                    </a>
                  </li>

                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-gray-600">Failed to load topic overview. Please try again.</p>
              <Button 
                variant="outline" 
                onClick={fetchExplanation} 
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}