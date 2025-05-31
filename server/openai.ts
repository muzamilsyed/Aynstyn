/**
 * OpenAI Integration Module
 * 
 * This module provides the integration with OpenAI's API services for the application.
 * It includes functions for using AI models to analyze text, generate content,
 * provide feedback, and score responses for educational assessments.
 * 
 * Key features:
 * - Topic explanations and analysis
 * - Assessment scoring and feedback generation
 * - Assistant summaries for user content
 * - Language processing for educational content
 */

import OpenAI from "openai";

// Initialize the OpenAI SDK with the API key from environment variables
// GPT-4o is the most advanced model as of May 2024 with improved capabilities
const apiKey = process.env.OPENAI_API_KEY || "";

// Log API key availability for debugging without exposing the actual key
console.log("OpenAI API Key availability:", apiKey ? "Key is set" : "Key is missing");

// Create the OpenAI client instance with the API key
const openai = new OpenAI({ apiKey });

// Export the OpenAI instance for use in other modules throughout the application
export { openai };

/**
 * TopicAnalysis Interface
 * 
 * Defines the structure for topic analysis results returned by AI assessment functions.
 * This represents a comprehensive evaluation of a user's response to assessment questions,
 * including scoring, topic coverage analysis, and personalized feedback.
 */
export interface TopicAnalysis {
  /** Overall numerical score (0-100) representing the quality of the response */
  score: number;
  
  /** List of topics that were successfully covered in the user's response */
  coveredTopics: {
    /** Name/title of the covered topic */
    name: string;
    /** Brief description of the covered topic */
    description: string;
  }[];
  
  /** List of topics that were expected but not addressed in the user's response */
  missingTopics: {
    /** Name/title of the missing topic */
    name: string;
    /** Brief description of what should have been included */
    description: string;
  }[];
  
  /** Detailed breakdown of how well each topic was covered (by percentage) */
  topicCoverage: {
    /** Name/title of the topic */
    name: string;
    /** Percentage (0-100) of how thoroughly the topic was covered */
    percentage: number;
  }[];
  
  /** Personalized feedback text with suggestions for improvement */
  feedback: string;
}

/**
 * Enhanced Scoring Algorithm
 * 
 * This function implements a sophisticated scoring algorithm that evaluates
 * assessment responses based on multiple factors including length, topic coverage,
 * factual accuracy, and depth of insight. It uses adaptive weighting to provide
 * fair scoring across different response styles and lengths.
 * 
 * The algorithm follows these steps:
 * 1. Pre-check for minimum response length
 * 2. Calculate component scores for different aspects
 * 3. Apply adaptive weighting based on response characteristics
 * 4. Normalize based on ideal response length
 * 5. Apply special bonuses for particularly effective responses
 * 6. Ensure the final score is within the valid range (0-100)
 * 
 * @param {string} input - The user's raw text response to be scored
 * @param {any} analysisResult - Analysis data from the AI evaluation of the response
 * @returns {number} A final score between 0-100 representing the quality of the response
 */
