import {
  DeleteOutlined,
  SearchOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Col,
  Dropdown,
  Input,
  Modal,
  Row,
  Select,
  Typography,
  message,
  Spin,
  Empty,
} from "antd";
import FolderIcon from "../../assets/SVGs/Folder.svg";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import CreateRenameModal from "../GuidelinesMatrices/CreateRenameModal";
import {
  fetchNestedFolders,
  addNestedFolder,
  updateNestedFolderAction,
  removeNestedFolder,
} from "../../services/Store/DocumentRepository/actions";
import { clearNestedFoldersState } from "../../services/Store/DocumentRepository/slice";

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

// Helper function to get user avatar props - only shows first character if no profile photo
const getUserAvatarProps = (user) => {
  const hasProfilePhoto = user?.profile_photo_path;
  
  if (hasProfilePhoto) {
    return {
      src: `${import.meta.env.VITE_IMAGE_BASE_URL}/${user.profile_photo_path}`,
    };
  }
  
  // Only show first character if no profile photo
  const userName = user?.name || user?.first_name || user?.username || 'U';
  return {
    style: {
     
      color: '#fff',
    },
    children: userName.charAt(0).toUpperCase(),
  };
};

const NestedFolder = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id, folderId } = useParams(); // id = user_id, folderId = parent_folder_id
  const scrollRef = useRef(null);
  
  // Redux state
  const {
    nestedFolders,
    nestedFoldersLoading,
    nestedLoadMoreLoading,
    createNestedFolderLoading,
    updateNestedFolderLoading,
    deleteNestedFolderLoading,
  } = useSelector((state) => state.friendFolders);
  const { userForEdit } = useSelector((state) => state?.usersmanagement);

  
  // Local states for modal visibility and folder management
  const [isCreateFolderModalVisible, setIsCreateFolderModalVisible] = useState(false);
  const [isRenameFolderModalVisible, setIsRenameFolderModalVisible] = useState(false);
  const [isDeleteFolderModalVisible, setIsDeleteFolderModalVisible] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState(null);
  
  // Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasUserSearched, setHasUserSearched] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Get data from Redux state
  const folders = nestedFolders?.data?.folders || [];
  const pagination = nestedFolders?.data?.pagination || {};
  const { currentPage, totalPage, totalRecords } = pagination;
  
  // Reset state when route params change
  useEffect(() => {
    setIsInitialLoad(true);
    setHasUserSearched(false);
    setSearchTerm("");
  }, [id, folderId]);
  
  // Initial load effect - runs once when component mounts
  useEffect(() => {
    if (id && folderId && isInitialLoad) {
      setIsSearching(true);
      dispatch(fetchNestedFolders({ 
        user_id: id,
        parent_id: folderId,
        page: 1,
        per_page: 20,
      })).then(() => {
        setIsSearching(false);
        setIsInitialLoad(false);
      });
    }
  }, [dispatch, id, folderId, isInitialLoad]);
  
  // Search effect - triggers when debouncedSearchTerm changes (but only if user has searched)
  useEffect(() => {
    // Only trigger search if user has actually interacted with search
    if (hasUserSearched && !isInitialLoad) {
      setIsSearching(true);
      dispatch(fetchNestedFolders({ 
        user_id: id,
        parent_id: folderId,
        page: 1,
        search: debouncedSearchTerm || undefined,
        per_page: 20,
      })).then(() => {
        setIsSearching(false);
      });
    }
  }, [debouncedSearchTerm, dispatch, hasUserSearched, isInitialLoad, id, folderId]);

  // Handle infinite scroll
  const handleScroll = (e) => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      loadMoreData();
    }
  };
  
  const loadMoreData = () => {
    if (nestedLoadMoreLoading || currentPage >= totalPage || nestedFoldersLoading) return;
    
    dispatch(fetchNestedFolders({ 
      user_id: id,
      parent_id: folderId,
      page: currentPage + 1,
      search: searchTerm || undefined,
      per_page: 20,
    }));
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Mark that user has interacted with search
    if (!hasUserSearched) {
      setHasUserSearched(true);
    }
  };

  // Handle folder creation
  const handleCreateFolder = (folderName) => {
    const folderData = {
      name: folderName,
      parent_id: folderId,
      first_person_user_id: userForEdit?.user?.id,
      second_person_user_id: id
    };
    
    dispatch(addNestedFolder(folderData)).then((result) => {
      if (result?.payload?.meta?.success) {
        setIsCreateFolderModalVisible(false);
      }
    });
  };

  // Handle folder rename
  const handleRenameFolder = (folderIdToRename, newName) => {
    const updateData = {
      id: folderIdToRename,
      name: newName,
    };
    
    dispatch(updateNestedFolderAction(updateData)).then((result) => {
      if (result?.payload?.meta?.success) {
        setIsRenameFolderModalVisible(false);
        setFolderToEdit(null);
      }
    });
  };
  
  // Handle folder delete
  const handleDeleteFolder = () => {
    if (folderToEdit?.id) {
      dispatch(removeNestedFolder(folderToEdit.id)).then((result) => {
        if (result?.payload?.meta?.success) {
          setIsDeleteFolderModalVisible(false);
          setFolderToEdit(null);
        }
      });
    }
  };
  
  const handleFolderClick = (folder) => {
    dispatch(clearNestedFoldersState());
    navigate(`/account-executive/detail/${id}/folder/${folderId}/nestedfolder/${folder.id}`);
  };

  const handleRecentlyDeletedClick = () => {
    dispatch(clearNestedFoldersState());
    navigate(`/account-executive/detail/${id}/recently-deleted`);
  };

  const items = [
    {
      label: "Rename",
      key: "rename",
    },
    {
      label: <span style={{ color: "red" }}>Delete</span>,
      key: "delete",
    },
  ];
  
  const onClickMenu = async (menuItem, folder, event) => {
    // Stop event propagation to prevent folder click
    if (event) {
      event.domEvent.stopPropagation();
    }

    switch (menuItem.key) {
      case "rename":
        setFolderToEdit(folder);
        setIsRenameFolderModalVisible(true);
        break;
      case "delete":
        setFolderToEdit(folder);
        setIsDeleteFolderModalVisible(true);
        break;
      default:
        break;
    }
  };
  
  // Show loading state only for initial loading and search (not for load more)
  const showLoading = nestedFoldersLoading || isSearching;
  
  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-none">
        <div className="flex items-center gap-2">
          <Text className="text-white font-bold">Loan Application Documents</Text>
          <div className="h-2 rounded-full w-2 bg-grayText"> </div>
          <div className="bg-primaryOpacity px-2 text-primary rounded-lg">
            {totalRecords || 0}
          </div>
        </div>
        
        <Row gutter={[10, 10]} className="mt-3">
          <Col xs={24} md={24} lg={24} xl={12}>
            <Input
              prefix={<SearchOutlined className="text-grayText mr-2" />}
              placeholder="Search for folder name or file"
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
                className="rounded-3xl py-5"
                onClick={() => handleRecentlyDeletedClick()}
              >
                Recently Deleted
              </Button>
              <Button
                type="primary"
                icon={<i className="icon-add"/>}
                className="rounded-3xl py-5"
                onClick={() => setIsCreateFolderModalVisible(true)}
              >
                Create Folder
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      {/* Scrollable Folders Section */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto mt-8" 
        style={{height:"50vh"}}
        onScroll={handleScroll}
      >
        {showLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spin size="large" />
          </div>
        ) : folders.length > 0 ? (
          <div className="flex gap-5 flex-wrap">
            {folders.map((folder) => (
              <div 
                key={folder.id} 
                className="w-32 md:w-40" 
              >
                <div
                  className="folder-container cursor-pointer h-full"
                  onClick={(e) => {
                    // Don't trigger folder click if clicked on dropdown or its menu
                    if (
                      e.target.closest(".folder-menu") ||
                      e.target.closest(".ant-dropdown")
                    ) {
                      e.stopPropagation();
                      return;
                    }
                    handleFolderClick(folder);
                  }}
                >
                  <div className="relative w-full mb-2">
                    <div className="absolute top-2 right-4 bg-black bg-opacity-40 w-6 h-6 flex items-center justify-center rounded-full text-xs z-10 folder-menu">
                      <Dropdown
                        menu={{
                          items,
                          onClick: (menuItem, e) =>
                            onClickMenu(menuItem, folder, e),
                        }}
                        trigger={["click"]}
                        overlayStyle={{ minWidth: "150px" }}
                        dropdownRender={(menu) => (
                          <div>{React.cloneElement(menu)}</div>
                        )}
                      >
                        <span className="hover:text-primary cursor-pointer">
                          <i className="icon-more-options-vertical text-white"></i>
                        </span>
                      </Dropdown>
                    </div>
                    <div
                      className="absolute bottom-2 left-3 lg:left-2 xl:left-3 px-2 bg-black bg-opacity-40 
                      flex items-center justify-center rounded-2xl text-sm z-10"
                    >
                      {folder?.items_count || 0} files
                    </div>
                    <div
                      className="absolute bottom-2 right-2 lg:right-2 px-2 
                      flex items-center justify-center rounded-2xl text-sm z-10"
                    >
                      <Avatar 
                        size={25} 
                        {...getUserAvatarProps(folder?.first_person_user)}
                      />
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
              </div>
            ))}
            
            {/* Loading indicator for infinite scroll - only at the bottom */}
            {nestedLoadMoreLoading && (
              <div className="w-full flex justify-center my-4">
                <Spin />
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <Empty
              description={
                <span className="text-grayText">
                  No folders found
                </span>
              }
            />
          </div>
        )}
      </div>
      
      {/* Add CreateRenameModal component */}
      <CreateRenameModal
        isCreateFolderModalVisible={isCreateFolderModalVisible}
        setIsCreateFolderModalVisible={setIsCreateFolderModalVisible}
        isRenameFolderModalVisible={isRenameFolderModalVisible}
        setIsRenameFolderModalVisible={setIsRenameFolderModalVisible}
        folderToRename={folderToEdit}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        createLoading={createNestedFolderLoading}
        renameLoading={updateNestedFolderLoading}
      />
      
      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Folder"
        open={isDeleteFolderModalVisible}
        onCancel={() => setIsDeleteFolderModalVisible(false)}
        footer={null}
        width={400}
        centered
        className="modalWrapperBox"
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
            disabled={deleteNestedFolderLoading}
          />
        }
        maskClosable={!deleteNestedFolderLoading}
      >
        <div className="border-t-2 border-solid border-[#373737] mt-5">
          <Row gutter={16} className="">
            <div className="w-full pt-5 flex items-center justify-center pb-5">
              <Text className="text-base font-normal text-grayText text-center">
                Are you sure you want to delete "{folderToEdit?.name}" folder? It will be moved to the Recently Deleted section.
              </Text>
            </div>

            <Col span={12}>
              <Button
                block
                size="large"
                onClick={() => setIsDeleteFolderModalVisible(false)}
                disabled={deleteNestedFolderLoading}
              >
                Cancel
              </Button>
            </Col>
            <Col span={12}>
              <Button
                block
                type="primary"
                size="large"
                onClick={handleDeleteFolder}
                loading={deleteNestedFolderLoading}
                style={{ backgroundColor: "#FF6D00", borderColor: "#FF6D00" }}
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

export default NestedFolder;