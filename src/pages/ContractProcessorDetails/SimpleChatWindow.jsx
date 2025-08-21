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
  Progress,
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
  DownloadOutlined,
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
import { getStorage } from "../../utils/commonfunction";
import AudioPlayer from "../../components/AuthLayout/AUdioPlayer";

const { Text, Title } = Typography;

// Add constants for file size limit
const MAX_FILE_SIZE_MB = 50; // Maximum file size in MB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert to bytes
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks - S3 multipart upload minimum requirement

// Helper function to format date labels
const formatDateLabel = (dateString) => {
  if (!dateString) return "Today";

  const messageDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time to compare dates only
  const messageDateOnly = new Date(
    messageDate.getFullYear(),
    messageDate.getMonth(),
    messageDate.getDate()
  );
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const yesterdayOnly = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate()
  );

  if (messageDateOnly.getTime() === todayOnly.getTime()) {
    return "Today";
  } else if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
    return "Yesterday";
  } else {
    // Format as "Mon, Jan 15" for other dates
    return messageDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
};

// Helper component for rendering message text with better formatting
const MessageText = ({ text, className = "" }) => {
  if (!text) return null;

  // URL detection regex
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Handle line breaks and URL detection
  const formatText = (text) => {
    return text.split("\n").map((line, lineIndex) => (
      <React.Fragment key={lineIndex}>
        {line.split(urlRegex).map((part, partIndex) => {
          if (urlRegex.test(part)) {
            return (
              <a
                key={partIndex}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline break-all"
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </a>
            );
          }
          return part;
        })}
        {lineIndex < text.split("\n").length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <Text className={`simple-chat-message-text ${className}`}>
      {formatText(text)}
    </Text>
  );
};

// Function to download a file using the download API endpoint
const downloadFile = (url, fileName, e) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (!url) {
    console.error("No file URL provided for download");
    return;
  }

  // Construct full URL if needed
  const isInternalUrl =
    url.startsWith(import.meta.env.VITE_IMAGE_BASE_URL) ||
    !url.startsWith("http");

  const fullUrl =
    isInternalUrl && !url.startsWith("http")
      ? `${import.meta.env.VITE_IMAGE_BASE_URL}/${url}`
      : url;

  // Get user token for authorization
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = user?.token;

  // Create download URL with the API endpoint
  const apiBaseUrl = import.meta.env.VITE_API_URL || window.location.origin;
  const downloadUrl = `${apiBaseUrl}/download-file?url=${encodeURIComponent(
    fullUrl
  )}`;

  // Create link element for download
  const link = document.createElement("a");
  link.style.display = "none";

  if (token) {
    // If token exists, we need to use fetch to add authorization header
    fetch(downloadUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.blob();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      })
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        link.href = blobUrl;
        link.download = fileName || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => {
        console.error("Error downloading file:", error);
        // Fallback to direct download
        link.href = fullUrl;
        link.download = fileName || "download";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  } else {
    // If no token, try direct API call
    link.href = downloadUrl;
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

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
  const micRecorderRef = useRef(null);

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
  const [currentPlayingAudioId, setCurrentPlayingAudioId] = useState(null);

  // Add refs for tracking oversized files
  const oversizedFilesRef = useRef([]);
  const invalidFilesRef = useRef([]);
  const notificationShownRef = useRef(false);
  const mediaVideoRefs = useRef([]);

  // New chunking states
  const [chunkingProgress, setChunkingProgress] = useState({
    isChunking: false,
    currentFile: 0,
    totalFiles: 0,
    currentFileName: "",
    chunkProgress: 0,
    overallProgress: 0,
  });

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


  // Helper function to get auth headers - matches your Redux API calls
  const getAuthHeaders = () => {
    let token = userForEdit?.token; // This will use static token first


    const headers = {
      "X-Requested-With": "XMLHttpRequest",
      Accept: "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn("No authentication token found!");
    }

    return headers;
  };

  // Helper function to get API base URL
  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_URL;
  };

  // Function to upload small files directly to S3
  const uploadSmallFileToS3 = async (file) => {
    try {
      

      // Get presigned URL from FAST Laravel endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(
        `${getApiBaseUrl()}/chat/generate-presigned-url`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);


      if (!response.ok) {
        clearTimeout(timeoutId);
        const errorText = await response.text();
        console.error("❌ Failed to get presigned URL:", errorText);
        throw new Error(`Failed to get presigned URL: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to get presigned URL");
      }

      const { presignedUrl, fileKey, fileName, fileType } = result;

      // Upload directly to S3
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });


      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("❌ Failed to upload to S3:", errorText);
        throw new Error(`Failed to upload to S3: ${uploadResponse.statusText}`);
      }


      // Use CloudFront URL if provided, otherwise use S3 URL
      const finalUrl = result.finalUrl || presignedUrl.split("?")[0];

      return {
        key: fileKey,
        name: fileName,
        type: fileType,
        url: finalUrl, // ✅ Use CloudFront URL
        size: file.size,
      };
    } catch (error) {
      console.error("❌ Small file upload failed:", error);
      if (error.name === "AbortError") {
        throw new Error("Upload request timed out. Please try again.");
      }
      throw error;
    }
  };

  // Function to upload large files - Using FAST Laravel endpoints
  const uploadLargeFileToS3 = async (file, onProgress) => {
    try {
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      const totalParts = Math.ceil(file.size / chunkSize);

      

      // Step 1: Initialize multipart upload (FAST Laravel endpoint - 1 S3 call)
      const initController = new AbortController();
      const initTimeoutId = setTimeout(() => initController.abort(), 10000); // 10 second timeout

      const initResponse = await fetch(
        `${getApiBaseUrl()}/chat/initialize-multipart-upload`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
          }),
          signal: initController.signal,
        }
      );

      clearTimeout(initTimeoutId);


      if (!initResponse.ok) {
        clearTimeout(initTimeoutId);
        const errorText = await initResponse.text();
        console.error("❌ Failed to initialize multipart upload:", errorText);
        throw new Error(
          `Failed to initialize multipart upload: ${initResponse.statusText}`
        );
      }

      const initResult = await initResponse.json();

      if (!initResult.success) {
        throw new Error(
          initResult.message || "Failed to initialize multipart upload"
        );
      }

      const { uploadId, fileKey, fileName, fileType } = initResult;

      // Step 2: Get presigned URLs for all parts (FAST Laravel endpoint - no S3 calls)
      const urlsController = new AbortController();
      const urlsTimeoutId = setTimeout(() => urlsController.abort(), 10000); // 10 second timeout

      const urlsResponse = await fetch(
        `${getApiBaseUrl()}/chat/generate-upload-part-urls`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uploadId: uploadId,
            fileKey: fileKey,
            totalParts: totalParts,
          }),
          signal: urlsController.signal,
        }
      );

      clearTimeout(urlsTimeoutId);


      if (!urlsResponse.ok) {
        clearTimeout(urlsTimeoutId);
        const errorText = await urlsResponse.text();
        console.error("❌ Failed to get upload part URLs:", errorText);
        throw new Error(
          `Failed to get upload part URLs: ${urlsResponse.statusText}`
        );
      }

      const urlsResult = await urlsResponse.json();

      if (!urlsResult.success) {
        throw new Error(urlsResult.message || "Failed to get upload part URLs");
      }

      const { presignedUrls } = urlsResult;

      // Step 3: Upload each part directly to S3 using presigned URLs
      const uploadedParts = [];

      for (let i = 0; i < presignedUrls.length; i++) {
        const { partNumber, url } = presignedUrls[i];
        const start = (partNumber - 1) * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        

        const partResponse = await fetch(url, {
          method: "PUT",
          body: chunk,
          headers: {
            "Content-Type": file.type,
          },
        });

        

        if (!partResponse.ok) {
          const errorText = await partResponse.text();
          console.error(`❌ Failed to upload part ${partNumber}:`, errorText);
          throw new Error(
            `Failed to upload part ${partNumber}: ${partResponse.statusText}`
          );
        }

        const etag = partResponse.headers.get("ETag");

        uploadedParts.push({
          PartNumber: partNumber,
          ETag: etag,
        });

        // Report progress
        if (onProgress) {
          const progress = Math.round((partNumber / totalParts) * 100);
          onProgress({
            currentChunk: partNumber,
            totalChunks: totalParts,
            progress: progress,
            fileName: file.name,
          });
        }
      }

      // Step 4: Complete multipart upload (FAST Laravel endpoint - 1 S3 call)
      const completeController = new AbortController();
      const completeTimeoutId = setTimeout(
        () => completeController.abort(),
        15000
      ); // 15 second timeout for completion

      const completeResponse = await fetch(
        `${getApiBaseUrl()}/chat/complete-multipart-upload`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uploadId: uploadId,
            fileKey: fileKey,
            parts: uploadedParts,
            fileType: file.type,
            fileSize: file.size,
          }),
          signal: completeController.signal,
        }
      );

      clearTimeout(completeTimeoutId);


      if (!completeResponse.ok) {
        clearTimeout(completeTimeoutId);
        const errorText = await completeResponse.text();
        console.error("❌ Failed to complete multipart upload:", errorText);
        throw new Error(
          `Failed to complete multipart upload: ${completeResponse.statusText}`
        );
      }

      const completeResult = await completeResponse.json();

      if (!completeResult.success) {
        throw new Error(
          completeResult.message || "Failed to complete multipart upload"
        );
      }

      return completeResult.file;
    } catch (error) {
      console.error("❌ Large file upload failed:", error);
      if (error.name === "AbortError") {
        throw new Error("Upload request timed out. Please try again.");
      }
      throw error;
    }
  };

  // Function to process files - upload directly to S3 using presigned URLs
  const processLargeFiles = async (files) => {
    const chunkThreshold = 5 * 1024 * 1024; // 5MB
    const largeFiles = files.filter((file) => {
      const actualFile = file.originFileObj || file;
      return actualFile.size > chunkThreshold;
    });

    const smallFiles = files.filter((file) => {
      const actualFile = file.originFileObj || file;
      return actualFile.size <= chunkThreshold;
    });

    

    if (largeFiles.length === 0 && smallFiles.length === 0) {
      return { uploadedFiles: [] };
    }

    // Start upload process
    setChunkingProgress({
      isChunking: true,
      currentFile: 0,
      totalFiles: largeFiles.length + smallFiles.length,
      currentFileName: "",
      chunkProgress: 0,
      overallProgress: 0,
    });

    const uploadedFiles = [];

    try {
      let fileIndex = 0;

      // Upload small files first
      for (const file of smallFiles) {
        const actualFile = file.originFileObj || file;

        

        setChunkingProgress((prev) => ({
          ...prev,
          currentFile: fileIndex + 1,
          currentFileName: actualFile.name,
          chunkProgress: 0,
        }));

        const uploadedFile = await uploadSmallFileToS3(actualFile);
        uploadedFiles.push(uploadedFile);

        fileIndex++;
        const overallProgress = Math.round(
          (fileIndex / (largeFiles.length + smallFiles.length)) * 100
        );
        setChunkingProgress((prev) => ({
          ...prev,
          chunkProgress: 100,
          overallProgress,
        }));

      }

      // Upload large files
      for (const file of largeFiles) {
        const actualFile = file.originFileObj || file;

        

        setChunkingProgress((prev) => ({
          ...prev,
          currentFile: fileIndex + 1,
          currentFileName: actualFile.name,
          chunkProgress: 0,
        }));

        const uploadedFile = await uploadLargeFileToS3(
          actualFile,
          (progress) => {
            setChunkingProgress((prev) => ({
              ...prev,
              chunkProgress: progress.progress,
              overallProgress: Math.round(
                ((fileIndex + progress.progress / 100) /
                  (largeFiles.length + smallFiles.length)) *
                  100
              ),
            }));
          }
        );

        uploadedFiles.push(uploadedFile);
        fileIndex++;

      }

      setChunkingProgress((prev) => ({
        ...prev,
        isChunking: false,
      }));

      return { uploadedFiles };
    } catch (error) {
      console.error("❌ File processing failed:", error);
      setChunkingProgress((prev) => ({
        ...prev,
        isChunking: false,
      }));
      throw error;
    }
  };

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
  const handleVoiceModalCancel = () => {
    // Stop recording WITHOUT sending the message
    if (
      micRecorderRef.current &&
      micRecorderRef.current.stopRecordingWithoutSending
    ) {
      micRecorderRef.current.stopRecordingWithoutSending();
    }
    setVoiceModalVisible(false);
  };

  const showVoiceRecordingModal = () => {
    setVoiceModalVisible(true);
    // Reset timer when modal opens
    setTimeout(() => {
      if (micRecorderRef.current && micRecorderRef.current.resetTimer) {
        micRecorderRef.current.resetTimer();
      }
    }, 100); // Small delay to ensure component is mounted
  };

  const pauseAllMediaVideos = useCallback(() => {
    mediaVideoRefs.current.forEach((video) => {
      if (video) {
        video.pause();
        video.currentTime = 0; // Reset to beginning
      }
    });
  }, []);
  const handleMediaModalClose = useCallback(() => {
    pauseAllMediaVideos();
    setMediaModalVisible(false);
  }, [pauseAllMediaVideos]);
  const handleFileSelect = (info) => {
    const { fileList } = info;
    setSelectedFiles(fileList);
  };
  useEffect(() => {
    return () => {
      pauseAllMediaVideos();
    };
  }, [pauseAllMediaVideos]);
  const handleFileModalCancel = () => {
    setFileModalVisible(false);
    setSelectedFiles([]);
    // Reset chunking progress
    setChunkingProgress({
      isChunking: false,
      currentFile: 0,
      totalFiles: 0,
      currentFileName: "",
      chunkProgress: 0,
      overallProgress: 0,
    });
  };

  const handleFileUploadConfirm = async () => {
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

    try {
      // Process files - upload directly to S3
      const { uploadedFiles } = await processLargeFiles(selectedFiles);

      const formData = new FormData();
      formData.append("receiver_id", activeItem?.id); // Always use receiver_id for standalone chat

      // Add uploaded file references to FormData
      if (uploadedFiles.length > 0) {
       
        formData.append("s3_files", JSON.stringify(uploadedFiles));
      } 

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
          notification.error({
            message: "Upload failed",
            description: "Failed to send files. Please try again.",
            duration: 5,
          });
        })
        .finally(() => {
          setIsUploadingFiles(false);
          setChunkingProgress({
            isChunking: false,
            currentFile: 0,
            totalFiles: 0,
            currentFileName: "",
            chunkProgress: 0,
            overallProgress: 0,
          });
        });
    } catch (error) {
      setIsUploadingFiles(false);
      console.error("Chunking failed:", error);
      notification.error({
        message: "Upload failed",
        description: "Failed to process large files. Please try again.",
        duration: 5,
      });
      setChunkingProgress({
        isChunking: false,
        currentFile: 0,
        totalFiles: 0,
        currentFileName: "",
        chunkProgress: 0,
        overallProgress: 0,
      });
    }
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

  const handleSendVoiceMessage = async (audioFileObj, transcript) => {
    const loadingMsg = message.loading("Sending voice message...", 0);

    try {
      // Process the audio file for S3 upload
      const { uploadedFiles } = await processLargeFiles([audioFileObj]);

      const formData = new FormData();
      formData.append("receiver_id", activeItem?.id); // Always use receiver_id for standalone chat

      // Add uploaded file references to FormData
      if (uploadedFiles.length > 0) {
        
        formData.append("s3_files", JSON.stringify(uploadedFiles));
      }

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
            setAllMessages((prevMessages) => [
              ...prevMessages,
              formattedMessage,
            ]);

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
          notification.error({
            message: "Failed to send voice message",
            description: "Please try again.",
            duration: 5,
          });
        });
    } catch (error) {
      loadingMsg();
      console.error("Voice message processing failed:", error);
      notification.error({
        message: "Failed to process voice message",
        description: "Please try again.",
        duration: 5,
      });
    }
  };

  // Send message function
  const handleSendMessage = (withFiles = false) => {
  
    // Create FormData
    const formData = new FormData();

    // Check if we have content to send
    const hasMessage = newMessage.trim().length > 0;
    const hasFiles = withFiles && selectedFiles.length > 0;


    // Early return if no content
    if (!hasMessage && !hasFiles) {
      return;
    }

    // Prevent multiple sends while loading
    if (chatMessageLoading) {
      return;
    }


    // Add message if exists
    if (hasMessage) {
      formData.append("message", newMessage.trim());
    }

    // Add receiver ID
    formData.append("receiver_id", activeItem?.id);

    // Add files if exists
    if (hasFiles) {
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

        // Clear message after successful send
        setNewMessage("");
      })
      .catch((error) => {
        console.error("❌ Error sending message:", error);
      });
  };
  const handleSendButtonClick = () => {
    handleSendMessage();
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
      afterChange: (index) => {
        setSelectedMediaIndex(index); // Update the selected media index when slide changes
      },
      beforeChange: (current, next) => {
        pauseAllMediaVideos();
      },
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
      <div style={{ height: "70vh", width: "100%" }}>
        <Slider {...getSliderSettings()} ref={carouselRef}>
          {selectedMedia.map((media, index) => (
            <div key={media.id || index} className="carousel-item-container">
              {media.content_type && media.content_type.includes("image") ? (
                <div
                  className="flex items-center justify-center"
                  style={{ height: "70vh", width: "100%" }}
                >
                  <img
                    src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                      media.file_path
                    }`}
                    alt={`Media ${index + 1}`}
                    className="max-h-full max-w-full object-contain"
                    style={{ maxHeight: "65vh", maxWidth: "85vw" }}
                  />
                </div>
              ) : (
                <div
                  className="flex items-center justify-center"
                  style={{ height: "70vh", width: "100%" }}
                >
                  <video
                    src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                      media.file_path
                    }`}
                    ref={(el) => (mediaVideoRefs.current[index] = el)}
                    controls
                    autoPlay
                    className="max-h-full max-w-full"
                    style={{ maxHeight: "65vh", maxWidth: "85vw" }}
                  />
                </div>
              )}
            </div>
          ))}
        </Slider>
      </div>
    );
  };
  const renderAudioAttachments = (attachments, isSender = false) => {
    if (!attachments || attachments.length === 0) return null;

    // Filter to only show audio attachments
    const audioAttachments = attachments.filter((attachment) =>
      attachment.content_type?.includes("audio")
    );

    if (audioAttachments.length === 0) return null;

    return (
      <div className="audio-attachments mt-2">
        {audioAttachments.map((attachment, index) => {
          // Create unique ID for each audio attachment
          const audioId = `audio_${
            attachment.id || attachment.file_path
          }_${index}`;

          return (
            <div
              key={index}
              className={`rounded-lg mb-2 ${
                isSender
                  ? "bg-primary bg-opacity-10 !rounded-br-sm"
                  : "bg-liteGray bg-opacity-30 !rounded-bl-sm"
              }`}
              style={{
                maxWidth: "320px",
                minWidth: "280px",
                borderRadius: "12px",
              }}
            >
              {/* Use your custom AudioPlayer component with global audio control */}
              <AudioPlayer
                audioSrc={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                  attachment.file_path
                }`}
                isSender={isSender}
                progressColor={isSender ? "#ffffff" : "#ff6d00"} // White for sender, Orange for receiver
                waveColor="#666666" // Gray for unplayed portion (same for both)
                buttonBgColor={isSender ? "#ffffff" : "#ff6d00"} // White for sender, Orange for receiver
                buttonHoverColor={isSender ? "#f0f0f0" : "#e55a00"} // Light gray hover for sender, darker orange for receiver
                buttonIconColor={isSender ? "#ff6d00" : "#ffffff"} // Orange icon for sender, White icon for receiver
                // New props for global audio control
                currentPlayingId={currentPlayingAudioId}
                setCurrentPlayingId={setCurrentPlayingAudioId}
                audioId={audioId}
              />
            </div>
          );
        })}
      </div>
    );
  };
  // Render file attachments
  const renderFileAttachments = (attachments, isSender = false) => {
    if (!attachments || attachments.length === 0) return null;

    // Filter to only show non-media attachments (not images, videos, OR audio)
    const nonMediaAttachments = attachments.filter(
      (attachment) =>
        !attachment.content_type?.includes("image") &&
        !attachment.content_type?.includes("video") &&
        !attachment.content_type?.includes("audio") // ✅ Added this line to exclude audio
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
              ) : (
                <FileOutlined className="text-xs sm:text-3xl" />
              )}
              {/* ❌ REMOVED: Audio handling since it's now handled by renderAudioAttachments */}
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
                    {/* {!showSearch && (
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
                    )} */}

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

                    {/* <Button
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
                    </Button> */}
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
                        />{" "}
                      </div>
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
                      {/* Show date indicator only if there are messages */}
                      {allMessages?.length > 0 && (
                        <div className="simple-chat-date-indicator text-center mb-4">
                          <Text className="simple-chat-date-text text-xs text-grayText px-3 py-1 bg-gray rounded-full">
                            {formatDateLabel(allMessages?.[0]?.created_at)}
                          </Text>
                        </div>
                      )}

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

                                      {/* ✅ Render audio attachments with AudioPlayer */}
                                      {renderAudioAttachments(
                                        message.attachments,
                                        message.isSender
                                      )}

                                      {/* Render non-media attachments (excluding audio) */}
                                      {renderFileAttachments(
                                        message.attachments,
                                        message.isSender
                                      )}
                                    </div>
                                  )}

                                {/* Regular message text */}
                                {message.text && (
                                  <div className="simple-chat-message-bubble p-2 sm:p-3 rounded-lg simple-chat-message-sent-bubble bg-primary text-black">
                                    <MessageText
                                      text={message.text}
                                      className="text-sm sm:text-base"
                                    />
                                  </div>
                                )}

                                <div className="flex justify-end items-center mt-1">
                                  <Text className="simple-chat-message-time text-xs text-grayText mr-1">
                                    {message.time}
                                  </Text>
                                  {/* <Text className="text-xs text-grayText mr-1">
                                    •
                                  </Text>
                                  <Text className="text-xs text-grayText mr-1">
                                    You
                                  </Text> */}
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
                              <div className="flex w-full">
                                {/* <div className="flex-shrink-0 self-end mr-2">
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
                                </div> */}

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
                                        {renderAudioAttachments(
                                          message.attachments,
                                          false
                                        )}
                                      </div>
                                    )}

                                  {/* Regular message text */}
                                  {message.text && (
                                    <div className="simple-chat-message-bubble p-2 sm:p-3 rounded-lg simple-chat-message-received-bubble bg-gray text-white">
                                      <MessageText
                                        text={message.text}
                                        className="text-sm sm:text-base"
                                      />
                                    </div>
                                  )}

                                  <div className="flex items-center mt-1">
                                    {/* <Text className="text-xs text-grayText">
                                      {message.sender || activeItem.name}
                                    </Text>
                                    <Text className="text-xs text-grayText mx-1">
                                      •
                                    </Text> */}
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
                        onClick={handleSendButtonClick}
                        loading={chatMessageLoading}
                        disabled={chatMessageLoading}
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
        closable={!isUploadingFiles && !chunkingProgress.isChunking}
        maskClosable={!isUploadingFiles && !chunkingProgress.isChunking}
      >
        {/* Chunking Progress Overlay */}
        {/* {chunkingProgress.isChunking && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
            <div className="bg-darkGray p-6 rounded-lg max-w-md w-full mx-4">
              <div className="text-center mb-4">
                <Text className="text-white text-lg font-medium">
                  Processing Large Files
                </Text>
                <Text className="text-grayText text-sm mt-1">
                  File {chunkingProgress.currentFile} of {chunkingProgress.totalFiles}
                </Text>
              </div>

              <div className="mb-4">
                <Text className="text-white text-sm mb-2 block truncate">
                  {chunkingProgress.currentFileName}
                </Text>
                <Progress
                  percent={chunkingProgress.chunkProgress}
                  status="active"
                  strokeColor="#FF6D00"
                  className="mb-2"
                />
                <Text className="text-grayText text-xs">
                  Current File: {chunkingProgress.chunkProgress}%
                </Text>
              </div>

              <div className="mb-2">
                <Progress
                  percent={chunkingProgress.overallProgress}
                  status="active"
                  strokeColor="#4CAF50"
                />
                <Text className="text-grayText text-xs">
                  Overall Progress: {chunkingProgress.overallProgress}%
                </Text>
              </div>
            </div>
          </div>
        )} */}

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
                const isHtml = 
                file.type?.includes("text/html") ||
                file.name?.toLowerCase().endsWith(".html") ||
                file.name?.toLowerCase().endsWith(".htm");

              const isAcceptedFileType =
                isImage ||
                isVideo ||
                isPdf ||
                isDoc ||
                isExcel ||
                isPpt ||
                isText ||
                isCsv ||
                isHtml;

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
            accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.wmv,.mkv,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.html,.htm"
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
                Supported formats: Images, Videos, Documents, HTML Files
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
                  disabled={isUploadingFiles || chunkingProgress.isChunking}
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
                        {/* <Text className="text-grayText text-xs">
                          {(file.size / 1024).toFixed(1)} KB
                          {file.size > CHUNK_SIZE && (
                            <span className="text-yellow-500 ml-2">(will be chunked)</span>
                          )}
                        </Text> */}
                      </div>
                      <Button
                        type="text"
                        size="small"
                        className={`text-grayText hover:text-white flex-shrink-0 ${
                          isUploadingFiles || chunkingProgress.isChunking
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={() => {
                          if (
                            !isUploadingFiles &&
                            !chunkingProgress.isChunking
                          ) {
                            const newFileList = [...selectedFiles];
                            newFileList.splice(index, 1);
                            setSelectedFiles(newFileList);
                          }
                        }}
                        disabled={
                          isUploadingFiles || chunkingProgress.isChunking
                        }
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
                  disabled={isUploadingFiles || chunkingProgress.isChunking}
                >
                  Cancel
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  block
                  type="primary"
                  size="large"
                  loading={isUploadingFiles || chunkingProgress.isChunking}
                  onClick={handleFileUploadConfirm}
                  style={{ backgroundColor: "#FF6D00", borderColor: "#FF6D00" }}
                  disabled={
                    selectedFiles.length === 0 ||
                    isUploadingFiles ||
                    chunkingProgress.isChunking
                  }
                >
                  {isUploadingFiles || chunkingProgress.isChunking
                    ? "Processing..."
                    : "Send Files"}
                </Button>
              </Col>
            </Row>
          </div>
        </div>
      </Modal>

      {/* Voice Recording Modal */}
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
        onCancel={handleVoiceModalCancel} // Use the new handler instead of the inline function
        footer={null}
        width={600}
        maskClosable={false} // Prevent accidental closing
        closable={true}
      >
        <MicRecorder
          ref={micRecorderRef} // Add ref to control the recorder
          setOpenVoiceModal={setVoiceModalVisible}
          onRecordingComplete={handleVoiceRecordingComplete}
        />
      </Modal>

      {/* Media viewing modal */}
      <Modal
        open={mediaModalVisible}
        onCancel={handleMediaModalClose}
        afterClose={pauseAllMediaVideos}
        footer={null}
        centered
        width="90vw"
        className="media-modal"
        closeIcon={
          <Button
            shape="circle"
            icon={<CloseOutlined className="text-white" />}
            className="bg-[#333333] hover:bg-[#444444]"
          />
        }
        style={{
          padding: 0,
          background: "#121212",
          minHeight: "70vh",
          maxHeight: "90vh",
        }}
        bodyStyle={{
          padding: 0,
        }}
      >
        <div
          style={{
            height: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {renderMediaCarousel()}
        </div>
        {/* Download section */}
        {selectedMedia && selectedMedia.length > 0 && (
          <div className="mt-4 flex justify-between items-center px-4 pb-4">
            <Text className="text-white">
              {selectedMedia[selectedMediaIndex]?.file_name ||
                `Media ${selectedMediaIndex + 1}`}
            </Text>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={(e) =>
                downloadFile(
                  `${import.meta.env.VITE_IMAGE_BASE_URL}/${
                    selectedMedia[selectedMediaIndex]?.file_path
                  }`,
                  selectedMedia[selectedMediaIndex]?.file_name ||
                    `media_${selectedMediaIndex + 1}`,
                  e
                )
              }
            >
              Download
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StandaloneChatWindow;