function calculateEnhancedScore(input: string, analysisResult: any): number {
  // Count the number of words in the input (filtering out empty strings)
  const words = input.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  
  // Extract the original base score from the analysis result
  const originalScore = typeof analysisResult.score === 'number' ? analysisResult.score : 0;
  
  // Log the initial metrics for debugging and transparency
  console.log(`Enhanced scoring: Word count = ${wordCount}, Original score = ${originalScore}`);
  
  // Step 1: Pre-check for minimum threshold
  // Very short responses are capped at a maximum score of 20
  if (wordCount < 10) {
    const cappedScore = Math.min(originalScore, 20);
    console.log(`Short response detected (${wordCount} words), capping score at 20. Final: ${cappedScore}`);
    return cappedScore;
  }
  
  // Step 2: Calculate component scores (normalized to 0-100)
  // Each component represents a different aspect of response quality
  const topicCoverage = Math.min(100, (analysisResult.coveredTopics?.length || 0) * 25);
  const factualAccuracy = Math.min(100, originalScore * 0.8); // Assume original score reflects accuracy
  const depthOfInsight = Math.min(100, Math.max(0, originalScore - 20)); // Insight from score above baseline
  
  // Step 3: Adaptive weighting based on response length
  // Different response lengths need different evaluation criteria
  let coverageWeight, accuracyWeight, insightWeight;
  
  if (wordCount < 30) {
    // Short response weights - more balanced approach for brief answers
    coverageWeight = 0.40;
    accuracyWeight = 0.30;
    insightWeight = 0.30;
  } else {
    // Normal response weights - prioritize comprehensive coverage
    coverageWeight = 0.60;
    accuracyWeight = 0.25;
    insightWeight = 0.15;
  }
  
  // Calculate base score using weighted components
  const baseScore = (topicCoverage * coverageWeight) + 
                   (factualAccuracy * accuracyWeight) + 
                   (depthOfInsight * insightWeight);
  
  // Step 4: Length normalization factor
  // Adjust score based on how close the response is to the ideal length
  const idealWordCount = 75; // Sweet spot for comprehensive answers
  const lengthFactor = Math.min(1.0, wordCount / idealWordCount);
  
  // Step 5: Apply length factor to the base score
  let finalScore = baseScore * lengthFactor;
  
  // Step 6: Bonus for concise yet complete responses
  // Reward efficiency - responses that cover topics well in fewer words
  if (wordCount >= 20 && wordCount <= 50 && topicCoverage >= 75 && factualAccuracy >= 80) {
    finalScore = Math.min(100, finalScore * 1.1); // 10% bonus for concise completeness
    console.log(`Concise completeness bonus applied`);
  }
  
  // Ensure score is within bounds (0-100) and rounded to an integer
  finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));
  
  // Log detailed scoring breakdown for transparency and debugging
  console.log(`Enhanced scoring breakdown: Coverage=${topicCoverage}, Accuracy=${factualAccuracy}, Insight=${depthOfInsight}`);
  console.log(`Weights: C=${coverageWeight}, A=${accuracyWeight}, I=${insightWeight}`);
  console.log(`Base score=${baseScore.toFixed(1)}, Length factor=${lengthFactor.toFixed(2)}, Final=${finalScore}`);
  
  return finalScore;
}

/**
 * Topic Explanation Generator
 * 
 * This function uses OpenAI's GPT-4o model to generate educational content that explains
 * academic topics in a concise, accessible way. It returns structured content with an
 * overview and key points about the requested topic, tailored to the specified subject area.
 * 
 * The function supports multilingual output (primarily English and Hindi) and includes
 * fallback content if the API is unavailable or the key is missing.
 * 
 * @param {string} subject - The academic subject or context for the topic (e.g., "Physics", "Economics")
 * @param {string} topicName - The specific topic to explain (e.g., "Newton's Laws of Motion")
 * @param {string} topicDescription - A brief initial description of the topic to guide the AI
 * @param {string} language - Language code for the response ('en' for English, 'hi' for Hindi, etc.)
 * @returns {Promise<{overview: string, keyPoints: string[]}>} A structured explanation with overview text and key points
 */
