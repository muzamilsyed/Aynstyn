import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface HtmlAssessmentViewerProps {
  assessmentId: string;
}

export default function HtmlAssessmentViewer({ assessmentId }: HtmlAssessmentViewerProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/assessment-html', assessmentId],
    queryFn: async () => {
      const response = await fetch(`/api/assessment-html/${assessmentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch assessment HTML');
      }
      const result = await response.json();
      return result.html;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading your assessment...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-red-600">
            <p>Failed to load assessment details</p>
            <p className="text-sm mt-2">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            <p>No assessment data found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div 
      className="assessment-html-content"
      dangerouslySetInnerHTML={{ __html: data }}
    />
  );
}