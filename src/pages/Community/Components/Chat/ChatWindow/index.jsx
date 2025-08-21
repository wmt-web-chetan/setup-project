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
  CheckOutlined,
  AudioOutlined,
  ArrowLeftOutlined,
  CloseOutlined,
  FileOutlined,
  SoundOutlined,
  CommentOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import "../Chat.scss";
import { useDispatch, useSelector } from "react-redux";
import {
  addChatRoomParticipantsAction,
  fetchChatMessageDetailsAction,
  sendChatMessageAction,
} from "../../../../../services/Store/Chat/action";
import { useReverb } from "../../../../../utils/useReverb";
import MicRecorder from "../MicRecorder"; // Import the MicRecorder component
import FolderIcon from "../../../../../assets/SVGs/Join-Channel.png";
import Slider from "react-slick";
import ContactDetails from "../ContactDetails";
import { getStorage } from "../../../../../utils/commonfunction";
import AudioPlayer from "../../../../../components/AuthLayout/AUdioPlayer";

// Add constants for file size limit and chunking
const MAX_FILE_SIZE_MB = 20; // Maximum file size in MB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert to bytes
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks - S3 multipart upload minimum requirement

// Helper function to format date labels
const formatDateLabel = (date) => {
  if (!date) return "";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if date is today
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  // Check if date is yesterday
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  // For dates within the current year
  const currentYear = today.getFullYear();
  if (date.getFullYear() === currentYear) {
    return date.toLocaleDateString(undefined, {
      month: "2-digit",
      day: "2-digit",
    });
  }

  // For older dates, include the year
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// Enhanced MessageText component with chatroom link detection
const MessageText = ({ text, onChatroomLinkClick }) => {
  // Skip processing if no text
  if (!text) return null;

  // Regular expressions for different link types
  const meetingLinkRegex = /https?:\/\/[^\s]*\/meeting\/meet_[^\s]+/g;
  const generalUrlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;

  // Reset regex state and check if text contains any URLs
  generalUrlRegex.lastIndex = 0;
  if (!generalUrlRegex.test(text)) {
    return <span>{text}</span>;
  }

  // Reset regex state again for actual processing
  generalUrlRegex.lastIndex = 0;

  // Split the text by URLs and create an array of text and link elements
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = generalUrlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex, match.index)}
        </span>
      );
    }

    // Get the matched URL
    const url = match[0];

    // Check if this is a meeting/chatroom link
    const isMeetingLink = /\/meeting\/meet_[^\s]+/.test(url);

    if (isMeetingLink) {
      // Extract meeting ID from URL
      const meetingMatch = url.match(/meet_([^\s/]+)/);
      const meetingId = meetingMatch ? meetingMatch[1] : null;

      parts.push(
        <div key={`meeting-link-${match.index}`} className="mt-2 mb-2">
          {/* Clickable text */}
          <div className="mb-1">
            <span
              className="text-[#A76FF] font-medium cursor-pointer"
              title="Click to join this chatroom"
            >
              Click below link to Join this chatroom
            </span>
          </div>
          {/* Clickable actual link */}
          <div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onChatroomLinkClick && meetingId) {
                  onChatroomLinkClick(meetingId, url);
                }
              }}
              className="text-[#A76FF] hover:underline cursor-pointer text-sm break-all"
              title="Click to join this chatroom"
            >
              {url}
            </a>
          </div>
        </div>
      );
    } else {
      // Regular URL - open in new tab
      const formattedUrl = url.startsWith("www.") ? `http://${url}` : url;

      parts.push(
        <a
          key={`link-${match.index}`}
          href={formattedUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#A76FF] hover:underline"
        >
          {url}
        </a>
      );
    }

    lastIndex = match.index + url.length;
  }

  // Add remaining text after the last URL
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>
    );
  }

  return <>{parts}</>;
};

const { Text, Title } = Typography;

