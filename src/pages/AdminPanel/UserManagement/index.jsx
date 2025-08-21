import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Row,
  Col,
  Table,
  Button,
  Tag,
  Avatar,
  Spin,
  Input,
  Select,
  Empty,
  Popover,
} from "antd";
import {
  UserOutlined,
  UserAddOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  PlusOutlined,
  SearchOutlined,
  CaretRightOutlined,
} from "@ant-design/icons";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./UserManagement.scss";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsersList } from "../../../services/Store/Users/action";
import { fetchRolesList } from "../../../services/Store/Permission/action";

const { Text, Title } = Typography;

const UserManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // Check if we're in admin mode based on current path
  const isAdminMode = location.pathname.includes("/admin/");

  // Get users data from Redux store
  const { usersListLoading } = useSelector((state) => state?.usersmanagement);

  // State for users data and filters
  const [users, setUsers] = useState(null);
  const [roles, setRoles] = useState([]);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    filters: {
      is_active: undefined,
      role: undefined,
    },
    search: "",
  });

  // State for popover visibility
  const [popoverVisibleMap, setPopoverVisibleMap] = useState({});

  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  // Debounce search with useRef to store timeout ID
  const searchTimeoutRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");
  
  // Add ref for search input and focus tracking
  const searchInputRef = useRef(null);
  const shouldMaintainFocus = useRef(false);

  // Helper functions for dynamic navigation
  const getDashboardLink = () => {
    return isAdminMode ? "/admin" : "/dashboard";
  };

  const getUserManagementNewPath = () => {
    return isAdminMode ? "/admin/user-management/new" : "/user-management/new";
  };

  const getUserManagementEditPath = (userId) => {
    return isAdminMode
      ? `/admin/user-management/${userId}`
      : `/user-management/${userId}`;
  };

  // Fetch users based on current tableParams
  const fetchUsers = () => {
    const params = {
      page: tableParams.pagination.current.toString(),
      per_page: tableParams.pagination.pageSize.toString(),
      ...(tableParams.filters.is_active !== undefined && {
        is_active: tableParams.filters.is_active,
      }),
      ...(tableParams.filters.role !== undefined && {
        role: tableParams.filters.role,
      }),
      ...(tableParams.search && { search: tableParams.search }),
    };

    dispatch(fetchUsersList(params)).then((res) => {
      if (res?.payload?.data?.users) {
        setUsers(res?.payload?.data?.users || []);
        const paginationData = res?.payload?.data?.pagination;

        // Update tableParams with new pagination info
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            current: paginationData?.currentPage,
            total: paginationData?.totalRecords,
          },
        });
        
        // Restore focus if needed
        if (shouldMaintainFocus.current && searchInputRef.current) {
          setTimeout(() => {
            searchInputRef.current.focus();
            shouldMaintainFocus.current = false;
          }, 0);
        }
      }
    });
  };

  // Fetch roles list
  const fetchRoles = () => {
    dispatch(fetchRolesList({})).then((res) => {
      if (res?.payload?.data?.roles) {
        setRoles(res?.payload?.data?.roles || []);
      }
    });
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setContainerHeight(
        window.innerWidth < 768 ? "calc(100vh - 212px)" : "calc(100vh - 241px)"
      );

      // Close all popovers on resize to prevent overflow issues
      setPopoverVisibleMap({});
    };

    // Set initial height
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close popovers when the container is scrolled
  useEffect(() => {
    const handleScroll = (e) => {
      // Close all popovers on scroll
      setPopoverVisibleMap({});
    };

    // Add scroll event listeners to both window and table container
    window.addEventListener("scroll", handleScroll, true);
    const tableContainer = document.querySelector(".ant-table-body");
    if (tableContainer) {
      tableContainer.addEventListener("scroll", handleScroll, {
        passive: true,
      });
    }

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      if (tableContainer) {
        tableContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  // Refetch when tableParams change (pagination, filters, etc.)
  useEffect(() => {
    fetchUsers();
  }, [
    tableParams.pagination.current,
    tableParams.pagination.pageSize,
    tableParams.filters.is_active,
    tableParams.filters.role,
    tableParams.search,
  ]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Role mapping for display
  const roleMap = {
    LO: { label: "Loan Officer", icon: <TeamOutlined /> },
    CP: { label: "Compliance Person", icon: <CheckCircleOutlined /> },
    ADMIN: { label: "Administrator", icon: <UserOutlined /> },
    MGR: { label: "Manager", icon: <TeamOutlined /> },
    // Add any other role mappings here
  };

  // Handle create new user - Navigate to create user page instead of showing modal
  const showCreateUser = () => {
    navigate(getUserManagementNewPath());
  };

  // Handle edit user - Navigate to edit user page instead of showing modal
  const handleEditUser = (user) => {
    navigate(getUserManagementEditPath(user.id));
  };

  // Handle table pagination and filtering change
  const handleTableChange = (pagination, filters, sorter) => {
    // Close all popovers when table changes
    setPopoverVisibleMap({});

    setTableParams({
      ...tableParams,
      pagination,
      // We don't update filters here as we're handling them separately
    });
  };

  // Handle status filter change
  const onChangeUserStatus = (value) => {
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: 1, // Reset to first page when filter changes
      },
      filters: {
        ...tableParams.filters,
        is_active: value,
      },
    });
  };

  // Handle role filter change
  const onChangeUserRole = (value) => {
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: 1, // Reset to first page when filter changes
      },
      filters: {
        ...tableParams.filters,
        role: value,
      },
    });
  };

  // Handle search input change with debouncing
  const onChangeUserSearch = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    // Set focus flag when user is typing
    shouldMaintainFocus.current = true;

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only update filters if search value is empty or has at least 3 characters
    if (value === "" || value.length >= 3) {
      // Set a new timeout for 500ms
      searchTimeoutRef.current = setTimeout(() => {
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            current: 1, // Reset to first page when search changes
          },
          search: value,
        });
      }, 500);
    }
  };

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      ? name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .toUpperCase()
          .substring(0, 2)
      : "UN"; // Default for undefined names
  };

  // Handle popover visibility changes
  const handlePopoverVisibleChange = (visible, userId) => {
    // Update visibility in state
    setPopoverVisibleMap((prev) => ({
      ...prev,
      [userId]: visible,
    }));
  };

  // Component to render a single role tag
  const RoleTag = ({ role }) => (
    <Tag
      key={role.id}
      className={`px-2 py-1 rounded-md bg-gray text-white mr-2 ${
        role.pivot?.is_default === 1 ? "border border-primary" : ""
      }`}
    >
      <Text
        style={{
          color: role.pivot?.is_default === 1 ? "#FF6D00" : "white",
        }}
      >
        {role.full_name || roleMap[role.name]?.label || role.name}
        {role.pivot?.is_default === 1 && <span> (Default)</span>}
      </Text>
    </Tag>
  );

  // Component to render all roles in a popover
  const AllRolesContent = ({ roles }) => (
    <div className="max-w-md p-3">
      <div className="font-medium mb-2">All Assigned Roles:</div>
      <div className="flex flex-wrap gap-2">
        {roles?.map((role) => (
          <RoleTag key={role.id} role={role} />
        ))}
      </div>
    </div>
  );

  // Table columns
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: "22%",
      render: (text, record) => (
        <div className="flex items-center">
          {record?.profile_photo_path ? (
            <Avatar
              size={40}
              src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                record?.profile_photo_path
              }`}
              style={{
                backgroundColor: "#373737",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginRight: "12px",
              }}
            ></Avatar>
          ) : (
            <Avatar
              size={40}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginRight: "12px",
              }}
              className="bg-primaryOpacity !rounded-full"
            >
              {record?.name?.[0]}
              {/* {getInitials(text)} */}
            </Avatar>
          )}

          <div>
            <Text className="text-white font-medium text-base">
              {text?.length >= 22 ? text?.slice(0, 20) + "..." : text}
            </Text>
            <div className="flex items-center">
              <Text className="text-grayText text-sm">
                {record?.email?.length >= 22
                  ? record?.email?.slice(0, 20) + "..."
                  : record?.email}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "NMLS Number",
      dataIndex: "nmls_number",
      key: "nmls_number",
      width: "15%",
      render: (text) => (
        <div className="flex items-center">
          <Text className="text-grayText">{text}</Text>
        </div>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone_number",
      key: "phone_number",
      width: "15%",
      render: (text) => (
        <div className="flex items-center">
          <Text className="text-grayText">{text}</Text>
        </div>
      ),
    },
    {
      title: "Roles",
      dataIndex: "roles",
      key: "roles",
      width: "35%",
      render: (roles, record) => {
        // Check if roles exist
        if (!roles || !Array.isArray(roles) || roles?.length === 0) {
          return <Text className="text-grayText">No roles assigned</Text>;
        }

        // Always show default role first
        const sortedRoles = [...roles].sort((a, b) => {
          if (a.pivot?.is_default === 1) return -1;
          if (b.pivot?.is_default === 1) return 1;
          return 0;
        });

        // Only show first 2 roles directly in the table
        const visibleRoles = sortedRoles?.slice(0, 2);
        const remainingRoles = sortedRoles?.slice(2);
        const hasMoreRoles = remainingRoles.length > 0;

        return (
          <div className="flex items-center">
            <div
              className="flex items-center overflow-x-auto"
              style={{ whiteSpace: "nowrap" }}
            >
              {visibleRoles?.map((role) => (
                <RoleTag key={role.id} role={role} />
              ))}

              {hasMoreRoles && (
                <Popover
                  content={<AllRolesContent roles={sortedRoles} />}
                  title={null}
                  trigger="click"
                  placement="bottom"
                  className="roles-popover"
                  autoAdjustOverflow={true}
                  open={popoverVisibleMap[record.id] || false}
                  onOpenChange={(visible) =>
                    handlePopoverVisibleChange(visible, record.id)
                  }
                  overlayInnerStyle={{ maxWidth: "400px" }}
                  align={{
                    overflow: {
                      adjustX: true,
                      adjustY: true,
                      alwaysByViewport: true,
                    },
                  }}
                >
                  <Tag
                    className="px-2 py-1 rounded-md bg-gray text-white mr-2 cursor-pointer"
                    style={{ backgroundColor: "#4A4A4A" }}
                  >
                    <PlusOutlined className="mr-1" />
                    <Text className="text-white">
                      {remainingRoles?.length} more
                    </Text>
                  </Tag>
                </Popover>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: "5%",
      render: (isActive) =>
        isActive ? (
          <Tag
            className="px-2 py-1 rounded-md bg-gray text-white"
            style={{ borderLeft: `3px solid #4CAF50` }}
          >
            Active
          </Tag>
        ) : (
          <Tag
            className="px-2 py-1 rounded-md bg-gray text-white"
            style={{ borderLeft: `3px solid #c53b37` }}
          >
            Inactive
          </Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "10%",
      render: (_, record) => (
        <Button
          type="text"
          icon={<i className="icon-edit" />}
          className="text-primary hover:text-primary-dark text-lg"
          onClick={() => handleEditUser(record)}
        />
      ),
    },
  ];

  // Close popovers when table is scrolled
  const onScrollUserTable = () => {
    if (Object.values(popoverVisibleMap).some((isOpen) => isOpen)) {
      setPopoverVisibleMap({});
    }
  };

  return (
    <Row className="bg-darkGray px-header-wrapper h-full w-full flex flex-col gap-3 sm:gap-6">
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
              User Management
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer
          height={containerHeight}
          overflow={
            !usersListLoading && users !== null && users.length === 0
              ? "hidden"
              : "auto"
          }
        >
          <>
            
              <>
                <div className="flex mt-0 items-center">
                  <div className="text-2xl font-normal">Users</div>
                  {users?.length > 0 && (
                    <>
                      <span className="mx-3 text-grayText">&#8226;</span>
                      <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                        {tableParams?.pagination?.total || ""}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex flex-col md:flex-row justify-between gap-3 mb-6 pt-6 w-full">
                  <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
                    <div className="relative w-full md:max-w-md">
                      <Input
                        ref={searchInputRef}
                        size="large"
                        prefix={
                          <SearchOutlined className="absolute left-4 top-1/2 text-xl transform -translate-y-1/2 text-grayText" />
                        }
                        placeholder="Search Users"
                        className="bg-[#171717] border-[#373737] rounded-full pl-10"
                        style={{ width: "100%" }}
                        onChange={onChangeUserSearch}
                        value={searchValue}
                        allowClear
                      />
                    </div>
                    <div className="w-full md:w-auto">
                      <Select
                        size="large"
                        placeholder="Filter by Role"
                        value={tableParams?.filters?.role}
                        style={{width:"190px "}}
                        // style={{ width: "160px" }}
                        className="bg-[#373737] rounded-full text-white filterSelection "
                        dropdownStyle={{
                          backgroundColor: "#212121",
                          borderRadius: "8px",
                          color: "white",
                        }}
                        filterOption={(input, option) =>
                          (option?.label || "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        suffixIcon={
                          <CaretRightOutlined className="rotate-90 text-white" />
                        }
                        options={roles?.map(role => ({
                          value: role.name,
                          label: role.full_name || role.name
                        }))}
                        onChange={onChangeUserRole}
                        allowClear
                      />
                    </div>
                    <div className="w-full md:w-auto">
                      <Select
                        size="large"
                        placeholder="Filter by Status"
                        value={tableParams?.filters?.is_active}
                        style={{ width: "160px" }}
                        className="bg-[#373737] rounded-full text-white filterSelection"
                        dropdownStyle={{
                          backgroundColor: "#212121",
                          borderRadius: "8px",
                          color: "white",
                        }}
                        filterOption={(input, option) =>
                          (option?.label || "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        suffixIcon={
                          <CaretRightOutlined className="rotate-90 text-white" />
                        }
                        options={[
                          { value: true, label: "Active" },
                          { value: false, label: "Inactive" },
                        ]}
                        onChange={onChangeUserStatus}
                        allowClear
                      />
                    </div>
                  
                  </div>
                  <div className="w-full md:w-auto mt-3 md:mt-0">
                    <Button
                      type="primary"
                      size="large"
                      icon={<UserAddOutlined />}
                      onClick={showCreateUser}
                      className="rounded-3xl w-full"
                    >
                      Add User
                    </Button>
                  </div>
                </div>
                <div className="h-full">
                  {usersListLoading || users === null ? (
                    <div className="loadingClass">
                      <Spin size="large" />
                    </div>
                  ) : users?.length > 0 ? (
                    <div className="overflow-auto">
                      <Table
                        columns={columns}
                        dataSource={users}
                        rowKey="id"
                        pagination={{
                          ...tableParams.pagination,
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
                        className="custom-table user-management-table bg-[#242424] !rounded-[2rem] mb-6"
                        rowClassName="bg-[#242424] hover:bg-darkGray transition-colors"
                        scroll={{
                          x: "max-content",
                        }}
                        onScroll={onScrollUserTable}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <Empty description="No Users Found" />
                    </div>
                  )}
                </div>
              </>
            
          </>
        </ShadowBoxContainer>
      </Col>
    </Row>
  );
};

export default UserManagement;