import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, BookOpen, TrendingUp, Clock, User, Calendar, Star, Lightbulb, Target, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import DynamicTimeline from "./dynamic-timeline";
import RelatedResources from "./related-resources";
import { motion } from "framer-motion";

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
    learningPath?: any[];
    nextSteps?: string[];
    resourceRecommendations?: any[];
  } | null;
  createdAt?: string;
  inputType?: string;
  transcribedText?: string;
  detectedLanguage?: string;
}

interface AssessmentResultsProps {
  data: AssessmentData;
  onSaveAssessment?: () => void;
  showSaveButton?: boolean;
}

export default function AssessmentResults({ data, onSaveAssessment, showSaveButton = false }: AssessmentResultsProps) {
  const [animateScore, setAnimateScore] = useState(false);

  useEffect(() => {
    setAnimateScore(true);
  }, []);

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

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-50 to-emerald-50";
    if (score >= 60) return "from-yellow-50 to-amber-50";
    return "from-red-50 to-orange-50";
  };

  // Always prioritize enhanced feedback
  const displayFeedback = data.aynstynSummary?.enhancedFeedback || data.feedback;
  const originalInput = data.input || data.userInput || data.transcribedText || '';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div 
      className="space-y-8 max-w-4xl mx-auto px-4 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Assessment Results Header */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {getScoreIcon(data.score)}
              </motion.div>
              <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Assessment Results
              </CardTitle>
            </div>
            <div className="space-y-2">
              <motion.div 
                className="text-6xl font-bold mb-2"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <span className={`${getScoreColor(data.score)} ${animateScore ? 'animate-pulse' : ''}`}>
                  {data.score}%
                </span>
              </motion.div>
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
      </motion.div>

      {/* Key Findings Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Lightbulb className="h-6 w-6 text-blue-600" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Key Findings
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Strengths */}
              <motion.div 
                className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-l-4 border-green-500 shadow-md hover:shadow-lg transition-shadow duration-300"
                whileHover={{ scale: 1.01 }}
              >
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  Strengths
                </h3>
                <ul className="space-y-3">
                  {data.coveredTopics.map((topic, index) => (
                    <motion.li 
                      key={index} 
                      className="flex items-start gap-2 bg-white/50 p-3 rounded-lg"
                      whileHover={{ x: 5 }}
                    >
                      <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      <span className="text-green-900">{topic.name}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* Areas for Improvement */}
              <motion.div 
                className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-lg border-l-4 border-amber-500 shadow-md hover:shadow-lg transition-shadow duration-300"
                whileHover={{ scale: 1.01 }}
              >
                <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-600" />
                  Areas for Improvement
                </h3>
                <ul className="space-y-3">
                  {data.missingTopics.map((topic, index) => (
                    <motion.li 
                      key={index} 
                      className="flex items-start gap-2 bg-white/50 p-3 rounded-lg"
                      whileHover={{ x: 5 }}
                    >
                      <XCircle className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                      <span className="text-amber-900">{topic.name}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Analysis Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-6 w-6 text-purple-600" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                Detailed Analysis
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-lg max-w-none">
              <motion.div 
                className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border-l-4 border-purple-500 shadow-md hover:shadow-lg transition-shadow duration-300"
                whileHover={{ scale: 1.01 }}
              >
                <p className="whitespace-pre-wrap leading-relaxed text-base font-medium text-purple-900">{displayFeedback}</p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Topic Coverage Visualization */}
      {data.topicCoverage && data.topicCoverage.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-indigo-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Topic Coverage Analysis
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.topicCoverage.map((topic, index) => (
                  <motion.div 
                    key={index} 
                    className="space-y-3 bg-white/50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">{topic.name}</span>
                      <span className="text-2xl font-bold text-indigo-600">{topic.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner overflow-hidden">
                      <motion.div 
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-4 rounded-full shadow-sm"
                        initial={{ width: 0 }}
                        animate={{ width: `${topic.percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recommendations Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 border-teal-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Target className="h-6 w-6 text-teal-600" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                Recommendations
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Learning Path */}
              {data.aynstynSummary?.learningPath && data.aynstynSummary.learningPath.length > 0 && (
                <motion.div 
                  className="bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-lg border-l-4 border-teal-500 shadow-md hover:shadow-lg transition-shadow duration-300"
                  whileHover={{ scale: 1.01 }}
                >
                  <h3 className="text-lg font-semibold text-teal-800 mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-teal-600" />
                    Learning Path
                  </h3>
                  <div className="space-y-4">
                    {data.aynstynSummary.learningPath.map((pathItem: any, index: number) => (
                      <motion.div 
                        key={index} 
                        className="flex items-start gap-4 bg-white/50 p-4 rounded-lg"
                        whileHover={{ x: 5 }}
                      >
                        <div className="w-8 h-8 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center mt-1 flex-shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-teal-900">{pathItem.topic || pathItem}</h4>
                          {pathItem.estimatedTime && (
                            <p className="text-teal-700 text-sm">⏱️ {pathItem.estimatedTime}</p>
                          )}
                          {pathItem.resources && (
                            <ul className="mt-2 space-y-1">
                              {pathItem.resources.map((resource: string, resourceIndex: number) => (
                                <li key={resourceIndex} className="text-teal-800 text-sm">📚 {resource}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Next Steps */}
              {data.aynstynSummary?.nextSteps && data.aynstynSummary.nextSteps.length > 0 && (
                <motion.div 
                  className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border-l-4 border-blue-500 shadow-md hover:shadow-lg transition-shadow duration-300"
                  whileHover={{ scale: 1.01 }}
                >
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    <ArrowRight className="h-5 w-5 text-blue-600" />
                    Next Steps
                  </h3>
                  <ul className="space-y-3">
                    {data.aynstynSummary.nextSteps.map((step: string, index: number) => (
                      <motion.li 
                        key={index} 
                        className="flex items-start gap-3 bg-white/50 p-3 rounded-lg"
                        whileHover={{ x: 5 }}
                      >
                        <ArrowRight className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <span className="text-blue-900">{step}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Historical Timeline and Related Resources */}
      <motion.div variants={itemVariants} className="space-y-6">
        <DynamicTimeline subject={data.subject} />
        <RelatedResources subject={data.subject} />
      </motion.div>

      {/* Save Assessment Button */}
      {showSaveButton && onSaveAssessment && (
        <motion.div 
          className="flex justify-center pt-8"
          variants={itemVariants}
        >
          <Button 
            onClick={onSaveAssessment} 
            size="lg" 
            className="w-full sm:w-auto font-bold text-lg px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            💾 Save Assessment to Profile
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}