const ChatWindow = ({
  activeItem,
  messages,
  setMessages,
  showLiveMeeting,
  activeMeeting,
  windowWidth,
  handleBackToList,
  handleJoinMeeting,
  handleCloseMeetingBanner,
  activeTab,
  showContactList,
  updateChatWithLatestMessage,
  // New props for chatroom link handling
  apiChatRooms,
  handleTabChange,
  handleChatRoomSelect,
  liveMeetings = [],
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [currentWidth, setCurrentWidth] = useState(window.innerWidth);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);
  const [sidebarReady, setSidebarReady] = useState(false);
  const [isUserJoinedRoom, setIsUserJoinedRoom] = useState(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isReceiverInactive, setIsReceiverInactive] = useState(false); // New state for inactive receiver
  const [groupMemberStatus, setGroupMemberStatus] = useState();

  // Search-related state
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // States for file upload
  const [fileModalVisible, setFileModalVisible] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadType, setUploadType] = useState(""); // 'image', 'document', 'video', 'audio'

  // State for voice recording modal
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [audioTranscript, setAudioTranscript] = useState("");

  // States for infinite scrolling
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allMessages, setAllMessages] = useState([]);

  // New loading state for initial message loading
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  // State for image/media modal
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

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
  const carouselRef = useRef(null);
  const dispatch = useDispatch();
  const oversizedFilesRef = useRef([]);
  const invalidFilesRef = useRef([]);
  const notificationShownRef = useRef(false);
  const [sliderRef, setSliderRef] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentPlayingAudioId, setCurrentPlayingAudioId] = useState(null);

  const { userForEdit } = useSelector((state) => state?.usersmanagement);
  const userLoginRole = getStorage("userLoginRole", true);
  const micRecorderRef = useRef(null);
  const mediaVideoRefs = useRef([]);

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

  const staticMeetings = [
    {
      id: 1,
      name: "Team Standup",
      participants: [
        {
          id: 1,
          avatar: "https://via.placeholder.com/32x32/FF6D00/FFFFFF?text=JS",
        },
        {
          id: 2,
          avatar: "https://via.placeholder.com/32x32/00BCD4/FFFFFF?text=MK",
        },
        {
          id: 3,
          avatar: "https://via.placeholder.com/32x32/4CAF50/FFFFFF?text=AL",
        },
      ],
    },
    {
      id: 2,
      name: "Design Review",
      participants: [
        {
          id: 4,
          avatar: "https://via.placeholder.com/32x32/9C27B0/FFFFFF?text=SM",
        },
        {
          id: 5,
          avatar: "https://via.placeholder.com/32x32/FF5722/FFFFFF?text=RJ",
        },
      ],
    },
    {
      id: 3,
      name: "Client Presentation",
      participants: [
        {
          id: 6,
          avatar: "https://via.placeholder.com/32x32/607D8B/FFFFFF?text=TK",
        },
        {
          id: 7,
          avatar: "https://via.placeholder.com/32x32/795548/FFFFFF?text=NL",
        },
        {
          id: 8,
          avatar: "https://via.placeholder.com/32x32/E91E63/FFFFFF?text=PD",
        },
        {
          id: 9,
          avatar: "https://via.placeholder.com/32x32/3F51B5/FFFFFF?text=VK",
        },
      ],
    },
    {
      id: 4,
      name: "Client1 Presentation",
      participants: [
        {
          id: 6,
          avatar: "https://via.placeholder.com/32x32/607D8B/FFFFFF?text=TK",
        },
        {
          id: 7,
          avatar: "https://via.placeholder.com/32x32/795548/FFFFFF?text=NL",
        },
        {
          id: 8,
          avatar: "https://via.placeholder.com/32x32/E91E63/FFFFFF?text=PD",
        },
        {
          id: 9,
          avatar: "https://via.placeholder.com/32x32/3F51B5/FFFFFF?text=VK",
        },
      ],
    },
  ];
  useEffect(() => {
    if (liveMeetings?.length > 1) {
      const interval = setInterval(() => {
        setCurrentMeetingIndex((prevIndex) =>
          prevIndex === liveMeetings.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [liveMeetings?.length]);
  useEffect(() => {
    return () => {
      pauseAllMediaVideos();
    };
  }, [pauseAllMediaVideos]);
  const handleChatroomLinkClick = useCallback(
    (meetingId, fullUrl) => {
      // Extract different parts of the URL
      const meetingLink = fullUrl.split("/meeting/")[1]; // "meet_68344f56c4223_ErqbfOvlsG"
      const justId = meetingId; // "68344f56c4223_ErqbfOvlsG"

      const findAndRedirectToChatroom = () => {
        // First try: Find by exact meeting_link match
        let targetChatRoom = apiChatRooms.find(
          (room) => room.meeting_link === meetingLink
        );

        if (!targetChatRoom) {
          // Second try: Find by full URL match
          targetChatRoom = apiChatRooms.find(
            (room) => room.meeting_link === fullUrl
          );
        }

        if (!targetChatRoom) {
          // Third try: Find by ID only
          targetChatRoom = apiChatRooms.find(
            (room) => room.meeting_link === justId
          );
        }

        if (!targetChatRoom) {
          // Fourth try: Find by meet_ID format
          targetChatRoom = apiChatRooms.find(
            (room) => room.meeting_link === `meet_${justId}`
          );
        }

        if (!targetChatRoom) {
          // Fifth try: Find by path format
          targetChatRoom = apiChatRooms.find(
            (room) => room.meeting_link === `/meeting/${meetingLink}`
          );
        }

        // Debug what we found
        if (targetChatRoom) {
          handleChatRoomSelect(targetChatRoom);
        } else {
          apiChatRooms.forEach((room) => {});
        }

        return !!targetChatRoom;
      };

      if (activeTab !== "chatRoom") {
        handleTabChange("chatRoom");
        setTimeout(findAndRedirectToChatroom, 2000);
      } else {
        findAndRedirectToChatroom();
      }
    },
    [activeTab, apiChatRooms, handleTabChange, handleChatRoomSelect]
  );
  const [currentMeetingIndex, setCurrentMeetingIndex] = useState(0);

  const {
    data: messageData,
    error: messageDataError,
    isConnected: messageisConnected,
  } = useReverb(
    activeTab === "chatRoom"
      ? `chatroom.${activeItem?.id}`
      : `chat.${activeItem?.id}`,
    ".chatMessagesUpdated"
  );
  const {
    data: activeMemberInChatRoom,
    error: activeMemberInChatRoomError,
    isConnected: activeMemberInChatRoomisConnected,
  } = useReverb(`chatroom.${activeItem?.id}`, ".chatRoomCount");

  const { chatMessageLoading } = useSelector((state) => state?.chat);

  // Debounced toggling to prevent layout issues
  const toggleSidebarTimeout = useRef(null);
  const resizeTimeout = useRef(null);

  // Process real-time messages from useReverb
  useEffect(() => {
    if (messageData && messageData?.messages) {
      const msg = messageData.messages;
      const messageType = messageData.type; // "chat" or "chatroom"
      const normalizedMessageType =
        messageType === "chatroom" ? "chatRoom" : messageType;
      if (normalizedMessageType !== activeTab) {
        return;
      }

      // For individual chats, check if either sender or receiver matches activeItem.id
      if (activeTab === "chat") {
        const isSenderMatch = msg?.sender_id === activeItem?.id;
        const isReceiverMatch = msg?.receiver_id === userForEdit?.user?.id;

        if (!isSenderMatch) {
          return;
        }
        if (!isReceiverMatch) {
          return;
        }
      }
      // For chatrooms, use target_id since receiver_id is null in chatrooms
      else if (activeTab === "chatRoom") {
        const messageTargetId = messageData?.target_id;
        if (messageTargetId !== activeItem?.id) {
          return;
        }
      }

      // Fix: Handle both single attachment object and attachments array
      let processedAttachments = [];

      if (msg.attachments && Array.isArray(msg.attachments)) {
        // Multiple attachments - already an array
        processedAttachments = msg.attachments;
      } else if (msg.attachment && typeof msg.attachment === "object") {
        // Single attachment object - convert to array
        processedAttachments = [msg.attachment];
      } else if (msg.attachments && typeof msg.attachments === "object") {
        // Single attachment in attachments property - convert to array
        processedAttachments = [msg.attachments];
      }

      // Add content_type to attachments if missing (for compatibility)
      processedAttachments = processedAttachments.map((attachment) => {
        if (!attachment.content_type && attachment.file_name) {
          // Try to determine content type from file extension
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
          } else if (extension === "pdf") {
            attachment.content_type = "application/pdf";
          } else if (["doc", "docx"].includes(extension)) {
            attachment.content_type = "application/document";
          } else if (["xls", "xlsx"].includes(extension)) {
            attachment.content_type = "application/spreadsheet";
          } else if (["ppt", "pptx"].includes(extension)) {
            attachment.content_type = "application/presentation";
          } else if (["txt", "csv"].includes(extension)) {
            attachment.content_type = "text/plain";
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
        attachments: processedAttachments, // Now always an array
      };

      // Check if we already have this message to avoid duplicates
      const isDuplicate = allMessages.some(
        (existingMsg) => existingMsg.id === newFormattedMessage.id
      );

      if (!isDuplicate) {
        // Append to allMessages
        setAllMessages((prevMessages) => [
          ...prevMessages,
          newFormattedMessage,
        ]);

        // If search is active, check if the new message matches the search query
        if (searchQuery && searchQuery?.length >= 2) {
          const lowercaseQuery = searchQuery.toLowerCase();

          // Check if message matches the search query
          const isMatch =
            (newFormattedMessage.text &&
              newFormattedMessage.text
                .toLowerCase()
                .includes(lowercaseQuery)) ||
            (newFormattedMessage.sender &&
              newFormattedMessage.sender
                .toLowerCase()
                .includes(lowercaseQuery)) ||
            (newFormattedMessage.attachments &&
              newFormattedMessage.attachments.some(
                (attachment) =>
                  attachment.file_name &&
                  attachment.file_name.toLowerCase().includes(lowercaseQuery)
              ));

          // Add matching message to search results
          if (isMatch) {
            setSearchResults((prevResults) => [
              ...prevResults,
              newFormattedMessage,
            ]);
          }
        }

        // Auto-scroll to bottom when new messages arrive in real-time
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    }
  }, [
    messageData,
    searchQuery,
    allMessages,
    scrollToBottom,
    activeItem?.id,
    activeTab,
  ]);

  useEffect(() => {
    if (staticMeetings.length > 1) {
      const interval = setInterval(() => {
        setCurrentMeetingIndex((prevIndex) =>
          prevIndex === staticMeetings.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [staticMeetings.length]);

  // Clear messages immediately when switching to a new chat
  useEffect(() => {
    if (activeItem?.id) {
      // Reset isReceiverInactive when changing conversations
      setIsReceiverInactive(false);

      // Clear messages immediately when switching to a new chat
      setAllMessages([]);
      setMessages([]);

      // Reset isUserJoinedRoom to avoid showing "Join Group" UI during loading
      setIsUserJoinedRoom(null);

      // Then reset pagination and fetch new messages
      setCurrentPage(1);
      setHasMoreMessages(true);

      // Set initial loading state before fetching messages
      setIsInitialLoading(true);

      // Small delay to ensure UI reflects the cleared state before loading new messages
      setTimeout(() => {
        fetchMessages(1, false);
      }, 50);
    }
  }, [activeItem?.id]); // Removed fetchMessages to avoid circular dependency

  // Auto-scroll when messages change (new messages arrive or initial load)
  useEffect(() => {
    // Only auto-scroll if we're not in loading mode and have messages
    if (!isLoadingMore && allMessages.length > 0) {
      // Small timeout to ensure DOM is updated before scrolling
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [allMessages, isLoadingMore, scrollToBottom]);

  // Auto-scroll when a new chat is selected
  useEffect(() => {
    if (activeItem?.id) {
      // Reset scroll position when changing conversations
      setTimeout(() => {
        scrollToBottom();
      }, 300); // Slightly longer delay to account for API fetch time
    }
  }, [activeItem?.id, scrollToBottom]);

  // fetchMessages function with chat_room_id support, auto-scroll, and loading state
  const fetchMessages = useCallback(
    (page = 1, shouldAppend = false) => {
      if (page === 1 && !shouldAppend) {
        setAllMessages([]);
        // Show loading indicator for initial loads
        setIsInitialLoading(true);
      }

      if (page > 1) {
        setIsLoadingMore(true);
      }

      // Store the current active item ID to prevent stale closures
      const currentActiveItemId = activeItem?.id;

      // Determine whether to use chat_user_id or chat_room_id based on activeTab
      const params = {
        page: page,
        per_page: 12, // Show 12 messages per page
      };

      // Add the appropriate ID parameter based on chat type
      if (activeTab === "chatRoom") {
        params.chat_room_id = currentActiveItemId;
      } else {
        params.chat_user_id = currentActiveItemId;
      }

      dispatch(fetchChatMessageDetailsAction(params))
        .then((response) => {
          // Check if the active item is still the same to prevent race conditions
          if (response?.payload?.data?.type === "chatroom") {
            setGroupMemberStatus({
              total_members: response?.payload?.data?.total_members,
              online_members: response?.payload?.data?.online_members,
            });
          }
          // Only update isUserJoinedRoom if the response is valid
          if (response?.payload) {
            setIsUserJoinedRoom(response?.payload);
          }
          if (response?.payload?.data?.is_active === 0) {
            setIsReceiverInactive(true);
          } else {
            setIsReceiverInactive(false);
          }
          if (
            currentActiveItemId === activeItem?.id &&
            response?.payload?.meta?.success
          ) {
            const receivedMessages = response?.payload?.data?.messages;
            const chatType = response.payload.data.type; // "chat" or "chatroom"
            const pagination = response?.payload?.data?.pagination || {};

            // Process messages for your component
            const formattedMessages = receivedMessages?.map((msg) => ({
              id: msg.id,
              text: msg.message,
              sender: msg.sender?.name || msg.user?.name || "Unknown",
              senderAvatar: msg.user?.profile_photo_path,
              time: new Date(msg.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              created_at: msg.created_at, // Store the full created_at timestamp
              isSender: msg.is_sender === 1,
              isRead: msg.is_read === 1,
              attachments: msg.attachments,
            }));

            // Update messages based on whether we're appending or replacing
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

              // Auto-scroll to bottom only for initial load (page 1)
              if (page === 1) {
                setTimeout(() => {
                  scrollToBottom();
                }, 100);
              }
            }

            // Update pagination state
            setHasMoreMessages(pagination.currentPage < pagination.totalPage);
          }

          // Clear loading states
          setIsLoadingMore(false);
          setIsInitialLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching messages:", error);
          // Clear loading states on error
          setIsLoadingMore(false);
          setIsInitialLoading(false);
        });
    },
    [dispatch, activeItem, activeTab, setMessages, scrollToBottom]
  );

  useEffect(() => {
    setGroupMemberStatus({
      total_members: activeMemberInChatRoom?.total_members,
      online_members: activeMemberInChatRoom?.online_members,
    });
  }, [activeMemberInChatRoom]);

  // Handle scroll for infinite loading of messages
  const handleMessagesScroll = useCallback(
    (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;

      // Load more when scrolled up to 20% from the top (for chat apps we load older messages when scrolling up)
      if (scrollTop < scrollHeight * 0.2 && !isLoadingMore && hasMoreMessages) {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        fetchMessages(nextPage, true);
      }
    },
    [currentPage, fetchMessages, hasMoreMessages, isLoadingMore]
  );

  useEffect(() => {
    const handleResize = () => {
      // Debounce resize events
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
      if (toggleSidebarTimeout.current) {
        clearTimeout(toggleSidebarTimeout.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Reset the message input when active item or tab changes
    setNewMessage("");
  }, [activeItem, activeTab]);

  const joinGroup = () => {
    const payload = {
      meeting_link: isUserJoinedRoom?.data?.meeting_link,
    };

    dispatch(addChatRoomParticipantsAction(payload))
      .then((res) => {
        if (res?.payload?.meta?.status === 200) {
          // Update isUserJoinedRoom with the proper structure
          // Set is_joined to 1 to indicate the user has joined
          setIsUserJoinedRoom({
            data: {
              ...isUserJoinedRoom?.data,
              is_joined: 1,
              meeting_link: res?.payload?.data?.chat_room?.meeting_link,
            },
          });

          // Refresh messages after joining
          fetchMessages(1, false);
        }
      })
      .catch((e) => {
        // console.log("Error", e);
      });
  };

  // Handle file upload modal
  const showFileUploadModal = () => {
    setSelectedFiles([]);
    setFileModalVisible(true);
  };

  // Function to show voice recording modal
  const showVoiceRecordingModal = () => {
    setVoiceModalVisible(true);
    // Reset timer when modal opens
    setTimeout(() => {
      if (micRecorderRef.current && micRecorderRef.current.resetTimer) {
        micRecorderRef.current.resetTimer();
      }
    }, 100); // Small delay to ensure component is mounted
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

  // Function to handle voice recording completion with S3 upload
  const handleVoiceRecordingComplete = async (audioBlob, transcript) => {
    if (audioBlob) {
      // Create a File object from the Blob that can be used with FormData
      const audioFile = new File([audioBlob], "voice-message.webm", {
        type: audioBlob.type,
      });

      // Create a FileList-like structure for the audio file
      const audioFileObj = {
        originFileObj: audioFile,
        name: "voice-message.webm",
        type: audioBlob.type,
        uid: Date.now(),
        size: audioBlob.size,
      };

      // Set audio file and transcript
      setRecordedAudio(audioFileObj);
      setAudioTranscript(transcript);

      // Send the audio message with S3 upload
      await handleSendVoiceMessage(audioFileObj, transcript);
    }

    // Close the voice modal
    setVoiceModalVisible(false);
  };

  // Function to send voice message with S3 upload and auto-scroll
  const handleSendVoiceMessage = async (audioFileObj, transcript) => {
    try {
      // Show loading message
      const loadingMsg = message.loading("Sending voice message...", 0);

      // Upload audio file to S3
      const { uploadedFiles } = await processLargeFiles([audioFileObj]);

      // Create FormData object for the API request
      const formData = new FormData();
      formData.append("role", userLoginRole?.name);

      // Add the appropriate ID parameter based on chat type
      if (activeTab === "chatRoom") {
        formData.append("chat_room_id", activeItem?.id);
      } else {
        formData.append("receiver_id", activeItem?.id);
      }

      // Add uploaded file references to FormData
      if (uploadedFiles.length > 0) {
        formData.append("s3_files", JSON.stringify(uploadedFiles));
      }

      // Dispatch the send message action
      const response = await dispatch(sendChatMessageAction(formData));

      // Hide loading message
      loadingMsg();

      // Check for inactive user error
      if (response?.meta?.success === false) {
        setIsReceiverInactive(true);
        return; // Exit early
      }

      if (response?.payload?.meta?.success === true) {
        // Get the message data from the response
        const messageData = response?.payload?.data?.message;

        // Format the message to match the component's message structure
        const formattedMessage = {
          id: messageData?.id,
          text: messageData?.message,
          sender: messageData?.sender?.name || "You",
          time: new Date(messageData?.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          created_at: messageData?.created_at, // Store the full created_at timestamp
          isSender: true,
          isRead: messageData?.is_read === 1,
          attachments: messageData?.attachments || [],
          isFile: true,
        };

        // Append the new message to both states
        setMessages((prevMessages) => [...prevMessages, formattedMessage]);
        setAllMessages((prevMessages) => [...prevMessages, formattedMessage]);

        // Update chat list with the latest message
        if (updateChatWithLatestMessage) {
          updateChatWithLatestMessage(
            formattedMessage.text,
            activeItem.id,
            activeItem.name,
            activeItem.avatar
          );
        }

        // Auto-scroll to the bottom after sending a voice message
        setTimeout(() => {
          scrollToBottom();
        }, 100);

        // If search is active, check if the new message matches the search criteria
        if (searchQuery && searchQuery.length >= 2) {
          const lowercaseQuery = searchQuery.toLowerCase();
          const messageMatches =
            (formattedMessage.text &&
              formattedMessage.text.toLowerCase().includes(lowercaseQuery)) ||
            (formattedMessage.sender &&
              formattedMessage.sender.toLowerCase().includes(lowercaseQuery)) ||
            (formattedMessage.attachments &&
              formattedMessage.attachments.some(
                (attachment) =>
                  attachment.file_name &&
                  attachment.file_name.toLowerCase().includes(lowercaseQuery)
              ));

          if (messageMatches) {
            setSearchResults((prevResults) => [
              ...prevResults,
              formattedMessage,
            ]);
          }
        }

        // Reset audio data
        setRecordedAudio(null);
        setAudioTranscript("");
      }
    } catch (error) {
      console.error("Error sending voice message:", error);
      notification.error({
        message: "Upload failed",
        description: "Failed to send voice message. Please try again.",
        duration: 5,
      });
    }
  };

  // Function to handle file selection
  const handleFileSelect = (info) => {
    const { fileList } = info;
    setSelectedFiles(fileList);
  };

  // Function to handle file modal cancel
  const handleFileModalCancel = () => {
    setFileModalVisible(false);
    setUploadType("");
    setSelectedFiles([]);
  };

  // Function to handle file upload confirmation with S3 upload
  const handleFileUploadConfirm = async () => {
    if (selectedFiles.length === 0) {
      message.warning("Please select at least one file");
      return;
    }

    // Check if any file exceeds the size limit
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

    setIsUploadingFiles(true); // Start loader

    try {
      // Upload files to S3 first
      const { uploadedFiles } = await processLargeFiles(selectedFiles);

      // Create FormData
      const formData = new FormData();
      formData.append("role", userLoginRole?.name);

      if (activeTab === "chatRoom") {
        formData.append("chat_room_id", activeItem?.id);
      } else {
        formData.append("receiver_id", activeItem?.id);
      }

      // Add uploaded file references to FormData
      if (uploadedFiles.length > 0) {
        formData.append("s3_files", JSON.stringify(uploadedFiles));
      }

      // Dispatch send
      const response = await dispatch(sendChatMessageAction(formData));

      // Check for inactive user error
      if (
        response?.payload?.meta?.status === 200 &&
        response?.payload?.meta?.success === false
      ) {
        setIsReceiverInactive(true);
        setFileModalVisible(false); // Close the modal
        setSelectedFiles([]);
        setIsUploadingFiles(false);
        return; // Exit early
      }

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
          created_at: messageData?.created_at, // Store the full created_at timestamp
          isSender: true,
          isRead: messageData?.is_read === 1,
          attachments: messageData?.attachments || [],
          isFile: true,
        };

        setMessages((prev) => [...prev, formattedMessage]);
        setAllMessages((prev) => [...prev, formattedMessage]);
        scrollToBottom();

        setFileModalVisible(false); // ✅ Close only after upload
        setSelectedFiles([]);
      }
    } catch (error) {
      console.error("Upload error:", error);
      notification.error({
        message: "Upload failed",
        description:
          error.message || "Failed to upload files. Please try again.",
        duration: 5,
      });
    } finally {
      setIsUploadingFiles(false); // Stop loader
    }
  };

  // Updated handleSendMessage function to support file uploads and auto-scroll with S3
  const handleSendMessage = async (withFiles = false) => {
    if (
      (!newMessage.trim() && !withFiles) ||
      (withFiles && selectedFiles.length === 0)
    ) {
      return;
    }

    try {
      // Create FormData object for the API request
      const formData = new FormData();
      formData.append("role", userLoginRole?.name);
      // Add message text if it exists
      if (newMessage.trim()) {
        formData.append("message", newMessage);
      }

      // Add the appropriate ID parameter based on chat type
      if (activeTab === "chatRoom") {
        formData.append("chat_room_id", activeItem?.id);
      } else {
        formData.append("receiver_id", activeItem?.id);
      }

      // Add files if they exist
      if (withFiles && selectedFiles.length > 0) {
        // Upload files to S3 first
        const { uploadedFiles } = await processLargeFiles(selectedFiles);

        // Add uploaded file references to FormData
        if (uploadedFiles.length > 0) {
          formData.append("s3_files", JSON.stringify(uploadedFiles));
        }
      }

      // Dispatch the send message action
      const response = await dispatch(sendChatMessageAction(formData));

      // Check for inactive user error
      if (
        response?.payload?.meta?.status === 200 &&
        response?.payload?.meta?.success === false
      ) {
        setIsReceiverInactive(true);
        setNewMessage(""); // Clear input field
        return; // Exit early
      }

      if (response?.payload?.meta?.success === true) {
        // Get the message data from the response
        const messageData = response?.payload?.data?.message;

        // Format the message to match the component's message structure
        const formattedMessage = {
          id: messageData?.id,
          text: messageData?.message || (withFiles ? "" : ""),
          sender: messageData?.sender?.name || "You",
          time: new Date(messageData?.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          created_at: messageData?.created_at, // Store the full created_at timestamp
          isSender: true,
          isRead: messageData?.is_read === 1,
          attachments: messageData?.attachments || [],
          isFile: withFiles,
        };

        // Append the new message to both states
        setMessages((prevMessages) => [...prevMessages, formattedMessage]);
        setAllMessages((prevMessages) => [...prevMessages, formattedMessage]);

        // Update chat list with the latest message for individual chats
        if (updateChatWithLatestMessage) {
          // Determine the message to display in chat list
          let displayMessage = formattedMessage.text;
          if (!displayMessage && withFiles) {
            if (selectedFiles.length === 1) {
              displayMessage = `Sent a file: ${selectedFiles[0].name}`;
            } else {
              displayMessage = `Sent ${selectedFiles.length} files`;
            }
          }

          updateChatWithLatestMessage(
            displayMessage,
            activeItem.id,
            activeItem.name,
            activeItem.avatar
          );
        }

        // Auto-scroll to the bottom after sending a message
        setTimeout(() => {
          scrollToBottom();
        }, 100);

        // If search is active, check if the new message matches the search criteria
        if (searchQuery && searchQuery.length >= 2) {
          const lowercaseQuery = searchQuery.toLowerCase();
          const messageMatches =
            (formattedMessage.text &&
              formattedMessage.text.toLowerCase().includes(lowercaseQuery)) ||
            (formattedMessage.sender &&
              formattedMessage.sender.toLowerCase().includes(lowercaseQuery)) ||
            (formattedMessage.attachments &&
              formattedMessage.attachments.some(
                (attachment) =>
                  attachment.file_name &&
                  attachment.file_name.toLowerCase().includes(lowercaseQuery)
              ));

          if (messageMatches) {
            setSearchResults((prevResults) => [
              ...prevResults,
              formattedMessage,
            ]);
          }
        }

        // Reset file selection
        setSelectedFiles([]);
      }

      // Clear the input field regardless of success or failure
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      notification.error({
        message: "Send failed",
        description:
          error.message || "Failed to send message. Please try again.",
        duration: 5,
      });
    }
  };

  // Modified handleKeyPress function to prevent multiple submissions
  const handleKeyPress = (e) => {
    // Only process Enter key if no message is currently being sent
    if (e.key === "Enter" && !chatMessageLoading) {
      e.preventDefault(); // Prevent default Enter behavior
      handleSendMessage();
    }
  };

  // Updated search functions
  const toggleSearch = () => {
    // If we're closing search, clear results
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

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If search is cleared, reset to show all messages
    if (value === "") {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    // Only update search if value has at least 2 characters
    if (value.length >= 2) {
      setIsSearching(true);

      // Set a new timeout for 500ms for debouncing
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 500);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const performSearch = (query) => {
    // Convert query to lowercase for case-insensitive search
    const lowercaseQuery = query.toLowerCase();

    // Search through allMessages for matches
    const results = allMessages.filter(
      (message) =>
        // Search in message text
        (message.text && message.text.toLowerCase().includes(lowercaseQuery)) ||
        // Search in sender name
        (message.sender &&
          message.sender.toLowerCase().includes(lowercaseQuery)) ||
        // Search in file names if message has attachments
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
      // Clear any existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      // Perform search immediately
      performSearch(searchQuery);
    }
  };

  const closeSidebar = () => {
    // First make the sidebar not ready before hiding it
    setSidebarReady(false);

    // Give time for opacity transition
    if (toggleSidebarTimeout.current) {
      clearTimeout(toggleSidebarTimeout.current);
    }

    toggleSidebarTimeout.current = setTimeout(() => {
      setShowDetailsSidebar(false);
    }, 300);
  };

  // In the toggleDetailsSidebar function of ChatWindow.jsx
  const toggleDetailsSidebar = () => {
    // Don't allow opening the sidebar if user is not part of the chatroom
    if (activeTab === "chatRoom" && isUserJoinedRoom?.data?.is_joined === 0) {
      return; // Exit early without toggling sidebar
    }

    if (!showDetailsSidebar) {
      // When showing the sidebar, first render it hidden
      setShowDetailsSidebar(true);

      // Then give time for the DOM to update before making it visible
      if (toggleSidebarTimeout.current) {
        clearTimeout(toggleSidebarTimeout.current);
      }

      toggleSidebarTimeout.current = setTimeout(() => {
        setSidebarReady(true);
      }, 10);
    } else {
      closeSidebar();
    }
  };

  // When activeItem changes, reset sidebar state
  useEffect(() => {
    if (showDetailsSidebar) {
      setSidebarReady(false);
      setShowDetailsSidebar(false);
    }
  }, [activeItem]);

  // Calculate dynamic widths for responsive layout
  const getChatWindowWidthStyle = () => {
    // For mobile devices, always use full width
    if (currentWidth < 768) {
      return { width: "100%" };
    }
    // For desktop with sidebar open
    else if (showDetailsSidebar && currentWidth > 1024) {
      return {
        width: "calc(100% - 25%)",
        maxWidth: "calc(100% - 25%)",
      };
    }
    // Desktop without sidebar or tablet
    else {
      return {
        width: "100%",
        maxWidth: "100%",
      };
    }
  };

  // Helper to check if we're in desktop mode
  const isDesktop = currentWidth > 1024;

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
                      ref={(el) => (mediaVideoRefs.current[index] = el)}
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
                        ref={(el) => (mediaVideoRefs.current[index] = el)}
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
  const renderAudioAttachments = (attachments, isSender = false) => {
    if (!attachments || attachments.length === 0) return null;

    // Filter to only show audio attachments
    const audioAttachments = attachments.filter((attachment) =>
      attachment.content_type?.includes("audio")
    );

    if (audioAttachments.length === 0) return null;

    return (
      <div className="audio-attachments mt-2">
        {audioAttachments?.map((attachment, index) => {
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
                borderRadius: "12px", // Ensure rounded corners are preserved
              }}
            >
              {/* Use your custom AudioPlayer component with different styling for sender vs receiver */}
              <AudioPlayer
                audioSrc={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                  attachment.file_path
                }`}
                isSender={isSender}
                progressColor={isSender ? "#ffffff" : "#ff6d00"} // White for sender, Orange for receiver
                waveColor={isSender ? "#373737" : "#6D6D6D"} // Gray for unplayed portion (same for both)
                buttonBgColor={isSender ? "#ffffff" : "#ff6d00"} // White for sender, Orange for receiver
                buttonHoverColor={isSender ? "#f0f0f0" : "#e55a00"} // Light gray hover for sender, darker orange for receiver
                buttonIconColor={isSender ? "#ff6d00" : "#ffffff"} // Orange icon for sender (white button), White icon for receiver (orange button)
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
                  ref={(el) => (mediaVideoRefs.current[index] = el)}
                />
              </div>
            )}
          </div>
        ))}
      </Slider>
    );
  };

  return (
    <div
      className="flex-grow flex overflow-hidden h-full"
      ref={chatContainerRef}
    >
      <div
        className={`chat-window h-full flex flex-col overflow-hidden ${
          currentWidth < 992 && showContactList ? "hidden" : ""
        }`}
        style={{
          display: currentWidth < 992 && showContactList ? "none" : "flex",
          ...getChatWindowWidthStyle(),
          zIndex: 20,
        }}
      >
        {activeItem ? (
          <>
            {/* Chat Header - Sticky */}
            <Row className="chat-header !py-2 px-2 sm:px-4 border-b-[1px] border-solid border-[#373737] items-center bg-gray justify-between sticky top-0 z-10 sm:py-4">
              {showSearch && currentWidth < 768 ? (
                // Full width search bar for mobile
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
                  <div className="flex items-center flex-grow overflow-hidden h-[71px]">
                    {currentWidth < 992 && (
                      <Button
                        type="text"
                        className="chat-back-button mr-2 text-white flex items-center p-1"
                        onClick={handleBackToList}
                        icon={<ArrowLeftOutlined />}
                      >
                        {currentWidth > 375 && ""}
                      </Button>
                    )}
                    {activeItem?.avatar ? (
                      <Avatar
                        size={52}
                        src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                          activeItem?.avatar
                        }`}
                        className="object-cover rounded-full"
                      ></Avatar>
                    ) : (
                      <Avatar
                        size={52}
                        style={{ backgroundColor: "#fde3cf", color: "#f56a00" }}
                        className=" object-cover rounded-full !text-3xl"
                      >
                        {`${activeItem?.name?.[0]}`}
                      </Avatar>
                    )}
                    <div
                      className="chat-header-info ml-2 sm:ml-3 max-w-[100px] xs:max-w-[150px] sm:max-w-[200px] md:max-w-full overflow-hidden overflow-ellipsis"
                      onClick={() => {
                        // Only allow opening details if user is part of chatroom or if it's a regular chat
                        if (
                          activeTab !== "chatRoom" ||
                          isUserJoinedRoom?.data?.is_joined !== 0
                        ) {
                          toggleDetailsSidebar();
                        }
                      }}
                      style={{
                        cursor:
                          activeTab === "chatRoom" &&
                          isUserJoinedRoom?.data?.is_joined === 0
                            ? "default"
                            : "pointer",
                      }}
                    >
                      <Text className="chat-header-name m-0 text-white text-base truncate font-bold">
                        {activeItem.name}
                      </Text>
                      {activeTab === "chatRoom" &&
                        isUserJoinedRoom?.data?.is_joined !== 0 && (
                          <div className="flex items-center flex-wrap gap-2">
                            <div className="text-[10px] sm:text-sm text-grayText flex items-center truncate">
                              {groupMemberStatus?.total_members
                                ? groupMemberStatus?.total_members
                                : "0"}{" "}
                              {(groupMemberStatus?.total_members || 0) === 1
                                ? "Member"
                                : "Members"}
                            </div>
                            <span className="mx-1 text-grayText">•</span>
                            <div className="text-grayText flex items-center mt-1 justify-center mb-1 xs:mt-0 xs:ml-2 bg-liteGray rounded-2xl py-0 px-0 sm:py-0 sm:px-2 ">
                              <Badge
                                className="flex items-center !text-sm"
                                color="green"
                                text={`${
                                  groupMemberStatus?.online_members
                                    ? groupMemberStatus?.online_members
                                    : "0"
                                } `}
                              />
                              <Text className="text-[13px] ml-1">
                                {" "}
                                {(groupMemberStatus?.online_members || 0) === 1
                                  ? "Member"
                                  : "Members"}
                              </Text>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="chat-header-actions flex items-center gap-1 sm:gap-2 md:gap-3 ml-1">
                    {showSearch && currentWidth >= 768 ? (
                      // Desktop/tablet search input
                      <>
                        <div className="flex relative items-center bg-darkGray rounded-full w-64 ">
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
                      // Search icon button
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
                  </div>
                </>
              )}
            </Row>

            {/* Live Meeting Banner - Show when in chat room - Floating style */}
            {showLiveMeeting &&
              activeTab === "chatRoom" &&
              liveMeetings.length > 0 && (
                <div
                  className={`fixed z-50 px-2 sm:px-4 ${
                    // Responsive positioning
                    currentWidth < 640
                      ? "top-80 left-1/2 transform -translate-x-1/2 w-[95%] max-w-sm"
                      : currentWidth < 768
                      ? "top-24 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md"
                      : currentWidth < 1024
                      ? "top-28 left-1/2 transform -translate-x-1/2 w-[85%] max-w-lg"
                      : currentWidth < 1440
                      ? "top-72 left-[65%] transform -translate-x-1/2 w-[75%] max-w-2xl"
                      : "top-72 left-[65%] transform -translate-x-1/2 w-[65%] max-w-4xl"
                  }`}
                >
                  <div className="meeting-banner-container relative bg-darkGray rounded-2xl shadow-2xl">
                    <Slider
                      ref={setSliderRef}
                      dots={false}
                      infinite={liveMeetings.length > 1}
                      speed={500}
                      slidesToShow={1}
                      slidesToScroll={1}
                      autoplay={liveMeetings.length > 1}
                      autoplaySpeed={5000}
                      arrows={false}
                      beforeChange={(current, next) => {
                        pauseAllMediaVideos();
                      }}
                      className="meeting-carousel-fixed"
                    >
                      {liveMeetings.map((meeting, meetingIndex) => (
                        <div
                          key={meeting.id}
                          className="carousel-slide-wrapper"
                        >
                          <div
                            className={`meeting-banner flex items-center flex-wrap sm:flex-nowrap relative ${
                              currentWidth < 640
                                ? "px-3 py-3"
                                : currentWidth < 1024
                                ? "px-4 py-3"
                                : "px-6 py-4"
                            } mx-2 my-2`}
                          >
                            <div className="flex items-center w-full justify-between flex-wrap sm:flex-nowrap">
                              <div className="flex items-center mb-2 sm:mb-0 w-full justify-between">
                                <div
                                  className={`meeting-avatars flex ${
                                    currentWidth < 640 ? "mr-2" : "mr-3"
                                  }`}
                                >
                                  {/* Show different number of participants based on screen size */}
                                  {meeting?.participants
                                    ?.slice(
                                      0,
                                      currentWidth < 640
                                        ? 2
                                        : currentWidth < 1024
                                        ? 3
                                        : 4
                                    )
                                    .map((participant, index) => {
                                      const hasAvatar = participant?.avatar;
                                      const avatarSrc = `${
                                        import.meta.env.VITE_IMAGE_BASE_URL
                                      }/${participant.avatar}`;

                                      // Responsive avatar sizes
                                      const avatarSize =
                                        currentWidth < 640
                                          ? 28
                                          : currentWidth < 1024
                                          ? 32
                                          : currentWidth < 1440
                                          ? 36
                                          : 40;

                                      return hasAvatar ? (
                                        <Avatar
                                          key={participant.id}
                                          src={avatarSrc}
                                          size={avatarSize}
                                          className="border-2 border-[#1E1E1E]"
                                          style={{
                                            marginLeft:
                                              index > 0 ? "-8px" : "0",
                                          }}
                                        >
                                          {!avatarSrc && participant.name?.[0]}
                                        </Avatar>
                                      ) : (
                                        <Avatar
                                          key={participant.id}
                                          size={avatarSize}
                                          className="object-cover rounded-full border-2 border-[#1E1E1E]"
                                          style={{
                                            backgroundColor: "#fde3cf",
                                            color: "#f56a00",
                                            marginLeft:
                                              index > 0 ? "-8px" : "0",
                                          }}
                                        >
                                          {participant.name?.[0]}
                                        </Avatar>
                                      );
                                    })}

                                  {/* Show +X indicator if more participants than displayed */}
                                  {meeting?.participants?.length >
                                    (currentWidth < 640
                                      ? 2
                                      : currentWidth < 1024
                                      ? 3
                                      : 4) && (
                                    <div
                                      className="flex items-center justify-center bg-gray-600 text-white text-xs font-bold border-2 border-[#1E1E1E] rounded-full"
                                      style={{
                                        width:
                                          currentWidth < 640
                                            ? 28
                                            : currentWidth < 1024
                                            ? 32
                                            : currentWidth < 1440
                                            ? 36
                                            : 40,
                                        height:
                                          currentWidth < 640
                                            ? 28
                                            : currentWidth < 1024
                                            ? 32
                                            : currentWidth < 1440
                                            ? 36
                                            : 40,
                                        marginLeft: "-8px",
                                        fontSize:
                                          currentWidth < 640 ? "10px" : "12px",
                                      }}
                                    >
                                      +
                                      {meeting.participants.length -
                                        (currentWidth < 640
                                          ? 2
                                          : currentWidth < 1024
                                          ? 3
                                          : 4)}
                                    </div>
                                  )}
                                </div>

                                <div
                                  className={`flex-1 text-center ${
                                    currentWidth >= 768 ? "sm:text-left" : ""
                                  } ${currentWidth < 640 ? "mx-2" : "sm:ml-2"}`}
                                >
                                  <Text
                                    className={`text-white font-medium block truncate ${
                                      currentWidth < 640
                                        ? "text-xs max-w-[120px]"
                                        : currentWidth < 768
                                        ? "text-sm max-w-[180px]"
                                        : currentWidth < 1024
                                        ? "text-base max-w-[220px]"
                                        : currentWidth < 1440
                                        ? "text-lg max-w-[300px]"
                                        : "text-xl max-w-[400px]"
                                    } sm:max-w-full`}
                                  >
                                    {meeting.name}{" "}
                                    <span className="text-grayText">
                                      {currentWidth < 640
                                        ? "is live"
                                        : "meeting is live now"}
                                    </span>
                                  </Text>
                                </div>

                                <div className="flex items-center w-full sm:w-auto justify-end">
                                  <Button
                                    variant="outlined"
                                    size={
                                      currentWidth < 640
                                        ? "small"
                                        : currentWidth < 1024
                                        ? "middle"
                                        : "large"
                                    }
                                    className={`bg-opacity-30 text-primary border-primary rounded-full hover:bg-primary hover:bg-opacity-20 transition-all duration-200 ${
                                      currentWidth < 640
                                        ? "text-xs min-w-[50px] px-2"
                                        : currentWidth < 1024
                                        ? "text-sm min-w-[70px] px-3"
                                        : "text-base min-w-[90px] px-4"
                                    }`}
                                    onClick={() => handleJoinMeeting(meeting)}
                                  >
                                    {currentWidth < 640 ? "Join" : "Join Now"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </Slider>

                    {/* Custom Navigation Dots - Only show if more than 1 meeting */}
                    {liveMeetings?.length > 1 && (
                      <div
                        className={`absolute left-1/2 transform -translate-x-1/2 flex items-center z-10 ${
                          currentWidth < 640
                            ? "bottom-1 gap-1"
                            : "bottom-2 gap-2"
                        }`}
                      >
                        {liveMeetings?.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => sliderRef?.slickGoTo(index)}
                            className={`rounded-full transition-all duration-300 ${
                              index === currentSlide
                                ? "bg-primary scale-125"
                                : "bg-grayText hover:bg-primary hover:scale-110"
                            } ${
                              currentWidth < 640
                                ? "w-[5px] h-[5px]"
                                : "w-[6px] h-[6px]"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Chunking Progress Overlay */}
            {chunkingProgress.isChunking && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
                <div className="bg-darkGray p-6 rounded-lg max-w-md w-full mx-4">
                  <div className="text-center mb-4">
                    <Text className="text-white text-lg font-medium">
                      Processing Large Files
                    </Text>
                    <Text className="text-grayText text-sm mt-1">
                      File {chunkingProgress.currentFile} of{" "}
                      {chunkingProgress.totalFiles}
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
            )}

            {/* Inactive user message */}
            {isInitialLoading ? (
              <div className="absolute top-[54%] left-[64%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center">
                <Spin size="large" />
                <Text className="text-grayText">Loading conversation...</Text>
              </div>
            ) : isUserJoinedRoom?.data?.is_joined === 0 ? (
              <div className="absolute top-[36%] right-[26%] flex flex-col justify-center items-center">
                <img
                  src={FolderIcon}
                  alt="FolderIcon"
                  height={"120px"}
                  width={"120px"}
                />
                <Text type="secondary" className="text-center mt-5">
                  You are currently not a member of this group.
                </Text>
                <Text type="secondary" className="text-center">
                  {" "}
                  Would you like to join now?
                </Text>
                <Button
                  type="primary"
                  size="large"
                  onClick={joinGroup}
                  loading={false}
                  className="mt-5"
                >
                  Join Group
                </Button>
              </div>
            ) : (
              <>
                <div
                  className="chat-messages-area p-2 sm:p-4 overflow-y-auto"
                  ref={messagesAreaRef}
                  onScroll={handleMessagesScroll}
                  style={{
                    height:
                      currentWidth < 640
                        ? "calc(100vh - 289px)"
                        : "calc(100vh - 369px)",
                    paddingTop:
                      showLiveMeeting &&
                      activeTab === "chatRoom" &&
                      liveMeetings.length > 0
                        ? // Responsive padding based on screen size and banner position
                          currentWidth < 640
                          ? "85px" // Small screens - banner is higher up
                          : currentWidth < 768
                          ? "95px" // Medium-small screens
                          : currentWidth < 1024
                          ? "105px" // Medium screens
                          : currentWidth < 1440
                          ? "115px" // Large screens
                          : "125px" // Extra large screens - banner is lower
                        : "16px", // Default padding when no banner
                    overflowY: "auto",
                  }}
                >
                  {/* Loading indicator for older messages at the top */}
                  {isLoadingMore && (
                    <div className="flex items-center justify-center py-2 mb-4 h-full">
                      <Spin size="large" />
                    </div>
                  )}

                  {/* Empty state for new conversations */}
                  {allMessages?.length === 0 && !isLoadingMore && (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="bg-darkGray w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6">
                        <CommentOutlined
                          style={{ fontSize: "36px", color: "#FF6D00" }}
                        />
                      </div>
                      <Title level={3} className="text-white">
                        {activeTab === "chat"
                          ? "Start a new conversation with this user"
                          : "Start a new conversation in this chat room"}
                      </Title>
                      <Text className="text-grayText block mb-8">
                        Send a message to begin chatting
                      </Text>
                    </div>
                  )}

                  {/* Show search indicator when searching */}
                  {isSearching && (
                    <div className="flex justify-center items-center py-2 mb-4">
                      <Spin size="large" />
                      <Text className="text-grayText ml-2">
                        Searching messages...
                      </Text>
                    </div>
                  )}

                  {/* Display messages with dynamic date separators */}
                  {!isSearching && (
                    <>
                      {/* Initialize variable to track date changes */}
                      {(() => {
                        let lastMessageDate = null;

                        return (searchQuery ? searchResults : allMessages).map(
                          (message, index) => {
                            // Parse date from created_at or fallback to time string
                            const currentMessageDate = message.created_at
                              ? new Date(message.created_at)
                              : typeof message.time === "string" &&
                                message.time.includes(":")
                              ? new Date() // If it's just a time without date, use today
                              : new Date(message.time || Date.now());

                            // Check if this message is from a different date than the previous one
                            const showDateLabel =
                              !lastMessageDate ||
                              currentMessageDate.toDateString() !==
                                lastMessageDate.toDateString();

                            // Update lastMessageDate for next iteration
                            lastMessageDate = currentMessageDate;

                            return (
                              <React.Fragment key={message.id || index}>
                                {/* Show date separator if needed */}
                                {showDateLabel && (
                                  <div className="chat-date-indicator text-center mb-4">
                                    <Text className="chat-date-text text-xs text-grayText px-3 py-1 bg-gray rounded-full">
                                      {formatDateLabel(currentMessageDate)}
                                    </Text>
                                  </div>
                                )}

                                {/* Message content */}
                                <div
                                  className={`chat-message mb-4 ${
                                    message.isSender
                                      ? "chat-message-sent"
                                      : "chat-message-received"
                                  }`}
                                >
                                  {message?.isSender ? (
                                    // Sent message - right side with no avatar
                                    <div className="chat-message-container cursor-pointer">
                                      {/* Handle attachments */}
                                      {message?.attachments &&
                                        message?.attachments?.length > 0 && (
                                          <div>
                                            {/* Render media grid for image/video attachments */}
                                            {renderMediaGrid(
                                              message.attachments
                                            )}
                                            {renderAudioAttachments(
                                              message.attachments,
                                              true
                                            )}

                                            {/* Render non-media attachments */}
                                            <div className="chat-attachments mt-2 cursor-pointer">
                                              {message.attachments
                                                .filter(
                                                  (attachment) =>
                                                    attachment.content_type !==
                                                      "image" &&
                                                    attachment.content_type !==
                                                      "video" &&
                                                    !attachment.content_type?.includes(
                                                      "audio"
                                                    )
                                                )
                                                .map((attachment, index) => (
                                                  <div
                                                    key={index}
                                                    className="p-2 sm:p-3 rounded-lg chat-message-file bg-primary bg-opacity-30 text-white flex items-center mb-2 cursor-pointer"
                                                    onClick={() => {
                                                      window.open(
                                                        `${
                                                          import.meta.env
                                                            .VITE_IMAGE_BASE_URL
                                                        }/${
                                                          attachment.file_path
                                                        }`,
                                                        "_blank"
                                                      );
                                                    }}
                                                  >
                                                    <div className="chat-file-icon bg-[#cc5700] sm:py-1 rounded-lg mr-2 p-2 flex-shrink-0 !text-white">
                                                      {attachment.content_type &&
                                                      attachment.content_type.includes(
                                                        "pdf"
                                                      ) ? (
                                                        <i className="icon-pdf text-xs sm:text-3xl"></i>
                                                      ) : attachment.content_type &&
                                                        attachment.content_type.includes(
                                                          "document"
                                                        ) ? (
                                                        <i className="icon-pdf text-xs sm:text-3xl"></i>
                                                      ) : attachment.content_type &&
                                                        attachment.content_type.includes(
                                                          "audio"
                                                        ) ? (
                                                        <SoundOutlined className="text-xs sm:text-3xl" />
                                                      ) : (
                                                        <FileOutlined className="text-xs sm:text-3xl" />
                                                      )}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden mr-2">
                                                      <Text
                                                        className="chat-file-name block text-xs sm:text-sm truncate w-full"
                                                        title={
                                                          attachment.file_name ||
                                                          "Attachment"
                                                        } // Show full name on hover
                                                      >
                                                        {attachment.file_name ||
                                                          "Attachment"}
                                                      </Text>
                                                      {attachment.file_size && (
                                                        <Text className="chat-file-size text-xs text-white whitespace-nowrap">
                                                          {Math.round(
                                                            attachment.file_size /
                                                              1024
                                                          )}{" "}
                                                          KB
                                                        </Text>
                                                      )}
                                                    </div>
                                                  </div>
                                                ))}
                                            </div>
                                          </div>
                                        )}

                                      {/* Regular message text if present */}
                                      {message.text && (
                                        <div className="chat-message-bubble p-2 sm:p-3 rounded-lg chat-message-sent-bubble bg-primary text-black">
                                          <Text className="chat-message-text text-sm sm:text-base">
                                            <MessageText
                                              text={message.text}
                                              onChatroomLinkClick={
                                                handleChatroomLinkClick
                                              }
                                            />
                                          </Text>
                                        </div>
                                      )}

                                      {/* For sent messages: only time and read status, NO "You" text */}
                                      <div className="flex justify-end items-center mt-1">
                                        <Text className="chat-message-time text-xs text-grayText">
                                          {message.time}
                                        </Text>
                                        {activeTab === "chatRoom" && (
                                          <>
                                            <Text className="text-xs text-grayText mx-1">
                                              •
                                            </Text>
                                            <Text className="text-xs text-white">
                                              You
                                            </Text>
                                          </>
                                        )}
                                        {message.isRead && (
                                          <div className="chat-message-status ml-1">
                                            <div className="chat-double-tick flex">
                                              <CheckOutlined className="text-xs text-primary mr-[-6px]" />
                                              <CheckOutlined className="text-xs text-primary" />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    // Received message - with avatar at the left
                                    <div className="flex w-full">
                                      {activeTab === "chatRoom" && (
                                        <div className="flex-shrink-0 self-end mr-2">
                                          {message.senderAvatar ? (
                                            <Avatar
                                              size={34}
                                              src={`${
                                                import.meta.env
                                                  .VITE_IMAGE_BASE_URL
                                              }/${message.senderAvatar}`}
                                              className="object-cover rounded-full"
                                            ></Avatar>
                                          ) : (
                                            <Avatar
                                              size={34}
                                              style={{
                                                backgroundColor: "#fde3cf",
                                                color: "#f56a00",
                                              }}
                                              className=" object-cover rounded-full !text-3xl"
                                            >
                                              {message.sender?.[0] || "?"}
                                            </Avatar>
                                          )}
                                        </div>
                                      )}
                                      <div className="chat-message-container cursor-pointer">
                                        {/* Handle attachments */}

                                        {message?.attachments &&
                                          message?.attachments?.length > 0 && (
                                            <div>
                                              {/* Render media grid for image/video attachments */}
                                              {renderMediaGrid(
                                                message.attachments
                                              )}
                                              {renderAudioAttachments(
                                                message.attachments,
                                                false
                                              )}

                                              {/* Render non-media attachments */}
                                              <div className="chat-attachments mt-2 cursor-pointer">
                                                {message?.attachments
                                                  .filter(
                                                    (attachment) =>
                                                      attachment.content_type !==
                                                        "image" &&
                                                      attachment.content_type !==
                                                        "video" &&
                                                      !attachment.content_type?.includes(
                                                        "audio"
                                                      )
                                                  )
                                                  .map((attachment, index) => (
                                                    <div
                                                      key={index}
                                                      className="p-2 sm:p-3 rounded-lg chat-message-file bg-gray bg-opacity-70 text-white flex items-center mb-2 cursor-pointer"
                                                      style={{
                                                        maxWidth: "280px",
                                                        width: "fit-content",
                                                      }}
                                                      onClick={() => {
                                                        window.open(
                                                          `${
                                                            import.meta.env
                                                              .VITE_IMAGE_BASE_URL
                                                          }/${
                                                            attachment.file_path
                                                          }`,
                                                          "_blank"
                                                        );
                                                      }}
                                                    >
                                                      <div className="chat-file-icon bg-[#2c2c2c] sm:py-1 rounded-lg mr-2 p-2 !text-white receiverSide">
                                                        {attachment.content_type &&
                                                        attachment.content_type.includes(
                                                          "pdf"
                                                        ) ? (
                                                          <i className="icon-pdf text-xs sm:text-3xl"></i>
                                                        ) : attachment.content_type &&
                                                          attachment.content_type.includes(
                                                            "document"
                                                          ) ? (
                                                          <i className="icon-pdf text-xs sm:text-3xl"></i>
                                                        ) : attachment.content_type &&
                                                          attachment.content_type.includes(
                                                            "audio"
                                                          ) ? (
                                                          <SoundOutlined className="text-xs sm:text-3xl" />
                                                        ) : (
                                                          <FileOutlined className="text-xs sm:text-3xl" />
                                                        )}
                                                      </div>
                                                      <div className="flex-1 overflow-hidden mr-2">
                                                        <Text
                                                          className="chat-file-name block text-xs sm:text-sm truncate"
                                                          style={{
                                                            maxWidth: "180px",
                                                          }}
                                                          title={
                                                            attachment?.file_name ||
                                                            "Attachment"
                                                          }
                                                        >
                                                          {attachment?.file_name ||
                                                            "Attachment"}
                                                        </Text>
                                                        {attachment?.file_size && (
                                                          <Text className="chat-file-size text-xs text-white">
                                                            {Math.round(
                                                              attachment?.file_size /
                                                                1024
                                                            )}{" "}
                                                            KB
                                                          </Text>
                                                        )}
                                                      </div>
                                                    </div>
                                                  ))}
                                              </div>
                                            </div>
                                          )}

                                        {/* Regular message text if present */}
                                        {message.text && (
                                          <div className="chat-message-bubble p-2 sm:p-3 rounded-lg chat-message-received-bubble bg-gray text-white">
                                            <Text className="chat-message-text text-sm sm:text-base">
                                              <MessageText
                                                text={message.text}
                                                onChatroomLinkClick={
                                                  handleChatroomLinkClick
                                                }
                                              />
                                            </Text>
                                          </div>
                                        )}
                                        {/* For received messages: show sender name only in chatrooms, otherwise just time */}
                                        {activeTab === "chatRoom" ? (
                                          <div className="flex items-center mt-1 flex-nowrap whitespace-nowrap overflow-visible w-full">
                                            <Text className="text-xs text-white overflow-visible">
                                              {message.sender}
                                            </Text>
                                            <Text className="text-xs text-grayText mx-1 flex-shrink-0">
                                              •
                                            </Text>
                                            <Text className="chat-message-time text-xs font-medium text-grayText flex-shrink-0">
                                              {message.time}
                                            </Text>
                                          </div>
                                        ) : (
                                          <div className="flex items-center mt-1">
                                            <Text className="chat-message-time text-xs text-grayText">
                                              {message.time}
                                            </Text>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </React.Fragment>
                            );
                          }
                        );
                      })()}
                    </>
                  )}

                  {/* Show when search has no results */}
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
                <div className="chat-input-area p-2 sm:p-4 border-t-[1px] border-solid border-[#373737] sticky bottom-0 bg-gray z-30">
                  {isReceiverInactive ? (
                    <div className="flex justify-center items-center">
                      <Text type="secondary" className="pt-2">
                        {activeTab === "chat" ? "This user" : "This Chat Room"}{" "}
                        is Currently Inactive.
                      </Text>
                    </div>
                  ) : (
                    <div className="chat-input-wrapper relative bg-darkGray rounded-full">
                      <Input
                        size="large"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="rounded-full bg-darkGray w-full pr-40 py-4 h-[68px] border-liteGray"
                        style={{
                          paddingLeft: "12px",
                          paddingRight: currentWidth < 640 ? "90px" : "200px",
                          height: currentWidth < 640 ? "42px" : "52px",
                        }}
                        disabled={chunkingProgress.isChunking}
                      />
                      <div className="chat-input-actions absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-4">
                        <Button
                          type="text"
                          className="chat-action-button text-grayText hover:text-primary p-1 text-lg md:text-2xl"
                          onClick={() => showFileUploadModal()}
                          icon={<i className="icon-attachments" />}
                          disabled={chunkingProgress.isChunking}
                        />
                        <Button
                          type="text"
                          className="chat-action-button text-grayText hover:text-primary p-1 text-lg md:text-2xl"
                          onClick={showVoiceRecordingModal}
                          icon={<i className="icon-voice" />}
                          disabled={chunkingProgress.isChunking}
                        />

                        <Button
                          type="primary"
                          size="middle"
                          onClick={() => handleSendMessage()}
                          loading={chatMessageLoading}
                          className="chat-send-button flex items-center justify-center ml-1 rounded-full text-sm md:text-base"
                          disabled={chunkingProgress.isChunking}
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="absolute top-1/2 left-[68%] transform -translate-x-[68%] -translate-y-1/2 flex flex-col justify-center items-center">
            <div className="flex flex-col items-center justify-center h-full w-full bg-gray p-4">
              <div className="text-center max-w-md">
                <div className="mb-8">
                  <div className="bg-darkGray w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6">
                    {activeTab === "chat" ? (
                      <CommentOutlined
                        style={{ fontSize: "36px", color: "#FF6D00" }}
                      />
                    ) : (
                      <TeamOutlined
                        style={{ fontSize: "36px", color: "#FF6D00" }}
                      />
                    )}
                  </div>
                  <Title level={3} className="text-white">
                    No {activeTab === "chat" ? "Chat" : "Chat room"} Selected
                  </Title>
                  <Text className="text-grayText block mb-8">
                    {activeTab === "chat"
                      ? "Select a contact from the list to start chatting or search for someone specific."
                      : "Select a chat room to join the conversation or create a new room."}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contact Details Sidebar - Different for mobile vs desktop */}
      {showDetailsSidebar && activeItem && (
        <div
          className={`contact-details-wrapper ${sidebarReady ? "show" : ""}`}
          style={{
            opacity: isDesktop ? (sidebarReady ? 1 : 0) : 1,
            width: isDesktop ? "35%" : "100%",
          }}
        >
          <ContactDetails
            activeItem={activeItem}
            activeTab={activeTab}
            onClose={closeSidebar}
            windowWidth={currentWidth}
            isUserJoinedRoom={isUserJoinedRoom}
            setIsUserJoinedRoom={setIsUserJoinedRoom}
            groupMemberStatus={groupMemberStatus}
          />
        </div>
      )}

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
        <div className="pt-5">
          {/* Upload Dragger Area */}
          <Upload.Dragger
            multiple
            fileList={selectedFiles}
            onChange={handleFileSelect}
            beforeUpload={(file, fileList) => {
              let shouldReject = false;

              // Check file size
              if (file.size > MAX_FILE_SIZE_BYTES) {
                oversizedFilesRef.current.push(file.name);
                shouldReject = true;
              }

              // Check file type
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
                file.type?.includes("application/vnd.ms-excel") ||
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
                isHtml; // Add HTML to accepted types

              if (!isAcceptedFileType && file.size <= MAX_FILE_SIZE_BYTES) {
                invalidFilesRef.current.push(file.name);
                shouldReject = true;
              }

              // Check if adding these files would exceed the 10-file limit
              const totalFilesAfterUpload =
                selectedFiles.length + fileList.length;

              if (totalFilesAfterUpload > 10) {
                notification.info({
                  message: "Info",
                  description: "You can only upload a maximum of 10 files!",
                });
                return Upload.LIST_IGNORE;
              }

              // If this is the last file in the batch, show notifications
              const currentIndex = fileList.indexOf(file);
              if (
                currentIndex === fileList.length - 1 &&
                !notificationShownRef.current
              ) {
                notificationShownRef.current = true;

                // Show notification for oversized files
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

                // Show notification for invalid file types
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

                // Reset refs after showing notifications
                setTimeout(() => {
                  oversizedFilesRef.current = [];
                  invalidFilesRef.current = [];
                  notificationShownRef.current = false;
                }, 100);
              }

              return shouldReject ? Upload.LIST_IGNORE : false;
            }}
            onDrop={() => {
              // Reset the refs when new files are dropped
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
            disabled={selectedFiles.length >= 10 || chunkingProgress.isChunking}
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
                Supported formats: Images, Videos, Documents, HTML Files{" "}
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
                  // Determine file type
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
                  const isCsv =
                    file.type?.includes("text/csv") ||
                    file.type?.includes("application/csv") ||
                    file.name?.toLowerCase().endsWith(".csv");
                  const isHtml =
                    file.type?.includes("text/html") ||
                    file.name?.toLowerCase().endsWith(".html") ||
                    file.name?.toLowerCase().endsWith(".htm");
                  // Set icon based on file type
                  let fileIcon;

                  if (isImage) {
                    fileIcon = <i className="icon-photo text-lg" />;
                  } else if (isVideo) {
                    fileIcon = <i className="icon-video text-lg" />;
                  } else if (isPdf) {
                    fileIcon = <i className="icon-pdf text-lg" />;
                  } else if (isDoc) {
                    fileIcon = <i className="icon-documents text-lg" />;
                  } else if (isExcel) {
                    fileIcon = <i className="icon-documents text-lg" />;
                  } else if (isPpt) {
                    fileIcon = <i className="icon-documents text-lg" />;
                  } else if (isCsv) {
                    fileIcon = <i className="icon-documents text-lg" />;
                  } else if (isHtml) {
                    // Use code icon for HTML files, or you can use a web/html specific icon if available
                    fileIcon = <i className="icon-documents text-lg" />; // or <i className="icon-code text-lg" /> if available
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

          {/* Chunking Progress */}
          {/* {chunkingProgress.isChunking && (
            <div className="mt-4 mb-4">
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
          )} */}

          {/* Footer with actions */}
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
                  {chunkingProgress.isChunking
                    ? "Processing..."
                    : isUploadingFiles
                    ? "Sending..."
                    : "Send Files"}
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
        onCancel={handleVoiceModalCancel} // Use the new handler
        footer={null}
        width={600}
        closable={!chunkingProgress.isChunking}
        maskClosable={!chunkingProgress.isChunking}
      >
        <MicRecorder
          ref={micRecorderRef} // Add ref to control the recorder
          setOpenVoiceModal={setVoiceModalVisible}
          onRecordingComplete={handleVoiceRecordingComplete}
        />
      </Modal>
      {/* Media viewing modal */}
      <Modal
        onCancel={handleMediaModalClose}
        afterClose={pauseAllMediaVideos}
        open={mediaModalVisible}
        // onCancel={() => setMediaModalVisible(false)}
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

export default ChatWindow;
