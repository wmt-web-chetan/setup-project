import React, { useState, useRef } from "react";
import { Modal, Button, Typography, Upload, notification } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { uploadFileToFriendFolder } from "../../services/Store/DocumentRepository/actions";

const { Text } = Typography;
const { Dragger } = Upload;

// File size limit constants
const MAX_FILE_SIZE_MB = 10; // Maximum file size in MB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert to bytes

const FileUploadModal = ({ isVisible, onCancel, folderId, onUploadSuccess }) => {
  const dispatch = useDispatch();
  const { uploadFileLoading } = useSelector((state) => state.friendFolders);

  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Refs for tracking validation
  const oversizedFilesRef = useRef([]);
  const invalidFilesRef = useRef([]);
  const notificationShownRef = useRef(false);

  // Validate a single file for type and size
  const validateFile = (file) => {

    // Check file size first
    if (file.size > MAX_FILE_SIZE_BYTES) {
      oversizedFilesRef.current.push(file.name);
      return false;
    }

    // Check file type - Only PDF, DOC, Excel, and HTML files
    const allowedTypes = [
      "application/pdf",
      "application/msword", // DOC
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
      "application/vnd.ms-excel", // XLS
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
      "text/html", // HTML
      "application/xhtml+xml", // XHTML
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

  // Handle file upload submission
  const handleImport = async () => {
    if (fileList.length === 0) {
      notification.warning({
        message: "No file selected",
        description: "Please select a file to upload",
        duration: 4,
      });
      return;
    }

    // Check file size before submitting
    const file = fileList[0];
    const fileSize = file.size || file.originFileObj?.size || 0;

    if (fileSize > MAX_FILE_SIZE_BYTES) {
      notification.error({
        message: "File too large",
        description: `File exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`,
        duration: 5,
      });
      return;
    }

    setUploading(true);

    try {
      // Create FormData exactly like in SupportDetails
      const formData = new FormData();

      // Get the actual File object, not the ant design wrapper
      const actualFile = file.originFileObj || file;

      // Append file with index like in SupportDetails: files[0]
      formData.append("files[0]", actualFile);

      // Add folder_id
      formData.append("folder_id", folderId);



      // Dispatch the upload action
      const result = await dispatch(uploadFileToFriendFolder(formData));


      if (result?.payload?.success === true || result?.payload?.meta?.success === true || result?.payload) {
        // Reset the modal
        setFileList([]);
        onCancel();
        if (onUploadSuccess) {
          onUploadSuccess();
        }
        // Success notification will be handled by Redux slice
      } else {
        notification.error({
          message: "Upload failed",
          description: result?.payload?.message || "Failed to upload file. Please try again.",
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
    if (!uploading && !uploadFileLoading) {
      setFileList([]);
      // Reset file tracking refs
      oversizedFilesRef.current = [];
      invalidFilesRef.current = [];
      notificationShownRef.current = false;
      onCancel();
    }
  };

  // Upload props configuration - similar to SupportDetails
  const uploadProps = {
    name: "file",
    multiple: false, // Only single file
    showUploadList: false, // Hide default upload list
    fileList,
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.html,.htm", // PDF, DOC, Excel, and HTML files
    beforeUpload: (file) => {

      // Reset refs for new upload
      oversizedFilesRef.current = [];
      invalidFilesRef.current = [];
      notificationShownRef.current = true;

      // Validate the file (both size and type)
      if (!validateFile(file)) {
        // Show validation errors immediately
        if (oversizedFilesRef.current.length > 0) {
          notification.error({
            message: "File not uploaded",
            description: `File exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`,
            duration: 5,
          });
        }

        if (invalidFilesRef.current.length > 0) {
          notification.error({
            message: "File not uploaded",
            description: "Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, and HTML files are allowed.",
            duration: 5,
          });
        }

        return Upload.LIST_IGNORE;
      }

      // Replace existing file (single file only)
      setFileList([file]);
      return false; // Prevent auto upload
    },
    onChange: (info) => {
      // Handle file list changes if needed
    },
    customRequest: ({ onSuccess }) => {
      // Do nothing, prevent default upload behavior
      setTimeout(() => {
        onSuccess("ok");
      }, 0);
    },
    onDrop: (e) => {
    },
  };

  // Get file icon based on file type - same as SupportDetails
  const getFileIcon = (file) => {
    const fileType = file.type || '';
    const fileName = file.name || '';
    const fileExtension = fileName.toLowerCase().split(".").pop();

    if (fileType === "application/pdf" || fileExtension === "pdf") {
      return "icon-pdf";
    } else if (fileType.includes("word") || ["doc", "docx"].includes(fileExtension)) {
      return "icon-word";
    } else if (fileType.includes("excel") || fileType.includes("spreadsheet") || ["xls", "xlsx"].includes(fileExtension)) {
      return "icon-excel";
    } else if (fileType === "text/html" || fileType === "application/xhtml+xml" || ["html", "htm"].includes(fileExtension)) {
      return "icon-documents";
    } else {
      return "icon-documents";
    }
  };

  // Format file size - same as SupportDetails
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      title={<div className="text-md text-white">Upload File</div>}
      centered
      open={isVisible}
      onCancel={!uploading && !uploadFileLoading ? handleCancel : undefined}
      footer={null}
      width={650}
      closable={true}
      className="bg-dark"
      maskClosable={!uploading && !uploadFileLoading}
      destroyOnClose
    >
      <div className="p-4">
        {/* Enhanced Dragger with improved styling - same as SupportDetails */}
        <Dragger
          {...uploadProps}
          className="bg-darkGray rounded-lg"
          style={{
            padding: "30px 0",
            border: "2px dashed #FF6D00",
            borderRadius: "8px",
          }}
          disabled={uploading || uploadFileLoading}
        >
          <div className="flex flex-col items-center">
            <div className="bg-primaryOpacity w-16 h-16 flex items-center justify-center !rounded-full mb-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary">
                <i className="icon-upload text-2xl" />
              </div>
            </div>
            <Text className="text-white mb-2 text-lg font-medium">
              Drag & drop or Choose file to upload
            </Text>
            <Text className="text-grayText text-sm">
              Supported formats: PDF, DOC, DOCX, XLS, XLSX, HTML
            </Text>
            <Text className="text-grayText text-sm mt-1">
              Maximum file size: {MAX_FILE_SIZE_MB}MB
            </Text>
            {fileList.length > 0 && (
              <Text className="text-primary text-sm mt-2">
                1 file selected
              </Text>
            )}
          </div>
        </Dragger>

        {/* Show File Details - same styling as SupportDetails */}
        {fileList.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center bg-darkGray rounded-lg p-3 border border-[#373737]">
              <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-primaryOpacity mr-3">
                <i className={`${getFileIcon(fileList[0])} text-2xl text-white before:!m-0`} />
              </div>

              <div className="flex-grow mr-2 overflow-hidden">
                <Text className="text-white text-sm block truncate" title={fileList[0].name}>
                  {fileList[0].name}
                </Text>
                <Text className="text-grayText text-xs">
                  {formatFileSize(fileList[0].size || fileList[0].originFileObj?.size || 0)}
                </Text>
              </div>

              <Button
                type="text"
                size="small"
                className="text-grayText hover:text-white flex-shrink-0"
                onClick={() => setFileList([])}
                disabled={uploading || uploadFileLoading}
                icon={<i className="icon-close text-xs" />}
              />
            </div>
          </div>
        )}

        <hr className="my-5 border-liteGray" />

        {/* Footer with action buttons - same as SupportDetails */}
        <div className="flex justify-between gap-3 mt-6">
          <Button
            className="w-1/2"
            size="large"
            onClick={handleCancel}
            disabled={uploading || uploadFileLoading}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            className="w-1/2"
            size="large"
            onClick={handleImport}
            style={{ backgroundColor: "#FF6D00", borderColor: "#FF6D00" }}
            loading={uploading || uploadFileLoading}
            disabled={fileList.length === 0}
          >
            {(uploading || uploadFileLoading) ? "Uploading..." : "Upload File"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FileUploadModal;