import { 
  DeleteOutlined, 
  SearchOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Col,
  Input,
  Modal,
  Row,
  Typography,
  Spin,
  Empty,
} from "antd";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import FileUploadModal from "./UploadFile"; // Import the modal component
import {
  fetchFriendFolderFiles,
  uploadFileToFriendFolder,
  deleteFriendFolderFileAction,
} from "../../services/Store/DocumentRepository/actions";
import { IMAGE_BASE_URL } from "../../utils/constant"; // Add this import

const { Text } = Typography;

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const File = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { id, folderId, folderId2 } = useParams(); // id = user_id, folderId2 = folder_id for files
  const scrollRef = useRef(null);
  
  // Determine base route based on current route
  const baseRoute = useMemo(() => {
    if (location.pathname.includes('/loan-officer/')) {
      return '/loan-officer';
    }
    if (location.pathname.includes('/account-executive/')) {
      return '/account-executive';
    }
    if (location.pathname.includes('/real-estate-agent/')) {
      return '/real-estate-agent';
    }
    // Default to Contract Processors
    return '/contract-processor';
  }, [location.pathname]);
  
  // Redux state
  const {
    friendFolderFiles,
    friendFolderFilesLoading,
    filesLoadMoreLoading,
    uploadFileLoading,
    deleteFileLoading,
  } = useSelector((state) => state.friendFolders);

  
  // Local states
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [hasUserSearched, setHasUserSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Get data from Redux state
  const files = friendFolderFiles?.data?.files || [];
  const folderData = friendFolderFiles?.data?.folderData || {};
  const pagination = friendFolderFiles?.data?.pagination || {};
  const { currentPage, totalPage, totalRecords } = pagination;
  
  // Reset state when route params change
  useEffect(() => {
    setIsInitialLoad(true);
    setHasUserSearched(false);
    setSearchTerm("");
  }, [folderId2]);
  
  // Initial load effect - runs once when component mounts
  useEffect(() => {
    if (folderId2 && isInitialLoad) {
      setIsSearching(true);
      dispatch(fetchFriendFolderFiles({ 
        folderId: folderId2,
        params: {
          page: 1,
          per_page: 20,
        }
      })).then(() => {
        setIsSearching(false);
        setIsInitialLoad(false);
      });
    }
  }, [dispatch, folderId2, isInitialLoad]);
  
  // Search effect - triggers when debouncedSearchTerm changes (but only if user has searched)
  useEffect(() => {
    // Only trigger search if user has actually interacted with search
    if (hasUserSearched && !isInitialLoad) {
      setIsSearching(true);
      dispatch(fetchFriendFolderFiles({ 
        folderId: folderId2,
        params: {
          page: 1,
          search: debouncedSearchTerm || undefined,
          per_page: 20,
        }
      })).then(() => {
        setIsSearching(false);
      });
    }
  }, [debouncedSearchTerm, dispatch, hasUserSearched, isInitialLoad, folderId2]);

  // Handle infinite scroll
  const handleScroll = (e) => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      loadMoreData();
    }
  };
  
  const loadMoreData = () => {
    if (filesLoadMoreLoading || currentPage >= totalPage || friendFolderFilesLoading) return;
    
    dispatch(fetchFriendFolderFiles({ 
      folderId: folderId2,
      params: {
        page: currentPage + 1,
        search: searchTerm || undefined,
        per_page: 20,
      }
    }));
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Mark that user has interacted with search
    if (!hasUserSearched) {
      setHasUserSearched(true);
    }
  };

  // NEW: Handle file click to open file viewer or document in new tab
  const handleFileClick = (file) => {
    const fileName = file?.file_name || "";
    const fileExtension = fileName?.split(".").pop().toLowerCase();
    const isDocFile = fileExtension === "doc" || fileExtension === "docx";

    if (isDocFile) {
      // For document files, open directly in Microsoft Office Online
      const File_url = IMAGE_BASE_URL || "";
      const fileUrl = `${File_url}/${file?.file_path || ""}`;
      window.open(
        `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
          fileUrl
        )}`,
        "_blank"
      );
    } else {
      // For all other files, open directly in new tab
      const File_url = IMAGE_BASE_URL || "";
      const fileUrl = `${File_url}/${file?.file_path || ""}`;
      window.open(`${fileUrl}`, "_blank");
    }
  };

  // Toggle modal visibility
  const showUploadModal = () => {
    setIsUploadModalVisible(true);
  };

  const hideUploadModal = () => {
    setIsUploadModalVisible(false);
  };

  // Show delete modal
  const showDeleteModal = (file) => {
    setSelectedFile(file);
    setIsDeleteModalVisible(true);
  };

  // Handle delete
  const handleDelete = () => {
    if (selectedFile?.id) {
      dispatch(deleteFriendFolderFileAction(selectedFile.id)).then((result) => {
        if (result?.payload?.meta?.success) {
          setIsDeleteModalVisible(false);
          setSelectedFile(null);
        }
      });
    }
  };

  // Handle file upload success (callback from upload modal)
  const handleUploadSuccess = () => {
    setIsUploadModalVisible(false);
    dispatch(fetchFriendFolderFiles({ 
      folderId: folderId2,
      params: {
        page: 1,
        search: searchTerm || undefined,
        per_page: 20,
      }
    }));
    // No need to refresh - Redux slice handles adding new files to the beginning
  };

  // Get file icon based on extension
  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'icon-pdf';
      case 'doc':
      case 'docx':
        return 'icon-documents';
      case 'xls':
      case 'xlsx':
        return 'icon-csv';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'icon-image';
      case 'csv':
        return 'icon-csv';
      default:
        return 'icon-documents'; // Default to CSV icon
    }
  };

  // NEW: Function to truncate file name but preserve extension
  const truncateFileName = (fileName, maxLength = 15) => {
    if (!fileName || fileName.length <= maxLength) {
      return fileName;
    }
    
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) {
      // No extension found
      return fileName.substring(0, maxLength) + '...';
    }
    
    const extension = fileName.substring(lastDotIndex);
    const nameWithoutExtension = fileName.substring(0, lastDotIndex);
    
    const availableLength = maxLength - extension.length - 3; // 3 for '...'
    
    if (availableLength <= 0) {
      return '...' + extension;
    }
    
    return nameWithoutExtension.substring(0, availableLength) + '...' + extension;
  };

  // Show loading state only for initial loading and search (not for load more)
  const showLoading = friendFolderFilesLoading || isSearching;

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-none">
        <div className="flex items-center gap-1">
          <Text className="text-2xl font-normal">Files</Text>
          <span className="mx-1 text-grayText">&#8226;</span>
          <div className="bg-primaryOpacity px-2 text-primary rounded-lg">
            {totalRecords || 0}
          </div>
        </div>
        
        <Row gutter={[10, 10]} className="mt-3">
          <Col xs={24} md={24} lg={24} xl={12}>
            <Input
              prefix={<SearchOutlined className="text-grayText mr-2" />}
              placeholder="Search for file"
              className="px-3 py-2 rounded-full lg:w-3/4"
              value={searchTerm}
              onChange={handleSearchChange}
              allowClear
            />
          </Col>
          <Col xs={24} md={24} lg={24} xl={12} className="">
            <div className="w-full flex gap-3 mt-3 md:mt-0 justify-end">
              <Button
                icon={<DeleteOutlined className="text-red-600" />}
                className="rounded-3xl py-5 bg-gray px-5"
                onClick={() => navigate(`${baseRoute}/detail/${id}/recently-deleted`)}
              >
                Recently Deleted
              </Button>
              <Button
                type="primary"
                icon={<i className="icon-upload" />}
                className="rounded-3xl py-5"
                onClick={showUploadModal}
              >
                Upload File
              </Button>
            </div>
          </Col>
        </Row>
      </div>
      
      {/* Scrollable Files Section */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto mt-6" 
        style={{height:"50vh"}}
        onScroll={handleScroll}
      >
        {showLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spin size="large" />
          </div>
        ) : files.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-liteGray p-2 rounded-2xl flex flex-col w-full cursor-pointer"
                style={{ borderRadius: "12px" }}
              >
                <div 
                  className="p-2 py-6 bg-gray rounded-xl relative cursor-pointer"
                  onClick={() => handleFileClick(file)}
                >
                  <div className="flex justify-center py-2">
                    <div className="bg-primaryOpacity inline-block rounded-xl py-1">
                      <i className={`${getFileIcon(file.file_name)} text-primary text-4xl`} />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Button 
                      shape="circle" 
                      className="bg-gray"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering file click
                        showDeleteModal(file);
                      }}
                      // loading={deleteFileLoading && selectedFile?.id === file.id}
                    >
                      <i className="icon-delete before:!m-0 text-red-600" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between mt-3 items-center">
                  <Text 
                    className="text-sm font-semibold line-clamp-2 flex-1 mr-2 cursor-pointer"
                    title={file.file_name}
                    onClick={() => handleFileClick(file)}
                  >
                    {truncateFileName(file.file_name) || "Unnamed File"}
                  </Text>
                  <Avatar 
                    size={25}
                    src={
                      file?.upload_user?.profile_photo_path 
                        ? `${import.meta.env.VITE_IMAGE_BASE_URL}/${file.upload_user.profile_photo_path}` 
                        : undefined
                    }
                    style={{ 
                      backgroundColor: file?.upload_user?.profile_photo_path ? undefined : '',
                      fontSize: '12px'
                    }}
                  >
                    {!file?.upload_user?.profile_photo_path && 
                      file?.upload_user?.name?.charAt(0)?.toUpperCase()
                    }
                  </Avatar>
                </div>
              </div>
            ))}
            
            {/* Loading indicator for infinite scroll */}
            {filesLoadMoreLoading && (
              <div className="col-span-full flex justify-center my-4">
                <Spin />
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <Empty
              description={
                <span className="text-grayText">
                  No files found
                </span>
              }
            />
          </div>
        )}
      </div>
      
      {/* File Upload Modal */}
      <FileUploadModal 
        isVisible={isUploadModalVisible} 
        onCancel={hideUploadModal}
        folderId={folderId2}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete File"
        open={isDeleteModalVisible}
        onCancel={() => setIsDeleteModalVisible(false)}
        footer={null}
        destroyOnClose
        centered
        className="modalWrapperBox"
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
          />
        }
      >
        <div className="border-t-2 border-solid border-[#373737] mt-5">
          <Row gutter={16} className="">
            <div className="w-full pt-5 flex items-center justify-center pb-5">
              <Text className="text-base font-normal text-grayText text-center">
                Are you sure you want to delete {selectedFile?.file_name} file?
              </Text>
            </div>

            <Col span={12}>
              <Button
                block
                size="large"
                onClick={() => setIsDeleteModalVisible(false)}
                disabled={deleteFileLoading}
              >
                Cancel
              </Button>
            </Col>
            <Col span={12}>
              <Button
                block
                type="primary"
                danger
                size="large"
                onClick={handleDelete}
                loading={deleteFileLoading}
              >
                Delete
              </Button>
            </Col>
          </Row>
        </div>
      </Modal>
    </div>
  );
};

export default File;