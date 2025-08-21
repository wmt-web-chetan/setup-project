import React, { useEffect, useRef, useState } from "react";
import './MicRecorder.scss'
import { Button, Card, Col, Divider, Row, Typography } from "antd";
import { AudioOutlined, PauseOutlined, UndoOutlined } from "@ant-design/icons";

const MicRecorder = ({ setOpenVoiceModal }) => {
  const { Text, Title } = Typography;

  const waveformRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const dataArrayRef = useRef(null);
  const recognitionRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState({ final: '', interim: '' });
  const timerRef = useRef(null);
  const savedTranscriptRef = useRef('');

  // Helper function to draw rounded rectangles
  const drawRoundedRect = (ctx, x, y, width, height, radius) => {
    if (height < radius * 2) {
      // If height is too small for the specified radius, adjust accordingly
      radius = height / 2;
    }

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = transcript.final;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptText;
          } else {
            interimTranscript += transcriptText;
          }
        }

        setTranscript({
          final: finalTranscript,
          interim: interimTranscript
        });
      };

      recognitionRef.current.onerror = (event) => {
        // console.error('Speech recognition error', event.error);
        if (event.error === 'no-speech') {
          // console.log("No speech detected, but continuing to listen");
          return;
        }
      };

      recognitionRef.current.onend = () => {
        // If still in recording state but recognition ended and not paused, restart it
        if (isRecording && !isPaused) {
          recognitionRef.current.start();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Need to update the event handler when transcript changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = transcript.final;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptText;
          } else {
            interimTranscript += transcriptText;
          }
        }

        setTranscript({
          final: finalTranscript,
          interim: interimTranscript
        });
      };
    }
  }, [transcript]);

  // Update recognition restart logic when isPaused changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => {
        // console.log("Recognition service disconnected");
        // Only restart if we're recording and not paused
        if (isRecording && !isPaused) {
          // console.log("Restarting recognition");
          recognitionRef.current.start();
        }
      };
    }
  }, [isRecording, isPaused]);

  // Initialize audio context and analyzer
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions
    const resizeCanvas = () => {
      const container = waveformRef.current;
      if (container) {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Draw initial equalizer lines (flat/silent state)
    const lineCount = 200;
    const lineWidth = 4; // Line width
    const lineSpacing = 8; // Space between lines
    const initialHeight = 2; // Small height when silent
    const radius = 6; // Radius for rounded corners

    ctx.fillStyle = "#888";
    const centerY = canvas.height / 2;
    for (let i = 0; i < lineCount; i++) {
      const x = i * (lineWidth + lineSpacing);
      // Draw two small lines at center with rounded corners
      drawRoundedRect(ctx, x, centerY - initialHeight, lineWidth, initialHeight, radius); // Upper half
      drawRoundedRect(ctx, x, centerY, lineWidth, initialHeight, radius); // Lower half
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      stopRecording();
    };
  }, []);

  // Draw vertical bars visualization
  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, width, height);

    // Number of lines to display
    const lineCount = 200;

    // Calculate position for each line with spacing
    const lineWidth = 8; // Line width
    const lineSpacing = 8; // Space between lines
    const radius = 6; // Radius for rounded corners
    const sensitivityFactor = 1.0; // Lower value = less sensitive (0.0 - 1.0)

    // Draw vertical lines
    ctx.fillStyle = "#f97316"; // Orange color matching the audio player

    // Use time domain data for more waveform-like visualization
    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

    for (let i = 0; i < lineCount; i++) {
      // Get time domain data (128 is the middle/silence level)
      const sampleIndex = Math.floor(i * (dataArrayRef.current.length / lineCount));
      const value = dataArrayRef.current[sampleIndex];

      // Calculate line height based on how far the value is from the middle (128)
      // This creates a symmetrical effect, extending both up and down
      const deviation = Math.abs(value - 128);

      // Apply sensitivity reduction and smoothing
      const lineHeight = (deviation / 128) * (height / 2) * sensitivityFactor;

      // Position line at the center of the canvas
      const x = i * (lineWidth + lineSpacing);
      const centerY = height / 2;

      // Draw two lines with rounded corners - one going up and one going down from center
      drawRoundedRect(ctx, x, centerY - lineHeight, lineWidth, lineHeight, radius); // Upper half
      drawRoundedRect(ctx, x, centerY, lineWidth, lineHeight, radius); // Lower half
    }

    // Continue animation loop
    animationRef.current = requestAnimationFrame(drawWaveform);
  };

  // Start recording and speech recognition
  const startRecording = async () => {
    try {
      // Get user microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup audio context and analyzer
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;

      analyser.fftSize = 2048;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      source.connect(analyser);

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);

      // Start visualization
      drawWaveform();

      // Start speech recognition
      if (recognitionRef.current) {
        // Only reset transcript if this is a new recording, not a resume
        if (!transcript.final && !transcript.interim) {
          setTranscript({ final: '', interim: '' });
        }
        recognitionRef.current.start();
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsPaused(true);
  };

  // Resume recording
  const resumeRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }

    // Restart timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    // Restart visualization if we have access to the analyzer
    if (analyserRef.current && dataArrayRef.current) {
      drawWaveform();
    }

    setIsPaused(false);
  };

  // Stop recording and speech recognition
  const stopRecording = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();

      // Save the final transcript to our saved variable
      savedTranscriptRef.current = transcript.final;
    }

    setIsRecording(false);
    setIsPaused(false);

    // Reset canvas to flat equalizer bars
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw initial equalizer lines (flat/silent state)
      const lineCount = 200;
      const lineWidth = 4; // Line width
      const lineSpacing = 8; // Space between lines
      const initialHeight = 2; // Small height when silent
      const radius = 6; // Radius for rounded corners

      ctx.fillStyle = "#888";
      const centerY = canvas.height / 2;
      for (let i = 0; i < lineCount; i++) {
        const x = i * (lineWidth + lineSpacing);
        // Draw two small lines at center with rounded corners
        drawRoundedRect(ctx, x, centerY - initialHeight, lineWidth, initialHeight, radius); // Upper half
        drawRoundedRect(ctx, x, centerY, lineWidth, initialHeight, radius); // Lower half
      }
    }
  };

  // Toggle recording with pause functionality
  const toggleRecording = () => {
    if (isRecording) {
      if (!isPaused) {
        // Pause recording
        pauseRecording();
      } else {
        // Resume recording
        resumeRecording();
      }
    } else {
      // Start new recording
      startRecording();
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const handleSend = () => {
    setRecordingTime(0);
    setOpenVoiceModal(false);
  }

  const onClickReset = () => {
    setRecordingTime(0);
    setTranscript({ final: '', interim: '' });
    savedTranscriptRef.current = '';
  }

  return (
    <div className="">
      <div ref={waveformRef} className="flex-1 h-52 relative items-center">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Speech-to-Text Display */}
      <div className="transcript-result bg-gray-100 rounded p-3 mt-3 max-h-40 overflow-auto">
        {transcript.final}
        <span style={{ color: '#999' }}>{transcript.interim}</span>
      </div>

      <Divider className="mt-3" />

      <div className="">
        <Row align={'middle'}>
          <Col xs={8}>
            <Text className="font-semibold">
              {recordingTime > 0 ? formatTime(recordingTime) : "0:00"}
            </Text>
            <Text className="text-grayText font-semibold px-2">
              /
            </Text>
            <Text className="font-semibold">
              3:00
            </Text>
          </Col>
          <Col xs={8} className="flex justify-center items-center">
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={isRecording && !isPaused ? <PauseOutlined style={{ color: "white", fontSize: "42px", fontWeight:"bolder" }} /> : !isRecording ? null : <i className="icon-play text-white pl-1" style={{ fontSize: "42px" }} />}
              onClick={toggleRecording}
              className={`flex justify-center items-center p-8 !px-8 borderbtn ${isRecording ? "bg-primary !border-primary" : "bg-error hover:!bg-error hover:opacity-70 border-white"}`}
            />
          </Col>
          <Col xs={8} className="flex justify-end items-center">
            <Button
              shape="circle"
              className="flex justify-center items-center"
              icon={<UndoOutlined style={{ color: "white", marginTop: "4px" }} rotate={90} />}
              onClick={onClickReset}
            />
            <Button
              type="primary"
              size="large"
              onClick={handleSend}
              className="rounded-full flex items-center justify-center px-7 ml-5"
            >
              Send
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default MicRecorder;