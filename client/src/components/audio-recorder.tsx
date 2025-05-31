import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Pause, Play, StopCircle, RefreshCw, Check, Loader2 } from "lucide-react";

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: string, text: string | null) => void;
}

export default function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<"pre" | "recording" | "paused" | "post">("pre");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check browser compatibility on component mount
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Your browser doesn't support audio recording. Please use the text input instead.");
    }
    
    // Check if we're running in a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext;
    if (!isSecureContext) {
      setError("Audio recording requires HTTPS. Please use text input instead or deploy the app with HTTPS.");
    }
  }, []);
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Start recording
  const startRecording = async () => {
    try {
      // Clear any previous errors
      setError(null);
      
      // Check if we're running in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        setError("Audio recording requires HTTPS. Please use text input instead or deploy the app.");
        return; // Exit early
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        } 
      });
      
      // Try different audio formats based on browser support
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';  // Let browser choose default
          }
        }
      }
      console.log("Using audio format:", mimeType || "browser default");
      
      const options = { 
        mimeType,
        audioBitsPerSecond: 16000 // Lower bitrate for smaller file size
      };
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          console.log("Recorded chunk size:", e.data.size);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Check if we have any audio data
        if (audioChunksRef.current.length === 0) {
          console.error("No audio data recorded");
          setError("No audio was recorded. Please check your microphone permissions and try again.");
          return;
        }
        
        // Create audio blob with the appropriate type
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        
        // Check if the blob size is reasonable
        if (audioBlob.size < 100) {
          console.error("Audio blob too small:", audioBlob.size, "bytes");
          setError("The recorded audio is too short or empty. Please try speaking louder or longer.");
          return;
        }
        
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        console.log("Recording complete. Total size:", audioBlob.size, "bytes");
        
        // Convert blob to base64 for sending to server
        const reader = new FileReader();
        reader.onloadend = function() {
          const base64data = reader.result as string;
          // Pass null for text since we haven't transcribed yet
          onRecordingComplete(base64data, null);
        };
        reader.readAsDataURL(audioBlob);
        
        // Close the media tracks to stop the microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording with 1-second chunks
      mediaRecorder.start(1000); 
      setRecordingState("recording");
      setRecordingSeconds(0);
      
      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
      
    } catch (error: any) {
      console.error("Error accessing microphone:", error);
      setError(`Could not access microphone: ${error.message || 'Permission denied'}. Please check browser permissions.`);
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      
      // Pause timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      
      // Resume timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecordingState("post");
      
      // Stop timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  // Record again
  const recordAgain = () => {
    setRecordingState("pre");
    setAudioUrl(null);
    setTranscribedText(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  // Use the recording
  const useRecording = () => {
    // Check if we have a valid audio URL
    if (audioUrl) {
      // Get the audio blob from the URL
      fetch(audioUrl)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = function() {
            const base64data = reader.result as string;
            // Send to parent component with null text (server will handle transcription)
            onRecordingComplete(base64data, null);
          };
          reader.readAsDataURL(blob);
        })
        .catch(err => {
          console.error("Error processing audio:", err);
          setError("Failed to process your recording. Please try again or use the text input.");
        });
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center">
      {/* Display error message if there's an error */}
      {error && (
        <div className="w-full p-4 mb-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          <p className="font-medium mb-1">Audio Recording Not Available</p>
          <p className="text-sm">{error}</p>
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-amber-700 text-sm">
            <p>Note: Microphone access requires a secure connection (HTTPS). In Replit's preview environment, 
            this may not be available. Please use the text input tab instead, or click "Deploy" to use a secure HTTPS connection.</p>
          </div>
        </div>
      )}
      
      {/* Pre-recording state */}
      {recordingState === "pre" && !error && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Mic className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Record Your Explanation</h3>
          <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
            Speak clearly about what you understand about the subject. We'll convert your speech to text for analysis.
          </p>
          <Button 
            onClick={startRecording}
            className="bg-black text-white hover:bg-gray-800 rounded-full px-6 py-3 h-auto border border-gray-300"
          >
            <Mic className="mr-2 h-5 w-5" />
            Start Recording
          </Button>
        </div>
      )}
      
      {/* Recording state */}
      {recordingState === "recording" && (
        <div className="flex flex-col items-center">
          <div className="wave-container mb-4 h-16 flex items-center justify-center">
            <div className="recording-waves flex items-end h-full">
              {Array.from({ length: 20 }).map((_, i) => (
                <div 
                  key={i}
                  className="wave mx-px bg-primary-500 rounded-md" 
                  style={{ 
                    height: `${Math.max(20, Math.min(90, Math.random() * 60 + 20))}%`,
                    width: '3px',
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          </div>
          <div className="text-lg font-medium text-gray-800 mb-2">Recording...</div>
          <div className="text-sm text-gray-500 mb-6">{formatTime(recordingSeconds)}</div>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={pauseRecording}
              className="bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full px-4 py-2 h-auto"
            >
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
            <Button
              variant="outline"
              onClick={stopRecording}
              className="bg-red-100 text-red-600 hover:bg-red-200 rounded-full px-4 py-2 h-auto"
            >
              <StopCircle className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </div>
        </div>
      )}
      
      {/* Paused state */}
      {recordingState === "paused" && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Pause className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="text-lg font-medium text-gray-800 mb-2">Recording Paused</div>
          <div className="text-sm text-gray-500 mb-6">{formatTime(recordingSeconds)}</div>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={resumeRecording}
              className="bg-green-100 text-green-600 hover:bg-green-200 rounded-full px-4 py-2 h-auto"
            >
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
            <Button
              variant="outline"
              onClick={stopRecording}
              className="bg-red-100 text-red-600 hover:bg-red-200 rounded-full px-4 py-2 h-auto"
            >
              <StopCircle className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </div>
        </div>
      )}
      
      {/* Post-recording state */}
      {recordingState === "post" && (
        <div className="w-full">
          <div className="mb-4 w-full">
            <div className="bg-gray-100 rounded-lg p-4 mb-2">
              {isTranscribing ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 text-primary-500 animate-spin mr-2" />
                  <p className="text-gray-700">Transcribing audio...</p>
                </div>
              ) : transcribedText ? (
                <p className="text-gray-700">{transcribedText}</p>
              ) : (
                <p className="text-gray-700 italic">
                  Your recording is ready. Click "Use This Recording" to proceed with analysis.
                </p>
              )}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Recording: {formatTime(recordingSeconds)}</span>
              {audioUrl && (
                <audio controls className="h-8 w-48">
                  <source src={audioUrl} type="audio/webm" />
                  Your browser does not support the audio element.
                </audio>
              )}
            </div>
          </div>
          <div className="flex space-x-4 justify-center">
            <Button
              variant="outline"
              onClick={recordAgain}
              className="border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full px-4 py-2 h-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Record Again
            </Button>
            <Button
              onClick={useRecording}
              className="bg-black text-white hover:bg-gray-800 rounded-full px-4 py-2 h-auto border border-gray-300"
            >
              <Check className="mr-2 h-4 w-4" />
              Use This Recording
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}