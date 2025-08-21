import { Button, Col, Form, Input, Modal, Row, Typography, Spin, Empty, Upload, notification, Progress } from "antd";
import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ShadowBoxContainer from "../../components/AuthLayout/ShadowBoxContainer";
import { PlusOutlined, DeleteOutlined, EditOutlined, InboxOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategoriesDetails, fetchArticleFileById } from "../../services/Store/Support/action";
import { addVimeoVideo, RemoveVimeoVideo, EditVimeoVideo } from "../../services/Store/VideoModule/action";
import { addArticle, removeArticle, updateArticleAction } from "../../services/Store/Support/action";
import { getStorage } from "../../utils/commonfunction";

const { Text, Title } = Typography;
const { Dragger } = Upload;

// Add constants for file size limit
const MAX_FILE_SIZE_MB = 20; // Maximum file size in MB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert to bytes
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks - S3 multipart upload minimum requirement

const SupportDetails = () => {
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch()
  const [form] = Form.useForm();
  const [uploadForm] = Form.useForm(); // Form for upload modal
  const {
    addVideoVimeoLoading, editVideoVimeoLoading
  } = useSelector((state) => state?.vimeoVideos);
  const { userForEdit } = useSelector((state) => state?.usersmanagement);

  // Check if in admin mode
  const isAdminMode = location.pathname.includes('/admin/');

  // Helper functions for dynamic navigation
  const getDashboardLink = () => {
    return isAdminMode ? '/admin' : '/dashboard';
  };

  const getSupportLink = () => {
    return isAdminMode ? '/admin/support-management' : '/support';
  };

  const getSupportLinkText = () => {
    return isAdminMode ? 'Support Management' : 'Support';
  };

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [originalFileList, setOriginalFileList] = useState([]); // Track original files for comparison
  const [deleteKey, setDeleteKey] = useState(null);
  const [deleteItemId, setDeleteItemId] = useState(null); // Add state for item ID
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false); // Add deleting state

  // Add states for edit functionality
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);

  // Add states for article edit functionality
  const [isArticleEditMode, setIsArticleEditMode] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [fetchingArticleData, setFetchingArticleData] = useState(false);

  const [categoriesData, setCategoriesData] = useState({
    top_video: { count: 0, data: [] },
    all_videos: { count: 0, data: [] },
    articles: { count: 0, data: [] }
  });

  // Add refs for tracking oversized and invalid files
  const oversizedFilesRef = useRef([]);
  const invalidFilesRef = useRef([]);
  const notificationShownRef = useRef(false);

  // Add chunking progress state
  const [chunkingProgress, setChunkingProgress] = useState({
    isChunking: false,
    currentFile: 0,
    totalFiles: 0,
    currentFileName: '',
    chunkProgress: 0,
    overallProgress: 0
  });

  console.log('categoriesData', categoriesData)

  const { id } = useParams();

  console.log('id', id, location)

  const handleClick = (videoId) => {
    navigate(`/support/video/${videoId}`)
  }

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

  const onClickUploadVideo = () => {
    console.log('Upload Video')
    setIsEditMode(false);
    setEditingVideo(null);
    form.resetFields();
    setIsModalVisible(true)
  }

  // Add function to handle edit video
  const onClickEditVideo = (video) => {
    console.log('Edit Video', video)
    setIsEditMode(true);
    setEditingVideo(video);
    form.setFieldsValue({
      embedUrl: video.url || video.embed_url || ''
    });
    setIsModalVisible(true);
  }

  const onClickUploadArticle = () => {
    console.log('Upload Articles')
    setIsArticleEditMode(false);
    setEditingArticle(null);
    setIsUploadModalVisible(true)
  }

  // Add function to handle edit article
  const onClickEditArticle = (article) => {
    console.log('Edit Article', article)
    setIsArticleEditMode(true);
    setEditingArticle(article);
    setFetchingArticleData(true);

    // Fetch article data by ID
    dispatch(fetchArticleFileById(article.id)).then((res) => {
      console.log('fetchArticleFileById response', res?.payload);

      if (res?.payload?.data) {
        const articleData = res.payload.data;

        // Set form title
        uploadForm.setFieldsValue({
          title: articleData.article.title
        });

        // Transform API files to upload component format
        const transformedFiles = articleData.files.map((file, index) => ({
          uid: file.id,
          name: file.name || `${file.type}_file.${file.extension}`,
          status: 'done',
          size: parseFileSize(file.size),
          type: getFileTypeFromExtension(file.extension),
          url: file.preview_url,
          response: 'ok',
          originFileObj: null, // This is an existing file, not a new upload
          isExisting: true, // Flag to identify existing files
          serverId: file.id // Keep track of server ID
        }));

        setFileList(transformedFiles);
        setOriginalFileList([...transformedFiles]); // Store original files for comparison
      }

      setFetchingArticleData(false);
      setIsUploadModalVisible(true);
    }).catch((error) => {
      console.error('Error fetching article data:', error);
      setFetchingArticleData(false);
      setIsUploadModalVisible(true);
    });
  }

  // Helper function to parse file size string to bytes
  const parseFileSize = (sizeString) => {
    const match = sizeString.match(/(\d+\.?\d*)\s*(KB|MB|GB)/i);
    if (!match) return 0;

    const size = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    switch (unit) {
      case 'KB':
        return size * 1024;
      case 'MB':
        return size * 1024 * 1024;
      case 'GB':
        return size * 1024 * 1024 * 1024;
      default:
        return size;
    }
  };

  // Helper function to get MIME type from extension
  const getFileTypeFromExtension = (extension) => {
    const extensionMap = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };

    return extensionMap[extension.toLowerCase()] || 'application/octet-stream';
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    let token = userForEdit?.token || getStorage("token", false);

    console.log('Debug - Final token being used:', token);

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
      console.log('🔹 Uploading small file:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);

      // Get presigned URL from FAST Laravel endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${getApiBaseUrl()}/articles/generate-presigned-url`, {
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

      console.log('🔹 Presigned URL response status:', response.status);

      if (!response.ok) {
        clearTimeout(timeoutId);
        const errorText = await response.text();
        console.error('❌ Failed to get presigned URL:', errorText);
        throw new Error(`Failed to get presigned URL: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🔹 Presigned URL result:', result);

      if (!result.success) {
        throw new Error(result.message || 'Failed to get presigned URL');
      }

      const { presignedUrl, fileKey, fileName, fileType } = result;

      // Upload directly to S3
      console.log('🔹 Uploading to S3 directly...');
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      console.log('🔹 S3 upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ Failed to upload to S3:', errorText);
        throw new Error(`Failed to upload to S3: ${uploadResponse.statusText}`);
      }

      console.log('✅ Small file uploaded successfully');

      // Use CloudFront URL if provided, otherwise use S3 URL
      const finalUrl = result.finalUrl || presignedUrl.split('?')[0];

      return {
        key: fileKey,
        name: fileName,
        type: fileType,
        url: finalUrl,
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

      console.log('🔸 Uploading large file:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`, `in ${totalParts} parts`);

      // Step 1: Initialize multipart upload (FAST Laravel endpoint - 1 S3 call)
      console.log('🔸 Step 1: Initializing multipart upload...');
      const initController = new AbortController();
      const initTimeoutId = setTimeout(() => initController.abort(), 10000); // 10 second timeout

      const initResponse = await fetch(`${getApiBaseUrl()}/articles/initialize-multipart-upload`, {
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

      console.log('🔸 Initialize response status:', initResponse.status);

      if (!initResponse.ok) {
        clearTimeout(initTimeoutId);
        const errorText = await initResponse.text();
        console.error('❌ Failed to initialize multipart upload:', errorText);
        throw new Error(`Failed to initialize multipart upload: ${initResponse.statusText}`);
      }

      const initResult = await initResponse.json();
      console.log('🔸 Initialize result:', initResult);

      if (!initResult.success) {
        throw new Error(initResult.message || 'Failed to initialize multipart upload');
      }

      const { uploadId, fileKey, fileName, fileType } = initResult;

      // Step 2: Get presigned URLs for all parts (FAST Laravel endpoint - no S3 calls)
      console.log('🔸 Step 2: Getting presigned URLs...');
      const urlsController = new AbortController();
      const urlsTimeoutId = setTimeout(() => urlsController.abort(), 10000); // 10 second timeout

      const urlsResponse = await fetch(`${getApiBaseUrl()}/articles/generate-upload-part-urls`, {
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

      console.log('🔸 URLs response status:', urlsResponse.status);

      if (!urlsResponse.ok) {
        clearTimeout(urlsTimeoutId);
        const errorText = await urlsResponse.text();
        console.error('❌ Failed to get upload part URLs:', errorText);
        throw new Error(`Failed to get upload part URLs: ${urlsResponse.statusText}`);
      }

      const urlsResult = await urlsResponse.json();
      console.log('🔸 URLs result:', urlsResult);

      if (!urlsResult.success) {
        throw new Error(urlsResult.message || 'Failed to get upload part URLs');
      }

      const { presignedUrls } = urlsResult;

      // Step 3: Upload each part directly to S3 using presigned URLs
      console.log('🔸 Step 3: Uploading parts to S3...');
      const uploadedParts = [];

      for (let i = 0; i < presignedUrls.length; i++) {
        const { partNumber, url } = presignedUrls[i];
        const start = (partNumber - 1) * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        console.log(`🔸 Uploading part ${partNumber}/${totalParts}, size: ${(chunk.size / 1024 / 1024).toFixed(2)}MB`);

        const partResponse = await fetch(url, {
          method: 'PUT',
          body: chunk,
          headers: {
            'Content-Type': file.type
          }
        });

        console.log(`🔸 Part ${partNumber} response status:`, partResponse.status);

        if (!partResponse.ok) {
          const errorText = await partResponse.text();
          console.error(`❌ Failed to upload part ${partNumber}:`, errorText);
          throw new Error(`Failed to upload part ${partNumber}: ${partResponse.statusText}`);
        }

        const etag = partResponse.headers.get('ETag');
        console.log(`✅ Part ${partNumber} uploaded, ETag:`, etag);

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
      console.log('🔸 Step 4: Completing multipart upload...');
      const completeController = new AbortController();
      const completeTimeoutId = setTimeout(() => completeController.abort(), 15000); // 15 second timeout for completion

      const completeResponse = await fetch(`${getApiBaseUrl()}/articles/complete-multipart-upload`, {
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

      console.log('🔸 Complete response status:', completeResponse.status);

      if (!completeResponse.ok) {
        clearTimeout(completeTimeoutId);
        const errorText = await completeResponse.text();
        console.error('❌ Failed to complete multipart upload:', errorText);
        throw new Error(`Failed to complete multipart upload: ${completeResponse.statusText}`);
      }

      const completeResult = await completeResponse.json();
      console.log('🔸 Complete result:', completeResult);

      if (!completeResult.success) {
        throw new Error(completeResult.message || 'Failed to complete multipart upload');
      }

      console.log('✅ Large file uploaded successfully');
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

    console.log('📁 Processing files:', {
      total: files.length,
      small: smallFiles.length,
      large: largeFiles.length,
      threshold: `${chunkThreshold / 1024 / 1024}MB`
    });

    if (largeFiles.length === 0 && smallFiles.length === 0) {
      console.log('📁 No new files to upload');
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
      console.log('📁 Starting small files upload...');
      for (const file of smallFiles) {
        const actualFile = file.originFileObj || file;

        console.log(`📁 Processing small file ${fileIndex + 1}/${smallFiles.length + largeFiles.length}:`, actualFile.name);

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

        console.log(`✅ Small file ${fileIndex} completed`);
      }

      // Upload large files
      console.log('📁 Starting large files upload...');
      for (const file of largeFiles) {
        const actualFile = file.originFileObj || file;

        console.log(`📁 Processing large file ${fileIndex + 1}/${smallFiles.length + largeFiles.length}:`, actualFile.name);

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

        console.log(`✅ Large file ${fileIndex} completed`);
      }

      setChunkingProgress(prev => ({
        ...prev,
        isChunking: false,
      }));

      console.log('🎉 All files uploaded successfully:', uploadedFiles);
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

  useEffect(() => {
    if (id) {
      setLoading(true);
      const params = {
        category_id: id,
        type: "2"
      }
      dispatch(fetchCategoriesDetails(params)).then((res) => {
        console.log('fetchCategoriesDetails response', res?.payload)
        if (res?.payload?.data) {
          setCategoriesData(res.payload.data);
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      })
    }
  }, [id, dispatch])

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setIsEditMode(false);
    setEditingVideo(null);
    form.resetFields();
  }

  const handleUploadModalCancel = () => {
    if (!uploading && !fetchingArticleData && !chunkingProgress.isChunking) {
      setIsUploadModalVisible(false);
      setFileList([]);
      setOriginalFileList([]); // Reset original files tracking
      uploadForm.resetFields(); // Reset upload form
      setIsArticleEditMode(false);
      setEditingArticle(null);
      // Reset file tracking refs
      oversizedFilesRef.current = [];
      invalidFilesRef.current = [];
      notificationShownRef.current = false;
      // Reset chunking progress
      setChunkingProgress({
        isChunking: false,
        currentFile: 0,
        totalFiles: 0,
        currentFileName: '',
        chunkProgress: 0,
        overallProgress: 0
      });
    }
  }

  const handleModalSubmit = () => {
    form.validateFields().then((values) => {
      console.log('values', values)

      if (isEditMode && editingVideo) {
        // Edit existing video
        const videoData = {
          url: values.embedUrl,
          category_type: categoriesData?.category_type,
        };


        dispatch(EditVimeoVideo({ id: editingVideo.id, data: videoData })).then((res) => {
          console.log('Edit video response', res);

          // Check if the video was edited successfully
          if (res?.payload?.success === true || res?.payload?.meta?.success === true || res?.payload) {
            // Reset the form and close modal
            form.resetFields();
            setIsModalVisible(false);
            setIsEditMode(false);
            setEditingVideo(null);

            // Refresh the categories data to get updated videos
            const params = {
              category_id: id,
              type: "2"
            }
            dispatch(fetchCategoriesDetails(params)).then((refreshRes) => {
              console.log('Refreshed categories data after video edit', refreshRes?.payload);
              // UPDATE: Properly update the state with fresh data
              if (refreshRes?.payload?.data) {
                setCategoriesData(refreshRes.payload.data);
              }
            }).catch((error) => {
              console.error('Error refreshing categories data:', error);
            });

            // notification.success({
            //   message: "Video updated successfully",
            //   description: "Video has been updated successfully!",
            //   duration: 4,
            // });
          } else {
            form.resetFields();
            setIsModalVisible(false);
            setIsEditMode(false);
            setEditingVideo(null);
            // notification.error({
            //   message: "Video update failed",
            //   description: res?.payload?.message || "Failed to update video. Please try again.",
            //   duration: 4,
            // });
          }
        }).catch((e) => {
          console.log('Error', e);
          form.resetFields();
          setIsModalVisible(false);
          setIsEditMode(false);
          setEditingVideo(null);
          // notification.error({
          //   message: "Video update error",
          //   description: "An error occurred while updating the video: " + (e.message || "Unknown error"),
          //   duration: 5,
          // });
        })
      } else {
        // Add new video
        const videoData = {
          url: values.embedUrl, // The URL from the form
          category_type: categoriesData?.category_type, // Category, e.g., Onboarding
        };

        dispatch(addVimeoVideo(videoData)).then((res) => {
          console.log('Added video response', res);

          // Check if the video was added successfully
          if (res?.payload?.success === true || res?.payload?.meta?.success === true || res?.payload) {
            // Reset the form and close modal
            form.resetFields();
            setIsModalVisible(false);

            // Refresh the categories data to get updated videos
            const params = {
              category_id: id,
              type: "2"
            }
            dispatch(fetchCategoriesDetails(params)).then((refreshRes) => {
              console.log('Refreshed categories data after video upload', refreshRes?.payload);
              // UPDATE: Properly update the state with fresh data
              if (refreshRes?.payload?.data) {
                setCategoriesData(refreshRes.payload.data);
              }
            }).catch((error) => {
              console.error('Error refreshing categories data:', error);
            });

            // notification.success({
            //   message: "Video added successfully",
            //   description: "Video has been added to the category!",
            //   duration: 4,
            // });
          } else {
            form.resetFields();
            setIsModalVisible(false);
            // notification.error({
            //   message: "Video upload failed",
            //   description: res?.payload?.message || "Failed to add video. Please try again.",
            //   duration: 4,
            // });
          }
        }).catch((e) => {
          console.log('Error', e);
          form.resetFields();
          setIsModalVisible(false);
          // notification.error({
          //   message: "Video upload error",
          //   description: "An error occurred while adding the video: " + (e.message || "Unknown error"),
          //   duration: 5,
          // });
        })
      }
    }).catch((errorInfo) => {
      console.log('Video form validation failed:', errorInfo);
    })
  }

  // Reset upload form when modal opens
  useEffect(() => {
    if (isUploadModalVisible && !isArticleEditMode) {
      uploadForm.resetFields();
      setFileList([]);
      setOriginalFileList([]); // Reset original files tracking
      setUploading(false);
      // Reset file tracking refs
      oversizedFilesRef.current = [];
      invalidFilesRef.current = [];
      notificationShownRef.current = false;
      // Reset chunking progress
      setChunkingProgress({
        isChunking: false,
        currentFile: 0,
        totalFiles: 0,
        currentFileName: '',
        chunkProgress: 0,
        overallProgress: 0
      });
    }
  }, [isUploadModalVisible, uploadForm, isArticleEditMode]);

  // Function to get removed file IDs
  const getRemovedFileIds = () => {
    const currentExistingFiles = fileList.filter(file => file.isExisting);
    const currentExistingIds = currentExistingFiles.map(file => file.serverId);
    const originalExistingIds = originalFileList.map(file => file.serverId);

    // Find IDs that were in original but not in current
    const removedIds = originalExistingIds.filter(id => !currentExistingIds.includes(id));
    return removedIds;
  };

  // Validate a single file for type and size
  const validateFile = (file) => {
    // Check file size first
    if (file.size > MAX_FILE_SIZE_BYTES) {
      oversizedFilesRef.current.push(file.name);
      return false;
    }

    // Check file type - including images as requested
    const allowedTypes = [
      "application/pdf",
      "application/msword", // DOC
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp"
    ];

    // Also check file extension as a fallback
    const fileName = file.name || "";
    const fileExtension = fileName.toLowerCase().split(".").pop();
    const allowedExtensions = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "gif", "webp"];

    const isValidType =
      allowedTypes.includes(file.type) ||
      allowedExtensions.includes(fileExtension);

    if (!isValidType) {
      invalidFilesRef.current.push(file.name);
      return false;
    }

    return true;
  };

  const handleCancelDelete = () => {
    setIsDeleteModal(false)
    setDeleteKey(null)
    setDeleteItemId(null)
  }

  const handleConfirmDelete = () => {
    console.log('Call Delete Api', deleteKey, deleteItemId);
    setDeleting(true);

    if (deleteKey === 'video') {
      dispatch(RemoveVimeoVideo(deleteItemId)).then((response) => {
        console.log('Remove video response', response);

        // Check if deletion was successful
        if (response?.payload?.success === true || response?.payload?.meta?.success === true || response?.payload) {
          // Refresh the categories data to get updated data
          const params = {
            category_id: id,
            type: "2"
          }
          dispatch(fetchCategoriesDetails(params)).then((refreshRes) => {
            console.log('Refreshed categories data after video deletion', refreshRes?.payload);
            if (refreshRes?.payload?.data) {
              setCategoriesData(refreshRes.payload.data);
            }
            setDeleting(false);
            setIsDeleteModal(false);
            setDeleteKey(null);
            setDeleteItemId(null);

            // notification.success({
            //   message: "Video deleted successfully",
            //   description: "Video has been removed from the category!",
            //   duration: 4,
            // });
          }).catch((error) => {
            console.error('Error refreshing categories data after video deletion:', error);
            setDeleting(false);
            setIsDeleteModal(false);
            setDeleteKey(null);
            setDeleteItemId(null);
          });
        } else {
          setDeleting(false);
          // notification.error({
          //   message: "Video deletion failed",
          //   description: response?.payload?.message || "Failed to delete video. Please try again.",
          //   duration: 4,
          // });
        }
      }).catch((error) => {
        console.error('Error deleting video:', error);
        setDeleting(false);
        // notification.error({
        //   message: "Video deletion error",
        //   description: "An error occurred while deleting the video: " + (error.message || "Unknown error"),
        //   duration: 5,
        // });
      });

    } else if (deleteKey === 'article') {
      dispatch(removeArticle(deleteItemId)).then((response) => {
        console.log('Remove article response', response);

        // Check if deletion was successful
        if (response?.payload?.success === true || response?.payload?.meta?.success === true || response?.payload) {
          // Refresh the categories data to get updated data
          const params = {
            category_id: id,
            type: "2"
          }
          dispatch(fetchCategoriesDetails(params)).then((refreshRes) => {
            console.log('Refreshed categories data after article deletion', refreshRes?.payload);
            if (refreshRes?.payload?.data) {
              setCategoriesData(refreshRes.payload.data);
            }
            setDeleting(false);
            setIsDeleteModal(false);
            setDeleteKey(null);
            setDeleteItemId(null);

            // notification.success({
            //   message: "Article deleted successfully",
            //   description: "Article has been removed from the category!",
            //   duration: 4,
            // });
          }).catch((error) => {
            console.error('Error refreshing categories data after article deletion:', error);
            setDeleting(false);
            setIsDeleteModal(false);
            setDeleteKey(null);
            setDeleteItemId(null);
          });
        } else {
          setDeleting(false);
          // notification.error({
          //   message: "Article deletion failed",
          //   description: response?.payload?.message || "Failed to delete article. Please try again.",
          //   duration: 4,
          // });
        }
      }).catch((error) => {
        console.error('Error deleting article:', error);
        setDeleting(false);
        // notification.error({
        //   message: "Article deletion error",
        //   description: "An error occurred while deleting the article: " + (error.message || "Unknown error"),
        //   duration: 5,
        // });
      });
    }
  }

  const onClickDelete = (type, itemId) => {
    setDeleteKey(type);
    setDeleteItemId(itemId);
    setIsDeleteModal(true);
  }

  // Upload props configuration
  const uploadProps = {
    name: "file",
    multiple: true,
    showUploadList: false,
    fileList,
    accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.html,.htm",
    beforeUpload: (file, fileListArg) => {
      let shouldReject = false;

      // Validate the file (both size and type)
      if (!validateFile(file)) {
        shouldReject = true;
      }

      // Count how many valid files we'll have after this upload
      const validExistingFiles = fileList.length;

      // If we already have 5 files, reject more
      if (validExistingFiles >= 5 && !shouldReject) {
        notification.error({
          message: "File limit exceeded",
          description: "You can only upload a maximum of 5 files!",
          duration: 4,
        });
        return Upload.LIST_IGNORE;
      }

      // Check if this is the last file in the batch
      const currentIndex = fileListArg.indexOf(file);
      if (currentIndex === fileListArg.length - 1 && !notificationShownRef.current) {
        notificationShownRef.current = true;

        // Show notification for oversized files
        if (oversizedFilesRef.current.length > 0) {
          const count = oversizedFilesRef.current.length;
          notification.error({
            message: `${count} file${count > 1 ? 's' : ''} not uploaded`,
            description: `File${count > 1 ? 's' : ''} exceeded the ${MAX_FILE_SIZE_MB}MB size limit.`,
            duration: 5,
          });
        }

        // Show notification for invalid file types
        if (invalidFilesRef.current.length > 0) {
          const count = invalidFilesRef.current.length;
          notification.error({
            message: `${count} file${count > 1 ? 's' : ''} not uploaded`,
            description: `Invalid file type${count > 1 ? 's' : ''}. Only PDF, DOC, DOCX and image files are allowed.`,
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

      return shouldReject ? Upload.LIST_IGNORE : false; // Prevent auto upload
    },
    onChange: (info) => {
      // Reset refs when starting new selection
      if (info.file.status === 'removed' || info.fileList.length === 0) {
        oversizedFilesRef.current = [];
        invalidFilesRef.current = [];
        notificationShownRef.current = false;
      }

      // Filter out invalid files that might have been added
      let newFileList = info.fileList.filter((file) => {
        // For files that have been validated (have status)
        if (file.status === "error") {
          return false;
        }

        // For new files that haven't been fully processed yet
        if (!file.status && file.originFileObj) {
          // Don't call validateFile here as it would add to refs again
          // Just check size and type directly
          const isValidSize = file.originFileObj.size <= MAX_FILE_SIZE_BYTES;
          const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp"
          ];
          const fileName = file.originFileObj.name || "";
          const fileExtension = fileName.toLowerCase().split(".").pop();
          const allowedExtensions = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "gif", "webp"];
          const isValidType =
            allowedTypes.includes(file.originFileObj.type) ||
            allowedExtensions.includes(fileExtension);

          return isValidSize && isValidType;
        }

        return true;
      });

      // Ensure we don't exceed 5 files
      if (newFileList.length > 5) {
        newFileList = newFileList.slice(0, 5);
        notification.warning({
          message: "File limit reached",
          description: "Only the first 5 files will be processed.",
          duration: 4,
        });
      }

      setFileList(newFileList);
    },
    customRequest: ({ onSuccess }) => {
      // Do nothing, prevent default upload behavior
      setTimeout(() => {
        onSuccess("ok");
      }, 0);
    },
  };

  // Handle file upload submission
  const handleFileUpload = async () => {
    // Validate the form first
    uploadForm.validateFields().then(async (values) => {
      const { title } = values;

      if (fileList?.length === 0) {
        notification.warning({
          message: "No files selected",
          description: "Please select at least one file to upload",
          duration: 4,
        });
        return;
      }

      // Check file sizes before submitting (only for new files)
      const newFiles = fileList.filter(file => !file.isExisting);
      const oversizedFiles = newFiles.filter(
        file => (file.size || file.originFileObj?.size || 0) > MAX_FILE_SIZE_BYTES
      );

      if (oversizedFiles.length > 0) {
        const count = oversizedFiles.length;
        notification.error({
          message: `${count} file${count > 1 ? 's' : ''} not uploaded`,
          description: `File${count > 1 ? 's' : ''} exceeded the ${MAX_FILE_SIZE_MB}MB size limit.`,
          duration: 5,
        });
        return;
      }

      // Final validation check
      if (fileList?.length > 5) {
        notification.error({
          message: "Too many files",
          description: "You can only upload up to 5 files at once!",
          duration: 4,
        });
        return;
      }

      setUploading(true);

      try {
        if (isArticleEditMode && editingArticle) {
          // Edit existing article
          const formData = new FormData();

          // Add title and article ID
          formData.append("id", editingArticle.id);
          formData.append("title", title);

          // Get removed file IDs
          const removedFileIds = getRemovedFileIds();
          console.log('Removed file IDs:', removedFileIds);

          // Add removed file IDs to payload
          if (removedFileIds.length > 0) {
            removedFileIds.forEach((fileId, index) => {
              formData.append(`removed_files[${index}]`, fileId);
            });
          }

          // Process new files - upload directly to S3
          const { uploadedFiles } = await processLargeFiles(fileList);

          // Add uploaded file references to FormData
          if (uploadedFiles.length > 0) {
            console.log('📤 Adding S3 files to FormData:', JSON.stringify(uploadedFiles, null, 2));
            formData.append('s3_files', JSON.stringify(uploadedFiles));
          } else {
            console.log('📤 No new files to upload');
          }

          // Log FormData contents for debugging
          console.log('FormData contents:');
          for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
          }

          // Dispatch updateArticle action
          dispatch(updateArticleAction(formData))
            .then((res) => {
              console.log('Update article response', res);
              if (res?.payload?.success === true || res?.payload?.meta?.success === true || res?.payload) {
                // Reset the modal
                setFileList([]);
                setOriginalFileList([]); // Reset original files tracking
                uploadForm.resetFields();
                setIsUploadModalVisible(false);
                setIsArticleEditMode(false);
                setEditingArticle(null);

                // Refresh the categories data
                const params = {
                  category_id: id,
                  type: "2"
                }
                dispatch(fetchCategoriesDetails(params)).then((refreshRes) => {
                  console.log('Refreshed categories data after article edit', refreshRes?.payload);
                  if (refreshRes?.payload?.data) {
                    setCategoriesData(refreshRes.payload.data);
                  }
                }).catch((error) => {
                  console.error('Error refreshing categories data:', error);
                });

                // notification.success({
                //   message: "Update successful",
                //   description: "Article updated successfully!",
                //   duration: 4,
                // });
              } else {
                // notification.error({
                //   message: "Update failed",
                //   description: res?.payload?.message || "Failed to update article. Please try again.",
                //   duration: 4,
                // });
              }
              setUploading(false);
            })
            .catch((error) => {
              console.error('Update error:', error);
              // notification.error({
              //   message: "Update error",
              //   description: "An error occurred during update: " + (error.message || "Unknown error"),
              //   duration: 5,
              // });
              setUploading(false);
            });

        } else {
          // Add new article
          const formData = new FormData();

          // Add title and category ID
          formData.append("title", title);
          formData.append("category_id", id);

          // Process files - upload directly to S3
          const { uploadedFiles } = await processLargeFiles(fileList);

          // Add uploaded file references to FormData
          if (uploadedFiles.length > 0) {
            console.log('📤 Adding S3 files to FormData:', JSON.stringify(uploadedFiles, null, 2));
            formData.append('s3_files', JSON.stringify(uploadedFiles));
          } else {
            console.log('📤 No files to upload, submitting without files');
          }

          // Dispatch the addArticle action
          dispatch(addArticle(formData))
            .then((res) => {
              console.log('Added article response', res);
              if (res?.payload?.success === true || res?.payload?.meta?.success === true) {
                // Reset the modal
                setFileList([]);
                setOriginalFileList([]); // Reset original files tracking
                uploadForm.resetFields();
                setIsUploadModalVisible(false);

                // Refresh the categories data
                const params = {
                  category_id: id,
                  type: "2"
                }
                dispatch(fetchCategoriesDetails(params)).then((refreshRes) => {
                  console.log('Refreshed categories data after article upload', refreshRes?.payload);
                  // UPDATE: Properly update the state with fresh data
                  if (refreshRes?.payload?.data) {
                    setCategoriesData(refreshRes.payload.data);
                  }
                }).catch((error) => {
                  console.error('Error refreshing categories data:', error);
                });

                // notification.success({
                //   message: "Upload successful",
                //   description: "Article uploaded successfully!",
                //   duration: 4,
                // });
              } else {
                // notification.error({
                //   message: "Upload failed",
                //   description: res?.payload?.message || "Failed to upload article. Please try again.",
                //   duration: 4,
                // });
              }
              setUploading(false);
            })
            .catch((error) => {
              console.error('Upload error:', error);
              // notification.error({
              //   message: "Upload error",
              //   description: "An error occurred during upload: " +
              //     (error.message || "Unknown error"),
              //   duration: 5,
              // });
              setUploading(false);
            });
        }

      } catch (error) {
        setUploading(false);
        console.error('File processing failed:', error);
        notification.error({
          message: "Upload failed",
          description: "Failed to process large files. Please try again.",
          duration: 5,
        });
      }

    }).catch((errorInfo) => {
      console.log('Form validation failed:', errorInfo);
    });
  };

  // Get file icon based on file type
  const getFileIcon = (file) => {
    const fileType = file.type || '';
    const fileName = file.name || '';
    const fileExtension = fileName.toLowerCase().split(".").pop();

    if (fileType === "application/pdf" || fileExtension === "pdf") {
      return "icon-pdf";
    } else if (fileType.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension)) {
      return "icon-photo";
    } else {
      return "icon-documents";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  }

  const renderVideoCard = (video, index) => (
    <div key={video.id || index} className="bg-liteGray px-2 py-3  xl:px-3  xl:py-3 2xl:px-3 2xl:py-3 mt-5  rounded-2xl cursor-pointer"
      onClick={() => handleClick(video.video_id)}>
      <div>
        {console.log('video 11', video)}
        <img
          src={video.thumbnail}
          alt="poster_img"
          className="w-full h-[120px] object-cover rounded-lg"
        />
      </div>
      <div className="mx-2 mt-2">
        <Text className="text-white text-md font-bold" ellipsis={{ tooltip: video.title }}>
          {video.title || "Video Title"}
        </Text>
        <Row gutter={[6, 10]} className="mt-1 p-1" justify={'space-between'}>
          <div className="text-sm text-grayText">{formatDate(video.created_at)}</div>
          {
            isAdminMode ?
              <div className="text-sm text-grayText">
                <EditOutlined
                  className="!text-lg cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClickEditVideo(video);
                  }}
                />
                <DeleteOutlined
                  className="text-error !text-lg ml-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClickDelete('video', video.id);
                  }}
                />
              </div>
              : null
          }
        </Row>
      </div>
    </div>
  );

  const renderArticleLink = (article) => (
    <div key={article.id} className="flex items-center justify-between gap-2 sm:gap-0 mt-1 flex-auto relative !left-0 group hover:bg-liteGray hover:bg-opacity-20 rounded-lg p-1 transition-all duration-200">
      <Link to={`/support/article/${article.id}`} className="flex flex-1">
        <i className="demo-icon icon-documents !text-2xl sm:text-2xl text-primary flex-shrink-0 sm:mt-0">
        </i>
        <div className="flex flex-row flex-wrap items-center gap-1 sm:gap-1 ml-2">
          {article.title}
        </div>
      </Link>
      {isAdminMode && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!fetchingArticleData) {
                onClickEditArticle(article);
              }
            }}
            className="text-grayText transition-colors duration-200 flex items-center"
            disabled={fetchingArticleData}
          >
            <EditOutlined className="!text-lg" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClickDelete('article', article.id);
            }}
            className="text-error transition-colors duration-200 flex items-center mr-2"
          >
            <DeleteOutlined className="!text-lg" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Row
      className="bg-darkGray px-header-wrapper h-full w-full"
      gutter={[0, 24]}
    >

      {/* Add/Edit Video Modal */}
      <Modal
        title={isEditMode ? "Edit Video" : "Add Video"}
        open={isModalVisible}
        onCancel={handleModalCancel}
        onOk={handleModalSubmit}
        okText={isEditMode ? "Update" : "Add"}
        cancelButtonProps={{ disabled: addVideoVimeoLoading || editVideoVimeoLoading }}
        okButtonProps={{ className: "bg-primary hover:bg-primary-dark", loading: addVideoVimeoLoading || editVideoVimeoLoading }}
        className="video-modal"
        destroyOnClose
        centered
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
          />
        }
      >
        <Form
          form={form}
          layout="vertical"
          name="videoForm"
          initialValues={{ embedUrl: "" }}
        >
          <Form.Item
            name="embedUrl"
            label={<Text type="secondary">Embed URL</Text>}
            rules={[
              {
                type: "url",
                message: "Please enter a valid URL",
              },
            ]}
          >
            <Input
              placeholder="https://player.vimeo.com/video/123456789"
              className=" rounded-lg"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Upload Files Modal */}
      <Modal
        title={isArticleEditMode ? "Edit Article" : "Upload Files"}
        centered
        destroyOnClose
        open={isUploadModalVisible}
        className="modalWrapperBox"
        onCancel={!uploading && !fetchingArticleData && !chunkingProgress.isChunking ? handleUploadModalCancel : undefined}
        footer={false}
        maskClosable={!uploading && !fetchingArticleData && !chunkingProgress.isChunking}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
            disabled={uploading || fetchingArticleData || chunkingProgress.isChunking}
          />
        }
        width={800}
      >
        <div className="pt-5">
          {fetchingArticleData ? (
            <div className="flex justify-center items-center py-10">
              <Spin size="large" />
              <Text className="text-white ml-3">Loading article data...</Text>
            </div>
          ) : (
            <>
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

              {/* Title Input Form */}
              <Form
                form={uploadForm}
                layout="vertical"
                name="uploadForm"
                initialValues={{ title: "" }}
                requiredMark={false}
              >
                <Form.Item
                  name="title"
                  label={<Text className="text-white">Title</Text>}
                  rules={[
                    {
                      required: true,
                      message: "Please Enter a Title For The Article",
                    },
                    {
                      min: 3,
                      message: "Title Must Be At Least 3 Characters Long",
                    },
                  ]}
                >
                  <Input
                    placeholder="Enter Article Title"
                    className="rounded-lg"
                    size="large"
                    disabled={uploading || chunkingProgress.isChunking}
                  />
                </Form.Item>
              </Form>

              {/* Enhanced Dragger with improved styling */}
              <Dragger
                {...uploadProps}
                className="bg-darkGray rounded-lg"
                style={{
                  padding: "30px 0",
                  border: "2px dashed #FF6D00",
                  borderRadius: "8px",
                }}
                disabled={uploading || fileList.length >= 5 || chunkingProgress.isChunking}
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
                    Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF, WEBP, HTML, HTM
                  </Text>
                  <Text className="text-grayText text-xs mt-1">
                    Maximum 5 files, up to {MAX_FILE_SIZE_MB}MB each
                  </Text>
                  {fileList.length > 0 && (
                    <Text className="text-primary text-xs mt-1">
                      {fileList.length} of 5 files selected
                    </Text>
                  )}
                </div>
              </Dragger>

              {/* Show File List */}
              {fileList.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-end mb-2">
                    <Button
                      type="text"
                      size="small"
                      onClick={() => setFileList([])}
                      className="text-grayText hover:text-white"
                      disabled={uploading || chunkingProgress.isChunking}
                    >
                      Clear All
                    </Button>
                  </div>

                  <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {fileList.map((file, index) => {
                      return (
                        <div
                          key={`${file.uid || index}`}
                          className="flex items-center bg-darkGray rounded-lg p-3 mb-2 border border-[#373737]"
                        >
                          <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-primaryOpacity mr-3">
                            <i className={`${getFileIcon(file)} text-2xl text-white before:!m-0`} />
                          </div>

                          <div className="flex-grow mr-2 overflow-hidden">
                            <Text className="text-white text-sm block truncate" title={file.name}>
                              {file.name}
                              {file.isExisting && <span className="text-xs text-primary ml-2">(Existing)</span>}
                            </Text>
                            {/* <Text className="text-grayText text-xs">
                              {((file.size || 0) / 1024).toFixed(1)} KB
                              {!file.isExisting && (file.size || file.originFileObj?.size) > CHUNK_SIZE && (
                                <span className="text-yellow-500 ml-2">(will be chunked)</span>
                              )}
                            </Text> */}
                          </div>

                          <Button
                            type="text"
                            size="small"
                            className="text-grayText hover:text-white flex-shrink-0"
                            onClick={() => {
                              if (!uploading && !chunkingProgress.isChunking) {
                                const newFileList = [...fileList];
                                newFileList.splice(index, 1);
                                setFileList(newFileList);
                              }
                            }}
                            disabled={uploading || chunkingProgress.isChunking}
                            icon={<i className="icon-close text-xs" />}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer with action buttons */}
              <div className="mb-6 border-t-2 border-solid border-[#373737] pt-6"></div>
              <Row gutter={16}>
                <Col span={12}>
                  <Button
                    block
                    size="large"
                    onClick={handleUploadModalCancel}
                    disabled={uploading || chunkingProgress.isChunking}
                  >
                    Cancel
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    block
                    type="primary"
                    size="large"
                    onClick={handleFileUpload}
                    style={{ backgroundColor: "#FF6D00", borderColor: "#FF6D00" }}
                    loading={uploading || chunkingProgress.isChunking}
                    disabled={fileList.length === 0 || fileList.length > 5}
                  >
                    {isArticleEditMode ? "Update" : "Upload"}
                  </Button>
                </Col>
              </Row>
            </>
          )}
        </div>
      </Modal>

      <Modal
        title={`Delete ${deleteKey === 'video' ? 'Video' : 'Article'}`}
        centered
        destroyOnClose
        open={isDeleteModal}
        footer={false}
        // width={"40%"}
        onCancel={!deleting ? handleCancelDelete : undefined}
        maskClosable={!deleting}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
            disabled={deleting}
          />
        }
      >
        <div className=" border-t-2 border-solid border-[#373737] mt-5">
          <Row gutter={16} className="">
            <div className="w-full pt-5 flex  items-center justify-center  pb-5">
              <Text className=" text-base font-normal text-grayText text-center">
                {
                  deleteKey === 'video' ?
                    `Are you sure you want to delete this Video?`
                    :
                    `Are you sure you want to delete this Article?`
                }

              </Text>
            </div>
            <Col span={12}>
              <Button
                block
                onClick={handleCancelDelete}
                size="large"
                disabled={deleting}
              >
                Cancel
              </Button>
            </Col>
            <Col span={12}>
              <Button
                block
                danger
                type="primary"
                size="large"
                onClick={handleConfirmDelete}
                loading={deleting}
              >
                Confirm Deletion
              </Button>
            </Col>
          </Row>
        </div>
      </Modal>

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
              to={getDashboardLink()}
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
              to={getSupportLink()}
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Support Management              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Text className="text-white text-lg sm:text-2xl">{categoriesData?.category_name}</Text>
          </Title>
        </div>
      </Col>

      <Row
        className="w-full"
        gutter={[
          { xs: 0, sm: 16 },
          { xs: 0, sm: 16 },
        ]}
      >
        <Col xs={24} md={14} xl={16} className="mb-4">
          <div className="w-full">
            <div
              className="rounded-3xl border overflow-hidden bg-gray border-solid border-liteGray w-full relative p-4 px-5"
              style={{
                height: containerHeight,
                ...scrollableContentStyle,
              }}
            >
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Spin size="large" />
                </div>
              ) : (
                <>
                  {
                    categoriesData.top_video.data.length > 0 ?
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 mt-3 !text-xl">
                          <div>Top Videos</div>
                          <div className="h-1.5 rounded-full w-1.5 bg-grayText"> </div>
                          <div className="bg-primaryOpacity px-2 py-0.5 text-primary rounded-lg font-bold !text-sm">
                            {categoriesData.top_video.count}
                          </div>
                        </div>
                        {
                          isAdminMode ?
                            <Button
                              type="primary"
                              size="large"
                              onClick={onClickUploadVideo}
                              icon={<PlusOutlined />}
                              className="rounded-full flex items-center justify-center px-7 ml-5"
                            >
                              Add Video
                            </Button>
                            : null
                        }
                      </div>
                      : null
                  }
                  {
                    categoriesData.top_video.data.length > 0 ?
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4 gap-3">
                        {categoriesData.top_video.data.length > 0 ? (
                          categoriesData.top_video.data.map((video, index) => renderVideoCard(video, index))
                        ) : (
                          <div className="col-span-full text-center text-grayText mt-10">
                            <Empty description="No Top Videos Available" />
                          </div>
                        )}
                      </div>
                      : null
                  }

                  <div className="flex w-full justify-between">

                    <div className={`flex items-center gap-2 ${categoriesData.top_video.data.length > 0 ? "mt-5" : ""}  text-xl`}>
                      <div>All Videos</div>
                      <div className="h-1.5 rounded-full w-1.5 bg-grayText"> </div>
                      <div className="bg-primaryOpacity px-2 py-0.5 text-primary rounded-lg font-bold !text-sm">
                        {categoriesData.all_videos.count}
                      </div>
                    </div>

                    {
                      isAdminMode && categoriesData.top_video.data.length <= 0 ?
                        <Button
                          type="primary"
                          size="large"
                          onClick={onClickUploadVideo}
                          icon={<PlusOutlined />}
                          className="rounded-full flex items-center justify-center px-7 ml-5"
                        >
                          Add Video
                        </Button>
                        : null
                    }

                  </div>
                  <div className=" grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4  gap-3">
                    {categoriesData.all_videos.data.length > 0 ? (
                      categoriesData.all_videos.data.map((video, index) => renderVideoCard(video, index))
                    ) : (
                      <div className="col-span-full text-center text-grayText mt-10">
                        <Empty description="No Videos Available" />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </Col>

        <Col xs={24} md={10} xl={8} className=" mb-4">
          <div className="w-full">
            <div
              className="rounded-3xl border hide-scrollbar bg-gray border-solid border-liteGray w-full relative p-4  "
              style={{
                height: isMobile ? "auto" : containerHeight,
                ...scrollableContentStyle,
              }}
            >
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Spin size="large" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 mt-4 text-xl">
                      <div>Article</div>
                      <div className="h-1.5 rounded-full w-1.5 bg-grayText"> </div>
                      <div className="bg-primaryOpacity px-2 py-0.5 text-primary rounded-lg font-bold !text-sm">
                        {categoriesData.articles.count}
                      </div>
                    </div>
                    {
                      isAdminMode ?
                        <Button
                          type="primary"
                          size="large"
                          onClick={onClickUploadArticle}
                          icon={<PlusOutlined />}
                          className="rounded-full flex items-center justify-center px-7 ml-5"
                        >
                          Add Article
                        </Button>
                        : null
                    }
                  </div>
                  <div className="mt-5 !text-md">
                    <div className="flex flex-col gap-0 sm:gap-1.5 ">
                      {categoriesData.articles.data.length > 0 ? (
                        categoriesData.articles.data.map((article) => renderArticleLink(article))
                      ) : (
                        <div className="text-center text-grayText h-[50vh] flex justify-center items-center">
                          <Empty description="No Articles Available" />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Row>
  );
};

export default SupportDetails;