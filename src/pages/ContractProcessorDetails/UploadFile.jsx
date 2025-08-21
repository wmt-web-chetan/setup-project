import React, { useState, useRef, useEffect } from "react";
import { Modal, Button, Typography, Upload, notification, Row, Col, Progress } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getStorage } from "../../utils/commonfunction";

const { Text } = Typography;
const { Dragger } = Upload;

// File size limit constants
const MAX_FILE_SIZE_MB = 20; // Maximum file size in MB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert to bytes
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks - S3 multipart upload minimum requirement

const FileUploadModal = ({ isVisible, onCancel, folderId, onUploadSuccess }) => {
  const dispatch = useDispatch();
  const { uploadFileLoading } = useSelector((state) => state.friendFolders);
  const { userForEdit } = useSelector((state) => state?.usersmanagement);

  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Refs for tracking validation
  const oversizedFilesRef = useRef([]);
  const invalidFilesRef = useRef([]);
  const notificationShownRef = useRef(false);

  // New chunking states
  const [chunkingProgress, setChunkingProgress] = useState({
    isChunking: false,
    currentFile: 0,
    totalFiles: 0,
    currentFileName: '',
    chunkProgress: 0,
    overallProgress: 0
  });

  // Reset form and file list when modal is opened
  useEffect(() => {
    if (isVisible) {
      setFileList([]);
      setUploading(false);
      // Reset file tracking refs
      oversizedFilesRef.current = [];
      invalidFilesRef.current = [];
      notificationShownRef.current = false;
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

      // Get presigned URL from FAST Laravel endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${getApiBaseUrl()}/friend-folder/generate-presigned-url`, {
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


      // Step 1: Initialize multipart upload (FAST Laravel endpoint - 1 S3 call)
      const initController = new AbortController();
      const initTimeoutId = setTimeout(() => initController.abort(), 10000); // 10 second timeout

      const initResponse = await fetch(`${getApiBaseUrl()}/friend-folder/initialize-multipart-upload`, {
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

      const urlsResponse = await fetch(`${getApiBaseUrl()}/friend-folder/generate-upload-part-urls`, {
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

      const completeResponse = await fetch(`${getApiBaseUrl()}/friend-folder/complete-multipart-upload`, {
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
      return actualFile.size > chunkThreshold;
    });

    const smallFiles = files.filter(file => {
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

  // Validate a single file for type and size
  const validateFile = (file) => {
    console.log(`🔍 Validating file: ${file.name}, size: ${file.size}, type: ${file.type}`);
  
    // Check file size first
    if (file.size > MAX_FILE_SIZE_BYTES) {
      oversizedFilesRef.current.push(file.name);
      return false;
    }
  
    // Check file type - PDF, DOC, Excel, and HTML files
    const allowedTypes = [
      "application/pdf",
      "application/msword", // DOC
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
      "application/vnd.ms-excel", // XLS
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
      "text/html", // HTML
      "application/xhtml+xml", // XHTML (alternative HTML MIME type)
    ];
  
    // Also check file extension as a fallback
    const fileName = file.name || "";
    const fileExtension = fileName.toLowerCase().split(".").pop();
    const allowedExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "html", "htm"];
  
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
    multiple: true, // Enable multiple file upload
    showUploadList: false, // Hide default upload list
    fileList,
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.html,.htm",
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
            description: `Invalid file type${count > 1 ? 's' : ''}. Only PDF, DOC, DOCX, XLS, and XLSX files are allowed.`,
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
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/html", // HTML
            "application/xhtml+xml", // XHTML
          ];
          const fileName = file.originFileObj.name || "";
          const fileExtension = fileName.toLowerCase().split(".").pop();
          const allowedExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "html", "htm"];
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

  // Handle file upload submission with S3 direct upload
  const handleImport = async () => {
    if (fileList.length === 0) {
      notification.warning({
        message: "No files selected",
        description: "Please select at least one file to upload",
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
    if (fileList.length > 5) {
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


      // Now submit the uploaded files to your backend API
      const formData = new FormData();
      formData.append("folder_id", folderId);

      // Add S3 file references instead of actual files
      if (uploadedFiles.length > 0) {
        formData.append('s3_files', JSON.stringify(uploadedFiles));
      }


     

      // Replace this with your actual API endpoint for handling S3 uploaded files
      const response = await fetch(`${getApiBaseUrl()}/friend-folder/upload-file`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend submission failed:', errorText);
        throw new Error(`Backend submission failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result?.success === true || result?.meta?.success === true) {
        // Reset the modal
        setFileList([]);
        onCancel();
        if (onUploadSuccess) {
          onUploadSuccess();
        }

        notification.success({
          message: "Upload successful",
          description: "Files have been uploaded successfully.",
          duration: 4,
        });
      } else {
        notification.error({
          message: "Upload failed",
          description: result?.message || "Failed to upload files. Please try again.",
          duration: 4,
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      notification.error({
        message: "Upload error",
        description: "An error occurred during upload: " + (error.message || "Unknown error"),
        duration: 5,
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (!uploading && !uploadFileLoading && !chunkingProgress.isChunking) {
      setFileList([]);
      // Reset file tracking refs
      oversizedFilesRef.current = [];
      invalidFilesRef.current = [];
      notificationShownRef.current = false;
      setChunkingProgress({
        isChunking: false,
        currentFile: 0,
        totalFiles: 0,
        currentFileName: '',
        chunkProgress: 0,
        overallProgress: 0
      });
      onCancel();
    }
  };

  // Get file icon based on file type
  const getFileIcon = (file) => {
    const fileType = file.type || '';
    const fileName = file.name || '';
    const fileExtension = fileName.toLowerCase().split(".").pop();

    if (fileType === "application/pdf" || fileExtension === "pdf") {
      return "icon-pdf";
    } else if (fileType.includes("word") || ["doc", "docx"].includes(fileExtension)) {
      return "icon-documents";
    } else if (fileType.includes("excel") || fileType.includes("spreadsheet") || ["xls", "xlsx"].includes(fileExtension)) {
      return "icon-xls";
    } else if (fileType === "text/html" || fileType === "application/xhtml+xml" || ["html", "htm"].includes(fileExtension)) {
      return "icon-documents";
    } else {
      return "icon-documents";
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      title="Upload Files"
      centered
      destroyOnClose
      open={isVisible}
      className="modalWrapperBox"
      onCancel={!uploading && !uploadFileLoading && !chunkingProgress.isChunking ? handleCancel : undefined}
      footer={false}
      maskClosable={!uploading && !uploadFileLoading && !chunkingProgress.isChunking}
      closeIcon={
        <Button
          shape="circle"
          icon={<i className="icon-close before:!m-0 text-sm" />}
          disabled={uploading || uploadFileLoading || chunkingProgress.isChunking}
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
          disabled={uploading || uploadFileLoading || fileList.length >= 5 || chunkingProgress.isChunking}
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
            Supported formats: PDF, DOC, DOCX, XLS, XLSX, HTML
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
                disabled={uploading || uploadFileLoading || chunkingProgress.isChunking}
              >
                Clear All
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {fileList.map((file, index) => {
                const actualFile = file.originFileObj || file;
                const willBeChunked = actualFile.size > CHUNK_SIZE;

                return (
                  <div
                    key={`${file.uid || index}`}
                    className="flex items-center bg-darkGray rounded-lg p-3 mb-2 border border-[#373737]"
                  >
                    <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-primaryOpacity mr-3">
                      <i className={`${getFileIcon(actualFile)} text-2xl text-white before:!m-0`} />
                    </div>

                    <div className="flex-grow mr-2 overflow-hidden">
                      <Text className="text-white text-sm block truncate" title={actualFile.name}>
                        {actualFile.name}
                      </Text>
                      {/* <Text className="text-grayText text-xs">
                        {formatFileSize(actualFile.size || 0)}
                        {willBeChunked && (
                          <span className="text-yellow-500 ml-2">(will be chunked)</span>
                        )}
                      </Text> */}
                    </div>

                    <Button
                      type="text"
                      size="small"
                      className="text-grayText hover:text-white flex-shrink-0"
                      onClick={() => {
                        if (!uploading && !uploadFileLoading && !chunkingProgress.isChunking) {
                          const newFileList = [...fileList];
                          newFileList.splice(index, 1);
                          setFileList(newFileList);
                        }
                      }}
                      disabled={uploading || uploadFileLoading || chunkingProgress.isChunking}
                      icon={<i className="icon-close text-xs" />}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer with action buttons */}
        <div className="mb-6 border-t-2 border-solid border-[#373737] pt-6 mt-6"></div>
        <Row gutter={16}>
          <Col span={12}>
            <Button
              block
              size="large"
              onClick={handleCancel}
              disabled={uploading || uploadFileLoading || chunkingProgress.isChunking}
            >
              Cancel
            </Button>
          </Col>
          <Col span={12}>
            <Button
              block
              type="primary"
              size="large"
              onClick={handleImport}
              style={{ backgroundColor: "#FF6D00", borderColor: "#FF6D00" }}
              loading={uploading || uploadFileLoading}
              disabled={fileList.length === 0 || fileList.length > 5 || chunkingProgress.isChunking}
            >
              {(uploading || uploadFileLoading) ? "Uploading..." : "Upload Files"}
            </Button>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default FileUploadModal;