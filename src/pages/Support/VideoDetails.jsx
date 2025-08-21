"use client";
import { Button, Col, Empty, Input, Row, Spin, Typography } from "antd";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Card, Tooltip } from "antd";
import {
  PlayCircleFilled,
  PauseCircleFilled,
  FileTextOutlined,
} from "@ant-design/icons";
import "./VideoDetails.scss";
import { useDispatch } from "react-redux";
import { fetchVideoById } from "../../services/Store/Support/action";

const VideoDetails = () => {
  const { Text, Title } = Typography;
  const playerRef = useRef(null);
  const iframeRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [vimeoPlayer, setVimeoPlayer] = useState(null);

  const [videoData, setVideoData] = useState();

  const dispatch = useDispatch()

  const { id } = useParams();

  console.log('videoData', videoData)

  // Load Vimeo Player SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (id) {
      dispatch(fetchVideoById(id)).then((res) => {
        console.log('Video Detail Response', res)
        setVideoData(res?.payload?.data)
      }).catch((e) => {
        console.log('Error', e)
      })
    }
  }, [])

  // Initialize Vimeo Player when iframe loads
  useEffect(() => {
    if (videoData?.video?.player_embed_url && window.Vimeo && iframeRef.current) {
      const player = new window.Vimeo.Player(iframeRef.current);
      setVimeoPlayer(player);

      // Set up event listeners
      player.on('play', () => {
        setIsPlaying(true);
      });

      player.on('pause', () => {
        setIsPlaying(false);
      });

      player.on('timeupdate', (data) => {
        setCurrentTime(data.seconds);
        setProgress((data.seconds / data.duration) * 100);
      });

      player.getDuration().then((duration) => {
        setDuration(duration);
      });

      return () => {
        player.destroy();
      };
    }
  }, [videoData]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Generate markers from video chapters or use default
  const markers = videoData?.video?.chapters && videoData.video.chapters.length > 0
    ? videoData.video.chapters.map(chapter => ({
      time: chapter.timecode,
      label: chapter.title,
      description: chapter.title,
    }))
    : [];

  // Generate video timelines from video chapters or use default
  const videoTimelines = videoData?.video?.chapters && videoData.video.chapters.length > 0
    ? videoData.video.chapters.map((chapter, index) => {
      const nextChapter = videoData.video.chapters[index + 1];
      const chapterDuration = nextChapter ?
        nextChapter.timecode - chapter.timecode :
        (videoData.video.duration || 0) - chapter.timecode;

      return {
        id: chapter.uri.split('/').pop(),
        title: chapter.title,
        duration: formatTime(chapterDuration),
        startTime: chapter.timecode,
      };
    })
    : [];

  // Seek to specific time using Vimeo Player
  const seekToTime = async (time) => {
    if (!vimeoPlayer) return;

    try {
      await vimeoPlayer.setCurrentTime(time);
      await vimeoPlayer.play();
      console.log(`Seeked to ${time} seconds`);
    } catch (error) {
      console.error('Error seeking to time:', error);
    }
  };

  // Toggle play/pause using Vimeo Player
  const togglePlayPause = async () => {
    if (!vimeoPlayer) return;

    try {
      if (isPlaying) {
        await vimeoPlayer.pause();
      } else {
        await vimeoPlayer.play();
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };



  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollableContentStyle = {
    overflowY: "auto",
    scrollbarWidth: "none", // Firefox
    msOverflowStyle: "none", // IE and Edge
  };

  return (
    <Row
      className="bg-darkGray px-header-wrapper h-full w-full"
      gutter={[0, 24]}
    >
      <Col
        span={24}
        className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mt-6"
      >
        <div className="flex justify-center items-center">
          <Title
            level={2}
            className="text-white !m-0 h-auto flex flex-wrap sm:flex-nowrap justify-center items-center text-base sm:text-lg md:text-xl"
          >
            <Link
              to="/dashboard"
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Dashboard
              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Link
              to="/support"
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Support
              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Link
              to={`/support/${videoData?.category?.id}`}
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                {videoData?.category?.name}
              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Text className="text-white text-lg sm:text-2xl">
              {videoData?.video?.name}
            </Text>
          </Title>
        </div>
      </Col>

      <Row
        className="w-full justify-center"
        gutter={[
          { xs: 0, md: 16 },
          { xs: 0, md: 16 },
        ]}
      >
        <Col xs={24} md={14} xl={16} className="mb-4">
          <div className="w-full">
            <div
              className="rounded-3xl border overflow-hidden bg-gray border-solid border-liteGray w-full relative p-6 px-7"
              style={{
                height: containerHeight,
              }}
            >
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-gray pb-4">
                <h1 className="text-xl font-bold text-white mb-2">
                  {videoData?.video?.name}
                </h1>
                <p className="text-[#6D6D6D]">
                  {videoData?.video?.created_time ?
                    new Date(videoData.video.created_time).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) :
                    ""
                  }
                </p>
              </div>

              {/* Scrollable Content */}
              <div
                className="overflow-y-auto"
                style={{
                  height: `calc(${containerHeight} - 110px)`, // Adjust for header height
                }}
              >
                {/* Vimeo Video Player Container */}
                <div className="relative w-auto mt-3 bg-black rounded-3xl h-auto overflow-hidden mb-6">
                  {videoData?.video?.player_embed_url ? (
                    <iframe
                      ref={iframeRef}
                      src={videoData.video.player_embed_url}
                      className="w-full aspect-video rounded-3xl"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                      title={videoData.video.name}
                    />
                  ) : (
                    <div className="w-full aspect-video bg-gray-800 rounded-3xl flex items-center justify-center">
                      <Spin size="large" />
                      {/* <p className="text-white">Loading video...</p> */}
                    </div>
                  )}
                </div>

                {/* Video Controls Info */}
                {/* {vimeoPlayer && (
                  <div className="mb-4 p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex justify-between items-center text-white text-sm">
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={togglePlayPause}
                          type="text"
                          className="text-white hover:bg-white/20 text-xl"
                          icon={
                            isPlaying ? (
                              <PauseCircleFilled />
                            ) : (
                              <PlayCircleFilled />
                            )
                          }
                        />
                        <span>
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>
                      <div className="w-1/2">
                        <div className="relative h-1 bg-white/20 rounded-full">
                          <div
                            className="absolute top-0 left-0 h-full bg-red-500 rounded-full transition-all duration-150"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )} */}

                {/* video description */}
                <div className="flex flex-col">
                  {
                    videoData?.video?.description ?
                      <div className="mb-3">
                        <div className="text-[#6D6D6D] text-lg">Descriptions:</div>
                        <Text>{videoData?.video?.description}</Text>
                      </div>
                      : null
                  }
                  <div className="mb-3">
                    <span className="text-[#6D6D6D]">Website:</span>&nbsp;
                    <Link
                      to={videoData?.video?.link}
                      className="underline"
                      target="_blank"
                    >
                      {videoData?.video?.link}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Col>

        <Col xs={24} md={10} xl={8} className=" mb-4">
          <div className="w-full">
            <div
              className="rounded-3xl border hide-scrollbar bg-gray border-solid border-liteGray w-full relative p-0   "
              style={{
                height: isMobile ? "auto" : containerHeight,
                ...scrollableContentStyle,
              }}
            >
              <div className="mb-8">
                <div className="flex items-center gap-2  p-6">
                  <h3 className="text-xl font-semibold text-white">
                    Video Content
                  </h3>
                </div>
                {
                  videoTimelines?.length > 0 ?
                    <div className="space-y-0">
                      {videoTimelines.map((timeline, index) => {
                        const nextTimelineStartTime =
                          videoTimelines[index + 1]?.startTime ?? duration;

                        const isActive =
                          currentTime >= timeline.startTime &&
                          currentTime < nextTimelineStartTime;

                        return (
                          <div
                            key={timeline.id}
                            className={`flex justify-between items-center gap-3 p-4 border-t-[1px] border-liteGray cursor-pointer hover:bg-gray-600/30 transition-all duration-200 ${isActive
                              ? "bg-white/10 border-darkgray"
                              : "bg-gray-700/30 border-gray-600"
                              }`}
                            onClick={() => {
                              console.log('Seeking to time:', timeline.startTime);
                              seekToTime(timeline.startTime);
                            }}
                          >
                            <div className="flex gap-2 items-center">
                              <i
                                className="icon-play text-primary text-xl cursor-pointer hover:scale-110 transition-transform"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Play icon clicked, seeking to time:', timeline.startTime);
                                  seekToTime(timeline.startTime);
                                }}
                              />
                              <div className="text-md text-white">
                                {timeline.title}
                              </div>
                            </div>
                            <div className="text-md text-white bg-[#373737] p-1 px-2 rounded-md">
                              {formatTime(timeline.startTime)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    :
                    <div className="h-[50vh] flex justify-center items-center">
                      <Empty description="No Video Content" />
                    </div>

                }
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Row>
  );
};

export default VideoDetails;