import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface Resource {
  type: "Course" | "Article" | "Video";
  title: string;
  description: string;
  image: string;
  meta: string;
  link: string;
}

interface RelatedResourcesProps {
  subject: string;
}

export default function RelatedResources({ subject }: RelatedResourcesProps) {
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    // In a real application, we would fetch recommended resources from the API
    // Here we're generating some sample resources based on the subject
    const generateResources = () => {
      const baseResources: Resource[] = [
        {
          type: "Course",
          title: `${subject} Fundamentals`,
          description: `A comprehensive introduction to ${subject.toLowerCase()} principles and theories.`,
          image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=340",
          meta: "4.5 ⭐ (2,340 reviews)",
          link: "#"
        },
        {
          type: "Article",
          title: `${subject} Latest Research`,
          description: `Recent developments and insights in the field of ${subject.toLowerCase()}.`,
          image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=340",
          meta: "12 min read",
          link: "#"
        },
        {
          type: "Video",
          title: `Understanding ${subject}`,
          description: `A visual guide to key concepts in ${subject.toLowerCase()} for beginners and experts.`,
          image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=340",
          meta: "35 min",
          link: "#"
        }
      ];
      
      setResources(baseResources);
    };

    generateResources();
  }, [subject]);

  return null; // Removed Recommended Learning Resources section as requested
}
