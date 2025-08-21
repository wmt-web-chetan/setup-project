import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Button,
  Row,
  Col,
  Typography,
  Upload,
  Select,
  notification,
  Progress,
} from "antd";
import { useSelector, useDispatch } from "react-redux";
import { addStateLicense } from "../../../../services/Store/StateLicense/action";
import { getStorage } from "../../../../utils/commonfunction";

const { Text } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

// Add constants for file size limit
const MAX_FILE_SIZE_MB = 20; // Maximum file size in MB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert to bytes
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks - S3 multipart upload minimum requirement

// USA States list
const US_STATES = [
  { value: "Alabama", label: "Alabama" },
  { value: "Alaska", label: "Alaska" },
  { value: "Arizona", label: "Arizona" },
  { value: "Arkansas", label: "Arkansas" },
  { value: "California", label: "California" },
  { value: "Colorado", label: "Colorado" },
  { value: "Connecticut", label: "Connecticut" },
  { value: "Delaware", label: "Delaware" },
  { value: "Florida", label: "Florida" },
  { value: "Georgia", label: "Georgia" },
  { value: "Hawaii", label: "Hawaii" },
  { value: "Idaho", label: "Idaho" },
  { value: "Illinois", label: "Illinois" },
  { value: "Indiana", label: "Indiana" },
  { value: "Iowa", label: "Iowa" },
  { value: "Kansas", label: "Kansas" },
  { value: "Kentucky", label: "Kentucky" },
  { value: "Louisiana", label: "Louisiana" },
  { value: "Maine", label: "Maine" },
  { value: "Maryland", label: "Maryland" },
  { value: "Massachusetts", label: "Massachusetts" },
  { value: "Michigan", label: "Michigan" },
  { value: "Minnesota", label: "Minnesota" },
  { value: "Mississippi", label: "Mississippi" },
  { value: "Missouri", label: "Missouri" },
  { value: "Montana", label: "Montana" },
  { value: "Nebraska", label: "Nebraska" },
  { value: "Nevada", label: "Nevada" },
  { value: "New Hampshire", label: "New Hampshire" },
  { value: "New Jersey", label: "New Jersey" },
  { value: "New Mexico", label: "New Mexico" },
  { value: "New York", label: "New York" },
  { value: "North Carolina", label: "North Carolina" },
  { value: "North Dakota", label: "North Dakota" },
  { value: "Ohio", label: "Ohio" },
  { value: "Oklahoma", label: "Oklahoma" },
  { value: "Oregon", label: "Oregon" },
  { value: "Pennsylvania", label: "Pennsylvania" },
  { value: "Rhode Island", label: "Rhode Island" },
  { value: "South Carolina", label: "South Carolina" },
  { value: "South Dakota", label: "South Dakota" },
  { value: "Tennessee", label: "Tennessee" },
  { value: "Texas", label: "Texas" },
  { value: "Utah", label: "Utah" },
  { value: "Vermont", label: "Vermont" },
  { value: "Virginia", label: "Virginia" },
  { value: "Washington", label: "Washington" },
  { value: "West Virginia", label: "West Virginia" },
  { value: "Wisconsin", label: "Wisconsin" },
  { value: "Wyoming", label: "Wyoming" },
  { value: "District of Columbia", label: "District of Columbia" },
];

