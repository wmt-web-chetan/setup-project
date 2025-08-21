import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

const AudioPlayer = ({
  audioSrc,
  isSender = false,
  progressColor = "#ff6d00",
  waveColor = "#666666",
  buttonBgColor = "#ff6d00",
  buttonHoverColor = "#e55a00",
  buttonIconColor = "white",
  // New props for global audio control
  currentPlayingId,
  setCurrentPlayingId,
  audioId,
}) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: waveColor, // Unplayed portion color
        progressColor: progressColor, // Played portion color
        cursorColor: "transparent",
        barWidth: 3,
        barGap: 2,
        height: 40,
        responsive: true,
        barRadius: 2,
        normalize: true,
      });

      wavesurfer.current.load(audioSrc);

      wavesurfer.current.on("ready", () => {
        // Audio is ready to play
      });

      wavesurfer.current.on("play", () => {
        setPlaying(true);
        // Set this audio as currently playing
        if (setCurrentPlayingId) {
          setCurrentPlayingId(audioId);
        }
      });

      wavesurfer.current.on("pause", () => {
        setPlaying(false);
        // Clear currently playing if this was the playing audio
        if (setCurrentPlayingId && currentPlayingId === audioId) {
          setCurrentPlayingId(null);
        }
      });

      wavesurfer.current.on("finish", () => {
        setPlaying(false);
        // Clear currently playing when audio finishes
        if (setCurrentPlayingId && currentPlayingId === audioId) {
          setCurrentPlayingId(null);
        }
      });

      return () => {
        if (wavesurfer.current) {
          wavesurfer.current.destroy();
        }
      };
    }
  }, [audioSrc, progressColor, waveColor, audioId, setCurrentPlayingId]);

  // Effect to pause this audio when another audio starts playing
  useEffect(() => {
    if (currentPlayingId && currentPlayingId !== audioId && playing) {
      // Another audio is playing, pause this one
      if (wavesurfer.current && wavesurfer.current.isPlaying()) {
        wavesurfer.current.pause();
      }
    }
  }, [currentPlayingId, audioId, playing]);

  const togglePlay = () => {
    if (wavesurfer.current) {
      if (playing) {
        // Pause current audio
        wavesurfer.current.pause();
      } else {
        // Play current audio (this will trigger the play event and update global state)
        wavesurfer.current.play();
      }
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-transparent rounded-lg w-full max-w-sm">
      {/* Round Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="transition-colors duration-200 p-2 rounded-full flex items-center justify-center min-w-[40px] min-h-[40px] shadow-lg"
        style={{
          backgroundColor: buttonBgColor,
        }}
        onMouseEnter={(e) =>
          (e.target.style.backgroundColor = buttonHoverColor)
        }
        onMouseLeave={(e) => (e.target.style.backgroundColor = buttonBgColor)}
      >
        {playing ? (
          // Pause icon
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: buttonIconColor }}
          >
            <rect x="6" y="4" width="4" height="16" fill="currentColor" />
            <rect x="14" y="4" width="4" height="16" fill="currentColor" />
          </svg>
        ) : (
          // Play icon using icon-play class
          <i
            className="icon-play text-base "
            style={{ color: buttonIconColor }}
          />
        )}
      </button>

      {/* Waveform */}
      <div ref={waveformRef} className="flex-1 min-w-0"></div>
    </div>
  );
};

export default AudioPlayer;
