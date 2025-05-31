import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Calendar, 
  Star, 
  Lightbulb, 
  Target, 
  ArrowRight, 
  Sparkles,
  Brain,
  GraduationCap,
  BookMarked,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface Topic {
  name: string;
  description: string;
  overview?: string;
  keyPoints?: string[];
}

interface AssessmentData {
  id?: number;
  assessmentId?: number;
  subject: string;
  score: number;
  input?: string;
  userInput?: string;
  feedback: string;
  coveredTopics: Topic[];
  missingTopics: Topic[];
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

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function AssessmentResults({ data, onSaveAssessment, showSaveButton = false }: AssessmentResultsProps) {
  const [animateScore, setAnimateScore] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    setAnimateScore(true);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-amber-500";
    return "from-red-500 to-orange-500";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Star className="h-6 w-6 text-green-600" />;
    if (score >= 60) return <TrendingUp className="h-6 w-6 text-yellow-600" />;
    return <Clock className="h-6 w-6 text-red-600" />;
  };

  const displayFeedback = data.aynstynSummary?.enhancedFeedback || data.feedback;

  return (
    <motion.div 
      className="max-w-5xl mx-auto px-4 py-8 space-y-8"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Header Section */}
      <motion.div variants={fadeInUp}>
        <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10" />
          <div className="relative p-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {getScoreIcon(data.score)}
              </motion.div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Assessment Results
              </h1>
            </div>
            <div className="text-center space-y-4">
              <motion.div 
                className="text-7xl font-bold"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <span className={cn(
                  "bg-clip-text text-transparent bg-gradient-to-r",
                  getScoreGradient(data.score),
                  animateScore && "animate-pulse"
                )}>
                  {data.score}%
                </span>
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {data.subject}
                </h2>
                {data.createdAt && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Completed on {new Date(data.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div variants={fadeInUp} className="flex justify-center space-x-4">
        {["Overview", "Analysis", "Topics", "Timeline", "Resources"].map((section) => (
          <Button
            key={section}
            variant={activeSection === section ? "default" : "outline"}
            onClick={() => setActiveSection(section)}
            className="relative overflow-hidden group"
          >
            <span className="relative z-10">{section}</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500"
              initial={false}
              animate={{ scale: activeSection === section ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </Button>
        ))}
      </motion.div>

      {/* Content Sections */}
      <AnimatePresence mode="wait">
        {(!activeSection || activeSection === "Overview") && (
          <motion.div
            key="overview"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            {/* Key Findings */}
            <Card className="p-6 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold">Key Findings</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Strengths */}
                <motion.div 
                  className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-l-4 border-green-500"
                  whileHover={{ scale: 1.02 }}
                >
                  <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    Strengths
                  </h4>
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
                  className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-lg border-l-4 border-amber-500"
                  whileHover={{ scale: 1.02 }}
                >
                  <h4 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <Target className="h-5 w-5 text-amber-600" />
                    Areas for Improvement
                  </h4>
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
            </Card>

            {/* Detailed Analysis */}
            <Card className="p-6 border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-6 w-6 text-purple-600" />
                <h3 className="text-xl font-semibold">Detailed Analysis</h3>
              </div>
              <motion.div 
                className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border-l-4 border-purple-500"
                whileHover={{ scale: 1.01 }}
              >
                <p className="whitespace-pre-wrap leading-relaxed text-base font-medium text-purple-900">
                  {displayFeedback}
                </p>
              </motion.div>
            </Card>
          </motion.div>
        )}

        {activeSection === "Topics" && (
          <motion.div
            key="topics"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Card className="p-6 border-2 border-indigo-200">
              <div className="flex items-center gap-2 mb-4">
                <BookMarked className="h-6 w-6 text-indigo-600" />
                <h3 className="text-xl font-semibold">Topic Coverage Analysis</h3>
              </div>
              <div className="space-y-6">
                {data.topicCoverage?.map((topic, index) => (
                  <motion.div 
                    key={index}
                    className="space-y-3 bg-white/50 p-4 rounded-lg shadow-sm"
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">{topic.name}</span>
                      <span className="text-2xl font-bold text-indigo-600">
                        {topic.percentage}%
                      </span>
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
            </Card>
          </motion.div>
        )}

        {activeSection === "Timeline" && (
          <motion.div
            key="timeline"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Card className="p-6 border-2 border-teal-200">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-6 w-6 text-teal-600" />
                <h3 className="text-xl font-semibold">Learning Timeline</h3>
              </div>
              {/* Add your timeline component here */}
            </Card>
          </motion.div>
        )}

        {activeSection === "Resources" && (
          <motion.div
            key="resources"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Card className="p-6 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold">Recommended Resources</h3>
              </div>
              {/* Add your resources component here */}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Assessment Button */}
      {showSaveButton && onSaveAssessment && (
        <motion.div 
          className="flex justify-center pt-8"
          variants={fadeInUp}
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