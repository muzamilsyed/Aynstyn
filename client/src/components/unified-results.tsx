import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, BookOpen, TrendingUp, Clock, User, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import TopicExplanationDialog from "./topic-explanation-dialog";
import { useState } from "react";
import DynamicTimeline from "./dynamic-timeline";
import RelatedResources from "./related-resources";

interface AssessmentData {
  id?: number;
  assessmentId?: number;
  subject: string;
  score: number;
  input?: string;
  userInput?: string;
  feedback: string;
  coveredTopics: Array<{
    name: string;
    description: string;
  }>;
  missingTopics: Array<{
    name: string;
    description: string;
    overview?: string;
    keyPoints?: string[];
  }>;
  topicCoverage?: Array<{
    name: string;
    percentage: number;
  }>;
  aynstynSummary?: {
    enhancedFeedback?: string;
    learningPath?: Array<{
      topic: string;
      resources: string[];
      estimatedTime: string;
    }>;
    nextSteps?: string[];
    resourceRecommendations?: Array<{
      title: string;
      type: string;
      url: string;
      description: string;
    }>;
  } | null;
  createdAt?: string;
  inputType?: string;
  transcribedText?: string;
  detectedLanguage?: string;
}

interface UnifiedResultsProps {
  data: AssessmentData;
  onSaveAssessment?: () => void;
  showSaveButton?: boolean;
}

