import React, { useState, useEffect } from "react";
import {
  Typography,
  Row,
  Col,
  Table,
  Button,
  Tag,
  Input,
  Select,
  Empty,
  Spin,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  CaretRightOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchReferrals } from "../../services/Store/Refer/action";

const { Text, Title } = Typography;

const MyReferrals = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userForEdit } = useSelector((state) => state?.usersmanagement);

  // State for loading indicator
  const [loading, setLoading] = useState(false);

  // State for referrals data
  const [referrals, setReferrals] = useState([]);

  // State for pagination data
  const [paginationData, setPaginationData] = useState({
    currentPage: 1,
    totalPage: 1,
    perPage: 10,
    totalRecords: 0
  });

  // Search and pagination
  const [searchValue, setSearchValue] = useState("");
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

  // Container height for responsiveness
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Function to fetch referrals data
  const fetchReferralsData = async (page = 1, perPage = 10) => {
    try {
      setLoading(true);
      const payload = {
        user_id: userForEdit?.user?.id,
        page: page,
        per_page: perPage
      };

      const res = await dispatch(fetchReferrals(payload));
      console.log('Reference Listing', res);

      if (res?.payload?.data?.referrals) {
        // Map API response to table format
        const mappedReferrals = res.payload.data.referrals.map(referral => ({
          id: referral.id,
          name: referral.name,
          email: referral.email,
          phone: referral.phone_number,
          referralDate: formatDate(referral.created_at),
          status: referral.status.charAt(0).toUpperCase() + referral.status.slice(1),
          lastUpdated: formatDate(referral.updated_at)
        }));

        setReferrals(mappedReferrals);

        // Update pagination data
        const pagination = res.payload.data.pagination;
        setPaginationData(pagination);

        setTableParams(prev => ({
          ...prev,
          pagination: {
            ...prev.pagination,
            current: pagination.currentPage,
            pageSize: pagination.perPage,
            total: pagination.totalRecords,
          }
        }));
      }
    } catch (error) {
      console.log('Error', error);
    } finally {
      setLoading(false);
    }
  };

  // Set container height based on screen size
  useEffect(() => {
    // Fetch referrals data on component mount
    if (userForEdit?.user?.id) {
      fetchReferralsData();
    }

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
  }, [userForEdit?.user?.id]);

  // Handle search input change
  const onChangeSearch = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    // In a real app, you would implement debouncing here
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: 1,
      },
      search: value,
    });
  };

  // Handle status filter change
  const onChangeStatus = (value) => {
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: 1,
      },
      filters: {
        ...tableParams.filters,
        status: value,
      },
    });
  };

  // Handle table pagination changes
  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      ...tableParams,
      pagination,
    });

    // Fetch data for new page
    fetchReferralsData(pagination.current, pagination.pageSize);
  };

  // Handle adding a new referral
  const handleAddReferral = () => {
    navigate("/add-referral"); // Adjust the route as needed
  };

  // Table column definitions
  const columns = [
    {
      title: "Prospective LO Name",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <Text className="text-white">{text}</Text>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text) => (
        <Text className="text-white">{text}</Text>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (text) => (
        <Text className="text-white">{text}</Text>
      ),
    },
    {
      title: "Referral Date",
      dataIndex: "referralDate",
      key: "referralDate",
      render: (text) => (
        <Text className="text-white">{text}</Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "";
        let backgroundColor = "bg-gray";

        if (status === "Pending") {
          color = "#FF9800"; // Orange for pending
        } else if (status === "Accepted") {
          color = "#4CAF50"; // Green for accepted
        } else if (status === "Onboarded") {
          color = "#2196F3"; // Blue for onboarded
        }

        return (
          <Tag
            className={`px-3 py-1 rounded-md ${backgroundColor} text-white`}
            style={{ borderColor: color, backgroundColor: 'rgba(55, 55, 55, 0.8)' }}
          >
            <Text style={{ color: color }}>{status}</Text>
          </Tag>
        );
      },
    },
    {
      title: "Last Updated",
      dataIndex: "lastUpdated",
      key: "lastUpdated",
      render: (text) => (
        <Text className="text-white">{text}</Text>
      ),
    },
  ];

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
              to="/recruitment"
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Recruitment
              </Text>
            </Link>

            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Text className="text-white text-lg sm:text-2xl">
              My Referrals
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <div className="w-full">
          <div
            className="rounded-3xl border overflow-hidden bg-gray border-solid border-liteGray w-full relative"
            style={{ minHeight: containerHeight }}
          >
            {/* Shadow effect at the bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-10"
            ></div>

            <div className="flex flex-col h-full px-4 pt-5 pb-6">
              <div className="flex items-center gap-2 mb-6">
                <Text className="text-white text-xl sm:text-xl font-bold">
                  My Referrals
                </Text>
                <div className="h-2 rounded-full w-2 bg-grayText"></div>
                <div className="bg-primaryOpacity px-2 py-1 text-primary rounded-lg">
                  {paginationData.totalRecords}
                </div>
              </div>

              <div className="h-full">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Spin size="large" />
                  </div>
                ) : referrals.length > 0 ? (
                  <div className="overflow-auto">
                    <Table
                      columns={columns}
                      dataSource={referrals}
                      rowKey="id"
                      pagination={{
                        ...tableParams.pagination,
                        position: ["bottomRight"],
                        showSizeChanger: false,
                        className: "custom-pagination bg-lightGray flex-wrap-pagination",
                        showTotal: (total, range) => (
                          <div className="text-grayText w-full text-center md: mb-4 md:mb-0">
                            Showing {range[0]}-{range[1]} of {total} results
                          </div>
                        ),
                      }}
                      onChange={handleTableChange}
                      className="custom-table referrals-table bg-[#242424] !rounded-[2rem] mb-6"
                      rowClassName="bg-[#242424] hover:bg-darkGray transition-colors"
                      scroll={{ x: "max-content" }}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-[50vh]">
                    <Empty description="No Referrals Found" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default MyReferrals;