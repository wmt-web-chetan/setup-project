import {
  Button,
  Col,
  Dropdown,
  Input,
  Modal,
  Row,
  Typography,
  Spin,
  Empty,
  Avatar,
  Select,
} from "antd";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ShadowBoxContainer from "../../components/AuthLayout/ShadowBoxContainer";
import {
  DeleteOutlined,
  SearchOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import FolderIcon from "../../assets/SVGs/Folder.png";
import CreateRenameModal from "./CreateRenameModal";
import RecentlyDeleted from "./RecentlyDeleted";
import {
  addLoanCategoryFolder,
  deleteLoanCategoryFolderAction,
  fetchLoanCategoryFolders,
  updateLoanCategoryFolderAction,
} from "../../services/Store/GuidelinesMatrices/action";
import { getStorage } from "../../utils/commonfunction";
import { fetchDropdownUsers } from "../../services/Store/Auth/action";

const { Text, Title } = Typography;
const { Option } = Select;

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

const GuidelinesMatrices = ({
  children,
  height,
  overflow,
  className,
  ...props
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [isDeleteFolderModalVisible, setIsDeleteFolderModalVisible] =
    useState(false);
  const [isCreateFolderModalVisible, setIsCreateFolderModalVisible] =
    useState(false);
  const [isRenameFolderModalVisible, setIsRenameFolderModalVisible] =
    useState(false);
  const [folderToEdit, setFolderToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showRecentlyDeleted, setShowRecentlyDeleted] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Add state for initial loading
  const initialLoadDone = useRef(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Ref to track if we're currently loading more data
  const isLoadingMoreRef = useRef(false);

  // Container ref for infinite scroll
  const containerRef = useRef(null);

  // Debounced search value - using the same delay as ContractProcessorsTab
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const userLoginRole = getStorage("userLoginRole", true);

  // Redux state
  const {
    loanCategoryFolders,
    loanCategoryFoldersLoading,
    loanCategoryFoldersError,
    isLoadingMoreFolders,
    createLoanCategoryFolderLoading,
    updateLoanCategoryFolderLoading,
    deleteLoanCategoryFolderLoading,
  } = useSelector((state) => state?.guidelineMatrices || {});

  // Dropdown users state
  const { dropdownUsers, dropdownUsersLoading, dropdownUsersError } =
    useSelector((state) => state?.auth || {});

  const location = useLocation();
  const isAdminMode = location.pathname.includes("/admin/");

  // Fetch dropdown users on component mount
  useEffect(() => {
    dispatch(fetchDropdownUsers());
  }, [dispatch]);

  // Initial fetch when component mounts
  useEffect(() => {
    if (!initialLoadDone.current) {
      // Set initial loading state
      setInitialLoading(true);

      // Fetch folders
      dispatch(
        fetchLoanCategoryFolders({
          page: 1,
          per_page: 30,
          is_delete: false,
        })
      ).finally(() => {
        setInitialLoading(false);
        initialLoadDone.current = true;
      });
    }
  }, [dispatch]);

  // Effect for search trigger and user filter - triggered by debounced search term or selected user
  useEffect(() => {
    if (initialLoadDone.current) {
      // Only search if not in initial loading state
      setIsSearching(true);

      const params = {
        search: debouncedSearchTerm.length >= 3 ? debouncedSearchTerm : "",
        is_delete: showRecentlyDeleted,
        page: 1,
        per_page: 30,
      };

      // Add user_id if a user is selected
      if (selectedUserId) {
        params.user_id = selectedUserId;
      }

      dispatch(fetchLoanCategoryFolders(params)).finally(() => {
        setIsSearching(false);
      });
    }
  }, [debouncedSearchTerm, showRecentlyDeleted, selectedUserId, dispatch]);

  // Extract pagination from the Redux state
  const pagination = loanCategoryFolders?.data?.pagination || {
    currentPage: 1,
    totalPage: 1,
    perPage: 30,
    totalRecords: 0,
  };

  // Load more data function
  const loadMoreData = useCallback(() => {
    // Don't load more if already loading or no more pages
    if (
      isLoadingMoreRef.current ||
      pagination.currentPage >= pagination.totalPage
    ) {
      return;
    }

    // Set loading flag
    isLoadingMoreRef.current = true;

    const params = {
      search: debouncedSearchTerm.length >= 3 ? debouncedSearchTerm : "",
      is_delete: showRecentlyDeleted,
      page: pagination.currentPage + 1,
      per_page: 30,
    };

    // Add user_id if a user is selected
    if (selectedUserId) {
      params.user_id = selectedUserId;
    }

    // Dispatch action to load more
    dispatch(fetchLoanCategoryFolders(params)).finally(() => {
      isLoadingMoreRef.current = false;
    });
  }, [
    debouncedSearchTerm,
    showRecentlyDeleted,
    selectedUserId,
    dispatch,
    pagination,
  ]);
  // Handle infinite scroll
  const handleScroll = useCallback(
    (e) => {
      if (!containerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = e.target;
      // Load more when scrolled within 50px of the bottom
      if (scrollHeight - scrollTop - clientHeight < 50) {
        loadMoreData();
      }
    },
    [loadMoreData]
  );

  useEffect(() => {
    const handleResize = () => {
      setContainerHeight(
        window.innerWidth < 768 ? "calc(100vh - 212px)" : "calc(100vh - 241px)"
      );
    };

    // Set initial height
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle user filter change
  const handleUserFilterChange = (userId) => {
    setSelectedUserId(userId);
  };

  // Clear user filter
  const clearUserFilter = () => {
    setSelectedUserId(null);
  };

  // Handle folder creation
  const handleCreateFolder = () => {
    setIsCreateFolderModalVisible(true);
  };

  const onCreateFolder = (folderName) => {
    // Create payload for folder creation
    const folderData = {
      name: folderName,
    };

    // Dispatch create folder action
    dispatch(addLoanCategoryFolder(folderData)).then((res) => {
      if (res?.payload?.meta?.success === true) {
        // Close the modal if successful
        setIsCreateFolderModalVisible(false);

        // Refetch the folders list
        setIsSearching(true);
        const params = {
          search: debouncedSearchTerm.length >= 3 ? debouncedSearchTerm : "",
          is_delete: showRecentlyDeleted,
          page: 1,
          per_page: 30,
        };

        if (selectedUserId) {
          params.user_id = selectedUserId;
        }

        dispatch(fetchLoanCategoryFolders(params)).finally(() => {
          setIsSearching(false);
        });
      }
    });
  };

  const onRenameFolder = (folderId, newName) => {
    // Create payload for folder update
    const folderData = {
      id: folderId,
      name: newName,
    };

    // Dispatch update folder action
    dispatch(updateLoanCategoryFolderAction(folderData)).then((res) => {
      if (res?.payload?.meta?.success === true) {
        // Close the modal if successful
        setIsRenameFolderModalVisible(false);
        setFolderToEdit(null);

        // Refetch the folders list
        setIsSearching(true);
        const params = {
          search: debouncedSearchTerm.length >= 3 ? debouncedSearchTerm : "",
          is_delete: showRecentlyDeleted,
          page: 1,
          per_page: 30,
        };

        if (selectedUserId) {
          params.user_id = selectedUserId;
        }

        dispatch(fetchLoanCategoryFolders(params)).finally(() => {
          setIsSearching(false);
        });
      }
    });
  };

  // Handle cancel of folder delete modal
  const handleCancelDeleteFolder = () => {
    setIsDeleteFolderModalVisible(false);
    setFolderToEdit(null);
  };

  // Handle confirm deletion of folder
  const handleConfirmDeleteFolder = () => {
    if (folderToEdit?.id) {
      // Dispatch delete folder action
      dispatch(deleteLoanCategoryFolderAction(folderToEdit.id)).then((res) => {
        if (res?.payload?.meta?.success === true) {
          // Close the modal if successful
          setIsDeleteFolderModalVisible(false);
          setFolderToEdit(null);

          // Refetch the folders list
          setIsSearching(true);
          const params = {
            search: debouncedSearchTerm.length >= 3 ? debouncedSearchTerm : "",
            is_delete: showRecentlyDeleted,
            page: 1,
            per_page: 30,
          };

          if (selectedUserId) {
            params.user_id = selectedUserId;
          }

          dispatch(fetchLoanCategoryFolders(params)).finally(() => {
            setIsSearching(false);
          });
        }
      });
    }
  };

  // Handle folder click to navigate to folder details page
  const handleFolderClick = (folder) => {
    // Dynamic navigation based on admin mode
    const basePath = isAdminMode
      ? "/admin/guidelines-matrices"
      : "/guidelines-&-matrices";

    navigate(`${basePath}/${folder.id}`, {
      state: {
        folderName: folder.name,
        folderId: folder.id,
      },
    });
  };

  // Handle Recently Deleted button click
  const handleRecentlyDeletedClick = () => {
    setShowRecentlyDeleted(true);
  };

  // Handle back from recently deleted
  const handleBackFromRecentlyDeleted = () => {
    setShowRecentlyDeleted(false);
  };

  // Show loading state - Fix to avoid double loading indicators
  const showLoading =
    (loanCategoryFoldersLoading && !isLoadingMoreFolders) || isSearching;

  // Get folders from Redux state
  const allFolders = loanCategoryFolders?.data?.folders || [];

  // Get users from Redux state
  const allUsers = dropdownUsers?.data?.users || [];

  // Debug pagination info
  console.log("Pagination info:", pagination);
  console.log("Is loading more:", isLoadingMoreFolders);
  console.log("Current folders count:", allFolders.length);

  const getDashboardLink = () => {
    return isAdminMode ? "/admin" : "/dashboard";
  };

  // Updated getUserAvatarProps function with hover tooltip
  const getUserAvatarProps = (user) => {
    const hasProfilePhoto = user?.profile_photo_path;
    const userName =
      user?.name || user?.first_name || user?.username || "Unknown User";

    const baseProps = {
      title: userName, // This will show the name on hover
    };

    if (hasProfilePhoto) {
      return {
        ...baseProps,
        src: `${import.meta.env.VITE_IMAGE_BASE_URL}/${user.profile_photo_path
          }`,
      };
    }

    return {
      ...baseProps,
      style: {
        color: "#fff",
      },
      children: userName.charAt(0).toUpperCase(),
    };
  };

  return (
    <>
      {showRecentlyDeleted ? (
        <RecentlyDeleted onBack={handleBackFromRecentlyDeleted} />
      ) : (
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
                <Text className="text-white text-lg sm:text-2xl">
                  Guidelines & Matrices
                </Text>
              </Title>
            </div>
          </Col>

          {initialLoading ? (
            <div className="flex justify-center items-center h-[50vh]">
              <Spin size="large" />
            </div>
          ) : (
            <Col span={24} className="h-full mb-4">
              <ShadowBoxContainer
                height={containerHeight}
                shadowVisible={false}
                overflow="auto"
              >
                <div className="flex flex-col h-full">
                  {/* Fixed Header Section */}
                  <div className="flex-none">
                    <div className="flex mt-0 items-center">
                      <div className="text-2xl font-normal">Lenders</div>
                      {allFolders?.length > 0 && (
                        <>
                          <span className="mx-3 text-grayText">&#8226;</span>
                          <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                            {pagination?.totalRecords || allFolders?.length}{" "}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col md:flex-row justify-between gap-3 mb-6 pt-6 w-full">
                      <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
                        <div className="relative w-full md:max-w-md">
                          <Input
                            prefix={
                              <SearchOutlined className="text-grayText mr-2" />
                            }
                            placeholder="Search Lenders"
                            className="rounded-full pl-3"
                            style={{ width: "100%" }}
                            size="large"
                            onChange={handleSearchChange}
                            value={searchTerm}
                            allowClear
                          />
                        </div>
                        {(userLoginRole?.name === "SA" || userLoginRole?.name === "A") && (
                          <div className="relative w-full md:max-w-xs">
                            <Select
                              placeholder="Filter by User"
                              className="bg-[#373737] rounded-full text-white filterSelection"
                              size="large"
                              value={selectedUserId}
                              onChange={handleUserFilterChange}
                              allowClear
                              onClear={clearUserFilter}
                              loading={dropdownUsersLoading}
                              suffixIcon={
                                <UserOutlined className="text-grayText" />
                              }
                              showSearch
                              style={{ width: "200px" }}
                              // optionFilterProp="children"
                              filterOption={(input, option) => {
                                // Find the user by option value (user.id)
                                const user = allUsers.find(
                                  (u) => u.id === option.value
                                );
                                const userName = user?.name || "";
                                return userName
                                  .toLowerCase()
                                  .includes(input.toLowerCase());
                              }}
                            >
                              {allUsers?.map((user) => (
                                <Option key={user.id} value={user.id}>
                                  <div className="flex items-center gap-2">
                                    {/* <Avatar
                                      size={20}
                                      {...getUserAvatarProps(user)}
                                    /> */}
                                    <span>{user.name}</span>
                                  </div>
                                </Option>
                              ))}
                            </Select>
                          </div>
                        )}
                      </div>
                      <div className="w-full flex gap-3 md:w-auto mt-3 md:mt-0">
                        <Button
                          size="large"
                          icon={<DeleteOutlined className="text-red-600" />}
                          className="rounded-3xl w-full"
                          onClick={handleRecentlyDeletedClick}
                        >
                          Recently Deleted{" "}
                        </Button>
                        <Button
                          type="primary"
                          size="large"
                          icon={<i className="icon-add" />}
                          className="rounded-3xl w-full"
                          onClick={handleCreateFolder}
                          loading={createLoanCategoryFolderLoading}
                        >
                          Create Lender{" "}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Content Section */}
                  <div
                    ref={containerRef}
                    className="flex-grow overflow-y-auto"
                    onScroll={handleScroll}
                  >
                    {showLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <Spin size="large" />
                      </div>
                    ) : allFolders?.length > 0 ? (
                      <div className="flex gap-6 md:gap-10 flex-wrap">
                        {allFolders?.map((folder) => (
                          <div key={folder.id} className="w-32 md:w-40">
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
                                    overlayStyle={{ minWidth: "180px" }}
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
                                  className="absolute bottom-2 left-4 px-2 py-1 bg-black bg-opacity-40 
                                  flex items-center justify-center rounded-2xl text-sm z-10"
                                >
                                  {" "}
                                  {folder?.folder_items?.length || 0} files
                                </div>
                                <div
                                  className="absolute bottom-2 right-2 lg:right-2 px-2 
  flex items-center justify-center rounded-2xl text-sm z-10"
                                >
                                  {userLoginRole?.name === "SA" && (
                                    <Avatar
                                      size={25}
                                      {...getUserAvatarProps(
                                        folder?.folder_created_by
                                      )}
                                    />
                                  )}
                                </div>
                                <div className="w-full h-full flex justify-center items-center">
                                  <img
                                    src={FolderIcon}
                                    alt={`${folder.name} folder`}
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
                                  {folder?.name}
                                </Text>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <Empty description="No Lenders Found" />
                      </div>
                    )}

                    {/* Loading more indicator */}
                    {isLoadingMoreFolders && (
                      <div className="flex justify-center my-4">
                        <Spin />
                      </div>
                    )}
                  </div>
                </div>
              </ShadowBoxContainer>
            </Col>
          )}

          {/* Delete Folder Modal */}
          <Modal
            title="Delete Lender"
            centered
            destroyOnClose
            open={isDeleteFolderModalVisible}
            className="modalWrapperBox"
            onCancel={
              deleteLoanCategoryFolderLoading
                ? undefined
                : handleCancelDeleteFolder
            }
            footer={false}
            maskClosable={!deleteLoanCategoryFolderLoading}
            closeIcon={
              <Button
                shape="circle"
                icon={<i className="icon-close before:!m-0 text-sm" />}
                disabled={deleteLoanCategoryFolderLoading}
              />
            }
          >
            <div className="border-t-2 border-solid border-[#373737] mt-5">
              <Row gutter={16} className="">
                <div className="w-full pt-5 flex items-center justify-center pb-5">
                  <Text className="text-base font-normal text-grayText text-center">
                    Are you sure you want to delete this lender?
                  </Text>
                </div>

                <Col span={12}>
                  <Button
                    block
                    size="large"
                    onClick={handleCancelDeleteFolder}
                    disabled={deleteLoanCategoryFolderLoading}
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
                    onClick={handleConfirmDeleteFolder}
                    loading={deleteLoanCategoryFolderLoading}
                  >
                    Delete
                  </Button>
                </Col>
              </Row>
            </div>
          </Modal>

          {/* Create and Rename Folder Modals */}
          <CreateRenameModal
            isCreateFolderModalVisible={isCreateFolderModalVisible}
            setIsCreateFolderModalVisible={setIsCreateFolderModalVisible}
            isRenameFolderModalVisible={isRenameFolderModalVisible}
            setIsRenameFolderModalVisible={setIsRenameFolderModalVisible}
            folderToRename={folderToEdit}
            onCreateFolder={onCreateFolder}
            onRenameFolder={onRenameFolder}
            createLoading={createLoanCategoryFolderLoading}
            renameLoading={updateLoanCategoryFolderLoading}
          />
        </Row>
      )}
    </>
  );
};

export default GuidelinesMatrices;
