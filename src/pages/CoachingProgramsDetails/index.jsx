import { Col, Row, Typography, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LoadingOutlined } from "@ant-design/icons";
import { fetchCoachingProgramById } from "../../services/Store/CoachingProgram/action";

const { Title, Text } = Typography;

const CoachingProgramsDetails = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");

  // Get coaching program data from Redux store
  const {
    singleCoachingProgram,
    singleCoachingProgramLoading,
    singleCoachingProgramError,
  } = useSelector((state) => state.coachingPrograms);

  const programData = singleCoachingProgram?.data?.coaching_program;
  // console.log("programData", programData);

  // Function to check if detail_page content is empty or contains only empty HTML
  const isDetailPageEmpty = (content) => {
    if (!content) return true;
    
    // Remove HTML tags and check if there's any meaningful content
    const textContent = content
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim(); // Remove leading/trailing spaces
    
    return textContent === '' || textContent.length === 0;
  };

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

  // Fetch coaching program details when component mounts or ID changes
  useEffect(() => {
    if (id) {
      dispatch(fetchCoachingProgramById(id));
    }
  }, [dispatch, id]);

  // Function to get appropriate icon for social media platform
  const getSocialIcon = (url, platform) => {
    if (!url) return null;

    switch (platform) {
      case "website":
        return (
          <i className="icon-website before:!m-0 mr-1 text-primary text-2xl" />
        );
      case "email":
        return <i className="icon-mail text-xl text-primary" />;
      case "instagram":
        return <i className="icon-instagram text-xl text-primary" />;
      case "youtube":
        return <i className="icon-youtube text-xl text-primary" />;
      case "linkedin":
        return <i className="icon-linkedin text-xl text-primary" />;
      case "x":
        return <i className="icon-twitter text-xl text-primary" />;
      default:
        return <i className="icon-link text-xl text-primary" />;
    }
  };

  // Function to render social media links
  const renderSocialLink = (url, platform, label) => {
    if (!url) return null;

    return (
      <div className="flex items-center gap-1 mb-2" key={platform}>
        {getSocialIcon(url, platform)}
        <Link
          to={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#5A76FF] text-sm hover:text-primary transition-colors"
        >
          {url}
        </Link>
      </div>
    );
  };

  if (singleCoachingProgramLoading) {
    return (
      <Row className="bg-darkGray h-full w-full flex flex-col gap-3 sm:gap-6 px-header-wrapper">
        <div className="flex justify-center items-center h-64">
          <Spin
            size="large"
          />
        </div>
      </Row>
    );
  }

  if (singleCoachingProgramError || !programData) {
    return (
      <Row className="bg-darkGray h-full w-full flex flex-col gap-3 sm:gap-6 px-header-wrapper">
        <div className="flex justify-center items-center h-64">
          <Text className="text-red-500">
            Error loading coaching program details. Please try again.
          </Text>
        </div>
      </Row>
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
              to="/coaching-programs"
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Coaching Programs
              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Text className="text-white text-lg sm:text-2xl">
              {programData.name}
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
          <div className="w-full">
            <div
              className="rounded-3xl border overflow-y-auto bg-gray border-solid border-liteGray w-full relative p-4"
              style={{ height: containerHeight }}
            >
              <div>
                <img
                  src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                    programData.thumbnail_img
                  } `}
                  alt={programData.name}
                  className="w-full h-36 rounded-2xl object-cover"
                />
              </div>
              <div className="mt-3">
                <Text className="text-white font-bold text-xl">
                  {programData.name}
                </Text>
              </div>
              <div className="mt-1">
                <Text className="text-grayText text-lg">
                  {programData.academy_name}
                </Text>
              </div>

              {programData.website_url && (
                <div className="flex items-center mt-2">
                  {getSocialIcon(programData.website_url, "website")}
                  <Link
                    to={programData.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#5A76FF] text-sm hover:text-primary transition-colors truncate"
                  >
                    {programData.website_url}
                  </Link>
                </div>
              )}

              <div className="mt-4 mb-4">
                <hr className="border-liteGray my-3" />
              </div>

              {programData.about_us && (
                <>
                  <div className="mt-4 mb-3">
                    <Text className="text-white">About:</Text>
                  </div>
                  <div className="mb-4">
                    <Text className="text-grayText">
                      {programData.about_us}
                    </Text>
                  </div>
                </>
              )}

              <div className="mt-4 mb-3">
                <Text className="text-white">Connect:</Text>
              </div>

              {/* Social Media Links */}
              {renderSocialLink(programData.email, "email", programData.email)}
              {renderSocialLink(
                programData.instagram_url,
                "instagram",
                "Instagram"
              )}
              {renderSocialLink(programData.youtube_url, "youtube", "YouTube")}
              {renderSocialLink(
                programData.linkedin_url,
                "linkedin",
                "LinkedIn"
              )}
              {renderSocialLink(programData.x_url, "x", "X (Twitter)")}
            </div>
          </div>
        </Col>

        {/* Right Side */}
        <Col xs={24} md={14} xl={17} className="h-full mb-4">
          <div className="w-full">
            <div
              className="rounded-3xl border overflow-y-auto bg-gray border-solid border-liteGray w-full relative p-4"
              style={{ height: containerHeight }}
            >
              <div className="text-white h-full">
                {!isDetailPageEmpty(programData.detail_page) ? (
                  <div
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: programData.detail_page,
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="mb-4">
                      <i className="icon-info text-6xl text-grayText opacity-50" />
                    </div>
                    <Text className="text-grayText text-lg mb-2">
                      No details available
                    </Text>
                    <Text className="text-grayText text-sm opacity-75">
                      Program details are not available at the moment.
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Row>
  );
};

export default CoachingProgramsDetails;