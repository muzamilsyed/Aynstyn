import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Mic, BrainCircuit, BarChart } from "lucide-react";
import { useEffect, useState } from "react";
import pinSvg from "@/assets/pin.svg";
import confetti from "canvas-confetti";

export default function Home() {
  const [_, navigate] = useLocation();
  const [pinVisible, setPinVisible] = useState(false);
  
  useEffect(() => {
    // Launch confetti celebration!
    const launchConfetti = () => {
      // First burst - colorful celebration
      confetti({
        particleCount: 150,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
      });
      
      // Second burst from left
      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FF6B6B', '#4ECDC4', '#45B7D1']
        });
      }, 300);
      
      // Third burst from right
      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#96CEB4', '#FFEAA7']
        });
      }, 600);
    };

    // Trigger the pin animation and confetti
    setTimeout(() => {
      setPinVisible(true);
      launchConfetti();
    }, 300);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="text-center max-w-4xl mb-12">
        <br></br>

        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4 relative inline-flex items-center">
          <span className={`transition-all duration-700 ${pinVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-16'} mr-2`} style={{ height: '30px', width: '30px', position: 'relative', top: '-2px' }}>
            <img 
              src={pinSvg} 
              alt="Pin" 
              className={`h-full w-full ${pinVisible ? '' : 'animate-bounce'}`} 
              style={{ 
                animation: pinVisible ? 'dropPin 0.5s ease-in-out forwards' : 'none'
              }} 
            />
          </span>
          <span>Pinpoint Your Knowledge Gaps</span>
        </h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-5">
          Be competent in the new era with Aynstyn
        </h2>

        <p className="text-xl text-gray-600 leading-relaxed mb-8">
          Focus your learning, master any subject. Test your knowledge, and our AI will analyze it, provide a score, and highlight areas for improvement. Learn smarter, not just harder.
        </p>
        <Button
          size="lg"
          className="bg-black hover:bg-gray-800 text-white px-8 py-6 text-lg border border-gray-300"
          onClick={() => navigate("/assessment")}
        >
          Start Assessment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mt-12">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="h-6 w-6 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Text Input</h3>
          <p className="text-gray-600">
            Type your understanding of any subject in your own words for deep
            analysis.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="h-6 w-6 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Audio Recording
          </h3>
          <p className="text-gray-600">
            Record your explanations naturally with your voice for a hands-free
            experience.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="h-6 w-6 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Detailed Analysis
          </h3>
          <p className="text-gray-600">
            Get comprehensive feedback on your knowledge with scores and topic
            breakdowns.
          </p>
        </div>
      </div>

      <div className="w-full max-w-6xl mt-16 mb-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          <div className="h-1 w-20 bg-primary-600 mx-auto mt-3 mb-4 rounded-full"></div>
          <p className="text-gray-600 max-w-xl mx-auto">
            Our streamlined algorithms helps you discover what you don't know
            about the subject and provides a personalized learning path
          </p>
        </div>

        <div className="relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center font-bold text-xl mb-4 mx-auto shadow-md">
                <BookOpen className="h-8 w-8 text-black" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-3 text-center">
                Select a Subject
              </h3>
              <p className="text-gray-600 text-center">
                Choose from our curated list or enter your own specialized topic
                to focus on.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center font-bold text-xl mb-4 mx-auto shadow-md">
                <Mic className="h-8 w-8 text-black" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-3 text-center">
                Share Your Knowledge
              </h3>
              <p className="text-gray-600 text-center">
                Type your thoughts or record your voice explaining what you
                understand about the subject.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center font-bold text-xl mb-4 mx-auto shadow-md">
                <BrainCircuit className="h-8 w-8 text-black" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-3 text-center">
                AI Analysis
              </h3>
              <p className="text-gray-600 text-center">
                Our advanced AI model evaluates your knowledge depth, breadth,
                and identifies knowledge gaps.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center font-bold text-xl mb-4 mx-auto shadow-md">
                <BarChart className="h-8 w-8 text-black" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-3 text-center">
                Personalized Results
              </h3>
              <p className="text-gray-600 text-center">
                Receive a detailed assessment with actionable insights and
                targeted learning recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full text-center mt-12 mb-6">
        <p className="text-gray-500 font-medium text-base italic opacity-70 tracking-wide">
          "You aren't smart until you believe in yourself"
        </p>
      </div>
    </div>
  );
}
