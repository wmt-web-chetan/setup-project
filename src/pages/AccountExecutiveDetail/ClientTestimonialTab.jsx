import React, { useState, useEffect } from "react";
import { Col, Input, Row, Select, Typography, Avatar, Rate, Pagination, Tag } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchReviewList } from "../../services/Store/ClientTestimonial/action";
import { useParams } from "react-router-dom";
import { fetchLoanType } from "../../services/Store/ContractProcessor/actions";

const { Text, Title } = Typography;

const TestimonialCard = ({ user_name, user_avatar, score, loan_category, created_at,heading ,comment, ctc }) => {
  // Format the date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Row className="pb-4 pt-3 border-b border-liteGray">
      <Col span={24}>
        <Row gutter={[16, 16]} align="top">
          {/* User Info Section */}
          <Col xs={24} md={24}>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={16}>
                <Row gutter={[12, 0]} align="middle">
                  {/* Avatar */}
                  <Col>
                    <Avatar 
                      src={user_avatar} 
                      size={48}
                      className=""
                    >
                      {!user_avatar && user_name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  </Col>
                  
                  {/* Name, Rating, and Tags all on the same line */}
                  <Col flex="1">
                    <Row align="middle" gutter={[0, 0]}>
                      <Col>
                        <Text className="text-white font-bold">{user_name}</Text>
                      </Col>
                      {ctc && (
                        <Col className="xl:ml-4">
                          <Tag className="bg-[#FFAA1633] border-none rounded-full text-yellow-400 text-xs p-1 px-3 font-bold">{ctc}</Tag>
                        </Col>
                      )}
                      {loan_category && (
                        <Col>
                          <Tag className="text-[#5A76FF] bg-[#5A76FF33] border-none rounded-full text-xs p-1 px-3">{loan_category}</Tag>
                        </Col>
                      )}
                    </Row>
                    <Row>
                      <Rate value={score} disabled className="text-[#FFAA16] text-sm" />
                    </Row>
                  </Col>
                </Row>
              </Col>

              {/* Date */}
              <Col xs={24} sm={8} className="text-right">
                <Text className="text-grayText">{formatDate(created_at)}</Text>
              </Col>
            </Row>
          </Col>

          {/* Testimonial Content */}
          <Col span={24} className="mt-2">
            <Row gutter={[8, 16]}>
              {/* Testimonial Text */}
              <Col span={24}>
              <div className="text-white text-lg font-semibold break-all">{heading}</div>
                <Text className="text-white text-sm break-all">{comment}</Text>
              </Col>
            </Row>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

const ClientTestimonialTab = () => {
  const dispatch = useDispatch();
  const {id}=useParams()
  const { reviewList, reviewListLoading, reviewListError } = useSelector((state) => state.reviews);
  // console.log(reviewList, "reviewList")
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState(undefined);
  const [loanTypeFilter, setLoanTypeFilter] = useState(undefined);
  const pageSize = 10;

  // Fetch reviews on component mount and when filters change
  useEffect(() => {
    const params = {
      page: currentPage,
      per_page: pageSize,
      rated_user_id: id,
      ...(search && { search: search }),
      ...(sortOrder && { sort_order: sortOrder }),
      ...(loanTypeFilter && { loan_category_id: loanTypeFilter })
    };
    dispatch(fetchReviewList(params));
  }, [dispatch, currentPage, search, sortOrder, loanTypeFilter, id]);

  const { loanType, loanTypeLoading } = useSelector((state) => state.contractProcessor);
  
    // Fetch loan types when component mounts
    useEffect(() => {
      dispatch(fetchLoanType());
    }, [dispatch]);

    // console.log(loanType,"loanType")

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSortChange = (value) => {
    setSortOrder(value);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleLoanTypeChange = (value) => {
    setLoanTypeFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Updated to match the API response structure
  const testimonials = reviewList?.data?.ratings || [];
  const totalRecords = reviewList?.data?.pagination?.total || 0;

  // Generate loan type options from API data
  const loanTypeOptions = loanType?.data?.map(type => ({
    value: type.id,
    label: type.name
  })) || [];

  return (
    <div className="mt-3">
      {/* Header Section */}
      <div className="flex items-center gap-2">
        <Text className="text-white font-bold">Reviews</Text>
        <div className="h-2 rounded-full w-2 bg-grayText"></div>
        <div className="bg-[#ff6d001a] px-2 text-primary rounded-lg">{totalRecords}</div>
      </div>

      {/* Search and Filter Section */}
      <div className="mt-5">
        <Row gutter={[10, 10]}>
          <Col xs={24} md={8} lg={14}>
            <Input
              placeholder="Search"
              className="px-3 rounded-full"
              size="large"
              value={search}
              onChange={handleSearchChange}
              prefix={<SearchOutlined className="text-grayText" />}
            />
          </Col>
          <Col xs={24} md={16} lg={10}>
            <Row gutter={[10, 10]}>
              <Col xs={12} md={8}>
                <Select
                  size="large"
                  placeholder={<div className="text-white">Filter</div>}
                  className="w-full bg-[#2a2a2a] !rounded-full text-white filterSelection"
                  value={sortOrder}
                  onChange={handleSortChange}
                  allowClear
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
                  suffixIcon={<i className="icon-down-arrow text-white" />}
                  options={[
                    { value: "desc", label: "Recent" },
                    { value: "asc", label: "Oldest" },
                  ]}
                />
              </Col>
              <Col xs={12} md={8}>
                <Select
                  size="large"
                  placeholder="Loan Type"
                  className="w-full bg-[#2a2a2a] rounded-full text-white filterSelection"
                  value={loanTypeFilter}
                  onChange={handleLoanTypeChange}
                  allowClear
                  loading={loanTypeLoading}
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
                  suffixIcon={<i className="icon-down-arrow text-white" />}
                  options={loanTypeOptions}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      {/* Testimonials Section */}
      <div className="mt-5 rounded-lg">
        {reviewListLoading ? (
          <div className="text-center py-8">
            <Text className="text-white">Loading reviews...</Text>
          </div>
        ) : testimonials?.length > 0 ? (
          <>
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} {...testimonial} />
            ))}

            {/* Pagination */}
            <Row justify="end" className="mt-4">
              <Col>
                <Pagination 
                  current={currentPage}
                  onChange={handlePageChange}
                  total={totalRecords}
                  pageSize={pageSize}
                  size="default"
                  className="custom-pagination"
                  showSizeChanger={false}
                />
              </Col>
            </Row>
          </>
        ) : (
          <div className="text-center py-8">
            <Text className="text-white">No reviews found</Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientTestimonialTab;