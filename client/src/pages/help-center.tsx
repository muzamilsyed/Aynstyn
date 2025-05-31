import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mail, MessageCircle, HelpCircle } from "lucide-react";

export default function HelpCenter() {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Submit form data to backend
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Message Sent Successfully",
          description: "Thank you for contacting us! We'll get back to you within 24 hours.",
        });
        
        // Reset form
        setContactForm({
          name: "",
          email: "",
          subject: "",
          message: ""
        });
      } else {
        throw new Error(result.error || 'Failed to submit form');
      }
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      question: "What is Aynstyn and how does it work?",
      answer: "Aynstyn is an AI-powered knowledge assessment platform that analyzes your understanding of various subjects. You can input text, upload documents, or record audio explanations, and our AI will evaluate your knowledge, identify gaps, and provide personalized feedback to help you learn more effectively."
    },
    {
      question: "How accurate are the assessment results?",
      answer: "Our AI-powered assessments provide valuable insights into your knowledge and learning progress. However, please note that results are for educational and informational purposes only and are not 100% accurate or definitive. Learning performance is subjective and multifactorial, so our assessments should be used as a reference for personal evaluation."
    },
    {
      question: "Is my assessment data private and secure?",
      answer: "Yes, absolutely! Your assessment data is fully protected and accessible only to you. We do not analyze, repurpose, or use your assessment data for any internal training or research purposes. Your privacy and the confidentiality of your academic progress are of the utmost importance to us."
    },
    {
      question: "What subjects can I assess with Aynstyn?",
      answer: "Aynstyn supports a wide range of subjects including Mathematics, Science, History, Literature, Computer Science, Business, Psychology, and many more. Our AI is designed to understand and evaluate knowledge across diverse academic and professional fields."
    },
    {
      question: "Can I use Aynstyn for free?",
      answer: "Yes! We offer free assessments with some limitations for anonymous users. Registered users get access to unlimited assessments, detailed feedback, progress tracking, and additional features. Check our pricing page for more details about premium features."
    },
    {
      question: "How do I interpret my assessment results?",
      answer: "Your assessment results include a knowledge score, covered topics, missing topics, and personalized feedback. The results show areas where you demonstrate strong understanding and identify knowledge gaps that need attention. Remember, these insights are for reference and personal evaluation to guide your learning journey."
    },
    {
      question: "Can I retake assessments?",
      answer: "Yes, you can take assessments multiple times to track your progress and improvement over time. Each assessment is treated independently, so you can see how your understanding evolves as you continue learning."
    },
    {
      question: "What formats can I submit for assessment?",
      answer: "You can submit your knowledge in multiple formats: written text explanations, uploaded documents (PDF, DOC, etc.), or audio recordings where you verbally explain concepts. Our AI can process and analyze all these input types effectively."
    },
    {
      question: "How long does it take to get assessment results?",
      answer: "Assessment results are typically generated within a few seconds to a minute, depending on the complexity and length of your input. Our AI processes your submission in real-time to provide immediate feedback."
    },
    {
      question: "Can I share my assessment results?",
      answer: "Your assessment results are private by default and only accessible to you. You have full control over your data and can choose to share results if you wish, but we never share or analyze your data without your explicit consent."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions and get support
          </p>
        </div>

        <Tabs defaultValue="faqs" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="faqs" className="flex items-center space-x-2">
              <HelpCircle className="h-4 w-4" />
              <span>Frequently Asked Questions</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>Contact Us</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faqs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HelpCircle className="h-5 w-5" />
                  <span>Frequently Asked Questions</span>
                </CardTitle>
                <CardDescription>
                  Find quick answers to the most common questions about Aynstyn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Mail className="h-5 w-5" />
                      <span>Send us a Message</span>
                    </CardTitle>
                    <CardDescription>
                      Can't find what you're looking for? Send us a message and we'll get back to you within 24 hours.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            placeholder="Your full name"
                            value={contactForm.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={contactForm.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="What is this regarding?"
                          value={contactForm.subject}
                          onChange={(e) => handleInputChange("subject", e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="Please describe your question or issue in detail..."
                          className="min-h-[120px]"
                          value={contactForm.message}
                          onChange={(e) => handleInputChange("message", e.target.value)}
                          required
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Sending..." : "Send Message"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Get in Touch</CardTitle>
                    <CardDescription>
                      Other ways to reach us
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Email Support</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        For general inquiries and support
                      </p>
                      <a 
                        href="mailto:muzamil@aynstyn.com" 
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        muzamil@aynstyn.com
                      </a>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Response Time</h4>
                      <p className="text-sm text-gray-600">
                        We typically respond within 24 hours during business days.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Before You Contact Us</h4>
                      <p className="text-sm text-gray-600">
                        Please check our FAQs above - you might find your answer there!
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Need Immediate Help?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      For urgent technical issues, please include:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Your browser type and version</li>
                      <li>• Steps to reproduce the issue</li>
                      <li>• Any error messages you see</li>
                      <li>• Screenshots if applicable</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}