export function UnifiedResults({ data, onSaveAssessment, showSaveButton = false }: UnifiedResultsProps) {
  const [selectedTopic, setSelectedTopic] = useState<{
    name: string;
    description: string;
    overview?: string;
    keyPoints?: string[];
  } | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Star className="h-6 w-6 text-green-600" />;
    if (score >= 60) return <TrendingUp className="h-6 w-6 text-yellow-600" />;
    return <Clock className="h-6 w-6 text-red-600" />;
  };

  // Always prioritize enhanced feedback
  const displayFeedback = data.aynstynSummary?.enhancedFeedback || data.feedback;
  const originalInput = data.input || data.userInput || data.transcribedText || '';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero Score Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="text-center pb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            {getScoreIcon(data.score)}
            <CardTitle className="text-3xl font-bold">Assessment Complete!</CardTitle>
          </div>
          <div className="space-y-2">
            <div className="text-6xl font-bold mb-2">
              <span className={getScoreColor(data.score)}>{data.score}%</span>
            </div>
            <p className="text-xl text-muted-foreground font-medium">Subject: {data.subject}</p>
            {data.createdAt && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                <Calendar className="h-4 w-4" />
                <span>Completed on {new Date(data.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* User Input Section */}
      {originalInput && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Your Response
              {data.inputType === 'audio' && <Badge variant="secondary">Audio Transcription</Badge>}
              {data.detectedLanguage && data.detectedLanguage !== 'en' && (
                <Badge variant="outline">{data.detectedLanguage.toUpperCase()}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-lg border-l-4 border-blue-500">
              <p className="whitespace-pre-wrap text-base leading-relaxed">{originalInput}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Feedback Section */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-6 w-6 text-green-600" />
            {data.aynstynSummary?.enhancedFeedback ? "✨ Your Personalized Assessment" : "📝 Assessment Feedback"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-lg max-w-none">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-l-4 border-green-500">
              <p className="whitespace-pre-wrap leading-relaxed text-base font-medium text-green-900">{displayFeedback}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topic Coverage Visualization */}
      {data.topicCoverage && data.topicCoverage.length > 0 && (
        <Card className="border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              📊 Knowledge Coverage Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.topicCoverage.map((topic, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">{topic.name}</span>
                    <span className="text-2xl font-bold text-purple-600">{topic.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-sm"
                      style={{ width: `${topic.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths Section */}
      {data.coveredTopics && data.coveredTopics.length > 0 && (
        <Card className="border-2 border-green-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
              🎯 Your Strengths ({data.coveredTopics.length} areas mastered)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.coveredTopics.map((topic, index) => (
                <div key={index} className="border-2 border-green-300 rounded-lg p-5 bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                    <div className="space-y-2">
                      <h4 className="font-bold text-green-900 text-lg">{topic.name}</h4>
                      <p className="text-green-800 leading-relaxed font-medium">{topic.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Growth Opportunities */}
      {data.missingTopics && data.missingTopics.length > 0 && (
        <Card className="border-2 border-orange-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <XCircle className="h-6 w-6 text-orange-600" />
              🌱 Growth Opportunities ({data.missingTopics.length} areas to explore)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.missingTopics.map((topic, index) => (
                <div key={index} className="border-2 border-orange-300 rounded-lg p-5 bg-gradient-to-r from-orange-50 to-yellow-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <XCircle className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
                      <div className="space-y-2">
                        <h4 className="font-bold text-orange-900 text-lg">{topic.name}</h4>
                        <p className="text-orange-800 leading-relaxed font-medium">{topic.description}</p>
                      </div>
                    </div>
                    {(topic.overview || (topic.keyPoints && topic.keyPoints.length > 0)) && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setSelectedTopic(topic)}
                        className="text-orange-700 border-orange-400 hover:bg-orange-100 font-semibold"
                      >
                        🔍 Explore
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Path */}
      {data.aynstynSummary?.learningPath && data.aynstynSummary.learningPath.length > 0 && (
        <Card className="border-2 border-blue-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-6 w-6 text-blue-600" />
              🗺️ Your Personalized Learning Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {data.aynstynSummary.learningPath.map((pathItem, index) => (
                <div key={index} className="border-2 border-blue-300 rounded-lg p-5 bg-gradient-to-r from-blue-50 to-sky-50">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white text-lg font-bold flex items-center justify-center mt-1 flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-bold text-blue-900 text-lg">{pathItem.topic}</h4>
                      <p className="text-blue-700 font-semibold">⏱️ Estimated time: {pathItem.estimatedTime}</p>
                      <div className="space-y-2">
                        {pathItem.resources.map((resource, resourceIndex) => (
                          <p key={resourceIndex} className="text-blue-800 font-medium">📚 {resource}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {data.aynstynSummary?.nextSteps && data.aynstynSummary.nextSteps.length > 0 && (
        <Card className="border-2 border-purple-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              🚀 Your Next Steps Forward
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.aynstynSummary.nextSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold flex items-center justify-center mt-0.5 flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-purple-900 font-semibold text-base">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resource Recommendations */}
      {data.aynstynSummary?.resourceRecommendations && data.aynstynSummary.resourceRecommendations.length > 0 && (
        <Card className="border-2 border-indigo-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-6 w-6 text-indigo-600" />
              📖 Curated Learning Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.aynstynSummary.resourceRecommendations.map((resource, index) => (
                <div key={index} className="border-2 border-indigo-200 rounded-lg p-5 hover:bg-indigo-50 transition-all duration-200 cursor-pointer bg-gradient-to-r from-indigo-50 to-blue-50"
                     onClick={() => window.open(resource.url, '_blank')}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-indigo-900 text-lg">{resource.title}</h4>
                        <Badge variant="secondary" className="text-sm font-semibold">{resource.type}</Badge>
                      </div>
                      <p className="text-indigo-800 leading-relaxed font-medium">{resource.description}</p>
                    </div>
                    <Button variant="outline" size="lg" className="font-semibold">
                      Open 🔗
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline and Additional Resources */}
      <div className="space-y-6">
        <DynamicTimeline subject={data.subject} />
        <RelatedResources subject={data.subject} />
      </div>

      {/* Save Assessment Button */}
      {showSaveButton && onSaveAssessment && (
        <div className="flex justify-center pt-8">
          <Button onClick={onSaveAssessment} size="lg" className="w-full sm:w-auto font-bold text-lg px-8 py-3">
            💾 Save Assessment to Profile
          </Button>
        </div>
      )}

      {/* Topic Explanation Dialog */}
      {selectedTopic && (
        <TopicExplanationDialog
          topicName={selectedTopic.name}
          topicDescription={selectedTopic.description}
          isOpen={!!selectedTopic}
          onOpenChange={(open) => !open && setSelectedTopic(null)}
        />
      )}
    </div>
  );
}