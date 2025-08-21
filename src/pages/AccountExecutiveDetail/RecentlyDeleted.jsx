import {
  Avatar,
  Button,
  Col,
  Modal,
  Progress,
  Row,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReportModal from "./VendorReportModal";
import VendorAddRating from "./VendorAddRating";
import FolderIcon from "../../assets/SVGs/Folder.svg";
import ContractProcessorLeftPanel from "./ContractProcessorLeftPanel";
import { useDispatch, useSelector } from "react-redux";
import { fetchContractProcessorUserDetails } from "../../services/Store/ContractProcessor/actions";
import { 
  fetchDeletedFriendFolders, 
  restoreFriendFolderAction,
  fetchDeletedFiles,
  restoreDeletedFilesAction
} from "../../services/Store/DocumentRepository/actions";

const { Title, Text } = Typography;

const RecentlyDeleted = () => {
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [isRestoreModalVisible, setIsRestoreModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState({ type: "", name: "", id: null });
  const scrollRef = useRef(null);
  
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get user details and deleted folders from Redux store
  const { contractProcessorUserDetails, contractProcessorUserDetailsLoading } = useSelector((state) => state.contractProcessor);
  const { 
    deletedFriendFolders, 
    deletedFriendFoldersLoading, 
    restoreFriendFolderLoading,
    deletedLoadMoreLoading,
    // NEW: Add deleted files state
    deletedFiles,
    deletedFilesLoading,
    restoreFileLoading,
    deletedFilesLoadMoreLoading
  } = useSelector((state) => state.friendFolders);

  
  const userData = contractProcessorUserDetails?.data?.user || {};
  const deletedFolders = deletedFriendFolders?.data?.folders || [];
  const foldersPagination = deletedFriendFolders?.data?.pagination || {};
  const { currentPage: foldersCurrentPage, totalPage: foldersTotalPage, totalRecords: foldersTotal } = foldersPagination;

  // NEW: Add deleted files data
  const deletedFilesList = deletedFiles?.data?.files || [];
  const filesPagination = deletedFiles?.data?.pagination || {};
  const { currentPage: filesCurrentPage, totalPage: filesTotalPage, totalRecords: filesTotal } = filesPagination;

  // NEW: Function to truncate file names
  const truncateFileName = (fileName) => {
    if (!fileName) return "";
    
    const lastDotIndex = fileName.lastIndexOf(".");
    
    // If no extension found, treat entire string as name
    if (lastDotIndex === -1) {
      if (fileName.length > 10) {
        return fileName.substring(0, 4) + "..." + fileName.substring(fileName.length - 3);
      }
      return fileName;
    }
    
    const name = fileName.substring(0, lastDotIndex);
    const extension = fileName.substring(lastDotIndex);
    
    // If name part is longer than 10 characters, truncate it
    if (name.length > 10) {
      const truncatedName = name.substring(0, 4) + "..." + name.substring(name.length - 3);
      return truncatedName + extension;
    }
    
    return fileName;
  };

  // Fetch user details when component mounts
  useEffect(() => {
    if (params?.id) {
      dispatch(fetchContractProcessorUserDetails(params.id));
    }
  }, [dispatch, params?.id]);

  // Fetch deleted folders when component mounts - Changed to 10 per page
  useEffect(() => {
    if (params?.id) {
      dispatch(fetchDeletedFriendFolders({
        user_id: params?.id,
        page: 1,
        per_page: 10, // Changed from 20 to 10
      }));
    }
  }, [dispatch, params?.id]);

  // NEW: Fetch deleted files when component mounts
  useEffect(() => {
    if (params?.id) {
      dispatch(fetchDeletedFiles({
        user_id: params?.id,
        page: 1,
        per_page: 10,
      }));
    }
  }, [dispatch, params?.id]);

  // Set container height based on screen size
  useEffect(() => {
    const handleResize = () => {
      setContainerHeight(
        window.innerWidth < 768 ? "calc(100vh - 212px)" : "calc(100vh - 241px)"
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle infinite scroll for folders
  const handleScroll = (e) => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      loadMoreFolders();
    }
  };
  
  const loadMoreFolders = () => {
    if (deletedFriendFoldersLoading || deletedLoadMoreLoading || foldersCurrentPage >= foldersTotalPage) return;
    
    dispatch(fetchDeletedFriendFolders({
      user_id: params?.id,
      page: foldersCurrentPage + 1,
      per_page: 10, // Changed from 20 to 10
    }));
  };

  // NEW: Load more files function
  const loadMoreFiles = () => {
    if (deletedFilesLoading || deletedFilesLoadMoreLoading || filesCurrentPage >= filesTotalPage) return;
    
    dispatch(fetchDeletedFiles({
      user_id: params?.id,
      page: filesCurrentPage + 1,
      per_page: 10,
    }));
  };

  // Handle report modal visibility
  const showReportModal = () => {
    setIsReportModalVisible(true);
  };

  const hideReportModal = () => {
    setIsReportModalVisible(false);
  };

  // Handle rating modal visibility
  const showRatingModal = () => {
    setIsRatingModalVisible(true);
  };

  const hideRatingModal = () => {
    setIsRatingModalVisible(false);
  };

  // Show restore modal
  const showRestoreModal = (type, name, id) => {
    setSelectedItem({ type, name, id });
    setIsRestoreModalVisible(true);
  };

  // UPDATED: Handle restore for both folders and files
  const handleRestore = () => {
    if (selectedItem.id) {
      const restoreAction = selectedItem.type === "Folder" 
        ? restoreFriendFolderAction(selectedItem.id)
        : restoreDeletedFilesAction(selectedItem.id);
      
      dispatch(restoreAction).then((result) => {
        if (result?.payload?.meta?.success) {
        
          setIsRestoreModalVisible(false);
          setSelectedItem({ type: "", name: "", id: null });
        }
      });
    }
  };

  // Handle report submission
  const handleReportSubmit = async (formData) => {
    try {
      message.success("Your report has been submitted successfully");
    } catch (error) {
      message.error("Failed to submit report. Please try again");
    }
  };

  // Handle rating submission
  const handleRatingSubmit = async (formData) => {
    try {
      console.log("Rating submitted:", formData);
      return true;
    } catch (error) {
      console.error("Error submitting rating:", error);
      throw error;
    }
  };

  const HandleNavigate = () => {
    navigate(-1);
  };

  const getModalTitle = () => {
    return selectedItem.type === "Folder" ? "Restore Folder" : "Restore File";
  };

  // NEW: Get file icon based on file extension
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
        return 'icon-csv'; // Default to CSV icon
    }
  };

  // UPDATED: Get current loading state based on item type
  const getCurrentLoadingState = () => {
    return selectedItem.type === "Folder" ? restoreFriendFolderLoading : restoreFileLoading;
  };

  // Render loading spinner when global loading is active
  if (contractProcessorUserDetailsLoading) {
    return (
      <div className="bg-darkGray h-full w-full flex justify-center items-center" style={{ height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Row className="bg-darkGray h-full w-full flex flex-col gap-3 sm:gap-6 px-header-wrapper">
      <div className="w-full"></div>
      <Col
        span={24}
        className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0"
      >
        <div className="flex justify-center items-center">
          <Title
            level={3}
            className="text-white !m-0 h-auto flex flex-wrap sm:flex-nowrap justify-center items-center text-base sm:text-lg md:text-xl"
          >
            <Link
              to="/dashboard"
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
              to="/account-executive"
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Account Executives
              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Text className="text-white text-lg sm:text-2xl">
              {userData?.name || ""}
            </Text>
          </Title>
        </div>
      </Col>
      <Row
        gutter={[
          { xs: 0, sm: 16 },
          { xs: 0, sm: 16 },
        ]}
      >
        {/* Left Side */}
        <Col xs={24} md={10} xl={7} className="h-full mb-4">
          <ContractProcessorLeftPanel 
            userData={userData}
            containerHeight={containerHeight}
          />
        </Col>

        {/* Right Side */}
        <Col xs={24} md={14} xl={17} className=" mb-4">
          <div className="w-full">
            <div
              className="rounded-3xl border overflow-y-auto bg-gray border-solid border-liteGray w-full relative p-4"
              style={{ height: containerHeight }}
              ref={scrollRef}
            >
              <div className="flex items-center text-lg font-semibold mb-6">
                <Button shape="circle" onClick={HandleNavigate}>
                  <i className="icon-back-arrow" />
                </Button>
                <Text className="ml-2">Recently Deleted</Text>
              </div>
              
              <div className="mt-4">
                {/* Folders Section */}
                <div className="flex items-center gap-2">
                  <Text className="text-white font-medium">Folders</Text>
                  <div className="h-2 rounded-full w-2 bg-grayText"> </div>
                  <div className="bg-primaryOpacity px-2 text-primary rounded-lg">
                    {foldersTotal || 0}
                  </div>
                </div>
                
                {deletedFriendFoldersLoading && deletedFolders.length === 0 ? (
                  <div className="flex justify-center items-center py-8">
                    <Spin size="large" />
                  </div>
                ) : deletedFolders.length > 0 ? (
                  <>
                    <div className="flex gap-5 mt-8 flex-wrap">
                      {deletedFolders.map((folder) => (
                        <div key={`folder-${folder.id}`}>
                          <div className="relative w-full mb-2">
                            <div
                              className="absolute top-2 right-3 bg-black cursor-pointer bg-opacity-40 w-6 h-6 flex items-center justify-center rounded-full text-xs z-10 folder-menu"
                              onClick={() =>
                                showRestoreModal("Folder", folder?.name, folder.id)
                              }
                            >
                              <i className="icon-light-mode text-lg" />
                            </div>
                            <div
                              className="absolute bottom-2 left-3 lg:left-2 xl:left-3 px-2 bg-black bg-opacity-40 
                                flex items-center justify-center rounded-2xl text-sm z-10"
                            >
                              {folder?.child_folders_count || 0} files
                            </div>
                            <div
                              className="absolute bottom-2 right-1 lg:right-1 px-2 
                        flex items-center justify-center rounded-2xl text-sm z-10"
                            >
                              <Avatar 
                                size={25} 
                                src={
                                  folder?.first_person_user?.profile_photo_path 
                                    ? `${import.meta.env.VITE_IMAGE_BASE_URL}/${folder.first_person_user.profile_photo_path}` 
                                    : undefined
                                }
                                style={{ 
                                  backgroundColor: folder?.first_person_user?.profile_photo_path ? undefined : '',
                                  fontSize: '12px'
                                }}
                              >
                                {!folder?.first_person_user?.profile_photo_path && 
                                  folder?.first_person_user?.name?.charAt(0)?.toUpperCase()
                                }
                              </Avatar>
                            </div>
                            <div className="w-full flex justify-center items-center relative">
                              <img
                                src={FolderIcon}
                                alt={`${folder?.name} folder`}
                                className="w-full object-contain"
                                style={{ maxHeight: "120px" }}
                              />
                            </div>
                          </div>
                          <div className="text-center px-1">
                            <Text 
                              className="text-white text-sm line-clamp-2 hover:text-primary"
                              title={folder?.name}
                            >
                              {folder?.name || "Unnamed Folder"}
                            </Text>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Load More Button for Folders */}
                    {foldersCurrentPage < foldersTotalPage && (
                      <div className="flex justify-center mt-6">
                        <Button
                          type="primary"
                          loading={deletedLoadMoreLoading} // Use specific loading state
                          onClick={loadMoreFolders}
                          className="rounded-full px-6"
                        >
                          Load More Folders
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-center items-center py-8">
                    <Text className="text-grayText">No deleted folders found</Text>
                  </div>
                )}

                {/* Files Section - FIXED: Now uses upload_user instead of user */}
                <div className="flex items-center gap-2 mt-12 mb-6">
                  <Text className="text-white font-medium">Files</Text>
                  <div className="h-2 rounded-full w-2 bg-grayText"> </div>
                  <div className="bg-primaryOpacity px-2 text-primary rounded-lg">
                    {filesTotal || 0}
                  </div>
                </div>

                {deletedFilesLoading && deletedFilesList.length === 0 ? (
                  <div className="flex justify-center items-center py-8">
                    <Spin size="large" />
                  </div>
                ) : deletedFilesList.length > 0 ? (
                  <>
                    <div className="grid grid-col-1 md:grid-cols-2 lg:grid-col-3 2xl:grid-cols-4 3xl:grid-cols-4 gap-4">
                      {deletedFilesList.map((file) => (
                        <div key={`file-${file.id}`}>
                          <div
                            className="bg-liteGray p-2 rounded-2xl flex flex-col w-full"
                            style={{ borderRadius: "12px" }}
                          >
                            <div className="p-2 py-6 bg-gray rounded-xl relative">
                              <div className="flex justify-center py-2">
                                <div className="bg-primaryOpacity inline-block rounded-xl py-1">
                                  <i className={`${getFileIcon(file.file_name)} text-primary text-4xl`} />
                                </div>
                              </div>
                              <div className="absolute top-2 right-2">
                                <Button
                                  shape="circle"
                                  className="bg-gray"
                                  onClick={() =>
                                    showRestoreModal("File", file.file_name, file.id)
                                  }
                                >
                                  <i className="icon-light-mode before:!m-0 text-primary" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex justify-between mt-3 items-center">
                              <Text 
                                className="text-sm font-semibold line-clamp-2"
                                title={file.file_name}
                              >
                                {truncateFileName(file.file_name)}
                              </Text>
                              {/* FIXED: Changed from file.user to file.upload_user */}
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
                        </div>
                      ))}
                    </div>

                    {/* Load More Button for Files */}
                    {filesCurrentPage < filesTotalPage && (
                      <div className="flex justify-center mt-6">
                        <Button
                          type="primary"
                          loading={deletedFilesLoadMoreLoading}
                          onClick={loadMoreFiles}
                          className="rounded-full px-6"
                        >
                          Load More Files
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-center items-center py-8">
                    <Text className="text-grayText">No deleted files found</Text>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Report Modal */}
      <ReportModal
        isVisible={isReportModalVisible}
        onCancel={hideReportModal}
        companyName="Elite Mortgage Solutions"
        onSubmit={handleReportSubmit}
      />

      {/* Add Rating Modal */}
      <VendorAddRating
        isVisible={isRatingModalVisible}
        onCancel={hideRatingModal}
        companyName="Elite Mortgage Solutions"
        onSubmit={handleRatingSubmit}
      />

      {/* UPDATED: Simple Restore Modal for both folders and files */}
      <Modal
        title={getModalTitle()}
        open={isRestoreModalVisible}
        onCancel={() => setIsRestoreModalVisible(false)}
        footer={null}
        width={400}
        centered
        className="modalWrapperBox"
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
            disabled={getCurrentLoadingState()}
          />
        }
        maskClosable={!getCurrentLoadingState()}
      >
        <div className="border-t-2 border-solid border-[#373737] mt-5">
          <Row gutter={16} className="">
            <div className="w-full pt-5 flex items-center justify-center pb-5">
              <Text className="text-base font-normal text-grayText text-center">
                Are you sure you want to restore {selectedItem.name}? It will be moved back to
                its original location.
              </Text>
            </div>

            <Col span={12}>
              <Button
                block
                size="large"
                onClick={() => setIsRestoreModalVisible(false)}
                disabled={getCurrentLoadingState()}
              >
                Cancel
              </Button>
            </Col>
            <Col span={12}>
              <Button
                block
                type="primary"
                size="large"
                onClick={handleRestore}
                style={{ backgroundColor: "#FF6D00", borderColor: "#FF6D00" }}
                loading={getCurrentLoadingState()}
              >
                Restore
              </Button>
            </Col>
          </Row>
        </div>
      </Modal>
    </Row>
  );
};

export default RecentlyDeleted;