const UploadLicenseModal = ({ isVisible, onCancel, onSuccess }) => {
  const dispatch = useDispatch();
  const [selectedState, setSelectedState] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Add refs for tracking oversized and invalid files
  const oversizedFilesRef = useRef([]);
  const invalidFilesRef = useRef([]);
  const notificationShownRef = useRef(false);
  const userLoginRole = getStorage("userLoginRole", true);

  // New chunking states
  const [chunkingProgress, setChunkingProgress] = useState({
    isChunking: false,
    currentFile: 0,
    totalFiles: 0,
    currentFileName: '',
    chunkProgress: 0,
    overallProgress: 0
  });

  // Get create state license loading state from Redux store
  const { createStateLicenseLoading } = useSelector(
    (state) => state?.stateLicenses || {}
  );

  // Get user data for authentication
  const { userForEdit } = useSelector((state) => state?.usersmanagement);

  // Reset form when modal is opened
  useEffect(() => {
    if (isVisible) {
      setSelectedState(null);
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

      const response = await fetch(`${getApiBaseUrl()}/state-licenses/generate-presigned-url`, {
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

      // Step 1: Initialize multipart upload
      console.log('🔸 Step 1: Initializing multipart upload...');
      const initController = new AbortController();
      const initTimeoutId = setTimeout(() => initController.abort(), 10000);

      const initResponse = await fetch(`${getApiBaseUrl()}/state-licenses/initialize-multipart-upload`, {
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

      // Step 2: Get presigned URLs for all parts
      console.log('🔸 Step 2: Getting presigned URLs...');
      const urlsController = new AbortController();
      const urlsTimeoutId = setTimeout(() => urlsController.abort(), 10000);

      const urlsResponse = await fetch(`${getApiBaseUrl()}/state-licenses/generate-upload-part-urls`, {
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

      // Step 3: Upload each part directly to S3
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

      const completeResponse = await fetch(`${getApiBaseUrl()}/state-licenses/complete-multipart-upload`, {
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
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    // Also check file extension as a fallback
    const fileName = file.name || "";
    const fileExtension = fileName.toLowerCase().split(".").pop();
    const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];

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
    multiple: false, // Only single file upload for license
    showUploadList: false,
    fileList,
    accept: ".pdf,.jpg,.jpeg,.png",
    beforeUpload: (file, fileListArg) => {
      let shouldReject = false;

      // Validate the file (both size and type)
      if (!validateFile(file)) {
        shouldReject = true;
      }

      // For single file upload, replace existing file
      if (fileList.length >= 1 && !shouldReject) {
        setFileList([]); // Clear existing file
      }

      // Check if this is the last file in the batch
      const currentIndex = fileListArg.indexOf(file);
      if (
        currentIndex === fileListArg.length - 1 &&
        !notificationShownRef.current
      ) {
        notificationShownRef.current = true;

        // Show notification for oversized files
        if (oversizedFilesRef.current.length > 0) {
          notification.error({
            message: "File not uploaded",
            description: `File exceeded the ${MAX_FILE_SIZE_MB}MB size limit.`,
            duration: 5,
          });
        }

        // Show notification for invalid file types
        if (invalidFilesRef.current.length > 0) {
          notification.error({
            message: "File not uploaded",
            description:
              "Invalid file type. Only PDF, JPG, JPEG and PNG files are allowed.",
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
      if (info.file.status === "removed" || info.fileList.length === 0) {
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
            "image/jpeg",
            "image/jpg",
            "image/png",
          ];
          const fileName = file.originFileObj.name || "";
          const fileExtension = fileName.toLowerCase().split(".").pop();
          const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];
          const isValidType =
            allowedTypes.includes(file.originFileObj.type) ||
            allowedExtensions.includes(fileExtension);

          return isValidSize && isValidType;
        }

        return true;
      });

      // Ensure we only keep 1 file for license upload
      if (newFileList.length > 1) {
        newFileList = newFileList.slice(-1); // Keep only the latest file
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

  // Handle form submission
  const handleUpload = async () => {
    if (!selectedState) {
      notification.warning({
        message: "State not selected",
        description: "Please select a state",
        duration: 4,
      });
      return;
    }

    if (fileList?.length === 0) {
      notification.warning({
        message: "No file selected",
        description: "Please select a license file to upload",
        duration: 4,
      });
      return;
    }

    // Check file size before submitting
    const file = fileList[0];
    const fileSize = file?.size || file?.originFileObj?.size || 0;

    if (fileSize > MAX_FILE_SIZE_BYTES) {
      notification.error({
        message: "File not uploaded",
        description: `File exceeded the ${MAX_FILE_SIZE_MB}MB size limit.`,
        duration: 5,
      });
      return;
    }

    setUploading(true);

    try {
      // Process files - upload directly to S3
      const { uploadedFiles } = await processLargeFiles(fileList);

      // Create form data
      const formData = new FormData();

      // Add state
      formData.append("state", selectedState);
      formData.append("role", userLoginRole?.name);


      // Add uploaded file references to FormData
      if (uploadedFiles.length > 0) {
        console.log('📤 Adding S3 files to FormData:', JSON.stringify(uploadedFiles, null, 2));
        formData.append('s3_files', JSON.stringify(uploadedFiles));
      } else {
        // Fallback to original file if S3 upload didn't work
        const actualFile = file.originFileObj || file;
        formData.append("license_file", actualFile);
      }

      // Dispatch upload action
      const res = await dispatch(addStateLicense(formData));
      
      if (res?.payload?.meta?.success === true) {
        // Reset the modal
        setFileList([]);
        setSelectedState(null);
        onCancel();
        if (onSuccess) onSuccess();
        notification.success({
          message: "Success",
          description:
            res?.payload?.meta?.message || "License uploaded successfully!",
          duration: 4,
        });
      } else {
        notification.error({
          message: "Upload failed",
          description:
            res?.payload?.meta?.message ||
            "Failed to upload license. Please try again.",
          duration: 4,
        });
      }
      setUploading(false);
    } catch (error) {
      console.error("Upload failed:", error);
      notification.error({
        message: "Upload error",
        description:
          "An error occurred during upload: " +
          (error?.message || "Unknown error"),
        duration: 5,
      });
      setUploading(false);
    }
  };

  return (
    <Modal
      title="Upload State License"
      centered
      destroyOnClose
      open={isVisible}
      className="modalWrapperBox"
      onCancel={!uploading && !createStateLicenseLoading ? onCancel : undefined}
      footer={false}
      maskClosable={!uploading && !createStateLicenseLoading}
      closeIcon={
        <Button
          shape="circle"
          icon={<i className="icon-close before:!m-0 text-sm" />}
          disabled={uploading || createStateLicenseLoading}
        />
      }
      width={700}
    >
      {/* Chunking Progress Overlay */}
      {/* {chunkingProgress.isChunking && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-darkGray p-6 rounded-lg max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <Text className="text-white text-lg font-medium">
                Processing File
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
        {/* State Selection */}
        <div className="mb-6">
          <Text className="text-white mb-2 block">Select State</Text>
          <Select
            size="large"
            className="w-full bg-darkGray"
            value={selectedState}
            onChange={setSelectedState}
            placeholder="Choose a state"
            showSearch
            filterOption={(input, option) =>
              option?.children?.toLowerCase()?.includes(input.toLowerCase())
            }
            dropdownClassName="dark-dropdown"
            disabled={uploading || createStateLicenseLoading}
          >
            {US_STATES.map((state) => (
              <Option key={state.value} value={state.value}>
                {state.label}
              </Option>
            ))}
          </Select>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <Text className="text-white mb-2 block">Upload License Document</Text>

          <Dragger
            {...uploadProps}
            className="bg-darkGray rounded-lg"
            style={{
              padding: "30px 0",
              border: "2px dashed #FF6D00",
              borderRadius: "8px",
            }}
            disabled={uploading || createStateLicenseLoading}
          >
            <div className="flex flex-col items-center">
              <div className="bg-primaryOpacity w-16 h-16 flex items-center justify-center !rounded-full mb-4">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary">
                  <i className="icon-upload text-2xl" />
                </div>
              </div>
              <Text className="text-white mb-1">
                Drag & drop or Choose file to upload
              </Text>
              <Text className="text-grayText text-xs">
                Supported formats: PDF, JPG, JPEG, PNG
              </Text>
              <Text className="text-grayText text-xs mt-1">
                Maximum file size: {MAX_FILE_SIZE_MB}MB
              </Text>
            </div>
          </Dragger>

          {/* Show Selected File */}
          {fileList.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-end mb-2">
                <Button
                  type="text"
                  size="small"
                  onClick={() => setFileList([])}
                  className="text-grayText hover:text-white"
                  disabled={uploading || createStateLicenseLoading}
                >
                  Remove File
                </Button>
              </div>

              <div className="bg-darkGray rounded-lg p-3 border border-[#373737]">
                {fileList.map((file, index) => (
                  <div
                    key={`${file.uid || index}`}
                    className="flex items-center"
                  >
                    <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-primaryOpacity mr-3">
                      {file?.type === "application/pdf" ||
                      file?.name?.toLowerCase().includes(".pdf") ? (
                        <i className="icon-pdf text-2xl text-white before:!m-0" />
                      ) : file?.type?.includes("image") ||
                        file?.name?.toLowerCase().match(/\.(jpg|jpeg|png)$/) ? (
                        <i className="icon-jpg text-2xl text-white before:!m-0" />
                      ) : (
                        <i className="icon-documents text-2xl text-white before:!m-0" />
                      )}
                    </div>

                    <div className="flex-grow mr-2 overflow-hidden">
                      <Text
                        className="text-white text-sm block truncate"
                        title={file.name}
                      >
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
                        if (!uploading && !createStateLicenseLoading) {
                          setFileList([]);
                        }
                      }}
                      disabled={uploading || createStateLicenseLoading}
                      icon={<i className="icon-close text-xs" />}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with action buttons */}
        <div className="mb-6 border-t-2 border-solid border-[#373737] pt-6"></div>
        <Row gutter={16}>
          <Col span={12}>
            <Button
              block
              size="large"
              onClick={onCancel}
              disabled={uploading || createStateLicenseLoading}
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
              loading={uploading || createStateLicenseLoading}
              disabled={!selectedState || fileList.length === 0}
            >
              Upload License
            </Button>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default UploadLicenseModal;