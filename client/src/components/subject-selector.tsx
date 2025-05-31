import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface SubjectSelectorProps {
  subject: string;
  onSubjectChange: (subject: string) => void;
}

export default function SubjectSelector({
  subject,
  onSubjectChange,
}: SubjectSelectorProps) {
  const [customSubject, setCustomSubject] = useState("");

  // Fetch subjects from API
  const { data: subjectsData } = useQuery<{subjects: string[]}>({
    queryKey: ["/api/subjects"],
  });

  const subjects: string[] = subjectsData?.subjects || [
    "Economy",
    "Biology",
    "Physics",
    "History",
    "Literature",
    "Computer Science",
  ];

  // Popular subjects for quick selection - only using values from the dropdown
  const allPopularSubjects = [
    "Economy",
    "Biology",
    "Physics",
    "History", 
    "Literature",
    "Computer Science",
    "Blockchain",
    "Cryptocurrency"
  ];
  
  // State for shuffled subjects
  const [shuffledSubjects, setShuffledSubjects] = useState<string[]>([]);
  
  // Shuffle function
  const shuffleArray = (array: string[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 7); // Only show 7 subjects at a time
  };
  
  // Shuffle subjects only on initial render (page refresh)
  useEffect(() => {
    // Shuffle on page load/refresh only
    setShuffledSubjects(shuffleArray(allPopularSubjects));
    
    // No interval needed as we only want to shuffle on page refresh
  }, []);

  // When dropdown selection changes
  const handleSelectChange = (value: string) => {
    onSubjectChange(value);
    setCustomSubject("");
    // Store selected subject in localStorage
    localStorage.setItem('currentAssessmentSubject', value);
  };

  // When custom subject input changes
  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSubject(e.target.value);
    if (e.target.value) {
      onSubjectChange(e.target.value);
      // Store custom subject in localStorage
      localStorage.setItem('currentAssessmentSubject', e.target.value);
    }
  };

  // When a popular subject button is clicked
  const handlePopularSubjectClick = (subject: string) => {
    onSubjectChange(subject);
    setCustomSubject("");
    // Store selected subject in localStorage
    localStorage.setItem('currentAssessmentSubject', subject);
  };
  
  // Initialize with some subjects if array is empty
  useEffect(() => {
    if (shuffledSubjects.length === 0) {
      setShuffledSubjects(shuffleArray(allPopularSubjects));
    }
  }, [shuffledSubjects.length]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Select a Subject
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Select value={subject} onValueChange={handleSelectChange}>
            <SelectTrigger className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg">
              <SelectValue placeholder="Choose a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subj) => (
                <SelectItem key={subj} value={subj}>
                  {subj}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom subject input */}
        <div className="relative col-span-1 md:col-span-2">
          <Input
            type="text"
            placeholder="Or type a custom subject...Product Manager, Interview prep"
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg"
            value={customSubject}
            onChange={handleCustomInputChange}
          />
        </div>
      </div>

      {/* Popular subjects */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Popular subjects:
        </h3>
        <div className="flex flex-wrap gap-2 min-h-[70px]">
          {shuffledSubjects.map((subj) => (
            <Button
              key={subj}
              variant="outline"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 h-10 min-w-[120px] flex items-center justify-center transition-all duration-500 ease-in-out"
              onClick={() => handlePopularSubjectClick(subj)}
            >
              {subj}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
