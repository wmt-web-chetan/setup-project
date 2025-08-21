import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Row,
  Col,
  Table,
  Button,
  Tag,
  Spin,
  Input,
  Empty,
  Tooltip,
  message,
  Modal,
} from "antd";
import { SearchOutlined, PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPasswordsList,
  removePassword,
  fetchPasswordForEdit,
} from "../../services/Store/PasswordManagement/actions";
import ShadowBoxContainer from "../../components/AuthLayout/ShadowBoxContainer";
import PasswordModal from "./Component/PasswordModal";

const { Text, Title } = Typography;

const PasswordManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get password data from Redux store
  const {
    passwords,
    passwordsLoading,
    passwordsError,
    passwordDeletion,
    passwordDeletionLoading,
    newPassword, // Updated to correct state property from initialState
    passwordUpdate,
    passwordEdit,
    passwordEditLoading,
  } = useSelector((state) => state?.passwords);

  // State for password modal
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [editingPassword, setEditingPassword] = useState(null);

  // State for view modal
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingPassword, setViewingPassword] = useState(null);

  // State for hover functionality
  const [hoveredRow, setHoveredRow] = useState(null);
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const searchTimeoutRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");

  // State for delete modal
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteableId, setDeleteableId] = useState(null);

  // Table params for pagination and filtering
  const [paginationForTable, setPaginationforTable] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    itemLength: 0,
  });

  // Fetch passwords based on current tableParams
  const fetchPasswords = (page = paginationForTable.current) => {
    const params = {
      page: page.toString(),
      per_page: paginationForTable.pageSize.toString(),
      search:
        searchValue && searchValue.trim() !== "" ? searchValue.trim() : "",
    };

    dispatch(fetchPasswordsList(params));
  };

  // Initial fetch
  useEffect(() => {
    fetchPasswords();
  }, []);

  // Update pagination when passwords data changes
  useEffect(() => {
    if (passwords?.data?.pagination) {
      setPaginationforTable({
        current: passwords.data.pagination.currentPage,
        pageSize: passwords.data.pagination.perPage,
        total: passwords.data.pagination.totalRecords,
        itemLength: passwords?.data?.password?.length || 0,
      });
    }
  }, [passwords]);

  // Handle view response
  useEffect(() => {
    if (passwordEdit?.meta?.success === true) {
      console.log("passwordEdit", passwordEdit)
      setViewingPassword(passwordEdit?.data?.password);
      // setIsViewModalVisible(true);
    }
  }, [passwordEdit]);

  // Refetch passwords after successful create/update/delete
  useEffect(() => {
    if (
      passwordDeletion?.meta?.success === true ||
      newPassword?.meta?.success === true || // Updated to match state property
      passwordUpdate?.meta?.success === true
    ) {
      const isSingleItemOnPage = paginationForTable?.itemLength === 1;
      const currentPage = paginationForTable?.current;

      if (isSingleItemOnPage && currentPage > 1 && passwordDeletion?.meta?.success) {
        // If deleting the last item on a page, go to previous page
        const newCurrentPage = currentPage - 1;
        fetchPasswords(newCurrentPage);
      } else {
        // Refresh current page
        fetchPasswords(currentPage);
      }
    }
  }, [passwordDeletion, newPassword, passwordUpdate]); // Updated dependency array

  // Set container height based on screen size
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

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle create new password - show modal
  const showCreatePassword = () => {
    setEditingPassword(null);
    setIsPasswordModalVisible(true);
  };

  // Handle edit password - show modal with data
  const handleEditPassword = (password) => {
    setEditingPassword(password);
    setIsPasswordModalVisible(true);
  };

  // Handle view password - call API and show modal
  const handleViewPassword = (password) => {
    dispatch(fetchPasswordForEdit(password.id));
    setIsViewModalVisible(true);
  };

  // Handle password modal close
  const handlePasswordModalClose = () => {
    setIsPasswordModalVisible(false);
    setEditingPassword(null);
  };

  // Handle view modal close
  const handleViewModalClose = () => {
    setIsViewModalVisible(false);
    setViewingPassword(null);
  };

  // Handle delete password - show confirmation modal
  const handleDeletePassword = (password) => {
    setDeleteableId(password.id);
    setIsDeleteModalVisible(true);
  };

  // Delete confirmation handlers
  const confirmDelete = () => {
    if (deleteableId) {
      dispatch(removePassword(deleteableId)).then((res) => {
        if (res?.payload?.meta?.success === true) {
          console.log('Clg')
        }
      });
      setIsDeleteModalVisible(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalVisible(false);
    setDeleteableId(null);
  };

  // Handle table pagination change
  const handleTableChange = (pagination) => {
    const { current, pageSize } = pagination;
    setPaginationforTable({
      ...paginationForTable,
      current: current,
      pageSize: pageSize,
    });
    fetchPasswords(current);
  };

  // Handle search input change with debouncing
  const onChangePasswordSearch = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only update filters if search value is empty or has at least 3 characters
    if (value === "" || value.length >= 3) {
      // Set a new timeout for 500ms
      searchTimeoutRef.current = setTimeout(() => {
        setPaginationforTable({
          ...paginationForTable,
          current: 1, // Reset to first page when search changes
        });
        fetchPasswords(1); // Fetch first page when search changes
      }, 500);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text, type) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        message.success(`${type} copied to clipboard!`);
      })
      .catch(() => {
        message.error(`Failed to copy ${type}`);
      });
  };

  // Password Modal completion handler
  const handlePasswordModalFinish = () => {
    fetchPasswords();
    setIsPasswordModalVisible(false);
    setEditingPassword(null);
  };

  // Table columns
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: "20%",
      render: (text) => (
        <div className="flex items-center">
          <Text className="text-white font-medium text-base">
            {text?.length >= 22 ? text?.slice(0, 20) + "..." : text}
          </Text>
        </div>
      ),
    },
    {
      title: "Username",
      dataIndex: "user_name",
      key: "user_name",
      width: "20%",
      render: (text) => (
        <div className="relative group hover:bg-gray pl-3 py-1 pr-3 rounded-md flex justify-between">
          <Text className="text-grayText">{text || "—"}</Text>
          {text && (
            <i
              className="icon-csv text-lg text-primary opacity-0 group-hover:opacity-100 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(text, "Username");
              }}
            />
          )}
        </div>
      ),
    },
    {
      title: "Password",
      dataIndex: "password",
      key: "password",
      width: "20%",
      render: (text, record) => (
        <div className="relative group">
          <div className="hover:bg-gray pl-3 py-1 pr-3 rounded-md flex justify-between">
            <Text className="text-grayText">
              {text ? "•".repeat(10) : "—"}
            </Text>
            {text && (
              <div className="flex">
                <i
                  className="icon-csv text-lg text-primary opacity-0 group-hover:opacity-100 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(text, "Password");
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      width: "15%",
      render: (text) => (
        <div className="flex items-center">
          {text ? (
            <Link
              to={`https://${text}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {text}
            </Link>
          ) : (
            <Text className="text-grayText">—</Text>
          )}
        </div>
      ),
    },
    {
      title: "Last Updated",
      dataIndex: "lastupdate",
      key: "lastupdate",
      width: "15%",
      render: (text) => (
        <div className="flex items-center">
          <Text className="text-grayText">
            {text
              ? new Date(text).toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })
              : "—"}
          </Text>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "15%",
      render: (_, record) => (
        <div className="flex space-x-2">
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              className="text-grayText hover:text-primary-dark border-liteGray"
              onClick={() => handleViewPassword(record)}
              shape="circle"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<i className="icon-edit" />}
              className="text-grayText hover:text-primary-dark border-liteGray"
              onClick={() => handleEditPassword(record)}
              shape="circle"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<i className="icon-delete" />}
              className="text-[#EF4444] hover:text-primary-dark border-liteGray"
              onClick={() => handleDeletePassword(record)}
              shape="circle"
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  // Get password list data
  const passwordList = passwords?.data?.password || [];

  return (
    <Row className="bg-darkGray px-header-wrapper h-full w-full flex flex-col gap-3 sm:gap-6">
      {/* Password Modal */}
      <PasswordModal
        visible={isPasswordModalVisible}
        onClose={handlePasswordModalClose}
        editingPassword={editingPassword}
        onFinish={handlePasswordModalFinish}
      />

      {/* View Password Modal */}
      <Modal
        title="View Password Details"
        centered
        destroyOnClose
        open={isViewModalVisible}
        footer={null}
        onCancel={handleViewModalClose}
        width={600}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
          />
        }
      >
        <div className="border-t-2 border-solid border-[#373737] mt-5 pt-5">
          {viewingPassword && (
            <div className="space-y-4">
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <div className="border border-[#373737] rounded-lg p-4">
                    <Text className="text-grayText text-sm">Name</Text>
                    <div className="text-white font-medium text-base mt-1 break-all overflow-wrap-anywhere">
                      {viewingPassword?.name || "—"}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="border border-[#373737] rounded-lg p-4">
                    <Text className="text-grayText text-sm">Username</Text>
                    <div className="text-white font-medium text-base mt-1 flex justify-between items-start gap-2">
                      <div className="break-all overflow-wrap-anywhere min-w-0 flex-1">
                        {viewingPassword?.user_name || "—"}
                      </div>
                      {viewingPassword?.user_name && (
                        <i
                          className="icon-csv text-lg text-primary cursor-pointer flex-shrink-0"
                          onClick={() => copyToClipboard(viewingPassword.user_name, "Username")}
                        />
                      )}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="border border-[#373737] rounded-lg p-4">
                    <Text className="text-grayText text-sm">Password</Text>
                    <div className="text-white font-medium text-base mt-1 flex justify-between items-center">
                      <div className="break-all overflow-wrap-anywhere min-w-0 flex-1">{viewingPassword?.password ? "•".repeat(viewingPassword?.password?.length) : "—"}</div>
                      {viewingPassword?.password && (
                        <i
                          className="icon-csv text-lg text-primary cursor-pointer flex-shrink-0"
                          onClick={() => copyToClipboard(viewingPassword.password, "Password")}
                        />
                      )}
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <div className="border border-[#373737] rounded-lg p-4">
                    <Text className="text-grayText text-sm">URL</Text>
                    <div className="text-white font-medium text-base mt-1">
                      {viewingPassword?.url ? (
                        <Link
                          to={`https://${viewingPassword.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all overflow-wrap-anywhere"
                        >
                          {viewingPassword.url}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="border border-[#373737] rounded-lg p-4">
                    <Text className="text-grayText text-sm">Created At</Text>
                    <div className="text-white font-medium text-base mt-1">
                      {viewingPassword?.created_at
                        ? new Date(viewingPassword.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "—"}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="border border-[#373737] rounded-lg p-4">
                    <Text className="text-grayText text-sm">Last Updated</Text>
                    <div className="text-white font-medium text-base mt-1">
                      {viewingPassword?.updated_at
                        ? new Date(viewingPassword.updated_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "—"}
                    </div>
                  </div>
                </Col>
                {viewingPassword?.notes && (
                  <Col span={24}>
                    <div className="border border-[#373737] rounded-lg p-4">
                      <Text className="text-grayText text-sm">Notes</Text>
                      <div className="text-white font-medium text-base mt-1 break-all overflow-wrap-anywhere">
                        {viewingPassword.notes}
                      </div>
                    </div>
                  </Col>
                )}
              </Row>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Password"
        centered
        destroyOnClose
        open={isDeleteModalVisible}
        footer={false}
        onCancel={cancelDelete}
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
                Are you sure you want to delete this password?
              </Text>
            </div>
            <Col span={12}>
              <Button block onClick={cancelDelete} size="large">
                Cancel
              </Button>
            </Col>
            <Col span={12}>
              <Button
                block
                danger
                type="primary"
                size="large"
                onClick={confirmDelete}
              >
                Confirm Deletion
              </Button>
            </Col>
          </Row>
        </div>
      </Modal>

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
            <Text className="text-white text-lg sm:text-2xl">
              Password Management
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer
          height={containerHeight}
          overflow={
            !passwordsLoading && passwordList.length === 0 ? "hidden" : "auto"
          }
        >
          <>
            <div className="flex mt-0 items-center">
              <div className="text-2xl font-normal">Passwords</div>
              {passwordList?.length > 0 && (
                <>
                  <span className="mx-3 text-grayText">&#8226;</span>
                  <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                    {passwords?.data?.pagination?.totalRecords ||
                      passwordList.length ||
                      ""}
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col md:flex-row justify-between gap-3 mb-6 pt-6 w-full">
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
                <div className="relative w-full md:max-w-md">
                  <Input
                    size="large"
                    prefix={
                      <SearchOutlined className="absolute left-4 top-1/2 text-xl transform -translate-y-1/2 text-grayText" />
                    }
                    placeholder="Search Passwords"
                    className="bg-[#171717] border-[#373737] rounded-full pl-10"
                    style={{ width: "100%" }}
                    onChange={onChangePasswordSearch}
                    value={searchValue}
                    allowClear
                  />
                </div>
              </div>
              <div className="w-full md:w-auto mt-3 md:mt-0">
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={showCreatePassword}
                  className="rounded-3xl w-full"
                >
                  Create Password
                </Button>
              </div>
            </div>
            <div className="h-full">
              {passwordsLoading ? (
                <div className="loadingClass">
                  <Spin size="large" />
                </div>
              ) : passwordList.length > 0 ? (
                <div className="overflow-auto">
                  <Table
                    columns={columns}
                    dataSource={passwordList}
                    rowKey="id"
                    pagination={{
                      current: paginationForTable.current,
                      pageSize: paginationForTable.pageSize,
                      total: paginationForTable.total,
                      position: ["bottomRight"],
                      showSizeChanger: false,
                      className:
                        "custom-pagination bg-lightGray flex-wrap-pagination",
                      showTotal: (total, range) => (
                        <div className="text-grayText w-full text-center md:text-left mb-4 md:mb-0">
                          Showing {range[0]}-{range[1]} of {total} results
                        </div>
                      ),
                    }}
                    onChange={handleTableChange}
                    className="custom-table password-management-table bg-[#242424] !rounded-[2rem] mb-6"
                    rowClassName="bg-[#242424] hover:bg-darkGray transition-colors"
                    scroll={{
                      x: "max-content",
                    }}
                  />
                </div>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <Empty description="No Passwords Found" />
                </div>
              )}
            </div>
          </>
        </ShadowBoxContainer>
      </Col>
    </Row>
  );
};

export default PasswordManagement;