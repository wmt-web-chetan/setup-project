import React, { useState, useRef, useEffect } from 'react';
import './SpeechToText.scss';

const SpeechToText = ({ 
  title = "Speech to Text Converter",
  onTranscriptChange = null
}) => {
  const [transcript, setTranscript] = useState({ final: '', interim: '' });
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const savedTranscriptRef = useRef('');
  
  // Setup recognition once and maintain reference
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";
      
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        // Use the current state, not the initial state reference
        let finalTranscript = transcript.final;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptText;
          } else {
            interimTranscript += transcriptText;
          }
        }
        
        const newTranscript = {
          final: finalTranscript,
          interim: interimTranscript
        };
        
        setTranscript(newTranscript);
        
        // Call the callback if provided
        if (onTranscriptChange) {
          onTranscriptChange(newTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'no-speech') {
          // Just log this error but don't stop listening
          // console.log("No speech detected, but continuing to listen");
          return;
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        console.log("Recognition service disconnected");
        // If still in listening state but recognition ended, restart it
        if (isListening) {
          console.log("Restarting recognition");
          recognitionRef.current.start();
        }
      };
    }
    
    // Cleanup on component unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // Empty dependency array to run only once on mount
  
  // Need to update the event handler when transcript changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        // Always use the latest transcript state
        let finalTranscript = transcript.final;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptText;
          } else {
            interimTranscript += transcriptText;
          }
        }
        
        const newTranscript = {
          final: finalTranscript,
          interim: interimTranscript
        };
        
        setTranscript(newTranscript);
        
        if (onTranscriptChange) {
          onTranscriptChange(newTranscript);
        }
      };
    }
  }, [transcript, onTranscriptChange]);


  const startConverting = () => {
    if ('webkitSpeechRecognition' in window) {
      if (recognitionRef.current) {
        // Reset transcript when starting new recording session
        setTranscript({ final: '', interim: '' });
        recognitionRef.current.start();
        setIsListening(true);
      }
    } else {
      const errorMessage = 'Your browser is not supported. Please download Google Chrome or update your Google Chrome!';
      setTranscript({
        final: errorMessage,
        interim: ''
      });
      
      if (onTranscriptChange) {
        onTranscriptChange({ final: errorMessage, interim: '' });
      }
    }
  };

  const stopConverting = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      
      // Save the final transcript to our saved variable
      savedTranscriptRef.current = transcript.final;
      
      console.log('Saved transcript:', savedTranscriptRef.current);
      
      if (onTranscriptChange) {
        onTranscriptChange({
          final: transcript.final,
          interim: '',
          saved: savedTranscriptRef.current
        });
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopConverting();
    } else {
      startConverting();
    }
  };

  return (
    <div className="speech-to-text-container">
      <h3>{title}</h3>
      <div className="transcript-result">
        {transcript.final}
        <span style={{ color: '#999' }}>{transcript.interim}</span>
      </div>
      <button 
        className={`mic-button ${isListening ? 'active' : ''}`} 
        onClick={toggleListening}
      >
        <i className="fa fa-microphone" aria-hidden="true"></i>
        {isListening ? ' Stop' : ' Start'} Recording
      </button>
      {savedTranscriptRef.current && !isListening && (
        <div className="saved-transcript">
          <h4>Saved Transcript:</h4>
          <p>{savedTranscriptRef.current}</p>
        </div>
      )}
    </div>
  );
};

export default SpeechToText;