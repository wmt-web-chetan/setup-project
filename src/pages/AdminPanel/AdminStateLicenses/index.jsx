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
  Modal,
} from "antd";
import {
  SearchOutlined,
  CaretRightOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStateLicenses,
  updateStateLicenseStatusAction,
} from "../../../services/Store/StateLicense/action";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";

const { Text, Title } = Typography;

const AdminStateLicenses = () => {
  const dispatch = useDispatch();

  // Get state licenses data from Redux store
  const {
    stateLicenses,
    stateLicensesLoading,
    updateStateLicenseStatusLoading,
  } = useSelector((state) => state?.stateLicenses);

  // State for licenses data and filters
  const [licenses, setLicenses] = useState(null);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    filters: {
      status: undefined,
    },
    search: "",
  });

  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  // Debounce search with useRef to store timeout ID
  const searchTimeoutRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");
  
  // Add ref for search input and focus tracking
  const searchInputRef = useRef(null);
  const shouldMaintainFocus = useRef(false);

  // Fetch licenses based on current tableParams
  const fetchLicenses = () => {
    const params = {
      page: tableParams.pagination.current.toString(),
      per_page: tableParams.pagination.pageSize.toString(),
      ...(tableParams.filters.status !== undefined && {
        status: tableParams.filters.status,
      }),
      ...(tableParams.search && { search: tableParams.search }),
    };

    dispatch(fetchStateLicenses(params)).then((res) => {
      if (res?.payload?.data?.state_licenses) {
        setLicenses(res?.payload?.data?.state_licenses || []);
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

  // Initial fetch
  useEffect(() => {
    fetchLicenses();
  }, []);

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

  // Refetch when tableParams change (pagination, filters, etc.)
  useEffect(() => {
    fetchLicenses();
  }, [
    tableParams.pagination.current,
    tableParams.pagination.pageSize,
    tableParams.filters.status,
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

  // Handle table pagination and filtering change
  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      ...tableParams,
      pagination,
    });
  };

  // Handle status filter change
  const onChangeStatus = (value) => {
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: 1, // Reset to first page when filter changes
      },
      filters: {
        ...tableParams.filters,
        status: value,
      },
    });
  };

  // Handle search input change with debouncing
  const onChangeSearch = (e) => {
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

  // Handle view license
  const handleViewLicense = (record) => {
    if (record?.license_path) {
      const fileUrl = `${import.meta.env.VITE_IMAGE_BASE_URL}/${
        record.license_path
      }`;
      window.open(fileUrl, "_blank");
    }
  };

  // Handle approve license
  const handleApproveLicense = (record) => {
    const data = {
      id: record.id,
      status: "approved",
    };
    dispatch(updateStateLicenseStatusAction(data)).then((res) => {
      if (res?.payload?.meta?.success === true) {
        // Update local state to reflect the change immediately
        setLicenses(
          (prevLicenses) =>
            prevLicenses?.map((license) =>
              license.id === record.id
                ? { ...license, status: "approved" }
                : license
            ) || []
        );
      }
    });
  };

  // Handle reject license
  const handleRejectLicense = (record) => {
    const data = {
      id: record.id,
      status: "rejected",
    };
    dispatch(updateStateLicenseStatusAction(data)).then((res) => {
      if (res?.payload?.meta?.success === true) {
        // Update local state to reflect the change immediately
        setLicenses(
          (prevLicenses) =>
            prevLicenses?.map((license) =>
              license.id === record.id
                ? { ...license, status: "rejected" }
                : license
            ) || []
        );
      }
    });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Get status tag color and text
  const getStatusTag = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return (
          <Tag
            className="px-2 py-1 rounded-md bg-gray text-white"
            style={{ borderLeft: `3px solid #4CAF50` }}
          >
            Approved
          </Tag>
        );
      case "rejected":
        return (
          <Tag
            className="px-2 py-1 rounded-md bg-gray text-white"
            style={{ borderLeft: `3px solid #c53b37` }}
          >
            Rejected
          </Tag>
        );
      case "pending":
      default:
        return (
          <Tag
            className="px-2 py-1 rounded-md bg-gray text-white"
            style={{ borderLeft: `3px solid #FF9800` }}
          >
            Pending
          </Tag>
        );
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
      : "UN";
  };

  // Get approve button style based on status
  const getApproveButtonStyle = (status) => {
    const isApproved = status?.toLowerCase() === "approved";
    return {
      backgroundColor: isApproved ? "#1f3f2b" : "#4b3c31",
      color: isApproved ? "#22C55E" : "white",
      borderRadius: "8px",
      border: "1px solid",
      borderColor: isApproved ? "#22C55E" : "#FF6D00",
      fontWeight: "500",
      fontSize: "12px",
      padding: "4px 12px",
      height: "28px",
      // boxShadow: isApproved
      //   ? "0 2px 4px rgba(34, 197, 94, 0.2)"
      //   : "0 2px 4px rgba(59, 130, 246, 0.2)",
    };
  };

  // Get reject button style based on status
  const getRejectButtonStyle = (status) => {
    const isRejected = status?.toLowerCase() === "rejected";
    return {
      backgroundColor: isRejected ? "#382727" : "#4b3c31",
      color: isRejected ? "#ef4444" : "white",
      borderRadius: "8px",
      border: "1px solid",
      borderColor: isRejected ? "#ef4444" : "#FF6D00",
      fontWeight: "500",
      fontSize: "12px",
      padding: "4px 12px",
      height: "28px",
      // boxShadow: isRejected
      //   ? "0 2px 4px rgba(239, 68, 68, 0.2)"
      //   : "0 2px 4px rgba(59, 130, 246, 0.2)",
    };
  };

  // Get view button style
  const getViewButtonStyle = () => {
    return {
      backgroundColor: "#3B82F6",
      borderColor: "#3B82F6",
      color: "white",
      borderRadius: "8px",
      border: "1px solid",
      fontWeight: "500",
      fontSize: "12px",
      padding: "4px 12px",
      height: "28px",
      boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
    };
  };

  // Table columns
  const columns = [
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      width: "30%",
      render: (user, record) => (
        <div className="flex items-center">
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
            {getInitials(user?.name)}
          </Avatar>
          <div>
            <Text className="text-white font-medium text-base">
              {user?.name?.length >= 20
                ? user?.name?.slice(0, 18) + "..."
                : user?.name}
            </Text>
            <div className="flex items-center">
              <Text className="text-grayText text-sm">
                {user?.email?.length >= 20
                  ? user?.email?.slice(0, 18) + "..."
                  : user?.email}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
      width: "10%",
      render: (text) => (
        <Text className="text-white font-medium text-base">{text}</Text>
      ),
    },
    {
      title: "Upload Date",
      dataIndex: "created_at",
      key: "created_at",
      width: "20%",
      render: (text) => (
        <Text className="text-grayText">{formatDate(text)}</Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "10%",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Actions",
      key: "actions",
      width: "20%",
      render: (_, record) => (
        <div className="flex gap-2">
          {/* <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewLicense(record)}
            title="View License"
            disabled={updateStateLicenseStatusLoading}
            className="text-primary"
            // style={getViewButtonStyle()}
          ></Button> */}
          <Button
            type="primary"
            icon={<CheckOutlined />}
            size="small"
            onClick={() => handleApproveLicense(record)}
            title="Approve License"
            disabled={updateStateLicenseStatusLoading}
            style={getApproveButtonStyle(record.status)}
            className="hover:opacity-80 transition-opacity shadow-none"
          >
            {record.status?.toLowerCase() === "approved"
              ? "Approved"
              : "Approve"}
          </Button>
          <Button
            type="primary"
            icon={<CloseOutlined />}
            size="small"
            onClick={() => handleRejectLicense(record)}
            title="Reject License"
            disabled={updateStateLicenseStatusLoading}
            style={getRejectButtonStyle(record.status)}
            className="hover:opacity-80 transition-opacity shadow-none"
          >
            {record.status?.toLowerCase() === "rejected"
              ? "Rejected"
              : "Reject"}
          </Button>
        </div>
      ),
    },
    {
      title: "View License",
      key: "viewlicense",
      width: "10%",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewLicense(record)}
            title="View License"
            disabled={updateStateLicenseStatusLoading}
            className="text-primary"
            // style={getViewButtonStyle()}
          ></Button>
        </div>
      ),
    },
  ];

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
              to="/admin"
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
              State Licenses Management
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer
          height={containerHeight}
          overflow={
            !stateLicensesLoading && licenses !== null && licenses?.length === 0
              ? "hidden"
              : "auto"
          }
        >
          <>
            {stateLicensesLoading || licenses === null ? (
              <div className="loadingClass">
                <Spin size="large" />
              </div>
            ) : (
              <>
                <div className="flex mt-0 items-center">
                  <div className="text-2xl font-normal">State Licenses</div>
                  {licenses?.length > 0 && (
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
                        placeholder="Search Licenses"
                        className="bg-[#171717] border-[#373737] rounded-full pl-10"
                        style={{ width: "100%" }}
                        onChange={onChangeSearch}
                        value={searchValue}
                        allowClear
                      />
                    </div>
                    {/* <div className="w-full md:w-auto">
                      <Select
                        size="large"
                        placeholder="Filter by Status"
                        value={tableParams?.filters?.status}
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
                          { value: "pending", label: "Pending" },
                          { value: "approved", label: "Approved" },
                          { value: "rejected", label: "Rejected" },
                        ]}
                        onChange={onChangeStatus}
                        allowClear
                      />
                    </div> */}
                  </div>
                </div>
                <div className="h-full">
                  {stateLicensesLoading || licenses === null ? (
                    <div className="loadingClass">
                      <Spin size="large" />
                    </div>
                  ) : licenses?.length > 0 ? (
                    <div className="overflow-auto">
                      <Table
                        columns={columns}
                        dataSource={licenses}
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
                        className="custom-table bg-[#242424] !rounded-[2rem] mb-6"
                        rowClassName="bg-[#242424] hover:bg-darkGray transition-colors"
                        scroll={{
                          x: "max-content",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <Empty description="No Licenses Found" />
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        </ShadowBoxContainer>
      </Col>
    </Row>
  );
};

export default AdminStateLicenses;