export async function explainTopic(
  subject: string,
  topicName: string,
  topicDescription: string,
  language: string = 'en'
): Promise<{ overview: string; keyPoints: string[] }> {
  try {
    // Log the request parameters for monitoring and debugging
    console.log(`Explaining topic: "${topicName}" for subject: ${subject} in language: ${language}`);
    
    // Verify that the OpenAI API key is available and valid
    if (!apiKey || apiKey.trim() === "") {
      console.error("OpenAI API key is missing or empty");
      // Return graceful fallback content instead of throwing an error
      // This ensures the application continues to function even without API access
      return {
        overview: `${topicName} is an important concept in ${subject}.`,
        keyPoints: [
          `${topicDescription}`, 
          "More detailed information will be available soon."
        ]
      };
    }
    
    // Log the API request for monitoring and debugging
    console.log("Making OpenAI API request for topic explanation...");
    
    // Call the OpenAI API to generate the topic explanation
    const response = await openai.chat.completions.create({
      model: "gpt-4o",  // Using the most advanced model for high-quality educational content
      messages: [
        {
          // System message defines the AI's role and output format requirements
          role: "system",
          content: `You are an educational expert providing concise overviews on academic topics. Your goal is to help users understand topics they're unfamiliar with by providing brief but insightful information.
          
          Format your response as JSON with two parts:
          1. "overview": A brief 2-3 sentence overview of the topic
          2. "keyPoints": An array of 3-5 bullet points highlighting the most important aspects to explore about this topic
          
          Each bullet point should be concise (15-25 words) and focus on a specific aspect, concept, or application of the topic.
          
          IMPORTANT: Your response must be in the language specified (${language}). 
          If specified language is 'hi', provide the response in Hindi.
          If specified language is 'en', provide the response in English.
          Always respond in the language specified.
          
          Make your content accessible to someone with basic knowledge of the subject area and focus on clarity over complexity.`
        },
        {
          // User message contains the specific topic request and context
          role: "user",
          content: `Please provide a short overview and key exploration points for "${topicName}" in the context of ${subject}.
          
          Here's a brief description to start from: "${topicDescription}"
          
          I need a JSON response with a brief overview and 3-5 bullet points that highlight what someone should explore to understand this topic.
          
          Remember to provide your response in ${language} language.`
        }
      ],
      // Ensure response is formatted as JSON for reliable parsing
      response_format: { type: "json_object" },
      // Use moderate temperature for creative but focused explanations
      temperature: 0.7,
      // Limit token count to ensure concise responses
      max_tokens: 500,
    });

    console.log("OpenAI API response received for topic explanation");
    
    if (!response.choices || !response.choices[0] || !response.choices[0].message || !response.choices[0].message.content) {
      console.error("Invalid response structure from OpenAI for topic explanation");
      // Return fallback content
      return {
        overview: `${topicName} relates to ${subject} and involves ${topicDescription}.`,
        keyPoints: ["More detailed information will be available soon."]
      };
    }
    
    // Parse the response with error handling
    let result;
    try {
      const contentStr = response.choices[0].message.content.trim();
      result = JSON.parse(contentStr);
    } catch (parseError: any) {
      console.error("Failed to parse OpenAI response for topic explanation:", parseError.message);
      // Return fallback content
      return {
        overview: `${topicName} is a concept in ${subject} that involves ${topicDescription}.`,
        keyPoints: ["More detailed information will be available soon."]
      };
    }
    
    return {
      overview: result.overview || `${topicName} in ${subject}.`,
      keyPoints: Array.isArray(result.keyPoints) ? result.keyPoints : ["Key information coming soon."]
    };
  } catch (error: any) {
    console.error("Error generating topic explanation:", error);
    // Return fallback content rather than throwing an error
    return {
      overview: `${topicName} is an important concept in ${subject}.`,
      keyPoints: [
        `${topicDescription}`, 
        "More detailed information will be available soon."
      ]
    };
  }
}

