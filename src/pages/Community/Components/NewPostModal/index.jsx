import {
  Avatar,
  Button,
  Col,
  DatePicker,
  Divider,
  Input,
  message,
  Modal,
  Row,
  TimePicker,
  Typography,
  Upload,
  notification,
  Progress,
} from "antd";
import EmojiPicker from "emoji-picker-react";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addFeed,
  updateFeedAction,
} from "../../../../services/Store/Feed/action";
import { InboxOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { getStorage } from "../../../../utils/commonfunction";

// Add dayjs plugins for UTC conversion
dayjs.extend(utc);
dayjs.extend(timezone);

// Add constants for file size limit
const MAX_FILE_SIZE_MB = 50; // Maximum file size in MB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert to bytes
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks - S3 multipart upload minimum requirement

const NewPostModal = ({
  isOpenNewChatModal,
  setIsOpenNewChatModal,
  setCreatedPostResponse,
  isEditMode = false,
  editFeedData = null,
  onEditSuccess,
}) => {
  const { TextArea } = Input;
  const { Text, Title } = Typography;
  const emojiPickerRef = useRef(null);
  const inputRef = useRef(null);
  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();

  // Add refs for tracking oversized files
  const oversizedFilesRef = useRef([]);
  const invalidFilesRef = useRef([]);
  const notificationShownRef = useRef(false);

  const [value, setValue] = useState("");
  const [fileList, setFileList] = useState([]);
  const [fileListVideo, setFileListVideo] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [postMessage, setPostMessage] = useState("");
  const [datePicker, setDatePicker] = useState("");
  const [timePicker, setTimePicker] = useState("");
  const [isSchedule, setIsSchedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  // Add separate loading states for each button
  const [draftLoading, setDraftLoading] = useState(false);
  const [scheduleButtonLoading, setScheduleButtonLoading] = useState(false);
  const [postLoading, setPostLoading] = useState(false);

  // State to track existing media that should be retained
  const [existingMedia, setExistingMedia] = useState([]);
  const [deletedMediaIds, setDeletedMediaIds] = useState([]);

  // New chunking states
  const [chunkingProgress, setChunkingProgress] = useState({
    isChunking: false,
    currentFile: 0,
    totalFiles: 0,
    currentFileName: '',
    chunkProgress: 0,
    overallProgress: 0
  });

  const { feedLoading } = useSelector((state) => state?.feeds);
  const { userForEdit } = useSelector((state) => state?.usersmanagement);
  const userLoginRole = getStorage("userLoginRole", true);


  // Initialize form with edit data
  useEffect(() => {
    if (isEditMode && editFeedData && isOpenNewChatModal) {
      // Set post message
      setPostMessage(editFeedData?.content || "");

      // Set existing media if available
      if (editFeedData?.media && editFeedData?.media?.length > 0) {
        const images = [];
        const videos = [];
        editFeedData?.media?.forEach((media) => {
          const fileObj = {
            uid: media.id || media.uid,
            name: media.original_filename || media.file_name || `Media ${media.id}`,
            status: "done",
            url: media.url,
            type: media.type === "image" ? "image/*" : "video/*",
            isExisting: true,
            mediaId: media.id,
          };

          if (media.type === "image") {
            images.push(fileObj);
          } else {
            videos.push(fileObj);
          }
        });

        setFileList(images);
        setFileListVideo(videos);
        setExistingMedia(editFeedData.media);
      }

      // Set schedule data if scheduled
      if (editFeedData.status === "Scheduled" && editFeedData.scheduled_at) {
        setIsSchedule(true);
        // Convert UTC scheduled_at back to local time for editing
        const scheduledDate = dayjs.utc(editFeedData.scheduled_at).local();
        setSelectedDate(scheduledDate);
        setDatePicker(scheduledDate.format("YYYY-MM-DD"));
        setTimePicker(scheduledDate.format("h:mm:ss A"))
      }
    }
  }, [isEditMode, editFeedData, isOpenNewChatModal]);

  // Reset all form fields to initial state
  const resetFormFields = () => {
    setValue("");
    setFileList([]);
    setFileListVideo([]);
    setShowEmojiPicker(false);
    setPostMessage("");
    setDatePicker("");
    setTimePicker("");
    setIsSchedule(false);
    setSelectedDate(null);
    setExistingMedia([]);
    setDeletedMediaIds([]);
    setChunkingProgress({
      isChunking: false,
      currentFile: 0,
      totalFiles: 0,
      currentFileName: '',
      chunkProgress: 0,
      overallProgress: 0
    });
    // Reset file tracking refs
    oversizedFilesRef.current = [];
    invalidFilesRef.current = [];
    notificationShownRef.current = false;
  };

  // Handle modal cancel with form reset
  const handleModalCancel = () => {
    resetFormFields();
    setIsOpenNewChatModal(false);
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpenNewChatModal && !isEditMode) {
      resetFormFields();
    }
  }, [isOpenNewChatModal, isEditMode]);

  const handleModalSubmit = () => {
  };

  // Add CSS for handling long filenames
  useEffect(() => {
    // Add CSS to handle long filenames in the upload list
    const style = document.createElement("style");
    style.innerHTML = `
            .ant-upload-list-item-name {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 260px;
                display: inline-block;
            }
            
            .ant-upload-list-item {
                margin-top: 8px;
            }
        `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // // Helper function to generate unique upload ID
  // const generateUploadId = () => {
  //   return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  // };


  // Helper function to get auth headers - matches your Redux API calls
  const getAuthHeaders = () => {
    let token = userForEdit?.token; // This will use static token first


    const headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('No authentication token found!');
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

      const response = await fetch(`${getApiBaseUrl()}/feed/generate-presigned-url`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);


      if (!response.ok) {
        clearTimeout(timeoutId);
        const errorText = await response.text();
        console.error('❌ Failed to get presigned URL:', errorText);
        throw new Error(`Failed to get presigned URL: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to get presigned URL');
      }

      const { presignedUrl, fileKey, fileName, fileType } = result;

      // Upload directly to S3
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });


      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ Failed to upload to S3:', errorText);
        throw new Error(`Failed to upload to S3: ${uploadResponse.statusText}`);
      }


      // Use CloudFront URL if provided, otherwise use S3 URL
      const finalUrl = result.finalUrl || presignedUrl.split('?')[0];

      return {
        key: fileKey,
        name: fileName,
        type: fileType,
        url: finalUrl, // ✅ Use CloudFront URL
        size: file.size
      };

    } catch (error) {
      console.error('❌ Small file upload failed:', error);
      if (error.name === 'AbortError') {
        throw new Error('Upload request timed out. Please try again.');
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

      const initResponse = await fetch(`${getApiBaseUrl()}/feed/initialize-multipart-upload`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type
        }),
        signal: initController.signal
      });

      clearTimeout(initTimeoutId);


      if (!initResponse.ok) {
        clearTimeout(initTimeoutId);
        const errorText = await initResponse.text();
        console.error('❌ Failed to initialize multipart upload:', errorText);
        throw new Error(`Failed to initialize multipart upload: ${initResponse.statusText}`);
      }

      const initResult = await initResponse.json();

      if (!initResult.success) {
        throw new Error(initResult.message || 'Failed to initialize multipart upload');
      }

      const { uploadId, fileKey, fileName, fileType } = initResult;

      // Step 2: Get presigned URLs for all parts (FAST Laravel endpoint - no S3 calls)
      const urlsController = new AbortController();
      const urlsTimeoutId = setTimeout(() => urlsController.abort(), 10000); // 10 second timeout

      const urlsResponse = await fetch(`${getApiBaseUrl()}/feed/generate-upload-part-urls`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadId: uploadId,
          fileKey: fileKey,
          totalParts: totalParts
        }),
        signal: urlsController.signal
      });

      clearTimeout(urlsTimeoutId);


      if (!urlsResponse.ok) {
        clearTimeout(urlsTimeoutId);
        const errorText = await urlsResponse.text();
        console.error('❌ Failed to get upload part URLs:', errorText);
        throw new Error(`Failed to get upload part URLs: ${urlsResponse.statusText}`);
      }

      const urlsResult = await urlsResponse.json();

      if (!urlsResult.success) {
        throw new Error(urlsResult.message || 'Failed to get upload part URLs');
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
          method: 'PUT',
          body: chunk,
          headers: {
            'Content-Type': file.type
          }
        });


        if (!partResponse.ok) {
          const errorText = await partResponse.text();
          console.error(`❌ Failed to upload part ${partNumber}:`, errorText);
          throw new Error(`Failed to upload part ${partNumber}: ${partResponse.statusText}`);
        }

        const etag = partResponse.headers.get('ETag');

        uploadedParts.push({
          PartNumber: partNumber,
          ETag: etag
        });

        // Report progress
        if (onProgress) {
          const progress = Math.round((partNumber / totalParts) * 100);
          onProgress({
            currentChunk: partNumber,
            totalChunks: totalParts,
            progress: progress,
            fileName: file.name
          });
        }
      }

      // Step 4: Complete multipart upload (FAST Laravel endpoint - 1 S3 call)
      const completeController = new AbortController();
      const completeTimeoutId = setTimeout(() => completeController.abort(), 15000); // 15 second timeout for completion

      const completeResponse = await fetch(`${getApiBaseUrl()}/feed/complete-multipart-upload`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadId: uploadId,
          fileKey: fileKey,
          parts: uploadedParts,
          fileType: file.type,
          fileSize: file.size
        }),
        signal: completeController.signal
      });

      clearTimeout(completeTimeoutId);


      if (!completeResponse.ok) {
        clearTimeout(completeTimeoutId);
        const errorText = await completeResponse.text();
        console.error('❌ Failed to complete multipart upload:', errorText);
        throw new Error(`Failed to complete multipart upload: ${completeResponse.statusText}`);
      }

      const completeResult = await completeResponse.json();

      if (!completeResult.success) {
        throw new Error(completeResult.message || 'Failed to complete multipart upload');
      }

      return completeResult.file;

    } catch (error) {
      console.error('❌ Large file upload failed:', error);
      if (error.name === 'AbortError') {
        throw new Error('Upload request timed out. Please try again.');
      }
      throw error;
    }
  };

  // Function to process files - upload directly to S3 using presigned URLs
  const processLargeFiles = async (files) => {
    const chunkThreshold = 5 * 1024 * 1024; // 5MB
    const largeFiles = files.filter(file => {
      const actualFile = file.originFileObj || file;
      return !file.isExisting && actualFile.size > chunkThreshold;
    });

    const smallFiles = files.filter(file => {
      const actualFile = file.originFileObj || file;
      return !file.isExisting && actualFile.size <= chunkThreshold;
    });


    if (largeFiles.length === 0 && smallFiles.length === 0) {
      return { uploadedFiles: [] };
    }

    // Start upload process
    setChunkingProgress({
      isChunking: true,
      currentFile: 0,
      totalFiles: largeFiles.length + smallFiles.length,
      currentFileName: '',
      chunkProgress: 0,
      overallProgress: 0
    });

    const uploadedFiles = [];

    try {
      let fileIndex = 0;

      // Upload small files first
      for (const file of smallFiles) {
        const actualFile = file.originFileObj || file;


        setChunkingProgress(prev => ({
          ...prev,
          currentFile: fileIndex + 1,
          currentFileName: actualFile.name,
          chunkProgress: 0,
        }));

        const uploadedFile = await uploadSmallFileToS3(actualFile);
        uploadedFiles.push(uploadedFile);

        fileIndex++;
        const overallProgress = Math.round((fileIndex / (largeFiles.length + smallFiles.length)) * 100);
        setChunkingProgress(prev => ({
          ...prev,
          chunkProgress: 100,
          overallProgress
        }));

      }

      // Upload large files
      for (const file of largeFiles) {
        const actualFile = file.originFileObj || file;


        setChunkingProgress(prev => ({
          ...prev,
          currentFile: fileIndex + 1,
          currentFileName: actualFile.name,
          chunkProgress: 0,
        }));

        const uploadedFile = await uploadLargeFileToS3(actualFile, (progress) => {
          setChunkingProgress(prev => ({
            ...prev,
            chunkProgress: progress.progress,
            overallProgress: Math.round(((fileIndex + (progress.progress / 100)) / (largeFiles.length + smallFiles.length)) * 100)
          }));
        });

        uploadedFiles.push(uploadedFile);
        fileIndex++;

      }

      setChunkingProgress(prev => ({
        ...prev,
        isChunking: false,
      }));

      return { uploadedFiles };

    } catch (error) {
      console.error('❌ File processing failed:', error);
      setChunkingProgress(prev => ({
        ...prev,
        isChunking: false,
      }));
      throw error;
    }
  };

  const uploadProps = {
    name: "file",
    multiple: true,
    fileList,
    showUploadList: false,
    beforeUpload: (file, fileList) => {
      let shouldReject = false;

      // Check file size first
      if (file.size > MAX_FILE_SIZE_BYTES) {
        oversizedFilesRef.current.push(file.name);
        shouldReject = true;
      }

      // Check file type
      const allowedTypes = [
        ".jpeg",
        ".jpg",
        ".gif",
        ".png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/png",
      ];

      const isValidType = allowedTypes.includes(file.type);

      if (!isValidType && file.size <= MAX_FILE_SIZE_BYTES) {
        invalidFilesRef.current.push(file.name);
        shouldReject = true;
      }

      // Check if this is the last file in the batch
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
            message: `${count} file${count > 1 ? "s" : ""} not uploaded`,
            description: `File${count > 1 ? "s" : ""
              } exceeded the ${MAX_FILE_SIZE_MB}MB size limit.`,
            duration: 5,
          });
        }

        // Show notification for invalid file types
        if (invalidFilesRef.current.length > 0) {
          const count = invalidFilesRef.current.length;
          notification.error({
            message: `${count} file${count > 1 ? "s" : ""} not uploaded`,
            description: `Invalid file type${count > 1 ? "s" : ""
              }. Only JPG, JPEG, GIF and PNG files are allowed.`,
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

      return shouldReject ? Upload.LIST_IGNORE : true;
    },
    onChange: (info) => {
      // Reset refs when starting new selection
      if (info.file.status === "removed" || info.fileList.length === 0) {
        oversizedFilesRef.current = [];
        invalidFilesRef.current = [];
        notificationShownRef.current = false;
      }

      // This is called after beforeUpload for the entire batch
      // Filter out any files that would exceed limits
      let newFileList = [...info.fileList];

      // Ensure we don't exceed the total limit (10)
      const totalFiles = newFileList.length + fileListVideo.length;
      if (totalFiles > 10) {
        const maxImagesToAdd = 10 - fileListVideo.length;
        newFileList = newFileList.slice(0, maxImagesToAdd);

        // Only show the error message once per batch upload
        if (info.file.uid === info.fileList[info.fileList.length - 1].uid) {
          const filesNotAdded = totalFiles - 10;
          notification.info({
            message: "File limit exceeded",
            description: `Total limit is 10 files. ${filesNotAdded} file(s) not added.`,
            duration: 4,
          });
        }
      }

      setFileList(newFileList);
    },
    onRemove: (file) => {
      // If it's an existing file, add to deleted list
      if (file.isExisting && file.mediaId) {
        setDeletedMediaIds((prev) => [...prev, file.mediaId]);
      }
      // Remove file from fileList
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
  };

  const uploadPropsVideo = {
    name: "file",
    multiple: true,
    fileList: fileListVideo,
    showUploadList: false,
    beforeUpload: (file, fileList) => {
      let shouldReject = false;

      // Check file size first
      if (file.size > MAX_FILE_SIZE_BYTES) {
        oversizedFilesRef.current.push(file.name);
        shouldReject = true;
      }

      // Check file type
      const allowedTypes = [".mp4", "video/mp4", ".webm", "video/webm"];
      const isValidType = allowedTypes.includes(file.type);

      if (!isValidType && file.size <= MAX_FILE_SIZE_BYTES) {
        invalidFilesRef.current.push(file.name);
        shouldReject = true;
      }

      // Check if this is the last file in the batch
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
            message: `${count} file${count > 1 ? "s" : ""} not uploaded`,
            description: `File${count > 1 ? "s" : ""
              } exceeded the ${MAX_FILE_SIZE_MB}MB size limit.`,
            duration: 5,
          });
        }

        // Show notification for invalid file types
        if (invalidFilesRef.current.length > 0) {
          const count = invalidFilesRef.current.length;
          notification.error({
            message: `${count} file${count > 1 ? "s" : ""} not uploaded`,
            description: `Invalid file type${count > 1 ? "s" : ""
              }. Only MP4 and WEBM files are allowed.`,
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

      // Return false to stop auto upload if file should be rejected
      return shouldReject ? false : false; // Always return false as per original logic
    },
    onChange: (info) => {
      // Reset refs when starting new selection
      if (info.file.status === "removed" || info.fileList.length === 0) {
        oversizedFilesRef.current = [];
        invalidFilesRef.current = [];
        notificationShownRef.current = false;
      }

      // Get the files from the onChange event
      const newFiles = [...info.fileList].filter(
        (file) => !fileListVideo.includes(file)
      );

      // Filter files by type and size
      const allowedTypes = [".mp4", "video/mp4", ".webm", "video/webm"];
      const validFiles = newFiles.filter((file) => {
        const isValidType = allowedTypes.includes(file.type);
        const isValidSize = file.size <= MAX_FILE_SIZE_BYTES;
        return isValidType && isValidSize;
      });

      // Check if adding these files would exceed the 10-file limit
      const currentTotal = fileList.length + fileListVideo.length;
      const newTotal = currentTotal + validFiles.length;

      if (currentTotal >= 10) {
        notification.error({
          message: "File limit reached",
          description: "Maximum of 10 files reached. Cannot add more files.",
          duration: 4,
        });
        return;
      }

      if (newTotal > 10) {
        // Only add enough files to reach the 10-file limit
        const allowedToAdd = 10 - currentTotal;
        const filesToAdd = validFiles.slice(0, allowedToAdd);

        setFileListVideo([...fileListVideo, ...filesToAdd]);

        // Show a single message about files not added
        const filesNotAdded = validFiles.length - allowedToAdd;
        notification.info({
          message: "Partial upload",
          description: `Only added ${allowedToAdd} files. ${filesNotAdded} file(s) not added due to the 10-file limit.`,
          duration: 4,
        });
      } else {
        // Add all valid files
        setFileListVideo([...fileListVideo, ...validFiles]);
      }
    },
    onRemove: (file) => {
      // If it's an existing file, add to deleted list
      if (file.isExisting && file.mediaId) {
        setDeletedMediaIds((prev) => [...prev, file.mediaId]);
      }
      // Remove file from fileListVideo
      const index = fileListVideo.indexOf(file);
      const newFileList = fileListVideo.slice();
      newFileList.splice(index, 1);
      setFileListVideo(newFileList);
    },
  };

  const handleEmojiClick = (emojiObject) => {
    // Prevent adding emoji if it would exceed the 3000 character limit
    if (postMessage.length + emojiObject.emoji.length <= 3000) {
      setPostMessage((prevComment) => prevComment + emojiObject.emoji);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      messageApi.warning("Message cannot exceed 3000 characters");
    }
  };

  const toggleEmojiPicker = (e) => {
    e.stopPropagation();
    setShowEmojiPicker(!showEmojiPicker);
  };

  // Disable dates before today
  const disabledDate = (current) => {
    return current && current < new Date().setHours(0, 0, 0, 0);
  };

  // Disable times before current time if the date is today
  const disabledTime = (now) => {
    const currentDate = new Date();
    const isToday =
      selectedDate &&
      selectedDate.year() === currentDate.getFullYear() &&
      selectedDate.month() === currentDate.getMonth() &&
      selectedDate.date() === currentDate.getDate();

    if (isToday) {
      return {
        disabledHours: () => {
          return Array.from({ length: currentDate.getHours() }, (_, i) => i);
        },
        disabledMinutes: (hour) => {
          if (hour === currentDate.getHours()) {
            return Array.from(
              { length: currentDate.getMinutes() },
              (_, i) => i
            );
          }
          return [];
        },
      };
    }
    return {};
  };

  const onChangeDate = (date, dateString) => {
    setDatePicker(dateString);
    setSelectedDate(date);
  };

  const onChangeTime = (time, timeString) => {
    setTimePicker(timeString);
  };

  const onClickSchedule = () => {
    setScheduleButtonLoading(true);
    setIsSchedule(!isSchedule);
    setTimeout(() => {
      setScheduleButtonLoading(false);
    }, 300);
  };

  // Function to convert local date and time to UTC format
  const getUTCScheduledTime = () => {
    if (!datePicker || !timePicker) {
      return null;
    }

    // Combine date and time strings and create a dayjs object
    const localDateTime = dayjs(`${datePicker} ${timePicker}`);

    // Convert to UTC and format as ISO string
    return localDateTime.utc().format('YYYY-MM-DD HH:mm:ss');
  };

  const onClickDraft = async () => {
    // Check file sizes before submitting
    const oversizedFiles = [...fileList, ...fileListVideo].filter(
      (file) =>
        !file.isExisting &&
        (file.size || file.originFileObj?.size || 0) > MAX_FILE_SIZE_BYTES
    );

    if (oversizedFiles.length > 0) {
      const count = oversizedFiles.length;
      notification.error({
        message: `${count} file${count > 1 ? "s" : ""} not uploaded`,
        description: `File${count > 1 ? "s" : ""
          } exceeded the ${MAX_FILE_SIZE_MB}MB size limit.`,
        duration: 5,
      });
      return;
    }

    setDraftLoading(true);

    try {
      const formData = new FormData();

      if (isEditMode) {
        // For edit mode, include feed ID
        formData.append("feed_id", editFeedData.id);

        // Add deleted media IDs if any
        if (deletedMediaIds.length > 0) {
          deletedMediaIds.forEach((id, index) => {
            formData.append(`removed_files[${index}]`, id);
          });
        }
      }

      // Get only new files (not existing ones)
      const newFiles = [...fileList, ...fileListVideo].filter(
        (file) => !file.isExisting
      );

      // Process files - upload directly to S3
      const { uploadedFiles } = await processLargeFiles(newFiles);

      formData.append("content", postMessage);
      formData.append("role", userLoginRole?.name);
      formData.append("status", 2);
      setIsOpenNewChatModal(false);

      // Add uploaded file references to FormData
      if (uploadedFiles.length > 0) {
        formData.append('s3_files', JSON.stringify(uploadedFiles));
      } else {
        // console.log('📤 No files to upload, submitting without files');
      }

      formData.append("content", postMessage);
      formData.append("status", 2);

      const action = isEditMode ? updateFeedAction(formData) : addFeed(formData);

      dispatch(action)
        .then((res) => {
          setDraftLoading(false);
          if (res?.payload?.meta?.status === 200) {
            setIsOpenNewChatModal(false);

            if (isEditMode && onEditSuccess) {
              // For edit mode, pass the updated feed data
              const updatedFeed = res?.payload?.data?.feed || res?.payload?.data;
              if (updatedFeed) {
                onEditSuccess(updatedFeed);
              } else {
                console.warn("No updated feed data received from API");
              }
            } else {
              // For create mode, use existing logic
              setCreatedPostResponse(res?.payload?.data);
            }

            resetFormFields();
            // setIsOpenNewChatModal(false);

            // Show success message
            if (isEditMode) {
              // message.success("Draft updated successfully");
            } else {
              // message.success("Draft saved successfully");
            }
          } else {
            // Handle non-200 status
            // message.error(res?.payload?.meta?.message || "Operation failed");
          }
        })
        .catch((error) => {
          setDraftLoading(false);
          console.error("API Error:", error);
          // message.error("Operation failed. Please try again.");
        });
    } catch (error) {
      setDraftLoading(false);
      console.error("Chunking failed:", error);
      notification.error({
        message: "Upload failed",
        description: "Failed to process large files. Please try again.",
        duration: 5,
      });
    }
  };

  const onClickPost = async () => {
    // Check file sizes before submitting
    const oversizedFiles = [...fileList, ...fileListVideo].filter(
      (file) =>
        !file.isExisting &&
        (file.size || file.originFileObj?.size || 0) > MAX_FILE_SIZE_BYTES
    );

    // setIsOpenNewChatModal(false);

    if (oversizedFiles.length > 0) {
      const count = oversizedFiles.length;
      notification.error({
        message: `${count} file${count > 1 ? "s" : ""} not uploaded`,
        description: `File${count > 1 ? "s" : ""
          } exceeded the ${MAX_FILE_SIZE_MB}MB size limit.`,
        duration: 5,
      });
      return;
    }

    setPostLoading(true);

    try {
      const formData = new FormData();

      formData.append("role", userLoginRole?.name);

      if (isEditMode) {
        // For edit mode, include feed ID
        formData.append("id", editFeedData.id);

        // Add deleted media IDs if any
        if (deletedMediaIds.length > 0) {
          deletedMediaIds.forEach((id, index) => {
            formData.append(`removed_files[${index}]`, id);
          });
        }
      }

      // Get only new files (not existing ones)
      const newFiles = [...fileList, ...fileListVideo].filter(
        (file) => !file.isExisting
      );

      // Process files - upload directly to S3
      const { uploadedFiles } = await processLargeFiles(newFiles);


      if (isSchedule) {
        // Convert to UTC format before sending
        const utcScheduledTime = getUTCScheduledTime();
        if (utcScheduledTime) {
          formData.append("scheduled_at", utcScheduledTime);
        } else {
          console.error("Failed to convert scheduled time to UTC");
          setPostLoading(false);
          notification.error({
            message: "Scheduling Error",
            description: "Please select both date and time for scheduling.",
            duration: 5,
          });
          return;
        }
      }
      // Add uploaded file references to FormData
      if (uploadedFiles.length > 0) {
        formData.append('s3_files', JSON.stringify(uploadedFiles));
      } else {
        // console.log('📤 No files to upload, submitting without files');
      }

      formData.append("content", postMessage);
      formData.append("status", isSchedule ? 3 : 1);

      // if (isSchedule) {
      //   formData.append("scheduled_at", `${datePicker} ${timePicker}`);
      // }

      const action = isEditMode ? updateFeedAction(formData) : addFeed(formData);

      dispatch(action)
        .then((res) => {
          setPostLoading(false);
          if (res?.payload?.meta?.status === 200) {

            setIsOpenNewChatModal(false);
            if (isEditMode && onEditSuccess) {
              // For edit mode, pass the updated feed data
              const updatedFeed = res?.payload?.data?.feed || res?.payload?.data;
              if (updatedFeed) {
                onEditSuccess(updatedFeed);
              } else {
                console.warn("No updated feed data received from API");
              }
            } else {
              // For create mode, use existing logic
              setCreatedPostResponse(res?.payload?.data);
            }

            resetFormFields();
            // setIsOpenNewChatModal(false);

            // Show success message
            if (isEditMode) {
              // message.success("Post updated successfully");
            } else {
              // message.success("Post created successfully");
            }
          } else {
            // Handle non-200 status
            // message.error(res?.payload?.meta?.message || "Operation failed");
          }
        })
        .catch((error) => {
          setPostLoading(false);
          console.error("API Error:", error);
          // message.error("Operation failed. Please try again.");
        });
    } catch (error) {
      setPostLoading(false);
      console.error("Chunking failed:", error);
      notification.error({
        message: "Upload failed",
        description: "Failed to process large files. Please try again.",
        duration: 5,
      });
    }
  };

  // Function to clear all image files
  const clearAllImages = () => {
    // Mark all existing images for deletion
    const existingImages = fileList.filter((file) => file.isExisting);
    existingImages.forEach((file) => {
      if (file.mediaId) {
        setDeletedMediaIds((prev) => [...prev, file.mediaId]);
      }
    });
    setFileList([]);
  };

  // Function to clear all video files
  const clearAllVideos = () => {
    // Mark all existing videos for deletion
    const existingVideos = fileListVideo.filter((file) => file.isExisting);
    existingVideos.forEach((file) => {
      if (file.mediaId) {
        setDeletedMediaIds((prev) => [...prev, file.mediaId]);
      }
    });
    setFileListVideo([]);
  };

  // Function to remove single image file
  const removeImageFile = (index) => {
    const file = fileList[index];
    if (file.isExisting && file.mediaId) {
      setDeletedMediaIds((prev) => [...prev, file.mediaId]);
    }
    const newFileList = [...fileList];
    newFileList.splice(index, 1);
    setFileList(newFileList);
  };

  // Function to remove single video file
  const removeVideoFile = (index) => {
    const file = fileListVideo[index];
    if (file.isExisting && file.mediaId) {
      setDeletedMediaIds((prev) => [...prev, file.mediaId]);
    }
    const newFileList = [...fileListVideo];
    newFileList.splice(index, 1);
    setFileListVideo(newFileList);
  };

  // Handler for text area input change with character limit
  const handleTextAreaChange = (e) => {
    const value = e.target.value;
    if (value.length <= 3000) {
      setPostMessage(value);
    }
  };

  return (
    <Modal
      title={
        <div className="flex gap-3">
          <div className="h-12 w-12 rounded-full relative">
            {userForEdit?.user?.profile_photo_path ? (
              <Avatar
                src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${userForEdit?.user?.profile_photo_path
                  }`}
                className="object-cover h-full w-full rounded-full"
              ></Avatar>
            ) : (
              <Avatar
                style={{ backgroundColor: "#fde3cf", color: "#f56a00" }}
                className="object-cover h-full w-full rounded-full !text-[24px] font-normal"
              >
                {userForEdit?.user?.name[0]}
              </Avatar>
            )}
            <div className="absolute bottom-0 right-[-6px] w-4 h-4 bg-success rounded-full border-2 border-liteGrayV1"></div>
          </div>
          <div className="ml-2">
            <div className="font-semibold text-white">
              {userForEdit?.user?.name}{" "}
            </div>
            <div className="text-grayText font-normal text-sm flex items-center gap-1 mt-1">
              {userLoginRole?.full_name?.length >= 22
                ? userLoginRole?.full_name?.slice(0, 20) + "..."
                : userLoginRole?.full_name || ""}{" "}
              <span className="mx-1 font-extrabold">•</span>
              {isEditMode ? "Editing" : "Now"}
            </div>
          </div>
        </div>
      }
      open={isOpenNewChatModal}
      onCancel={handleModalCancel}
      width={window.innerWidth < 1024 ? "90%" : "48%"}
      className="newPostModal"
      destroyOnClose={true}
      footer={false}
      centered
      closeIcon={
        <Button
          shape="circle"
          icon={<i className="icon-close before:!m-0 text-sm" />}
        />
      }
    >
      {contextHolder}

      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-0 right-52 z-10">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme="dark"
            height={320}
            preload={false}
            searchDisabled={false}
            skinTonesDisabled={false}
            className="customEmojiPicker"
            allowExpandReactions={false}
            reactionsDefaultOpen={false}
          />
        </div>
      )}


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

      <div className="mainContaintNewPost my-5">
        <TextArea
          ref={inputRef}
          value={postMessage}
          onChange={handleTextAreaChange}
          placeholder="Type your message..."
          autoSize={{ minRows: 7, maxRows: 7 }}
          size="large"
          onClick={() => setShowEmojiPicker(false)}
          maxLength={3000}
        />
        <div className="flex justify-end mt-1">
          <Text className="text-grayText text-xs">
            {postMessage.length}/3000
          </Text>
        </div>

        {isSchedule && !isEditMode ? (
          <Row className="mt-7 mb-5" gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <DatePicker
                value={selectedDate}
                onChange={onChangeDate}
                size="large"
                className="w-full"
                disabledDate={disabledDate}
                placeholder="Select Date"
              />
            </Col>
            <Col xs={24} md={12}>
              <TimePicker
                value={timePicker ? dayjs(timePicker, "h:mm A") : null}
                onChange={onChangeTime}
                size="large"
                className="w-full"
                // disabledTime={disabledTime}
                showNow={false}
                placeholder="Select Time"
                use12Hours={true}
                format="h:mm A"
              />
            </Col>
          </Row>
        ) : null}
        <div className="flex my-5">
          <Upload
            {...uploadProps}
            accept=".jpeg,.jpg,.gif,.png,image/jpeg,image/jpg,image/gif,image/png"
            className=" rounded-lg"
            disabled={fileList.length + fileListVideo.length >= 10}
          >
            <div
              className={`flex items-start mr-7 ${fileList.length + fileListVideo.length >= 10
                ? "cursor-not-allowed"
                : "cursor-pointer"
                } `}
            >
              <div className="flex items-center">
                <i
                  className={`icon-photo before:!m-0  text-grayText text-3xl`}
                />
                <Text className="text-sm ml-1 hidden lg:block">Photo</Text>
              </div>
            </div>
          </Upload>

          <Upload
            {...uploadPropsVideo}
            accept=".mp4,image/mp4, .webm,video/webm"
            className="rounded-lg"
            disabled={fileList.length + fileListVideo.length >= 10}
          >
            <div
              className={`flex items-start mr-7 ${fileList.length + fileListVideo.length >= 10
                ? "cursor-not-allowed"
                : "cursor-pointer"
                } `}
            >
              <div className="flex items-center">
                <i
                  className={`icon-video before:!m-0  text-grayText text-3xl`}
                />
                <Text className="text-sm ml-1 hidden lg:block">Video</Text>
              </div>
            </div>
          </Upload>

          <div
            className="flex items-start mr-7 cursor-pointer"
            onClick={toggleEmojiPicker}
          >
            <div className="flex items-center">
              <i className={`icon-emoji before:!m-0  text-grayText text-3xl`} />
              <Text className="text-sm ml-1 hidden lg:block">Emoji</Text>
            </div>
          </div>
        </div>

        <div className="text-center mb-2">
          <Text className="text-grayText text-xs">
            Maximum 10 files, up to {MAX_FILE_SIZE_MB}MB each
          </Text>
        </div>

        <div className="overflow-y-auto max-h-[250px]">
          {/* File List Display - Images */}
          {fileList.length > 0 && (
            <div className="mt-4 mb-4">
              <div className="flex justify-between mb-2 items-center">
                <Text className="text-white font-medium">
                  Images ({fileList.length})
                </Text>
                <Button
                  type="text"
                  size="small"
                  onClick={clearAllImages}
                  className="text-grayText hover:text-white"
                  disabled={postLoading || draftLoading}
                >
                  Clear All
                </Button>
              </div>

              <div className="pr-2 ">
                {fileList.map((file, index) => (
                  <div
                    key={`image-${index}`}
                    className="flex items-center bg-darkGray rounded-lg p-3 mb-2 border border-[#373737]"
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primaryOpacity mr-3">
                      <i className="icon-photo text-lg" />
                    </div>

                    <div className="flex-grow mr-2 overflow-hidden">
                      <Text
                        className="text-white text-sm block truncate"
                        title={file.name}
                      >
                        {file.name}
                        {file.isExisting && (
                          <span className="text-grayText ml-2">(existing)</span>
                        )}
                      </Text>
                      {/* <Text className="text-grayText text-xs">
                        {file.size
                          ? `${((file.size || 0) / 1024).toFixed(1)} KB`
                          : "Existing file"}
                        {!file.isExisting && (file.size || file.originFileObj?.size) > CHUNK_SIZE && (
                          <span className="text-yellow-500 ml-2">(will be chunked)</span>
                        )}
                      </Text> */}
                    </div>

                    <Button
                      type="text"
                      size="small"
                      className="text-grayText hover:text-white flex-shrink-0"
                      onClick={() => removeImageFile(index)}
                      disabled={postLoading || draftLoading}
                      icon={<i className="icon-close text-xs" />}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File List Display - Videos */}
          {fileListVideo.length > 0 && (
            <div className="mt-4 mb-4">
              <div className="flex justify-between mb-2 items-center">
                <Text className="text-white font-medium">
                  Videos ({fileListVideo.length})
                </Text>
                <Button
                  type="text"
                  size="small"
                  onClick={clearAllVideos}
                  className="text-grayText hover:text-white"
                  disabled={postLoading || draftLoading}
                >
                  Clear All
                </Button>
              </div>

              <div className="  pr-2 ">
                {fileListVideo.map((file, index) => (
                  <div
                    key={`video-${index}`}
                    className="flex items-center bg-darkGray rounded-lg p-3 mb-2 border border-[#373737]"
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primaryOpacity mr-3">
                      <i className="icon-video text-lg" />
                    </div>

                    <div className="flex-grow mr-2 overflow-hidden">
                      <Text
                        className="text-white text-sm block truncate"
                        title={file.name}
                      >
                        {file.name}
                        {file.isExisting && (
                          <span className="text-grayText ml-2">(existing)</span>
                        )}
                      </Text>
                      {/* <Text className="text-grayText text-xs">
                        {file.size
                          ? `${((file.size || 0) / 1024).toFixed(1)} KB`
                          : "Existing file"}
                        {!file.isExisting && (file.size || file.originFileObj?.size) > CHUNK_SIZE && (
                          <span className="text-yellow-500 ml-2">(will be chunked)</span>
                        )}
                      </Text> */}
                    </div>

                    <Button
                      type="text"
                      size="small"
                      className="text-grayText hover:text-white flex-shrink-0"
                      onClick={() => removeVideoFile(index)}
                      disabled={postLoading || draftLoading}
                      icon={<i className="icon-close text-xs" />}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <Divider className="m-0" />
      </div>
      <div className="footerContaintNewPost">
        <div className="flex justify-between">
          <div>
            {!isSchedule && !isEditMode ? (
              <Button
                className=" bg-transparent !w-auto xl:!w-44 hover:!border-grayText text-grayText hover:!text-grayText"
                size="large"
                variant="filled"
                block
                onClick={onClickDraft}
              // disabled={draftLoading || postLoading || scheduleButtonLoading}
              // loading={draftLoading}
              >
                <InboxOutlined
                  className={`text-grayText text-2xl ${draftLoading || postLoading || scheduleButtonLoading || chunkingProgress.isChunking
                    ? "opacity-50"
                    : ""
                    }`}
                />{" "}
                Save as Draft
              </Button>
            ) : null}
          </div>
          <div className="flex justify-end">
            {!isEditMode && (
              <Button
                className="bg-primaryOpacity text-primary border-primary !w-auto xl:!w-44"
                onClick={onClickSchedule}
                // disabled={draftLoading || postLoading || scheduleButtonLoading || chunkingProgress.isChunking}
                // loading={scheduleButtonLoading}
                size="large"
                variant="filled"
                block
                icon={<i className="icon-calendar before:!m-0  text-2xl" />}
                iconPosition={"start"}
              >
                Schedule
              </Button>
            )}
            <Button
              type="primary"
              size="large"
              className="ml-4 !w-auto xl:!w-44"
              // disabled={postLoading || chunkingProgress.isChunking}
              // loading={draftLoading || postLoading || scheduleButtonLoading}
              block
              icon={<i className="icon-send before:!m-0  text-2xl" />}
              iconPosition={"end"}
              onClick={onClickPost}
            >
              {isEditMode ? "Update" : isSchedule ? "Schedule Post" : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default NewPostModal;