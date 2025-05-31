import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function AssessmentViewer() {
  const { id } = useParams<{ id: string }>();

  const { data: htmlData, isLoading, error } = useQuery({
    queryKey: ['/api/assessment-html', id],
    queryFn: async () => {
      const response = await fetch(`/api/assessment-html/${id}`);
      if (!response.ok) {
        throw new Error('Assessment not found or no HTML available');
      }
      const result = await response.json();
      return result.html;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading assessment...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !htmlData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">Assessment not found or unable to load</p>
              <Link href="/profile">
                <button className="inline-flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Profile
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href="/profile">
          <button className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </button>
        </Link>
      </div>
      
      <div 
        className="assessment-content"
        dangerouslySetInnerHTML={{ __html: htmlData }}
      />
    </div>
  );
}