export async function analyzeKnowledge(
  subject: string,
  input: string
): Promise<TopicAnalysis> {
  try {
    console.log(`Analyzing knowledge for subject: ${subject}, input length: ${input.length} characters`);
    
    // Verify API key is available
    if (!apiKey || apiKey.trim() === "") {
      console.error("OpenAI API key is missing or empty");
      throw new Error("OpenAI API key is not properly configured");
    }

    // Make API call with proper error handling
    console.log("Making OpenAI API request...");
    
    // First detect the language of the input
    const languageDetectionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a language detection expert. Detect the language of the following text and respond with only the ISO language code (e.g., 'en' for English, 'hi' for Hindi, 'es' for Spanish, etc.).`
        },
        {
          role: "user",
          content: input
        }
      ],
      temperature: 0.1,
    });
    
    const detectedLanguage = languageDetectionResponse.choices[0]?.message?.content?.trim() || 'en';
    console.log(`Detected language: ${detectedLanguage}`);
    
    // Now analyze the knowledge in the detected language
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an educational assessment expert. Your task is to analyze a user's understanding of a specific subject and provide constructive feedback.
          
          The user's input is in ${detectedLanguage} language. Analyze the user's input on the subject "${subject}" and respond with a JSON object containing:
          1. "score": An overall score from 0-100 based on the depth and accuracy of understanding
          2. "coveredTopics": Array of objects with "name" and "description" for topics they covered correctly
          3. "missingTopics": Array of objects with "name" and "description" for important topics they missed
          4. "topicCoverage": Array of objects with "name" and "percentage" for each key topic area. CRITICAL: Make sure percentages are realistic and varied - never all at 100%! Even excellent responses should show a range (55-95%) across different topics. Distribute scores across this range to reflect relative strengths and weaknesses.
          5. "feedback": Detailed constructive feedback string on their understanding
          
          IMPORTANT: Your response must be in the SAME LANGUAGE as the user's input (${detectedLanguage}). 
          If the input is in Hindi, your response should be in Hindi. 
          If the input is in English, your response should be in English.
          
          The analysis should be educational and helpful, not critical. Return in JSON format.`
        },
        {
          role: "user",
          content: input
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    console.log("OpenAI API response received successfully");
    
    if (!response.choices || !response.choices[0] || !response.choices[0].message || !response.choices[0].message.content) {
      console.error("Invalid response structure from OpenAI:", JSON.stringify(response));
      throw new Error("Received invalid response structure from OpenAI");
    }
    
    // Parse the response with error handling
    let result;
    try {
      const contentStr = response.choices[0].message.content.trim();
      console.log("OpenAI response content (preview):", contentStr.substring(0, 100) + "...");
      result = JSON.parse(contentStr);
    } catch (parseError: any) {
      console.error("Failed to parse OpenAI response:", parseError.message);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
    
    // Validate result structure
    if (!result || typeof result !== 'object') {
      console.error("Invalid result format from OpenAI:", result);
      throw new Error("OpenAI returned invalid format");
    }
    
    // Additional validation for required fields with logging
    console.log("Validating analysis result structure");
    
    // Ensure coveredTopics is an array of objects with name and description
    const coveredTopics = Array.isArray(result.coveredTopics) ? result.coveredTopics.filter((topic: any) => 
      topic && typeof topic === 'object' && topic.name && topic.description
    ) : [];
    
    // Ensure missingTopics is an array of objects with name and description
    const missingTopics = Array.isArray(result.missingTopics) ? result.missingTopics.filter((topic: any) => 
      topic && typeof topic === 'object' && topic.name && topic.description
    ) : [];
    
    // Ensure topicCoverage is an array of objects with name and percentage
    const topicCoverage = Array.isArray(result.topicCoverage) ? result.topicCoverage.filter((topic: any) => 
      topic && typeof topic === 'object' && topic.name && (typeof topic.percentage === 'number')
    ) : [];
    
    console.log(`Analysis structure: Found ${coveredTopics.length} covered topics, ${missingTopics.length} missing topics`);
    
    // Apply the enhanced scoring algorithm
    const words = input.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const originalScore = typeof result.score === 'number' ? result.score : 0;
    
    console.log(`Enhanced scoring: Word count = ${wordCount}, Original score = ${originalScore}`);
    
    // Step 1: Pre-check for minimum threshold
    let enhancedScore;
    if (wordCount < 10) {
      enhancedScore = Math.min(originalScore, 20);
      console.log(`Short response detected (${wordCount} words), capping score at 20. Final: ${enhancedScore}`);
    } else {
      // For longer responses, use the original sophisticated algorithm
      enhancedScore = originalScore; // For now, keeping original until we implement full algorithm
      console.log(`Normal response length (${wordCount} words), using original score: ${enhancedScore}`);
    }
    
    // Format the response to match our expected structure with defaults for safety
    return {
      score: enhancedScore,
      coveredTopics: coveredTopics,
      missingTopics: missingTopics,
      topicCoverage: topicCoverage,
      feedback: typeof result.feedback === 'string' ? result.feedback : "Unable to generate feedback."
    };
  } catch (error: any) {
    console.error("Error analyzing knowledge:", error);
    console.error("Error stack:", error.stack);
    throw new Error(`Failed to analyze knowledge: ${error.message}`);
  }
}

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

export async function generateSubjectTimeline(
  subject: string,
  language: string = 'en'
): Promise<TimelineEvent[]> {
  try {
    // Add detailed logging for debugging
    console.log(`===== TIMELINE GENERATION =====`);
    console.log(`Subject: "${subject}"`);
    console.log(`Requested language: "${language}"`);
    console.log(`OpenAI API key available: ${apiKey ? "Yes" : "No"}`);
    
    // Normalize language code to prevent inconsistencies
    const normalizedLanguage = language.trim().toLowerCase().substring(0, 2);
    console.log(`Normalized language code: "${normalizedLanguage}"`);
    
    // Verify API key is available
    if (!apiKey || apiKey.trim() === "") {
      console.error("OpenAI API key is missing or empty");
      console.log(`Using fallback timeline for language: ${normalizedLanguage}`);
      return generateFallbackTimeline(normalizedLanguage);
    }
    
    console.log("Making OpenAI API request for timeline generation...");
    
    // Map language codes to full language names for clearer instructions to the model
    const languageMap: {[key: string]: string} = {
      'en': 'English',
      'hi': 'Hindi',
      'ar': 'Arabic',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'ja': 'Japanese',
      'zh': 'Chinese',
      'ru': 'Russian',
      'pt': 'Portuguese',
      'gu': 'Gujarati',
      'bn': 'Bengali',
      'ta': 'Tamil',
      'te': 'Telugu',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'mr': 'Marathi',
      'pa': 'Punjabi',
      'ur': 'Urdu'
    };
    
    // Get the full language name, default to English if not found
    const fullLanguageName = languageMap[normalizedLanguage] || 'English';
    console.log(`Using full language name: "${fullLanguageName}"`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a historical expert who creates concise, accurate timelines for educational purposes. Generate a timeline of 6 key historical developments related to the given subject.
          
          EXTREMELY IMPORTANT: Your response MUST be in ${fullLanguageName} language (code: ${normalizedLanguage}). 
          Do not translate the timeline - generate it directly in ${fullLanguageName}.
          The entire response including all years, titles, and descriptions must be in ${fullLanguageName}.`
        },
        {
          role: "user",
          content: `Create a historical timeline for "${subject}" with 6 key events or developments.
          
          Format your response as a JSON object with an "events" array, where each event has:
          1. "year": A specific year or time period (e.g., "1905", "1970s", "300 BCE")
          2. "title": A short title for the event or development (3-5 words)
          3. "description": A brief description of the significance (maximum 10 words)
          
          Make the timeline chronological, historically accurate, and educational. Focus on major discoveries, breakthroughs, or developments in the field.
          
          YOUR RESPONSE MUST BE ENTIRELY IN ${fullLanguageName} (${normalizedLanguage}) - INCLUDING ALL YEARS, TITLES, AND DESCRIPTIONS.
          
          DO NOT INCLUDE ANY TEXT IN ENGLISH OR ANY OTHER LANGUAGE BESIDES ${fullLanguageName}.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    console.log("OpenAI API response received for timeline generation");
    
    if (!response.choices || !response.choices[0] || !response.choices[0].message || !response.choices[0].message.content) {
      console.error("Invalid response structure from OpenAI for timeline generation");
      return generateFallbackTimeline(language);
    }
    
    // Parse the response with error handling
    let timeline: TimelineEvent[] = [];
    try {
      const contentStr = response.choices[0].message.content.trim();
      console.log("Timeline response preview:", contentStr.substring(0, 100) + "...");
      const result = JSON.parse(contentStr);
      
      // Check if we got an array of events
      if (result.events && Array.isArray(result.events)) {
        timeline = result.events;
      } else if (Array.isArray(result)) {
        timeline = result;
      } else {
        console.error("Timeline data is not in expected format");
        return generateFallbackTimeline(language);
      }
      
      // Validate timeline structure
      if (timeline.length === 0) {
        console.error("Timeline is empty");
        return generateFallbackTimeline(language);
      }
      
      // Ensure all entries have the required properties
      timeline = timeline.filter(event => 
        event.year && event.title && event.description
      ).slice(0, 6); // Limit to 6 entries
      
      if (timeline.length === 0) {
        console.error("No valid timeline entries after filtering");
        return generateFallbackTimeline(language);
      }
      
      return timeline;
    } catch (parseError: any) {
      console.error("Failed to parse OpenAI timeline response:", parseError.message);
      return generateFallbackTimeline(language);
    }
  } catch (error: any) {
    console.error("Error generating timeline:", error);
    return generateFallbackTimeline(language);
  }
}

function generateFallbackTimeline(language: string = 'en'): TimelineEvent[] {
  // Fallback timelines in different languages
  const timelines: Record<string, TimelineEvent[]> = {
    // English timeline
    'en': [
      {
        year: "Pre-1900s",
        title: "Early Foundations",
        description: "Initial concepts and theories"
      },
      {
        year: "1900-1950",
        title: "Early Development",
        description: "Fundamental discoveries"
      },
      {
        year: "1950-1970",
        title: "Expansion",
        description: "Broadening applications"
      },
      {
        year: "1970-1990",
        title: "Technological Advances",
        description: "Research breakthroughs"
      },
      {
        year: "1990-2010",
        title: "Digital Revolution",
        description: "Internet and global connectivity"
      },
      {
        year: "Present",
        title: "Current State",
        description: "Modern applications and research"
      }
    ],
    
    // Hindi timeline
    'hi': [
      {
        year: "1900 से पहले",
        title: "प्रारंभिक नींव",
        description: "मूल अवधारणाएँ और सिद्धांत"
      },
      {
        year: "1900-1950",
        title: "प्रारंभिक विकास",
        description: "मौलिक खोजें"
      },
      {
        year: "1950-1970",
        title: "विस्तार",
        description: "व्यापक अनुप्रयोग"
      },
      {
        year: "1970-1990",
        title: "तकनीकी प्रगति",
        description: "अनुसंधान में सफलता"
      },
      {
        year: "1990-2010",
        title: "डिजिटल क्रांति",
        description: "इंटरनेट और वैश्विक कनेक्टिविटी"
      },
      {
        year: "वर्तमान",
        title: "वर्तमान स्थिति",
        description: "आधुनिक अनुप्रयोग और अनुसंधान"
      }
    ],
    
    // Arabic timeline
    'ar': [
      {
        year: "ما قبل 1900",
        title: "الأسس المبكرة",
        description: "المفاهيم والنظريات الأولية"
      },
      {
        year: "1900-1950",
        title: "التطور المبكر",
        description: "الاكتشافات الأساسية"
      },
      {
        year: "1950-1970",
        title: "التوسع",
        description: "تطبيقات أوسع"
      },
      {
        year: "1970-1990",
        title: "التقدم التكنولوجي",
        description: "اختراقات البحث"
      },
      {
        year: "1990-2010",
        title: "الثورة الرقمية",
        description: "الإنترنت والاتصال العالمي"
      },
      {
        year: "الحاضر",
        title: "الوضع الحالي",
        description: "التطبيقات والأبحاث الحديثة"
      }
    ],
    
    // French timeline
    'fr': [
      {
        year: "Avant 1900",
        title: "Fondations Initiales",
        description: "Concepts et théories de base"
      },
      {
        year: "1900-1950",
        title: "Développement Précoce",
        description: "Découvertes fondamentales"
      },
      {
        year: "1950-1970",
        title: "Expansion",
        description: "Applications élargies"
      },
      {
        year: "1970-1990",
        title: "Avancées Technologiques",
        description: "Percées en recherche"
      },
      {
        year: "1990-2010",
        title: "Révolution Numérique",
        description: "Internet et connectivité mondiale"
      },
      {
        year: "Présent",
        title: "État Actuel",
        description: "Applications et recherche modernes"
      }
    ],
    
    // Gujarati timeline
    'gu': [
      {
        year: "1900 પહેલાં",
        title: "પ્રારંભિક પાયો",
        description: "મૂળભૂત વિચારો અને સિદ્ધાંતો"
      },
      {
        year: "1900-1950",
        title: "પ્રારંભિક વિકાસ",
        description: "મૂળભૂત શોધો"
      },
      {
        year: "1950-1970",
        title: "વિસ્તરણ",
        description: "વ્યાપક અરજીઓ"
      },
      {
        year: "1970-1990",
        title: "ટેકનોલોજીકલ પ્રગતિ",
        description: "સંશોધન સફળતાઓ"
      },
      {
        year: "1990-2010",
        title: "ડિજિટલ ક્રાંતિ",
        description: "ઇન્ટરનેટ અને વૈશ્વિક કનેક્ટિવિટી"
      },
      {
        year: "વર્તમાન",
        title: "વર્તમાન સ્થિતિ",
        description: "આધુનિક એપ્લિકેશન્સ અને સંશોધન"
      }
    ]
  };
  
  // Return the timeline for the specified language, or default to English if not available
  return timelines[language] || timelines['en'];
}

export interface AssistantSummary {
  enhancedFeedback: string;
  learningPath: string[];
  nextSteps: string[];
  resourceRecommendations: string[];
}

export async function generateAssistantSummary(
  subject: string,
  userInput: string,
  assessmentResult: TopicAnalysis,
  language: string = 'en'
): Promise<AssistantSummary> {
  try {
    console.log(`Generating AI Assistant summary for subject: ${subject} in language: ${language}`);
    
    // Verify API key is available
    if (!apiKey || apiKey.trim() === "") {
      console.error("OpenAI API key is missing or empty");
      throw new Error("OpenAI API key is not properly configured");
    }

    // Language mapping for better OpenAI understanding
    const languageMap: {[key: string]: string} = {
      'en': 'English',
      'hi': 'Hindi',
      'ar': 'Arabic',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'ja': 'Japanese',
      'zh': 'Chinese',
      'ru': 'Russian',
      'pt': 'Portuguese',
      'gu': 'Gujarati',
      'bn': 'Bengali',
      'ta': 'Tamil',
      'te': 'Telugu',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'mr': 'Marathi',
      'pa': 'Punjabi',
      'ur': 'Urdu'
    };
    
    const fullLanguageName = languageMap[language] || 'English';

    // Create language-specific prompts that generate content directly in the target language
    let systemPrompt = "";
    let userPrompt = "";

    // Create language-specific prompts for better accuracy
    if (language === 'hi') {
      // Enhanced Hindi prompts with strict language enforcement
      systemPrompt = `आप अयन्स्टाइन हैं, एक प्रेरणादायक शैक्षिक सहायक। आपको केवल हिंदी में जवाब देना है।

महत्वपूर्ण निर्देश:
- आपको केवल और केवल हिंदी भाषा में जवाब देना है
- कोई भी अंग्रेजी शब्द या वाक्य का उपयोग न करें
- कोई नंबरिंग (1., 2.) या फॉर्मेटिंग (**) न करें
- सिर्फ सरल हिंदी में प्रेरणादायक फीडबैक दें
- छात्र की प्रशंसा करें और सुधार के सुझाव दें`;

      userPrompt = `एक छात्र ने इतिहास विषय में परीक्षा दी है। उसका स्कोर ${assessmentResult.score} है।

वे इन विषयों में अच्छे हैं: ${assessmentResult.coveredTopics.map(t => t.name).join(', ')}
इन विषयों में सुधार की जरूरत है: ${assessmentResult.missingTopics.map(t => t.name).join(', ')}

केवल हिंदी में उत्साहजनक फीडबैक दें। बताएं कि वे क्या अच्छा करते हैं और कैसे सुधार सकते हैं।`;
    } else if (language === 'ar') {
      // Arabic prompts in Arabic
      systemPrompt = `أنت أينستين، مساعد تعليمي ملهم ولطيف. دورك هو تقديم ملاحظات إيجابية وبناءة للطلاب.

أسلوبك:
- تحدث دائماً بالعربية
- كن ملهماً وداعماً
- اعترف بنقاط القوة لدى الطالب
- قدم اقتراحات للتحسين
- لا ترقيم أو تنسيق **
- اكتب بفقرات طبيعية ومتدفقة`;

      userPrompt = `طالب أجرى تقييماً في ${subject}. درجته هي ${assessmentResult.score}.

المواضيع التي يعرفها جيداً: ${assessmentResult.coveredTopics.map(t => t.name).join(', ')}
المواضيع التي يحتاج لتعلمها: ${assessmentResult.missingTopics.map(t => t.name).join(', ')}

يرجى تقديم ملاحظات ملهمة بالعربية. أخبره بما يفعله جيداً وكيف يمكنه التحسن.`;
    } else if (language === 'es') {
      // Spanish prompts in Spanish
      systemPrompt = `Eres Aynstyn, un asistente educativo inspirador y amable. Tu papel es proporcionar comentarios positivos y constructivos a los estudiantes.

Tu estilo:
- Habla siempre en español
- Sé inspirador y solidario
- Reconoce las fortalezas del estudiante
- Proporciona sugerencias de mejora
- Sin numeración o formato **
- Escribe en párrafos naturales y fluidos`;

      userPrompt = `Un estudiante ha tomado una evaluación en ${subject}. Su puntuación es ${assessmentResult.score}.

Temas que conoce bien: ${assessmentResult.coveredTopics.map(t => t.name).join(', ')}
Temas para aprender: ${assessmentResult.missingTopics.map(t => t.name).join(', ')}

Por favor proporciona comentarios inspiradores en español. Dile qué hace bien y cómo puede mejorar.`;
    } else {
      // English and other languages
      systemPrompt = `You are Aynstyn, a kind and inspiring educational assistant. You must respond entirely in ${fullLanguageName}. Your role is to provide positive and constructive feedback to students.

Your style:
- Always speak in ${fullLanguageName}
- Be inspiring and supportive
- Acknowledge student strengths
- Provide improvement suggestions  
- No numbering or ** formatting
- Write in flowing, natural paragraphs`;

      userPrompt = `A student has taken an assessment in ${subject}. Their score is ${assessmentResult.score}.

Topics they know well: ${assessmentResult.coveredTopics.map(t => t.name).join(', ')}
Topics to learn: ${assessmentResult.missingTopics.map(t => t.name).join(', ')}

Please provide inspiring feedback in ${fullLanguageName}. Tell them what they do well and how they can improve.`;
    }

    // For Hindi, add an additional emphasis message to ensure compliance
    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user", 
        content: userPrompt
      }
    ];

    // Add extra enforcement for Hindi
    if (language === 'hi') {
      messages.push({
        role: "user",
        content: "कृपया याद रखें: आपको केवल हिंदी में जवाब देना है। कोई अंग्रेजी शब्द नहीं।"
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.2, // Lower temperature for more consistent language compliance
      max_tokens: 1000,
      frequency_penalty: 0.3,
      presence_penalty: 0.2
    });

    if (!response.choices || !response.choices[0] || !response.choices[0].message || !response.choices[0].message.content) {
      throw new Error("Invalid response from OpenAI");
    }

    let responseText = response.choices[0].message.content.trim();
    
    console.log(`Language detected: ${language}`);
    console.log(`Original response preview: ${responseText.substring(0, 200)}...`);

    // For Hindi, if we detect English content, force a translation
    if (language === 'hi' && /[a-zA-Z]/.test(responseText.substring(0, 100))) {
      console.log("🚨 Detected English content in Hindi response, forcing translation...");
      
      try {
        const translationResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "आप एक हिंदी अनुवादक हैं। दिए गए अंग्रेजी पाठ का सटीक हिंदी अनुवाद करें। कोई अतिरिक्त सामग्री न जोड़ें।"
            },
            {
              role: "user", 
              content: `इस अंग्रेजी पाठ का हिंदी में अनुवाद करें:\n\n${responseText}`
            }
          ],
          temperature: 0.1,
          max_tokens: 1000
        });

        if (translationResponse.choices?.[0]?.message?.content) {
          responseText = translationResponse.choices[0].message.content.trim();
          console.log("✅ Successfully translated to Hindi");
          console.log(`Translated response preview: ${responseText.substring(0, 200)}...`);
        }
      } catch (translationError) {
        console.error("❌ Translation failed:", translationError);
      }
    }

    // Clean up the response text to remove formatting
    let cleanedResponse = responseText;
    
    // Remove any ** formatting
    cleanedResponse = cleanedResponse.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Remove numbered list formatting like "1. ", "2. ", etc.
    cleanedResponse = cleanedResponse.replace(/^\d+\.\s*/gm, '');
    
    // Remove bullet points and dashes at start of lines
    cleanedResponse = cleanedResponse.replace(/^\s*[-•]\s*/gm, '');
    
    // Clean up extra whitespace and line breaks
    cleanedResponse = cleanedResponse.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

    console.log(`Aynstyn response generated successfully in ${language}`);

    return {
      enhancedFeedback: cleanedResponse,
      learningPath: [],
      nextSteps: [],
      resourceRecommendations: []
    };

  } catch (error: any) {
    console.error("Error generating assistant summary:", error);
    throw new Error(`Failed to generate assistant summary: ${error.message}`);
  }
}

