/* eslint-disable react/no-unknown-property */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Col, Row, Typography, Avatar, Rate, Spin, Empty } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchVendorRatingList } from "../../services/Store/VendorAdmin/action";
import { resetVendorRatings } from "../../services/Store/VendorAdmin/slice";

const { Text } = Typography;

const VendorRatingCard = ({
  user_name,
  user_avatar,
  score,
  loan_category,
  created_at,
  heading,
  comment,
}) => {
  // Format the date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
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

                    <Avatar src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${user_avatar
                    }`} size={48} className="">
                      {!user_avatar && user_name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  </Col>

                  {/* Name and Rating */}
                  <Col flex="1">
                    <Row align="middle" gutter={[0, 0]}>
                      <Col>
                        <Text className="text-white font-bold">
                          {user_name}
                        </Text>
                      </Col>
                    </Row>
                    <Row>
                      <Rate
                        value={score}
                        disabled
                        className="text-[#FFAA16] text-sm"
                      />
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

          {/* Rating Content */}
          <Col span={24} className="mt-2">
            <Row gutter={[8, 16]}>
              {/* Rating Text */}
              <Col span={24}>
                {heading && (
                  <div className="text-white text-lg font-semibold break-all mb-2">
                    {heading}
                  </div>
                )}
                {comment && (
                  <Text className="text-white text-sm break-all">
                    {comment}
                  </Text>
                )}
              </Col>
            </Row>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

const VendorRatingsView = ({ vendorId, containerHeight }) => {
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const ratingsContainerRef = useRef(null);

  const { vendorRatings, vendorRatingsLoading, vendorRatingsHasMore } =
    useSelector((state) => state.vendorStoreCategories);

  // Fetch ratings on component mount
  useEffect(() => {
    if (vendorId) {
      // Reset ratings state when vendor changes
      dispatch(resetVendorRatings());
      setCurrentPage(1);
      const params = {
        vendor_id: vendorId,
        page: 1,
        per_page: 10,
      };
      dispatch(fetchVendorRatingList(params));
    }
  }, [dispatch, vendorId]);

  // Fetch more ratings for infinite scroll
  const fetchMoreRatings = useCallback(
    (page) => {
      if (!vendorId || !vendorRatingsHasMore || isLoadingMore) return;

      setIsLoadingMore(true);
      const params = {
        vendor_id: vendorId,
        page: page,
        per_page: 10,
      };

      dispatch(fetchVendorRatingList(params)).finally(() => {
        setIsLoadingMore(false);
      });
    },
    [dispatch, vendorId, vendorRatingsHasMore, isLoadingMore]
  );

  // Handle infinite scroll
  const handleScroll = useCallback(
    (e) => {
      if (ratingsContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const scrollThreshold = scrollHeight * 0.8;

        if (
          scrollTop + clientHeight >= scrollThreshold &&
          !isLoadingMore &&
          vendorRatingsHasMore &&
          !vendorRatingsLoading
        ) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          fetchMoreRatings(nextPage);
        }
      }
    },
    [
      currentPage,
      isLoadingMore,
      vendorRatingsHasMore,
      vendorRatingsLoading,
      fetchMoreRatings,
    ]
  );

  const ratings = vendorRatings?.data?.vendor || [];
  const totalRatings = vendorRatings?.data?.pagination?.total || 0;

  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Text className="text-white font-bold text-xl">Vendor Ratings</Text>
        <div className="h-2 rounded-full w-2 bg-grayText"></div>
        <div className="bg-[#ff6d001a] px-2 text-primary rounded-lg">
          {totalRatings}
        </div>
      </div>

      {/* Ratings Container */}
      <div
        ref={ratingsContainerRef}
        onScroll={handleScroll}
        // className="overflow-y-auto pr-2"
        // style={{
        //   height: `calc(${containerHeight} - 100px)`,
        //   scrollbarWidth: "thin",
        //   scrollbarColor: "#666 transparent",
        // }}
      >
        {vendorRatingsLoading && currentPage === 1 ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : ratings?.length > 0 ? (
          <>
            {ratings.map((rating) => (
              <VendorRatingCard key={rating.id} {...rating} />
            ))}

            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="w-full flex justify-center items-center py-4">
                <Spin size="default" tip="Loading more ratings..." />
              </div>
            )}

            {/* No more ratings indicator */}
            {!vendorRatingsHasMore && ratings.length > 0 && (
              <div className="text-center py-4">
                <Text className="text-grayText">No more ratings to load</Text>
              </div>
            )}
          </>
        ) : (
          <div className="flex justify-center items-center h-64">
            <Empty
              description={
                <Text className="text-grayText">
                  No ratings found for this vendor
                </Text>
              }
            />
          </div>
        )}
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        div::-webkit-scrollbar {
          width: 6px;
        }

        div::-webkit-scrollbar-track {
          background: transparent;
        }

        div::-webkit-scrollbar-thumb {
          background: #666;
          border-radius: 3px;
        }

        div::-webkit-scrollbar-thumb:hover {
          background: #ff6d00;
        }
      `}</style>
    </div>
  );
};

export default VendorRatingsView;
