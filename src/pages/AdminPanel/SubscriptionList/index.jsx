import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Row,
  Col,
  Table,
  Button,
  Tag,
  notification,
  Input,
  Select,
  Empty,
  Spin,
} from "antd";
import {
  CreditCardOutlined,
  EditOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  WarningOutlined,
  SearchOutlined,
  CaretRightOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchSubscriptionsList } from "../../../services/Store/Subscription/action";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";

const { Text, Title } = Typography;

// Main Subscription Management Component
const SubscriptionList = () => {
  const dispatch = useDispatch();

  // Get subscription data from Redux store
  const { subscriptionsListLoading } = useSelector(
    (state) => state?.subscriptions
  );

  // State for subscriptions data and filters
  const [subscriptions, setSubscriptions] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    stripe_status: undefined,
    search: "",
  });

  // Debounce search with useRef to store timeout ID
  const searchTimeoutRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");

  // Add ref for search input and focus tracking
  const searchInputRef = useRef(null);
  const shouldMaintainFocus = useRef(false);

  // Fetch subscriptions based on current filters and pagination
  const fetchSubscriptions = (page = 1, pageSize = 10) => {
    const params = {
      page: page.toString(),
      per_page: pageSize.toString(),
      ...(filters.stripe_status !== undefined && {
        stripe_status: filters.stripe_status,
      }),
      ...(filters.search && { search: filters.search }),
    };

    dispatch(fetchSubscriptionsList(params)).then((res) => {
      if (res?.payload?.data?.users) {
        setSubscriptions(res.payload.data.users || []);
        const paginationData = res?.payload?.data?.pagination;
        setPagination({
          current: paginationData?.currentPage,
          pageSize: paginationData?.perPage,
          total: paginationData?.totalRecords,
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
    fetchSubscriptions();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchSubscriptions(1); // Reset to first page when filters change
  }, [filters]);

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

  // Handle search input change with debouncing
  const onSearchChange = (e) => {
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
        setFilters((prev) => ({ ...prev, search: value }));
      }, 500);
    }
  };

  // Handle status filter change
  const onStatusFilterChange = (value) => {
    setFilters((prev) => ({ ...prev, stripe_status: value }));
  };

  // Handle table pagination change
  const handleTableChange = (pagination) => {
    fetchSubscriptions(pagination.current, pagination.pageSize);
  };

  // Format date in a readable format
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Render status tag with appropriate color
  const renderStatusTag = (status) => {
    let icon = null;
    let color = "";
    let text =
      status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");

    switch (status) {
      case "active":
        icon = <CheckCircleOutlined />;
        color = "#4CAF50";
        break;
      case "canceled":
        icon = <StopOutlined />;
        color = "#c53b37";
        break;
      case "past_due":
        icon = <WarningOutlined />;
        color = "#FF9800";
        text = "Past Due";
        break;
      case "incomplete":
        icon = <ClockCircleOutlined />;
        color = "#03A9F4";
        break;
      default:
        icon = <CloseCircleOutlined />;
        color = "#F44336";
    }

    return (
      <Tag
        icon={icon}
        className="px-2 py-1 rounded-md bg-gray text-white"
        style={{ borderLeft: `3px solid ${color}` }}
      >
        {text}
      </Tag>
    );
  };

  // Table columns
  const columns = [
    {
      title: "Customer",
      key: "customer",
      width: "20%",
      render: (_, record) => (
        <div className="flex flex-col">
          <Text className="text-white font-medium">{record.user.name}</Text>
          <Text className="text-grayText text-sm">{record.user.email}</Text>
        </div>
      ),
    },
    {
      title: "Subscription ID",
      dataIndex: "stripe_id",
      key: "stripe_id",
      width: "20%",
      render: (text) => (
        <Text className="text-grayText text-sm font-mono">{text}</Text>
      ),
    },

    {
      title: "Subscription Start Date",
      dataIndex: "created_at",
      key: "created_at",
      width: "15%",
      render: (date) => (
        <Text className="text-grayText">{formatDate(date)}</Text>
      ),
    },
    {
      title: "Renewal Date",
      dataIndex: "next_payment_date",
      key: "next_payment_date",
      width: "15%",
      render: (date) => (
        <Text className="text-grayText">{formatDate(date)}</Text>
      ),
    },
    {
      title: "Cancelled Subscription Date",
      dataIndex: "ends_at",
      key: "ends_at",
      width: "15%",
      render: (date) => (
        <Text className="text-grayText">{formatDate(date)}</Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "stripe_status",
      key: "status",
      width: "10%",
      render: (status) => renderStatusTag(status),
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
              Subscription Management
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <ShadowBoxContainer height={containerHeight}>
          <>
            {subscriptionsListLoading || subscriptions === null ? (
              <div className="flex items-center justify-center h-full">
                <Spin size="large" />
              </div>
            ) : (
              <>
                <div className="flex mt-0 items-center">
                  <div className="text-2xl font-normal">Subscriptions</div>
                  {subscriptions?.length > 0 && (
                    <>
                      <span className="mx-3 text-grayText">&#8226;</span>
                      <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                        {pagination?.total || ""}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex flex-col md:flex-row justify-between gap-3 mb-6 pt-6 w-full">
                  <div className="flex flex-col md:flex-row gap-3 w-full">
                    <div className="relative w-full md:max-w-md">
                      <Input
                        ref={searchInputRef}
                        size="large"
                        prefix={
                          <SearchOutlined className="absolute left-4 top-1/2 text-xl transform -translate-y-1/2 text-grayText" />
                        }
                        placeholder="Search by Name or Email"
                        className="bg-[#171717] border-[#373737] rounded-full pl-10"
                        style={{ width: "100%" }}
                        onChange={onSearchChange}
                        value={searchValue}
                        allowClear
                      />
                    </div>
                    <div className="w-full md:w-auto">
                      <Select
                        size="large"
                        placeholder="Filter by Status"
                        value={filters?.stripe_status} // Set value from filters state
                        style={{ width: "150px" }}
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
                          { value: "active", label: "Active" },
                          { value: "canceled", label: "Canceled" },
                          { value: "past_due", label: "Past Due" },
                          { value: "incomplete", label: "Incomplete" },
                          { value: "trialing", label: "Trialing" },
                        ]}
                        onChange={onStatusFilterChange}
                        allowClear
                      />
                    </div>
                  </div>
                </div>

                <div className="h-full">
                  {subscriptionsListLoading || subscriptions === null ? (
                    <div className="flex items-center justify-center h-full">
                      <Spin size="large" />
                    </div>
                  ) : subscriptions?.length > 0 ? (
                    <div className="overflow-auto">
                      <Table
                        columns={columns}
                        dataSource={subscriptions}
                        rowKey="id"
                        pagination={{
                          current: pagination.current,
                          pageSize: pagination.pageSize,
                          total: pagination.total,
                          position: ["bottomRight"],
                          showSizeChanger: false,
                          className: "custom-pagination flex-wrap-pagination",
                          showTotal: (total, range) => (
                            <div className="text-grayText w-full text-center md:text-left mb-4 md:mb-0">
                              Showing {range[0]}-{range[1]} of {total} results
                            </div>
                          ),
                          onChange: (page) => {
                            fetchSubscriptions(page, pagination.pageSize);
                          },
                        }}
                        onChange={handleTableChange}
                        className="custom-table subscription-management-table bg-[#242424] !rounded-[2rem] mb-6"
                        rowClassName="bg-[#242424] hover:bg-darkGray transition-colors"
                        scroll={{
                          x: "max-content",
                          // y: "calc(100vh - 420px)",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <Empty description="No Subscriptions Found" />
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

export default SubscriptionList;