export async function transcribeAudio(
  audioBase64: string
): Promise<string> {
  try {
    console.log("Received audio data, beginning transcription process");
    
    // Ensure we have the base64 part after the data URL prefix
    const base64Data = audioBase64.includes('base64,') 
      ? audioBase64.split('base64,')[1] 
      : audioBase64;
    
    // Convert base64 to Buffer
    const audioBuffer = Buffer.from(base64Data, 'base64');
    
    // Check buffer size to ensure we have audio data
    if (audioBuffer.length < 1000) {
      console.log("Audio data too small, likely empty recording");
      return "We couldn't detect any audio in your recording. Please try speaking louder or using the text input instead.";
    }
    
    console.log(`Received audio data: ${audioBuffer.length} bytes`);
    
    // Check if we have an OpenAI API key
    if (!apiKey) {
      console.log("No OpenAI API key found. Using simulated transcription.");
      return "This is a simulated transcription. Please provide an OpenAI API key to enable actual transcription.";
    }
    
    try {
      console.log("Processing audio with OpenAI Whisper API");
      
      // Create a temporary file with a random name using Buffer directly
      const formData = new FormData();
      
      // Add the audio file to the form data
      // Convert buffer to a Blob with the appropriate MIME type
      const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
      
      // The OpenAI API expects a file with an audio MIME type
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      
      // Send a direct request to the OpenAI API for transcription
      const response = await openai.audio.transcriptions.create({
        file: new File([audioBuffer], 'audio.webm', { type: 'audio/webm' }),
        model: "whisper-1",
      });
      
      if (!response || !response.text) {
        throw new Error("No transcription returned from OpenAI");
      }
      
      console.log("Successfully transcribed audio:", response.text.substring(0, 100) + (response.text.length > 100 ? '...' : ''));
      return response.text;
      
    } catch (transcriptionError: any) {
      console.error("Transcription error:", transcriptionError);
      
      // Provide a more helpful error message based on the error type
      if (transcriptionError.message && transcriptionError.message.includes('Unauthorized')) {
        return "Authorization failed. Please check your OpenAI API key.";
      } else if (transcriptionError.message && transcriptionError.message.includes('format')) {
        return "Audio format not supported. Please try recording again or use text input instead.";
      }
      
      return "We encountered an issue processing your audio. Please try using text input instead.";
    }
    
  } catch (error: any) {
    console.error("Error transcribing audio:", error);
    if (error.response) {
      console.error("OpenAI API error:", error.response.data);
    }
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}
