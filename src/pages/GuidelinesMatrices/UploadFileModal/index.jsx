import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Button,
  Row,
  Col,
  Typography,
  Upload,
  message,
  TreeSelect,
  notification,
  Progress,
} from "antd";
import { InboxOutlined, StarFilled } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchLoanCategoryFolderDetails,
  uploadLoanCategoryFileAction,
} from "../../../services/Store/GuidelinesMatrices/action";
import { getStorage } from "../../../utils/commonfunction";

const { Text } = Typography;
const { Dragger } = Upload;
const { SHOW_PARENT } = TreeSelect;

// Add constants for file size limit and chunking
const MAX_FILE_SIZE_MB = 20; // Maximum file size in MB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert to bytes
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks - S3 multipart upload minimum requirement

const UploadFileModal = ({ isVisible, onCancel, folderId }) => {
  const dispatch = useDispatch();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

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

  // Get loan categories and file upload state from Redux store
  const { loanCategories, loanCategoriesLoading } = useSelector(
    (state) => state?.loanCategories || {}
  );

  const { fileUploadLoading, fileUpload } = useSelector(
    (state) => state?.guidelineMatrices || {}
  );

  // Add userForEdit selector for auth token
  const { userForEdit } = useSelector((state) => state?.usersmanagement || {});

  // Reset form and file list when modal is opened
  useEffect(() => {
    if (isVisible) {
      setSelectedCategories([]);
      setFileList([]);
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
  }, [isVisible]);

  // Transform loan categories to tree data format
  useEffect(() => {
    if (loanCategories?.data?.loan_categories?.length > 0) {
      const categories = loanCategories.data.loan_categories;

      const formattedTreeData = categories.map((category) => {
        const categoryObj = {
          title: category.name,
          value: category.id,
          key: category.id,
          color: category.color || "#9e9e9e",
        };

        // Add children if subcategories exist
        if (category.sub_categories?.length > 0) {
          categoryObj.children = category.sub_categories.map((subCategory) => ({
            title: subCategory.name,
            value: subCategory.id,
            key: subCategory.id,
            color: subCategory.color || "#9e9e9e",
            parentColor: category.color || "#9e9e9e",
            parentName: category.name,
            isSubcategory: true,
          }));
        }

        return categoryObj;
      });

      setTreeData(formattedTreeData);
    }
  }, [loanCategories]);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    let token = userForEdit?.token;

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

      const response = await fetch(`${getApiBaseUrl()}/admin/loan-category-folder/generate-presigned-url`, {
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

      // Step 1: Initialize multipart upload
      console.log('🔸 Step 1: Initializing multipart upload...');
      const initController = new AbortController();
      const initTimeoutId = setTimeout(() => initController.abort(), 10000);

      const initResponse = await fetch(`${getApiBaseUrl()}/admin/loan-category-folder/initialize-multipart-upload`, {
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

      // Step 2: Get presigned URLs for all parts
      console.log('🔸 Step 2: Getting presigned URLs...');
      const urlsController = new AbortController();
      const urlsTimeoutId = setTimeout(() => urlsController.abort(), 10000);

      const urlsResponse = await fetch(`${getApiBaseUrl()}/admin/loan-category-folder/generate-upload-part-urls`, {
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

      // Step 4: Complete multipart upload
      console.log('🔸 Step 4: Completing multipart upload...');
      const completeController = new AbortController();
      const completeTimeoutId = setTimeout(() => completeController.abort(), 15000);

      const completeResponse = await fetch(`${getApiBaseUrl()}/admin/loan-category-folder/complete-multipart-upload`, {
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
      return actualFile.size > chunkThreshold;
    });

    const smallFiles = files.filter(file => {
      const actualFile = file.originFileObj || file;
      return actualFile.size <= chunkThreshold;
    });

    console.log('📁 Processing files:', {
      total: files.length,
      small: smallFiles.length,
      large: largeFiles.length,
      threshold: `${chunkThreshold / 1024 / 1024}MB`
    });

    if (largeFiles.length === 0 && smallFiles.length === 0) {
      console.log('📁 No files to upload');
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

  // Validate a single file for type and size
  const validateFile = (file) => {
    // Check file size first
    if (file.size > MAX_FILE_SIZE_BYTES) {
      oversizedFilesRef.current.push(file.name);
      return false;
    }

    // Check file type
    const allowedTypes = [
      "application/pdf",
      "application/msword", // DOC
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
      "text/html", // HTML
      "application/xhtml+xml", // XHTML
    ];

    // Also check file extension as a fallback
    const fileName = file.name || "";
    const fileExtension = fileName.toLowerCase().split(".").pop();
    const allowedExtensions = ["pdf", "doc", "docx", "html", "htm"];

    const isValidType =
      allowedTypes.includes(file.type) ||
      allowedExtensions.includes(fileExtension);

    if (!isValidType) {
      invalidFilesRef.current.push(file.name);
      return false;
    }

    return true;
  };

  // Upload props configuration
  const uploadProps = {
    name: "file",
    multiple: true,
    showUploadList: false,
    fileList,
    accept: ".pdf,.doc,.docx,.html,.htm",
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
            description: `Invalid file type${count > 1 ? 's' : ''}. Only PDF, DOC, DOCX, and HTML files are allowed.`,
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
            "text/html",
            "application/xhtml+xml",
          ];
          const fileName = file.originFileObj.name || "";
          const fileExtension = fileName.toLowerCase().split(".").pop();
          const allowedExtensions = ["pdf", "doc", "docx", "html", "htm"];
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

  // Custom TreeSelect title renderer
  const titleRender = (nodeData) => {
    const isSubcategory = nodeData.isSubcategory;
    const color = nodeData.color || "#9e9e9e";
    const parentColor = nodeData.parentColor || color;

    return (
      <div className="flex items-center">
        {isSubcategory ? (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center mr-2"
            style={{ backgroundColor: parentColor }}
          >
            <StarFilled style={{ color: color }} className="text-xs" />
          </div>
        ) : (
          <StarFilled
            style={{ color: color, fontSize: "16px", marginRight: "8px" }}
          />
        )}
        <Text className="text-white">{nodeData.title}</Text>
      </div>
    );
  };

  // Handle form submission
  const handleUpload = async () => {
    if (fileList?.length === 0) {
      notification.warning({
        message: "No files selected",
        description: "Please select at least one file to upload",
        duration: 4,
      });
      return;
    }

    if (selectedCategories?.length === 0) {
      notification.warning({
        message: "No categories selected",
        description: "Please select at least one category",
        duration: 4,
      });
      return;
    }

    // Check file sizes before submitting
    const oversizedFiles = fileList.filter(
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
      // Process files - upload directly to S3
      const { uploadedFiles } = await processLargeFiles(fileList);

      // Create form data
      const formData = new FormData();

      // Add folder ID
      formData.append("folder_id", folderId);

      // Add category IDs with proper indexing
      selectedCategories.forEach((categoryId, index) => {
        formData.append(`category_ids[${index}]`, categoryId);
      });

      // Add uploaded file references to FormData instead of actual files
      if (uploadedFiles.length > 0) {
        console.log('📤 Adding S3 files to FormData:', JSON.stringify(uploadedFiles, null, 2));
        formData.append('s3_files', JSON.stringify(uploadedFiles));
      } else {
        console.log('📤 No files to upload, submitting without files');
      }

      // Dispatch upload action
      dispatch(uploadLoanCategoryFileAction(formData))
        .then((res) => {
          if (res?.payload?.meta?.success === true) {
            // Reset the modal
            setFileList([]);
            setSelectedCategories([]);
            onCancel();
            dispatch(fetchLoanCategoryFolderDetails(folderId));
            // notification.success({
            //   message: "Upload successful",
            //   description: "Files uploaded successfully!",
            //   duration: 4,
            // });
          } else {
            notification.error({
              message: "Upload failed",
              description: "Failed to upload files. Please try again.",
              duration: 4,
            });
          }
          setUploading(false);
        })
        .catch((error) => {
          notification.error({
            message: "Upload error",
            description: "An error occurred during upload: " +
              (error.message || "Unknown error"),
            duration: 5,
          });
          setUploading(false);
        });
    } catch (error) {
      setUploading(false);
      console.error("File processing failed:", error);
      notification.error({
        message: "Upload failed",
        description: "Failed to process files. Please try again.",
        duration: 5,
      });
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        title="Upload Files"
        centered
        destroyOnClose
        open={isVisible}
        className="modalWrapperBox"
        onCancel={!uploading && !chunkingProgress.isChunking ? onCancel : undefined}
        footer={false}
        maskClosable={!uploading && !chunkingProgress.isChunking}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
            disabled={uploading || chunkingProgress.isChunking}
          />
        }
        width={800}
      >
        {/* Chunking Progress Overlay */}
        {/* {chunkingProgress.isChunking && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
            <div className="bg-darkGray p-6 rounded-lg max-w-md w-full mx-4">
              <div className="text-center mb-4">
                <Text className="text-white text-lg font-medium">
                  Processing Files
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
                Supported formats: PDF, DOC, DOCX, HTML
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
                  // Set icon based on file type
                  console.log('file', file)
                  return (
                    <div
                      key={`${file.uid || index}`}
                      className="flex items-center bg-darkGray rounded-lg p-3 mb-2 border border-[#373737]"
                    >
                      <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-primaryOpacity mr-3">
                        {file?.type === "application/pdf" || file?.name?.toLowerCase().endsWith('.pdf') ? 
                          <i className="icon-pdf text-2xl text-white before:!m-0 " /> :
                          <i className="icon-documents text-2xl text-white before:!m-0 " />
                        }
                      </div>

                      <div className="flex-grow mr-2 overflow-hidden">
                        <Text className="text-white text-sm block truncate" title={file.name}>
                          {file.name}
                        </Text>
                        {/* <Text className="text-grayText text-xs">
                          {((file.size || 0) / 1024).toFixed(1)} KB
                          {(file.size || file.originFileObj?.size) > CHUNK_SIZE && (
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

          {/* Categories Selection - Keeping original */}
          <div className="my-6">
            <Text className="text-white mb-2 block">Select Categories</Text>
            {
              treeData?.length > 0 ? 
              <TreeSelect
              size="large"
              className="w-full bg-darkGray custom-tree-select"
              value={selectedCategories}
              onChange={setSelectedCategories}
              treeData={treeData}
              treeCheckable={true}
              showCheckedStrategy={SHOW_PARENT}
              placeholder="Select one or more categories"
              treeDefaultExpandAll
              multiple
              maxTagCount={3}
              showSearch={true}
              filterTreeNode={(input, node) => {
                const title = node.title?.toLowerCase() || "";
                return title.includes(input.toLowerCase());
              }}
              maxTagPlaceholder={(omittedValues) =>
                `+ ${omittedValues.length} more`
              }
              dropdownClassName="dark-dropdown"
              treeIcon
              treeNodeLabelProp="title"
              titleRender={titleRender}
              popupClassName="dark-select-dropdown"
              listHeight={300}
              loading={loanCategoriesLoading}
              disabled={uploading || chunkingProgress.isChunking}
            />
              :
              <TreeSelect
              size="large"
              className="w-full bg-darkGray custom-tree-select"
              disabled={true}
              placeholder="No categories found. Create one to upload files."
              treeDefaultExpandAll
              multiple
              maxTagCount={3}
              showSearch={true}
              dropdownClassName="dark-dropdown"
              treeIcon
              treeNodeLabelProp="title"              
              popupClassName="dark-select-dropdown"
              listHeight={300}
              loading={loanCategoriesLoading}
              suffixIcon={false}
            /> 
            }
            
          </div>

          {/* Footer with action buttons */}
          <div className="mb-6 border-t-2 border-solid border-[#373737] pt-6"></div>
          <Row gutter={16}>
            <Col span={12}>
              <Button
                block
                size="large"
                onClick={onCancel}
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
                onClick={handleUpload}
                style={{ backgroundColor: "#FF6D00", borderColor: "#FF6D00" }}
                loading={uploading || fileUploadLoading || chunkingProgress.isChunking}
                disabled={
                  fileList.length === 0 ||
                  selectedCategories.length === 0 ||
                  fileList.length > 5 ||
                  treeData?.length <= 0 ||
                  chunkingProgress.isChunking
                }                
              >
                Import
              </Button>
            </Col>
          </Row>
        </div>
      </Modal>
    </>
  );
};

export default UploadFileModal;