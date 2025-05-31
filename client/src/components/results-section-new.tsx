import { useEffect, useRef, useState } from "react";
import type { AssessmentResult } from "@/pages/assessment";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import AnimatedSection from "./animated-section";
import TransitionSection from "./transition-section";
import {
  CheckCircle,
  PlusCircle,
  Brain,
  ArrowRight,
  Clock,
  Calendar,
  BookOpen,
  ChevronRight,
  ChevronDown,
  FileDown,
  FileText,
  Save,
  Share2,
  Download,
  Play,
  Youtube,
  Video,
  Lightbulb,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import html2pdf from "html2pdf.js";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DynamicTimeline from "./dynamic-timeline";

interface ResultsSectionProps {
  result: AssessmentResult;
}

export default function ResultsSection({ result }: ResultsSectionProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const resultSectionRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "json">("pdf");
  const { toast } = useToast();

  useEffect(() => {
    // Animate progress ring
    if (circleRef.current) {
      const radius = circleRef.current.r.baseVal.value;
      const circumference = radius * 2 * Math.PI;

      circleRef.current.style.strokeDasharray = `${circumference} ${circumference}`;
      circleRef.current.style.strokeDashoffset = `${circumference}`;

      // Trigger animation
      setTimeout(() => {
        if (circleRef.current) {
          const offset = circumference - (result.score / 100) * circumference;
          circleRef.current.style.strokeDashoffset = `${offset}`;
        }
      }, 200);
    }
  }, [result.score]);

  const handleSaveAssessment = async () => {
    try {
      setIsSaving(true);

      // Create filename based on subject
      const fileName = `${result.subject.replace(/\s+/g, "_")}_Assessment_${new Date().toISOString().split("T")[0]}`;

      if (exportFormat === "json") {
        // For JSON format, create a downloadable JSON file
        const content = JSON.stringify(result, null, 2);
        const blob = new Blob([content], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.json`;
        document.body.appendChild(link);
        link.click();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);

        toast({
          title: "Assessment Saved",
          description: `Your assessment has been downloaded as JSON`,
        });
      } else {
        // For PDF format, use direct HTML2PDF approach with the actual reference
        if (!resultSectionRef.current) {
          throw new Error("Could not find assessment content");
        }

        // Simple options that work reliably
        const options = {
          margin: 15,
          filename: `${fileName}.pdf`,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 1 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        };

        // Generate PDF from the ref element which is definitely an HTMLElement
        await html2pdf(resultSectionRef.current, options);

        toast({
          title: "Assessment Saved",
          description: `Your assessment has been downloaded as PDF`,
        });
      }

      setExportDialogOpen(false);
    } catch (error) {
      console.error("Error saving assessment:", error);
      toast({
        title: "Error",
        description: `Failed to save assessment: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm p-6 mb-8 assessment-container"
      ref={resultSectionRef}
    >
      {/* Header */}
      <AnimatedSection className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Knowledge Assessment: {result.subject}
        </h2>
        <p className="text-gray-600">
          Here's an analysis of your understanding based on the information you
          provided.
        </p>
      </AnimatedSection>

      {/* Score Overview */}
      <div className="flex flex-col md:flex-row mb-8 gap-6">
        {/* Circular Score Display */}
        <AnimatedSection className="flex-1 bg-gray-50 rounded-xl p-6 flex flex-col items-center" delay={0.1}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Overall Score
          </h3>
          <div className="relative w-48 h-48 mb-4">
            <svg
              className="w-48 h-48"
              style={{ transform: "rotate(-90deg)" }}
              viewBox="0 0 160 160"
            >
              <circle
                className="text-gray-200"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                r="70"
                cx="80"
                cy="80"
              />
              <circle
                ref={circleRef}
                className="text-primary-500"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                r="70"
                cx="80"
                cy="80"
                style={{
                  transition: "stroke-dashoffset 1s ease-in-out",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-gray-900">
                {Math.round(result.score)}
              </span>
              <span className="text-sm text-gray-500">out of 100</span>
            </div>
          </div>
          <p className="text-center text-sm text-gray-600 mb-2">
            {result.score >= 90
              ? "Excellent understanding across most key topics."
              : result.score >= 70
                ? "Good understanding of basic concepts with some gaps in advanced topics."
                : result.score >= 50
                  ? "Basic understanding with significant knowledge gaps."
                  : "Introductory understanding with many concepts to explore."}
          </p>

          <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-3 mt-3 px-4">
            <p className="font-medium mb-1">How we calculate your score:</p>
            <p>
              We analyze the depth and accuracy of your explanation, evaluating
              how many key topics you covered and the precision of your
              understanding.
              <br />
              <br />
              Our algorithms weighs topic coverage (60%), factual accuracy
              (25%), and depth of insight (15%) to determine your final score
              out of 100.
            </p>
          </div>
        </AnimatedSection>

        {/* Topic Coverage */}
        <AnimatedSection className="flex-1 bg-gray-50 rounded-xl p-6" delay={0.2}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Topic Coverage
            </h3>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
              Higher % = Better coverage
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-4">
            These percentages reflect how thoroughly you covered key concepts in
            each topic area of {result.subject}.
          </p>

          {/* Topic bars */}
          <div className="space-y-5">
            {result.topicCoverage.map((topic, index) => {
              // Ensure percentage is a valid number
              const validPercentage = Number.isFinite(topic.percentage)
                ? topic.percentage
                : 0;

              // Determine color and message based on percentage
              const getColorClass = (percentage: number) => {
                if (percentage >= 70) return "bg-green-600";
                if (percentage >= 40) return "bg-blue-500";
                return "bg-amber-500";
              };

              const getMessage = (percentage: number) => {
                if (percentage >= 70) return "Strong understanding";
                if (percentage >= 40) return "Partial understanding";
                return "Needs attention";
              };

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  className="border border-gray-100 rounded-lg p-3"
                >
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {topic.name}
                    </span>
                    <div className="flex items-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full mr-2 ${
                          validPercentage >= 70
                            ? "bg-green-100 text-green-700"
                            : validPercentage >= 40
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {getMessage(validPercentage)}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {Math.round(validPercentage)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 overflow-hidden">
                    <div
                      className={`${getColorClass(validPercentage)} h-2.5 ${validPercentage === 100 ? "rounded-full" : "rounded-l-full"} shadow-sm`}
                      style={{
                        width: `${validPercentage}%`,
                        transition: "width 1s ease-in-out",
                        maxWidth: "100%",
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-200">
            <p className="font-medium mb-1">What does this mean?</p>
            <p>
              Topic Coverage shows how well you addressed important concepts
              within each subject area. Areas with lower percentages represent
              opportunities to deepen your knowledge.
            </p>
          </div>
        </AnimatedSection>
      </div>

      {/* Detailed Analysis */}
      <TransitionSection className="mb-8" delay={0.3} direction="up">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Topics You Covered
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {result.coveredTopics.map((topic, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 transition-all hover:shadow-md"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-base font-medium text-gray-900">
                    {topic.name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {topic.description}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <a
                      href={`https://en.wikipedia.org/wiki/${encodeURIComponent(topic.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm px-3 py-1.5 bg-green-100 text-green-700 rounded-full flex items-center hover:bg-green-200"
                    >
                      <ArrowRight className="h-4 w-4 mr-1.5" />
                      Learn More
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Topics to Explore
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {result.missingTopics.map((topic, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              className="bg-gray-50 border border-gray-200 rounded-lg p-5 transition-all hover:shadow-md"
            >
              <div className="flex items-start mb-3">
                <div className="flex-shrink-0 bg-gray-100 rounded-full p-1">
                  <PlusCircle className="h-5 w-5 text-gray-600" />
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-base font-medium text-gray-900">
                    {topic.name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {topic.description}
                  </p>
                </div>
              </div>

              {topic.overview && (
                <div className="mb-4 mt-2 px-2">
                  <p className="text-sm text-gray-700">{topic.overview}</p>
                </div>
              )}

              {topic.keyPoints && topic.keyPoints.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-gray-800 mb-2 px-2">
                    Key Points to Explore:
                  </h5>
                  <ul className="space-y-2">
                    {topic.keyPoints.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center mt-0.5 mr-2">
                          <span className="text-primary-700 text-xs font-bold">
                            {pointIndex + 1}
                          </span>
                        </div>
                        <span className="text-xs text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Additional resource links */}
              <div className="flex flex-wrap gap-2 mt-3">
                <a
                  href={`https://en.wikipedia.org/wiki/${encodeURIComponent(topic.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full flex items-center hover:bg-gray-200"
                >
                  <ArrowRight className="h-4 w-4 mr-1.5" />
                  Wikipedia
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </TransitionSection>

      {/* Historical Timeline */}
      <TransitionSection className="mb-8" delay={0.5} direction="up">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="mr-2 h-5 w-5 text-primary-600" />
          Historical Timeline
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          This timeline shows key events and developments in the evolution of {result.subject}
        </p>
        <div className="bg-gray-50 p-4 rounded-lg">
          <DynamicTimeline 
            subject={result.subject} 
            language={result.detectedLanguage} // Pass detected language to timeline
          />
        </div>
      </TransitionSection>

      {/* Final Feedback Section */}
      <TransitionSection className="mb-8" delay={0.6} direction="up">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Brain className="mr-2 h-5 w-5 text-primary-600" />
          Personalized Feedback
        </h3>
        <div className="bg-primary-50 border border-primary-100 rounded-lg p-6">
          <div className="prose prose-sm max-w-none text-gray-700">
            <p className="whitespace-pre-line">{result.feedback}</p>
          </div>
        </div>
      </TransitionSection>

      {/* User Input Section (Collapsible) */}
      <TransitionSection delay={0.7} direction="up">
        <Collapsible className="w-full rounded-lg border border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between px-4 py-3">
            <h3 className="text-base font-medium text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-600" />
              Your Original Input
            </h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <ChevronDown className="h-4 w-4" />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="px-4 pb-4">
              <div className="bg-white border border-gray-100 rounded p-3 text-sm text-gray-600 max-h-60 overflow-y-auto whitespace-pre-line">
                {result.userInput || "No input text available."}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </TransitionSection>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap justify-end gap-4">
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Assessment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Assessment</DialogTitle>
              <DialogDescription>
                Choose your preferred file format to save this assessment.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="grid flex-1 gap-2">
                    <Select
                      value={exportFormat}
                      onValueChange={(value) => setExportFormat(value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                        <SelectItem value="json">JSON Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setExportDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleSaveAssessment}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}