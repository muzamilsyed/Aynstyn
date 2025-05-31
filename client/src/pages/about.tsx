import { Link } from "wouter";
import { ExternalLink } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 mb-4">
            Introducing Aynstyn, the next-generation AI-assisted learning system. Aynstyn empowers individuals to achieve their excellence and goals through an innovative learning mechanism that pinpoints and fills knowledge gaps, making learning precise and effective.
          </p>
          
          <p className="text-gray-700 mb-4">
            Developed in collaboration with leading experts in education, human behavior, and psychology, our AI models facilitate rapid self-improvement and goal attainment.
          </p>
          
          <p className="text-gray-700 mb-8">
            Aynstyn's cutting-edge educational AI models are designed for both corporate and academic environments. We help organizations boost results, increase productivity, and sharpen focus on what truly matters for achieving both collective and individual objectives.
          </p>
          
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
            <div className="flex flex-col space-y-1">
              <p className="text-gray-700 font-medium">Muzamil Syed 
                <br />
              Founder</p>
              <a 
                href="https://www.linkedin.com/in/muzamil-syed-aisaactech/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 inline-flex items-center"
              >
                LinkedIn Profile
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <Link href="/">
            <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
              ← Back to Home
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}