import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Row,
  Col,
  Avatar,
  Typography,
  Button,
  Badge,
  Input,
  Modal,
  Upload,
  message,
  Spin,
  notification,
} from "antd";
import {
  SearchOutlined,
  PaperClipOutlined,
  VideoCameraOutlined,
  MenuOutlined,
  CheckOutlined,
  AudioOutlined,
  ArrowLeftOutlined,
  CloseOutlined,
  FileOutlined,
  SoundOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import "./SimpleChatWindow.scss";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Slider from "react-slick";
import { useReverb } from "../../utils/useReverb";
import {
  fetchChatMessageDetailsAction,
  sendChatMessageAction,
} from "../../services/Store/Chat/action";
import MicRecorder from "../Community/Components/Chat/MicRecorder";

const { Text, Title } = Typography;

const StandaloneChatWindow = () => {
  const dispatch = useDispatch();
  const { id } = useParams();

  // Internal state management
  const [newMessage, setNewMessage] = useState("");
  const [currentWidth, setCurrentWidth] = useState(window.innerWidth);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLiveMeeting, setShowLiveMeeting] = useState(false);
  const [messages, setMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  // Search-related state
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // States for file upload
  const [fileModalVisible, setFileModalVisible] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // State for voice recording modal
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [audioTranscript, setAudioTranscript] = useState("");

  // States for infinite scrolling
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // State for image/media modal
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  // Constants for file upload
  const MAX_FILE_SIZE_MB = 20;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const oversizedFilesRef = useRef([]);
  const invalidFilesRef = useRef([]);
  const notificationShownRef = useRef(false);

  // Refs for measuring
  const chatContainerRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const resizeTimeout = useRef(null);
  const carouselRef = useRef(null);

  // Redux selectors
  const { chatMessageLoading } = useSelector((state) => state?.chat);
  const { userForEdit } = useSelector((state) => state?.usersmanagement);

  // Default active chat item - you can modify this based on your needs
  const activeItem = {
    id: id, // Use the ID from URL params
    // name: "Michael Anderson",
    // avatar: "https://media.istockphoto.com/id/1353379172/photo/cute-little-african-american-girl-looking-at-camera.jpg?s=170667a&w=is&k=20&c=JJ8IGmBvg9V_VGKdpDP6O0WR_H97epRjO-spB5-2V38=",
  };

  // Real-time message handling with useReverb
  const {
    data: messageData,
    error: messageDataError,
    isConnected: messageisConnected,
  } = useReverb(`chat.${activeItem?.id}`, ".chatMessagesUpdated");

  // Scroll to bottom helper function
  const scrollToBottom = useCallback(() => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
    }
  }, []);

  // Process real-time messages from useReverb
  useEffect(() => {
    if (messageData && messageData?.messages) {
      const msg = messageData.messages;
      const messageType = messageData.type; // Should be "chat" for standalone

      // For individual chats, check if either sender or receiver matches activeItem.id
      const isSenderMatch = msg?.sender_id === activeItem?.id;
      const isReceiverMatch = msg?.receiver_id === userForEdit?.user?.id;

      if (!isSenderMatch) {
        return;
      }

      if (!isReceiverMatch) {
        return;
      }

      // Process attachments
      let processedAttachments = [];
      if (msg.attachments && Array.isArray(msg.attachments)) {
        processedAttachments = msg.attachments;
      } else if (msg.attachment && typeof msg.attachment === "object") {
        processedAttachments = [msg.attachment];
      } else if (msg.attachments && typeof msg.attachments === "object") {
        processedAttachments = [msg.attachments];
      }

      // Add content_type to attachments if missing
      processedAttachments = processedAttachments.map((attachment) => {
        if (!attachment.content_type && attachment.file_name) {
          const extension = attachment.file_name
            .split(".")
            .pop()
            ?.toLowerCase();
          if (
            ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(
              extension
            )
          ) {
            attachment.content_type = "image";
          } else if (
            ["mp4", "mov", "avi", "wmv", "mkv", "flv", "webm"].includes(
              extension
            )
          ) {
            attachment.content_type = "video";
          } else if (
            ["mp3", "wav", "ogg", "webm", "aac", "m4a"].includes(extension)
          ) {
            attachment.content_type = "audio";
          } else {
            attachment.content_type = "application/octet-stream";
          }
        }
        return attachment;
      });

      const newFormattedMessage = {
        id: msg.id,
        text: msg.message,
        sender: msg.sender?.name,
        senderAvatar: msg.sender?.profile_photo_path,
        time: new Date(msg.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        created_at: msg.created_at,
        isSender: msg.is_sender === 1,
        isRead: msg.is_read === 1,
        attachments: processedAttachments,
      };

      // Check if we already have this message to avoid duplicates
      const isDuplicate = allMessages.some(
        (existingMsg) => existingMsg.id === newFormattedMessage.id
      );

      if (!isDuplicate) {
        setAllMessages((prevMessages) => [
          ...prevMessages,
          newFormattedMessage,
        ]);
        setMessages((prevMessages) => [...prevMessages, newFormattedMessage]);

        // Auto-scroll to bottom when new messages arrive
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    }
  }, [
    messageData,
    allMessages,
    scrollToBottom,
    activeItem?.id,
    userForEdit?.user?.id,
  ]);

  // Fetch messages function
  const fetchMessages = useCallback(
    (page = 1, shouldAppend = false) => {
      if (page === 1 && !shouldAppend) {
        setAllMessages([]);
        setMessages([]);
        setIsInitialLoading(true);
      }

      if (page > 1) {
        setIsLoadingMore(true);
      }

      const params = {
        page: page,
        per_page: 12,
        chat_user_id: activeItem?.id, // Always use chat_user_id for standalone chat
      };

      dispatch(fetchChatMessageDetailsAction(params))
        .then((response) => {
          if (response?.payload?.meta?.success) {
            const receivedMessages = response?.payload?.data?.messages;
            const pagination = response?.payload?.data?.pagination || {};

            const formattedMessages = receivedMessages?.map((msg) => ({
              id: msg.id,
              text: msg.message,
              sender: msg.sender?.name || msg.user?.name || "Unknown",
              senderAvatar: msg.user?.profile_photo_path,
              time: new Date(msg.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              created_at: msg.created_at,
              isSender: msg.is_sender === 1,
              isRead: msg.is_read === 1,
              attachments: msg.attachments,
            }));

            if (shouldAppend) {
              setAllMessages((prevMessages) => [
                ...prevMessages,
                ...formattedMessages,
              ]);
              setMessages((prevMessages) => [
                ...prevMessages,
                ...formattedMessages,
              ]);
            } else {
              setAllMessages(formattedMessages);
              setMessages(formattedMessages);

              if (page === 1) {
                setTimeout(() => {
                  scrollToBottom();
                }, 100);
              }
            }

            setHasMoreMessages(pagination.currentPage < pagination.totalPage);
          }

          setIsLoadingMore(false);
          setIsInitialLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching messages:", error);
          setIsLoadingMore(false);
          setIsInitialLoading(false);
        });
    },
    [dispatch, activeItem?.id, scrollToBottom]
  );

  // Load messages when component mounts
  useEffect(() => {
    if (activeItem?.id) {
      setCurrentPage(1);
      setHasMoreMessages(true);
      setIsInitialLoading(true);

      setTimeout(() => {
        fetchMessages(1, false);
      }, 50);
    }
  }, [activeItem?.id, fetchMessages]);

  // Handle scroll for infinite loading
  const handleMessagesScroll = useCallback(
    (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;

      if (scrollTop < scrollHeight * 0.2 && !isLoadingMore && hasMoreMessages) {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        fetchMessages(nextPage, true);
      }
    },
    [currentPage, fetchMessages, hasMoreMessages, isLoadingMore]
  );

  // Auto-scroll when messages change
  useEffect(() => {
    if (!isLoadingMore && allMessages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [allMessages, isLoadingMore, scrollToBottom]);

  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }

      resizeTimeout.current = setTimeout(() => {
        setCurrentWidth(window.innerWidth);
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // File upload functions
  const showFileUploadModal = () => {
    setSelectedFiles([]);
    setFileModalVisible(true);
  };

  const showVoiceRecordingModal = () => {
    setVoiceModalVisible(true);
  };

  const handleFileSelect = (info) => {
    const { fileList } = info;
    setSelectedFiles(fileList);
  };

  const handleFileModalCancel = () => {
    setFileModalVisible(false);
    setSelectedFiles([]);
  };

  const handleFileUploadConfirm = () => {
    if (selectedFiles.length === 0) {
      message.warning("Please select at least one file");
      return;
    }

    const oversizedFiles = selectedFiles.filter(
      (file) => file.size > MAX_FILE_SIZE_BYTES
    );

    if (oversizedFiles.length > 0) {
      const count = oversizedFiles?.length;
      notification.error({
        message: `${count} file${count > 1 ? "s" : ""} not uploaded`,
        description: `File${
          count > 1 ? "s" : ""
        } exceeded the ${MAX_FILE_SIZE_MB}MB size limit.`,
        duration: 5,
      });
      return;
    }

    setIsUploadingFiles(true);

    const formData = new FormData();
    formData.append("receiver_id", activeItem?.id); // Always use receiver_id for standalone chat

    selectedFiles?.forEach((file, index) => {
      formData.append(`files[${index}]`, file.originFileObj);
    });

    dispatch(sendChatMessageAction(formData))
      .then((response) => {
        if (response?.payload?.meta?.success === true) {
          const messageData = response?.payload?.data?.message;

          const formattedMessage = {
            id: messageData?.id,
            text: messageData?.message || "",
            sender: messageData?.sender?.name || "You",
            time: new Date(messageData?.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            created_at: messageData?.created_at,
            isSender: true,
            isRead: messageData?.is_read === 1,
            attachments: messageData?.attachments || [],
            isFile: true,
          };

          setMessages((prev) => [...prev, formattedMessage]);
          setAllMessages((prev) => [...prev, formattedMessage]);
          scrollToBottom();

          setFileModalVisible(false);
          setSelectedFiles([]);
        }
      })
      .catch((err) => {
        console.error("Upload error:", err);
      })
      .finally(() => {
        setIsUploadingFiles(false);
      });
  };

  // Voice recording functions
  const handleVoiceRecordingComplete = (audioBlob, transcript) => {
    if (audioBlob) {
      const audioFile = new File([audioBlob], "voice-message.webm", {
        type: audioBlob.type,
      });

      const audioFileObj = {
        originFileObj: audioFile,
        name: "voice-message.webm",
        type: audioBlob.type,
        uid: Date.now(),
        size: audioBlob.size,
      };

      setRecordedAudio(audioFileObj);
      setAudioTranscript(transcript);

      handleSendVoiceMessage(audioFileObj, transcript);
    }

    setVoiceModalVisible(false);
  };

  const handleSendVoiceMessage = (audioFileObj, transcript) => {
    const formData = new FormData();
    formData.append("receiver_id", activeItem?.id); // Always use receiver_id for standalone chat
    formData.append("files[0]", audioFileObj.originFileObj);

    const loadingMsg = message.loading("Sending voice message...", 0);

    dispatch(sendChatMessageAction(formData))
      .then((response) => {
        loadingMsg();

        if (response?.payload?.meta?.success === true) {
          const messageData = response?.payload?.data?.message;

          const formattedMessage = {
            id: messageData?.id,
            text: messageData?.message,
            sender: messageData?.sender?.name || "You",
            time: new Date(messageData?.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            created_at: messageData?.created_at,
            isSender: true,
            isRead: messageData?.is_read === 1,
            attachments: messageData?.attachments || [],
            isFile: true,
          };

          setMessages((prevMessages) => [...prevMessages, formattedMessage]);
          setAllMessages((prevMessages) => [...prevMessages, formattedMessage]);

          setTimeout(() => {
            scrollToBottom();
          }, 100);

          setRecordedAudio(null);
          setAudioTranscript("");
        }
      })
      .catch((error) => {
        loadingMsg();
        console.error("Error sending voice message:", error);
      });
  };

  // Send message function
  const handleSendMessage = (withFiles = false) => {
    if (
      (!newMessage.trim() && !withFiles) ||
      (withFiles && selectedFiles.length === 0)
    ) {
      return;
    }

    const formData = new FormData();

    if (newMessage.trim()) {
      formData.append("message", newMessage);
    }

    formData.append("receiver_id", activeItem?.id); // Always use receiver_id for standalone chat

    if (withFiles && selectedFiles.length > 0) {
      selectedFiles.forEach((file, index) => {
        formData.append(`files[${index}]`, file.originFileObj);
      });
    }

    dispatch(sendChatMessageAction(formData))
      .then((response) => {
        if (response?.payload?.meta?.success === true) {
          const messageData = response?.payload?.data?.message;

          const formattedMessage = {
            id: messageData?.id,
            text: messageData?.message || (withFiles ? "" : ""),
            sender: messageData?.sender?.name || "You",
            time: new Date(messageData?.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            created_at: messageData?.created_at,
            isSender: true,
            isRead: messageData?.is_read === 1,
            attachments: messageData?.attachments || [],
            isFile: withFiles,
          };

          setMessages((prevMessages) => [...prevMessages, formattedMessage]);
          setAllMessages((prevMessages) => [...prevMessages, formattedMessage]);

          setTimeout(() => {
            scrollToBottom();
          }, 100);

          setSelectedFiles([]);
        }

        setNewMessage("");
      })
      .catch((error) => {
        console.error("Error sending message:", error);
      });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !chatMessageLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Search functions
  const toggleSearch = () => {
    if (showSearch) {
      setSearchQuery("");
      setSearchResults([]);
      setIsSearching(false);
    }
    setShowSearch(!showSearch);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value === "") {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    if (value.length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 500);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const performSearch = (query) => {
    const lowercaseQuery = query.toLowerCase();

    const results = allMessages.filter(
      (message) =>
        (message.text && message.text.toLowerCase().includes(lowercaseQuery)) ||
        (message.sender &&
          message.sender.toLowerCase().includes(lowercaseQuery)) ||
        (message.attachments &&
          message.attachments.some(
            (attachment) =>
              attachment.file_name &&
              attachment.file_name.toLowerCase().includes(lowercaseQuery)
          ))
    );

    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter" && searchQuery.length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      performSearch(searchQuery);
    }
  };

  // Function to open media modal
  const openMediaModal = (attachments, index = 0) => {
    setSelectedMedia(attachments);
    setSelectedMediaIndex(index);
    setMediaModalVisible(true);

    // Wait for modal to open, then go to the selected slide
    setTimeout(() => {
      if (carouselRef.current) {
        carouselRef.current.slickGoTo(index);
      }
    }, 100);
  };

  // Function to render media grid
  const renderMediaGrid = (attachments) => {
    if (!attachments || attachments.length === 0) return null;

    // Filter to only show image and video attachments
    const mediaAttachments = attachments.filter(
      (attachment) =>
        attachment.content_type?.includes("image") ||
        attachment.content_type?.includes("video")
    );

    if (mediaAttachments.length === 0) return null;

    // If only one media item
    if (mediaAttachments.length === 1) {
      const media = mediaAttachments[0];
      const isVideo = media.content_type === "video";

      return (
        <div
          className="mt-2 cursor-pointer rounded-lg overflow-hidden bg-darkGray relative"
          onClick={() => openMediaModal(mediaAttachments, 0)}
        >
          {isVideo ? (
            <>
              <div className="w-full max-h-[200px] relative">
                {/* Video thumbnail */}
                <video
                  src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                    media.file_path
                  }`}
                  alt="Video attachment"
                  className="w-full max-h-[200px] object-cover"
                />
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={
                      <i
                        className="icon-play text-white pl-1"
                        style={{ fontSize: "28px" }}
                      />
                    }
                    className="flex justify-center items-center p-6 !px-6 borderbtn"
                  />
                </div>
              </div>
            </>
          ) : (
            <img
              src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${media.file_path}`}
              alt="Image attachment"
              className="w-full max-h-[200px] object-cover"
            />
          )}
        </div>
      );
    }

    // Multiple media items (display in a 2-column grid)
    return (
      <div className="mt-2">
        <div className="grid grid-cols-2 gap-2">
          {/* First row - two media items side by side */}
          {mediaAttachments.slice(0, 2).map((media, index) => {
            const isVideo = media.content_type === "video";

            return (
              <div
                key={media.id}
                className="cursor-pointer rounded-lg overflow-hidden bg-darkGray relative"
                onClick={() => openMediaModal(mediaAttachments, index)}
              >
                {isVideo ? (
                  <>
                    <video
                      src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                        media?.file_path
                      }`}
                      alt="Video attachment"
                      className="w-full max-h-[120px] object-cover"
                    />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        type="primary"
                        shape="circle"
                        size="small"
                        icon={
                          <i
                            className="icon-play text-white pl-1"
                            style={{ fontSize: "16px" }}
                          />
                        }
                        className="flex justify-center items-center p-3 !px-3 borderbtn"
                      />
                    </div>
                  </>
                ) : (
                  <img
                    src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                      media.file_path
                    }`}
                    alt={`Image ${index + 1}`}
                    className="w-full h-[120px] object-cover"
                  />
                )}
              </div>
            );
          })}

          {/* Second row - if there are more than 2 media items */}
          {mediaAttachments?.length > 2 &&
            mediaAttachments?.slice(2, 4)?.map((media, index) => {
              const isVideo = media.content_type === "video";

              return (
                <div
                  key={media.id}
                  className="cursor-pointer relative rounded-lg overflow-hidden bg-darkGray"
                  onClick={() => openMediaModal(mediaAttachments, index + 2)}
                >
                  {isVideo ? (
                    <>
                      <video
                        src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                          media.file_path
                        }`}
                        alt="Video attachment"
                        className="w-full max-h-[120px] object-cover"
                      />

                      {/* Play button overlay (if not the 4th item with +X) */}
                      {!(index === 1 && mediaAttachments?.length > 4) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Button
                            type="primary"
                            shape="circle"
                            size="small"
                            icon={
                              <i
                                className="icon-play text-white pl-1"
                                style={{ fontSize: "16px" }}
                              />
                            }
                            className="flex justify-center items-center p-3 !px-3 borderbtn"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <img
                      src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                        media.file_path
                      }`}
                      alt={`Image ${index + 3}`}
                      className="w-full h-[120px] object-cover"
                    />
                  )}

                  {/* If this is the 4th media item and there are more than 4 items */}
                  {index === 1 && mediaAttachments?.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                      <Text className="text-white text-lg font-bold">
                        +{mediaAttachments?.length - 4}
                      </Text>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  const getSliderSettings = () => {
    const baseSettings = {
      dots: true,
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
    };

    // If only one media item, disable infinite scroll and arrows
    if (selectedMedia && selectedMedia.length === 1) {
      return {
        ...baseSettings,
        infinite: false,
        arrows: false,
      };
    }

    // Default settings for multiple items
    return baseSettings;
  };

  // Function to render media carousel
  const renderMediaCarousel = () => {
    if (!selectedMedia || selectedMedia.length === 0) return null;

    return (
      <Slider {...getSliderSettings()} ref={carouselRef}>
        {selectedMedia.map((media, index) => (
          <div key={media.id || index} className="carousel-item-container">
            {media.content_type && media.content_type.includes("image") ? (
              <div className="flex items-center justify-center h-full">
                <img
                  src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                    media.file_path
                  }`}
                  alt={`Media ${index + 1}`}
                  className="max-h-[80vh] max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <video
                  src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                    media.file_path
                  }`}
                  controls
                  autoPlay
                  className="max-h-[80vh] max-w-full"
                />
              </div>
            )}
          </div>
        ))}
      </Slider>
    );
  };

  // Render file attachments
  const renderFileAttachments = (attachments, isSender = false) => {
    if (!attachments || attachments.length === 0) return null;

    // Filter to only show non-media attachments (not images or videos)
    const nonMediaAttachments = attachments.filter(
      (attachment) =>
        !attachment.content_type?.includes("image") &&
        !attachment.content_type?.includes("video")
    );

    if (nonMediaAttachments.length === 0) return null;

    return (
      <div className="simple-chat-attachments mt-2">
        {nonMediaAttachments.map((attachment, index) => (
          <div
            key={index}
            className={`p-2 sm:p-3 rounded-lg simple-chat-message-file ${
              isSender ? "bg-primary bg-opacity-30" : "bg-gray bg-opacity-70"
            } text-white flex items-center mb-2 cursor-pointer`}
            onClick={() => {
              window.open(
                `${import.meta.env.VITE_IMAGE_BASE_URL}/${
                  attachment.file_path
                }`,
                "_blank"
              );
            }}
          >
            <div
              className={`simple-chat-file-icon ${
                isSender ? "bg-[#cc5700]" : "bg-[#2c2c2c]"
              } sm:py-1 rounded-lg mr-2 p-2 flex-shrink-0 !text-white`}
            >
              {attachment.content_type &&
              attachment.content_type.includes("pdf") ? (
                <i className="icon-pdf text-xs sm:text-3xl"></i>
              ) : attachment.content_type &&
                attachment.content_type.includes("audio") ? (
                <SoundOutlined className="text-xs sm:text-3xl" />
              ) : (
                <FileOutlined className="text-xs sm:text-3xl" />
              )}
            </div>
            <div className="flex-1 overflow-hidden mr-2">
              <Text
                className="simple-chat-file-name block text-xs sm:text-sm truncate w-full"
                title={attachment.file_name || "Attachment"}
              >
                {attachment.file_name || "Attachment"}
              </Text>
              {attachment.file_size && (
                <Text className="simple-chat-file-size text-xs text-white whitespace-nowrap">
                  {Math.round(attachment.file_size / 1024)} KB
                </Text>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className="flex-grow flex overflow-hidden h-full simple-chat-container"
      ref={chatContainerRef}
    >
      <div
        className="simple-chat-window h-full flex flex-col overflow-hidden"
        style={{
          width: "100%",
          zIndex: 20,
        }}
      >
        {activeItem ? (
          <>
            {/* Chat Header - Sticky */}
            <Row className="simple-chat-header bg-liteGrayV1 px-2 sm:px-4 border-b-[1px] border-solid border-[#373737] items-center justify-between sticky top-0 z-10">
              {showSearch && currentWidth < 768 ? (
                <div className="w-full flex items-center">
                  <Button
                    type="text"
                    className="text-white mr-2 flex items-center p-1"
                    onClick={toggleSearch}
                    icon={<ArrowLeftOutlined />}
                  />
                  <div className="flex-grow bg-darkGray rounded-full px-3 mr-2">
                    <Input
                      size="large"
                      placeholder="Search in conversation..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onKeyPress={handleSearchKeyPress}
                      className="border-none bg-transparent text-white"
                      bordered={false}
                      autoFocus
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center flex-grow overflow-hidden">
                    <div className="simple-chat-header-info">
                      <Text className="simple-chat-header-title m-0 text-white text-lg font-semibold">
                        Chat
                      </Text>
                    </div>
                  </div>

                  <div className="simple-chat-header-actions flex items-center gap-1 sm:gap-2 md:gap-3 ml-1">
                    {!showSearch && (
                      <Button
                        type="text"
                        className="border-liteGray bg-gray flex items-center justify-center p-0"
                        shape="circle"
                        size={currentWidth < 375 ? "small" : "middle"}
                      >
                        <VideoCameraOutlined
                          className={
                            currentWidth < 375 ? "text-sm" : "text-base"
                          }
                        />
                      </Button>
                    )}

                    {showSearch && currentWidth >= 768 ? (
                      <>
                        <div className="flex relative items-center bg-darkGray rounded-full w-64">
                          <Input
                            size="middle"
                            prefix={
                              <SearchOutlined className="absolute left-4 top-1/2 text-xl transform -translate-y-1/2 text-grayText" />
                            }
                            placeholder="Search message"
                            style={{ width: "100%" }}
                            className="bg-[#171717] border-[#373737] rounded-full pl-10"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onKeyPress={handleSearchKeyPress}
                            autoFocus
                          />
                        </div>
                        <Button
                          type="text"
                          className="border-liteGray bg-gray flex items-center justify-center p-0"
                          shape="circle"
                          size={currentWidth < 375 ? "small" : "middle"}
                          onClick={toggleSearch}
                          icon={
                            <CloseOutlined
                              className={
                                currentWidth < 375 ? "text-sm" : "text-base"
                              }
                            />
                          }
                        />
                      </>
                    ) : (
                      <Button
                        type="text"
                        className="border-liteGray bg-gray flex items-center justify-center p-0"
                        shape="circle"
                        size={currentWidth < 375 ? "small" : "middle"}
                        onClick={toggleSearch}
                      >
                        {showSearch ? (
                          <CloseOutlined
                            className={
                              currentWidth < 375 ? "text-sm" : "text-base"
                            }
                          />
                        ) : (
                          <SearchOutlined
                            className={
                              currentWidth < 375 ? "text-sm" : "text-base"
                            }
                          />
                        )}
                      </Button>
                    )}

                    <Button
                      type="text"
                      className="border-liteGray bg-gray flex items-center justify-center p-0"
                      shape="circle"
                      size={currentWidth < 375 ? "small" : "middle"}
                    >
                      <i
                        className={
                          currentWidth < 375
                            ? "text-sm icon-more-options-vertical"
                            : "text-base icon-more-options-vertical"
                        }
                      />
                    </Button>
                  </div>
                </>
              )}
            </Row>

            {/* Chat Messages Area - Scrollable */}
            {isInitialLoading ? (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center">
                <Spin size="large" />
                <Text className="text-grayText mt-2">
                  Loading conversation...
                </Text>
              </div>
            ) : (
              <>
                <div
                  className="simple-chat-messages-area p-2 sm:p-4 overflow-y-auto"
                  ref={messagesAreaRef}
                  onScroll={handleMessagesScroll}
                  style={{
                    height:
                      currentWidth < 640
                        ? "calc(100vh - 289px)"
                        : "calc(100vh - 383px)",
                    overflowY: "auto",
                  }}
                >
                  {/* Loading indicator for older messages */}
                  {isLoadingMore && (
                    <div className="flex items-center justify-center py-2 mb-4">
                      <Spin size="large" />
                    </div>
                  )}

                  {/* Empty state */}
                  {allMessages?.length === 0 && !isLoadingMore && (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="bg-darkGray w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6">
                      <CommentOutlined
                          style={{ fontSize: "36px", color: "#FF6D00" }}
                        />                      </div>
                      <Title level={3} className="text-white">
                        Start a new conversation
                      </Title>
                      <Text className="text-grayText block mb-8">
                        Send a message to begin chatting
                      </Text>
                    </div>
                  )}

                  {/* Search indicator */}
                  {isSearching && (
                    <div className="flex justify-center items-center py-2 mb-4">
                      <Spin size="large" />
                      <Text className="text-grayText ml-2">
                        Searching messages...
                      </Text>
                    </div>
                  )}

                  {/* Display messages */}
                  {!isSearching && (
                    <>
                      <div className="simple-chat-date-indicator text-center mb-4">
                        <Text className="simple-chat-date-text text-xs text-grayText px-3 py-1 bg-gray rounded-full">
                          Today
                        </Text>
                      </div>

                      {(searchQuery ? searchResults : allMessages).map(
                        (message) => (
                          <div
                            key={message.id}
                            className={`simple-chat-message mb-4 ${
                              message.isSender
                                ? "simple-chat-message-sent"
                                : "simple-chat-message-received"
                            }`}
                          >
                            {message.isSender ? (
                              // Sent message
                              <div className="simple-chat-message-container">
                                {/* Handle attachments */}
                                {message?.attachments &&
                                  message?.attachments?.length > 0 && (
                                    <div>
                                      {/* Render media grid for image/video attachments */}
                                      {renderMediaGrid(message.attachments)}

                                      {/* Render non-media attachments */}
                                      {renderFileAttachments(
                                        message.attachments,
                                        true
                                      )}
                                    </div>
                                  )}

                                {/* Regular message text */}
                                {message.text && (
                                  <div className="simple-chat-message-bubble p-2 sm:p-3 rounded-lg simple-chat-message-sent-bubble bg-primary text-black">
                                    <Text className="simple-chat-message-text text-sm sm:text-base">
                                      {message.text}
                                    </Text>
                                  </div>
                                )}

                                <div className="flex justify-end items-center mt-1">
                                  <Text className="simple-chat-message-time text-xs text-grayText mr-1">
                                    {message.time}
                                  </Text>
                                  <Text className="text-xs text-grayText mr-1">
                                    •
                                  </Text>
                                  <Text className="text-xs text-grayText mr-1">
                                    You
                                  </Text>
                                  {message.isRead && (
                                    <div className="simple-chat-message-status">
                                      <div className="simple-chat-double-tick flex">
                                        <CheckOutlined className="text-xs text-primary mr-[-6px]" />
                                        <CheckOutlined className="text-xs text-primary" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              // Received message
                              <div className="flex">
                                <div className="flex-shrink-0 self-end mr-2">
                                  {message.senderAvatar ? (
                                    <Avatar
                                      size={34}
                                      src={`${
                                        import.meta.env.VITE_IMAGE_BASE_URL
                                      }/${message.senderAvatar}`}
                                      className="object-cover rounded-full"
                                    />
                                  ) : (
                                    <Avatar
                                      size={34}
                                      style={{
                                        backgroundColor: "#fde3cf",
                                        color: "#f56a00",
                                      }}
                                      className="object-cover rounded-full"
                                    >
                                      {message.sender?.[0] ||
                                        activeItem.name?.[0] ||
                                        "?"}
                                    </Avatar>
                                  )}
                                </div>

                                <div className="simple-chat-message-container">
                                  {/* Handle attachments */}
                                  {message?.attachments &&
                                    message?.attachments?.length > 0 && (
                                      <div>
                                        {/* Render media grid for image/video attachments */}
                                        {renderMediaGrid(message.attachments)}

                                        {/* Render non-media attachments */}
                                        {renderFileAttachments(
                                          message.attachments,
                                          false
                                        )}
                                      </div>
                                    )}

                                  {/* Regular message text */}
                                  {message.text && (
                                    <div className="simple-chat-message-bubble p-2 sm:p-3 rounded-lg simple-chat-message-received-bubble bg-gray text-white">
                                      <Text className="simple-chat-message-text text-sm sm:text-base">
                                        {message.text}
                                      </Text>
                                    </div>
                                  )}

                                  <div className="flex items-center mt-1">
                                    <Text className="text-xs text-grayText">
                                      {message.sender || activeItem.name}
                                    </Text>
                                    <Text className="text-xs text-grayText mx-1">
                                      •
                                    </Text>
                                    <Text className="simple-chat-message-time text-xs text-grayText">
                                      {message.time}
                                    </Text>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </>
                  )}

                  {/* No search results */}
                  {searchQuery &&
                    searchResults.length === 0 &&
                    !isSearching && (
                      <div className="flex flex-col items-center justify-center py-10 h-full">
                        <SearchOutlined
                          style={{ fontSize: "24px", color: "#666" }}
                        />
                        <Text className="text-grayText mt-2">
                          No messages found matching your search.
                        </Text>
                      </div>
                    )}
                </div>

                {/* Message Input Area - Sticky */}
                <div className="simple-chat-input-area pt-4 border-t-[1px] border-solid border-[#373737] sticky bottom-0 z-30">
                  <div className="simple-chat-input-wrapper relative bg-darkGray rounded-full">
                    <Input
                      size="large"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="simple-chat-input border-none bg-transparent"
                      bordered={false}
                      style={{
                        paddingLeft: "12px",
                        paddingRight: currentWidth < 640 ? "90px" : "200px",
                        height: currentWidth < 640 ? "42px" : "52px",
                      }}
                    />
                    <div className="simple-chat-input-actions absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-4">
                      <Button
                        type="text"
                        className="simple-chat-action-button text-grayText hover:text-primary p-1 text-lg md:text-2xl"
                        onClick={showFileUploadModal}
                        icon={<i className="icon-attachments" />}
                      />
                      <Button
                        type="text"
                        className="simple-chat-action-button text-grayText hover:text-primary p-1 text-lg md:text-2xl"
                        onClick={showVoiceRecordingModal}
                        icon={<i className="icon-voice" />}
                      />
                      <Button
                        type="primary"
                        size="middle"
                        onClick={handleSendMessage}
                        loading={chatMessageLoading}
                        className="simple-chat-send-button flex items-center justify-center ml-1 rounded-full text-sm md:text-base"
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <Text className="text-grayText">No chat selected</Text>
          </div>
        )}
      </div>

      {/* File Upload Modal */}
      <Modal
        title="Upload Files"
        centered
        destroyOnClose
        open={fileModalVisible}
        onCancel={handleFileModalCancel}
        footer={false}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
          />
        }
        width={600}
        className="modalWrapperBox"
        closable={!isUploadingFiles}
        maskClosable={!isUploadingFiles}
      >
        <div className="pt-5">
          <Upload.Dragger
            multiple
            fileList={selectedFiles}
            onChange={handleFileSelect}
            beforeUpload={(file, fileList) => {
              let shouldReject = false;

              if (file.size > MAX_FILE_SIZE_BYTES) {
                oversizedFilesRef.current.push(file.name);
                shouldReject = true;
              }

              const isImage = file.type?.startsWith("image/");
              const isVideo = file.type?.startsWith("video/");
              const isPdf = file.type?.includes("application/pdf");
              const isDoc =
                file.type?.includes("application/msword") ||
                file.type?.includes(
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                );
              const isExcel =
                file.type?.includes("application/vnd.ms-excel") ||
                file.type?.includes(
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );
              const isPpt =
                file.type?.includes("application/vnd.ms-powerpoint") ||
                file.type?.includes(
                  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                );
              const isText = file.type?.includes("text/plain");
              const isCsv =
                file.type?.includes("text/csv") ||
                file.type?.includes("application/csv") ||
                file.name?.toLowerCase().endsWith(".csv");

              const isAcceptedFileType =
                isImage ||
                isVideo ||
                isPdf ||
                isDoc ||
                isExcel ||
                isPpt ||
                isText ||
                isCsv;

              if (!isAcceptedFileType && file.size <= MAX_FILE_SIZE_BYTES) {
                invalidFilesRef.current.push(file.name);
                shouldReject = true;
              }

              const totalFilesAfterUpload =
                selectedFiles.length + fileList.length;
              if (totalFilesAfterUpload > 10) {
                notification.info({
                  message: "Info",
                  description: "You can only upload a maximum of 10 files!",
                });
                return Upload.LIST_IGNORE;
              }

              const currentIndex = fileList.indexOf(file);
              if (
                currentIndex === fileList.length - 1 &&
                !notificationShownRef.current
              ) {
                notificationShownRef.current = true;

                if (oversizedFilesRef.current.length > 0) {
                  const count = oversizedFilesRef.current.length;
                  notification.error({
                    message: `${count} file${
                      count > 1 ? "s" : ""
                    } not uploaded`,
                    description: `File${
                      count > 1 ? "s" : ""
                    } exceeded the ${MAX_FILE_SIZE_MB}MB size limit.`,
                    duration: 5,
                  });
                }

                if (invalidFilesRef.current.length > 0) {
                  const count = invalidFilesRef.current.length;
                  notification.error({
                    message: `${count} file${
                      count > 1 ? "s" : ""
                    } not uploaded`,
                    description: `Invalid file type${
                      count > 1 ? "s" : ""
                    }. Only images, videos, and documents are allowed.`,
                    duration: 5,
                  });
                }

                setTimeout(() => {
                  oversizedFilesRef.current = [];
                  invalidFilesRef.current = [];
                  notificationShownRef.current = false;
                }, 100);
              }

              return shouldReject ? Upload.LIST_IGNORE : false;
            }}
            onDrop={() => {
              oversizedFilesRef.current = [];
              invalidFilesRef.current = [];
              notificationShownRef.current = false;
            }}
            accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.wmv,.mkv,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
            className="bg-darkGray"
            style={{
              padding: "30px 0",
              border: "2px dashed #FF6D00",
              borderRadius: "8px",
            }}
            showUploadList={false}
            disabled={selectedFiles.length >= 10}
          >
            <div className="flex flex-col items-center">
              <div className="bg-primaryOpacity w-16 h-16 flex items-center justify-center !rounded-full mb-4">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary">
                  <i className="icon-upload text-2xl" />
                </div>
              </div>
              <Text className="text-white mb-1">
                Drag & drop or Choose files to upload
              </Text>
              <Text className="text-grayText text-xs">
                Supported formats: Images, Videos, Documents
              </Text>
              <Text className="text-grayText text-xs mt-1">
                Maximum 10 files, up to {MAX_FILE_SIZE_MB}MB each
              </Text>
              {selectedFiles.length > 0 && (
                <Text className="text-primary text-xs mt-2">
                  {selectedFiles.length} of 10 files selected
                </Text>
              )}
            </div>
          </Upload.Dragger>

          {/* File List */}
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-end mb-2">
                <Button
                  type="text"
                  size="small"
                  onClick={() => setSelectedFiles([])}
                  className="text-grayText hover:text-white"
                  disabled={isUploadingFiles}
                >
                  Clear All
                </Button>
              </div>

              <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {selectedFiles?.map((file, index) => {
                  const isImage = file.type?.startsWith("image/");
                  const isVideo = file.type?.startsWith("video/");
                  const isPdf = file.type?.includes("application/pdf");
                  const isDoc =
                    file.type?.includes("application/msword") ||
                    file.type?.includes(
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    );

                  let fileIcon;
                  if (isImage) {
                    fileIcon = <i className="icon-photo text-lg" />;
                  } else if (isVideo) {
                    fileIcon = <i className="icon-video text-lg" />;
                  } else if (isPdf) {
                    fileIcon = <i className="icon-pdf text-lg" />;
                  } else {
                    fileIcon = <i className="icon-documents text-lg" />;
                  }

                  return (
                    <div
                      key={`${file.uid || index}`}
                      className="flex items-center bg-darkGray rounded-lg p-3 mb-2 border border-[#373737]"
                    >
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-primaryOpacity mr-3">
                        {fileIcon}
                      </div>

                      <div className="flex-grow min-w-0 mr-2">
                        <Text
                          className="text-white text-sm block truncate w-full"
                          title={file.name}
                        >
                          {file.name}
                        </Text>
                        <Text className="text-grayText text-xs">
                          {(file.size / 1024).toFixed(1)} KB
                        </Text>
                      </div>
                      <Button
                        type="text"
                        size="small"
                        className={`text-grayText hover:text-white flex-shrink-0 ${
                          isUploadingFiles
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={() => {
                          if (!isUploadingFiles) {
                            const newFileList = [...selectedFiles];
                            newFileList.splice(index, 1);
                            setSelectedFiles(newFileList);
                          }
                        }}
                        disabled={isUploadingFiles}
                        icon={<i className="icon-close text-xs" />}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 border-t-2 border-solid border-[#373737] pt-6">
            <Row gutter={16}>
              <Col span={12}>
                <Button
                  block
                  size="large"
                  onClick={handleFileModalCancel}
                  disabled={isUploadingFiles}
                >
                  Cancel
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  block
                  type="primary"
                  size="large"
                  loading={isUploadingFiles}
                  onClick={handleFileUploadConfirm}
                  style={{ backgroundColor: "#FF6D00", borderColor: "#FF6D00" }}
                  disabled={selectedFiles.length === 0 || isUploadingFiles}
                >
                  {isUploadingFiles ? "Sending..." : "Send Files"}
                </Button>
              </Col>
            </Row>
          </div>
        </div>
      </Modal>

      {/* Voice Recording Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <span className="mr-2">
              <AudioOutlined />
            </span>
            <span>Voice Message</span>
          </div>
        }
        open={voiceModalVisible}
        onCancel={() => setVoiceModalVisible(false)}
        footer={null}
        width={600}
      >
        <MicRecorder
          setOpenVoiceModal={setVoiceModalVisible}
          onRecordingComplete={handleVoiceRecordingComplete}
        />
      </Modal>

      {/* Media viewing modal */}
      <Modal
        open={mediaModalVisible}
        onCancel={() => setMediaModalVisible(false)}
        footer={null}
        centered
        width="80%"
        className="media-modal"
        closeIcon={
          <Button
            shape="circle"
            icon={<CloseOutlined className="text-white" />}
            className="bg-[#333333] hover:bg-[#444444]"
          />
        }
        style={{ padding: 0, background: "#121212" }}
      >
        {renderMediaCarousel()}
      </Modal>
    </div>
  );
};

export default StandaloneChatWindow;
