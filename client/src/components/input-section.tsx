import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { BrainCircuit, Loader2 } from "lucide-react";
import AudioRecorder from "./audio-recorder";

interface InputSectionProps {
  onSubmit: (input: string, inputType: "text" | "audio") => void;
  isLoading: boolean;
  initialInput?: string;
}

export default function InputSection({ onSubmit, isLoading, initialInput = "" }: InputSectionProps) {
  const [activeTab, setActiveTab] = useState<"text" | "audio">("text");
  const [textInput, setTextInput] = useState(initialInput);
  const [wordCount, setWordCount] = useState(0);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  
  // Update word count when text input changes
  useEffect(() => {
    const words = textInput.trim() ? textInput.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [textInput]);
  
  // Handle text input change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    // Store the text input in localStorage for persistence
    localStorage.setItem('currentAssessmentInput', e.target.value);
  };
  
  // Handle audio recording complete
  const handleAudioComplete = (audioBlob: string, text: string | null) => {
    setAudioData(audioBlob);
    setTranscribedText(text);
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (activeTab === "text") {
      onSubmit(textInput, "text");
    } else if (audioData) {
      onSubmit(audioData, "audio");
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Share Your Understanding : Take your sweet time</h2>
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "text" | "audio")} 
          className="w-[200px]"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="mb-4">
        {activeTab === "text" ? (
          <div>
            <Textarea
              placeholder="Explain what you know about this subject in your own words. For example: Economy is made up of transactions and is enabled by businesses and individual transactions. There are different economy models like mixed economy, traditional economy and so on...Or
              
              I see that a product manager is responsible for the entire lifecycle of a product from ideation to launch and beyond. He needs to understand the market, the competition, the customers.."
              className="w-full border border-gray-300 rounded-lg p-4 min-h-[450px] md:min-h-[350px]"
              value={textInput}
              onChange={handleTextChange}
            />
            <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
              <span>Min. 50 words recommended</span>
              <span>{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        ) : (
          <AudioRecorder onRecordingComplete={handleAudioComplete} />
        )}
      </div>
      
      {/* Submit Button */}
      <div className="mt-6">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || (activeTab === "text" ? !textInput : !audioData)}
          className="w-full bg-black hover:bg-gray-800 text-white py-6 h-auto border border-gray-300"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <BrainCircuit className="mr-2 h-5 w-5" />
              Analyze My Knowledge
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
