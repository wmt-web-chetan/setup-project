import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Button, Card, Col, Divider, Row, Typography } from "antd";
import { AudioOutlined, PauseOutlined, UndoOutlined } from "@ant-design/icons";

const MicRecorder = forwardRef(({ setOpenVoiceModal, onRecordingComplete }, ref) => {
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
  const audioChunksRef = useRef([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState({ final: "", interim: "" });
  const timerRef = useRef(null);
  const savedTranscriptRef = useRef("");

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    stopRecording: () => {
      stopRecording();
    },
    stopRecordingWithoutSending: () => {
      stopRecordingWithoutSending();
    },
    resetTimer: () => {
      resetTimer();
    },
    isRecording: isRecording
  }));

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

  // Comprehensive cleanup function
  const cleanupResources = () => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // console.log("Speech recognition already stopped:", e);
      }
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // console.log("MediaRecorder already stopped:", e);
      }
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Reset canvas to flat equalizer bars
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw initial equalizer lines (flat/silent state)
      const lineCount = 200;
      const lineWidth = 4;
      const lineSpacing = 8;
      const initialHeight = 2;
      const radius = 6;

      ctx.fillStyle = "#888";
      const centerY = canvas.height / 2;
      for (let i = 0; i < lineCount; i++) {
        const x = i * (lineWidth + lineSpacing);
        drawRoundedRect(
          ctx,
          x,
          centerY - initialHeight,
          lineWidth,
          initialHeight,
          radius
        );
        drawRoundedRect(ctx, x, centerY, lineWidth, initialHeight, radius);
      }
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = "";
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
          interim: interimTranscript,
        });
      };

      recognitionRef.current.onerror = (event) => {
        if (event.error === "no-speech") {
          return;
        }
      };

      recognitionRef.current.onend = () => {
        // If still in recording state but recognition ended and not paused, restart it
        if (isRecording && !isPaused) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            // console.log("Could not restart recognition:", e);
          }
        }
      };
    }

    // Cleanup on unmount
    return () => {
      cleanupResources();
    };
  }, []);

  // Need to update the event handler when transcript changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = "";
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
          interim: interimTranscript,
        });
      };
    }
  }, [transcript]);

  // Update recognition restart logic when isPaused changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => {
        // Only restart if we're recording and not paused
        if (isRecording && !isPaused) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            // console.log("Could not restart recognition:", e);
          }
        }
      };
    }
  }, [isRecording, isPaused]);

  // Initialize audio context and analyzer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
    const lineWidth = 4;
    const lineSpacing = 8;
    const initialHeight = 2;
    const radius = 6;

    ctx.fillStyle = "#888";
    const centerY = canvas.height / 2;
    for (let i = 0; i < lineCount; i++) {
      const x = i * (lineWidth + lineSpacing);
      drawRoundedRect(
        ctx,
        x,
        centerY - initialHeight,
        lineWidth,
        initialHeight,
        radius
      );
      drawRoundedRect(ctx, x, centerY, lineWidth, initialHeight, radius);
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  // Draw vertical bars visualization
  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current || !dataArrayRef.current)
      return;

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
    const lineWidth = 8;
    const lineSpacing = 8;
    const radius = 6;
    const sensitivityFactor = 1.0;

    // Draw vertical lines
    ctx.fillStyle = "#f97316";

    // Use time domain data for more waveform-like visualization
    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

    for (let i = 0; i < lineCount; i++) {
      const sampleIndex = Math.floor(
        i * (dataArrayRef.current.length / lineCount)
      );
      const value = dataArrayRef.current[sampleIndex];

      const deviation = Math.abs(value - 128);
      const lineHeight = (deviation / 128) * (height / 2) * sensitivityFactor;

      const x = i * (lineWidth + lineSpacing);
      const centerY = height / 2;

      drawRoundedRect(
        ctx,
        x,
        centerY - lineHeight,
        lineWidth,
        lineHeight,
        radius
      );
      drawRoundedRect(ctx, x, centerY, lineWidth, lineHeight, radius);
    }

    // Continue animation loop
    animationRef.current = requestAnimationFrame(drawWaveform);
  };

  // Start recording and speech recognition
  const startRecording = async () => {
    try {
      // Reset audio chunks
      audioChunksRef.current = [];

      // Get user microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup audio context and analyzer
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
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

      // Set up data handling
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);

      // Start visualization
      drawWaveform();

      // Start speech recognition
      if (recognitionRef.current) {
        if (!transcript.final && !transcript.interim) {
          setTranscript({ final: "", interim: "" });
        }
        recognitionRef.current.start();
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
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

    // Pause media recorder if supported
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      try {
        if (mediaRecorderRef.current.pause) {
          mediaRecorderRef.current.pause();
        }
      } catch (e) {
        // console.log("MediaRecorder pause not supported:", e);
      }
    }

    setIsPaused(true);
  };

  // Resume recording
  const resumeRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }

    // Resume media recorder if supported
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      try {
        if (mediaRecorderRef.current.resume) {
          mediaRecorderRef.current.resume();
        }
      } catch (e) {
        // console.log("MediaRecorder resume not supported:", e);
      }
    }

    // Restart timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    // Restart visualization if we have access to the analyzer
    if (analyserRef.current && dataArrayRef.current) {
      drawWaveform();
    }

    setIsPaused(false);
  };

  // Stop recording and speech recognition (WITH sending)
  const stopRecording = () => {
    // First check if we're actually recording
    if (!mediaRecorderRef.current || !isRecording) {
      cleanupResources();
      setIsRecording(false);
      setIsPaused(false);
      return;
    }

    // Stop media recorder and get recording
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();

      // Add event listener for when recording is stopped
      mediaRecorderRef.current.onstop = () => {
        // Create audio blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // Save the final transcript
        const finalTranscript = transcript.final || "";
        savedTranscriptRef.current = finalTranscript;

        // Call callback if provided
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob, finalTranscript);
        }
      };
    }

    // Cleanup all resources
    cleanupResources();
    setIsRecording(false);
    setIsPaused(false);
  };

  // Stop recording WITHOUT sending the message (for modal close)
  const stopRecordingWithoutSending = () => {
    // First check if we're actually recording
    if (!mediaRecorderRef.current || !isRecording) {
      cleanupResources();
      setIsRecording(false);
      setIsPaused(false);
      return;
    }

    // Stop media recorder WITHOUT calling the callback
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      // Remove any existing onstop handlers to prevent callback
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }

    // Cleanup all resources
    cleanupResources();
    setIsRecording(false);
    setIsPaused(false);
    
    // Reset all states
    setRecordingTime(0);
    setTranscript({ final: "", interim: "" });
    savedTranscriptRef.current = "";
    audioChunksRef.current = [];
  };

  // Reset timer function
  const resetTimer = () => {
    setRecordingTime(0);
    setTranscript({ final: "", interim: "" });
    savedTranscriptRef.current = "";
    audioChunksRef.current = [];
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
    // Stop recording if still recording
    if (isRecording) {
      stopRecording();
    } else {
      // If we have a recorded audio, just close the modal
      setOpenVoiceModal(false);
    }

    // Reset timer to zero after sending
    setRecordingTime(0);

    // Reset transcript as well
    setTranscript({ final: "", interim: "" });
    savedTranscriptRef.current = "";
  };

  const onClickReset = () => {
    // Stop current recording WITHOUT sending the message
    if (isRecording) {
      stopRecordingWithoutSending(); // Changed from stopRecording()
    } else {
      // If not recording, just reset the timer and states
      setRecordingTime(0);
      setTranscript({ final: "", interim: "" });
      savedTranscriptRef.current = "";
      audioChunksRef.current = [];
    }
  };

  return (
    <div className="">
      <div ref={waveformRef} className="flex-1 h-52 relative items-center">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      <Divider className="mt-3" />

      <div className="">
        <Row align={"middle"}>
          <Col xs={8}>
            <Text className="font-semibold">
              {recordingTime > 0 ? formatTime(recordingTime) : "0:00"}
            </Text>
          </Col>
          <Col xs={8} className="flex justify-center items-center">
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={
                isRecording && !isPaused ? (
                  <PauseOutlined
                    style={{
                      color: "white",
                      fontSize: "42px",
                      fontWeight: "bolder",
                    }}
                  />
                ) : !isRecording ? null : (
                  <i
                    className="icon-play text-white pl-1"
                    style={{ fontSize: "42px" }}
                  />
                )
              }
              onClick={toggleRecording}
              className={`flex justify-center items-center p-8 !px-8 borderbtn ${
                isRecording
                  ? "bg-primary !border-primary"
                  : "bg-error hover:!bg-error hover:opacity-70 border-white"
              }`}
            />
          </Col>
          <Col xs={8} className="flex justify-end items-center">
            <Button
              shape="circle"
              className="flex justify-center items-center"
              icon={
                <UndoOutlined
                  style={{ color: "white", marginTop: "4px" }}
                  rotate={90}
                />
              }
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
});

// Add display name for better debugging
MicRecorder.displayName = 'MicRecorder';

export default MicRecorder;