import { Button, Col, Input, Row, Typography, Spin, Empty } from "antd";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ShadowBoxContainer from "../../components/AuthLayout/ShadowBoxContainer";
import { SearchOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { fetchArticleFileById } from "../../services/Store/Support/action";

const ArticleDetails = () => {
  const { Text, Title } = Typography;
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(false);
  const [articleData, setArticleData] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();

  console.log('Article Id: ', id);

  const handleClick = (id) => {
    navigate(`/support/salesforce/video`);
  };

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  // Get file icon based on extension
  const getFileIcon = (extension, type) => {
    if (type === 'image') return 'icon-photo';
    if (extension === 'pdf') return 'icon-pdf';
    if (extension === 'docx' || extension === 'doc') return 'icon-documents';
    return 'icon-documents';
  };

  useEffect(() => {
    if (id) {
      setLoading(true);

      console.log('api called article')

      dispatch(fetchArticleFileById(id)).then((res) => {
        console.log('Article Detail response', res?.payload);
        if (res?.payload?.meta?.success) {
          setArticleData(res.payload.data);
        }
        setLoading(false);
      }).catch((error) => {
        console.error('Error fetching article:', error);
        setLoading(false);
      });
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, [id, dispatch]);

  const scrollableContentStyle = {
    overflowY: "auto",
    scrollbarWidth: "none", // Firefox
    msOverflowStyle: "none", // IE and Edge
  };


  return (
    <Row
      className="bg-darkGray px-header-wrapper h-full w-full"
      gutter={[0, 24]}
    >
      <Col
        span={24}
        className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mt-6"
      >
        <div className="flex justify-center items-center">
          <Title
            level={2}
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
              to="/support"
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Support
              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Link
              to={`/support/${articleData?.category?.id}`}
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                {articleData?.category?.name}
              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            {/* <Link
              to="/support"
              className="text-primary hover:text-primary flex justify-center"
            > */}
            <Text className="text-white text-lg sm:text-2xl">
              {loading ? null : articleData?.article?.title}
            </Text>
            {/* </Link> */}
          </Title>
        </div>
      </Col>

      <Row
        className="w-full"
        gutter={[
          { xs: 0, sm: 16 },
          { xs: 0, sm: 16 },
        ]}
      >
        <Col sm={24} md={14} xl={16} className="mb-4">
          <div className="w-full">
            <div
              className="rounded-3xl border overflow-hidden bg-gray border-solid border-liteGray w-full relative p-4 px-5"
              style={{
                height: containerHeight,
                ...scrollableContentStyle,
              }}
            >
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Spin size="large" />
                </div>
              ) : (
                <div className="px-3">
                  <div className=" mt-3 !text-lg flex flex-col">
                    <div className="font-bold text-white text-xl">
                      {articleData?.article?.title || "Article Title"}
                    </div>
                    <div className=" !text-sm mt-2">
                      {articleData?.article?.created_at
                        ? formatDate(articleData.article.created_at)
                        : "Date not available"
                      }
                    </div>
                  </div>
                  <div className="mt-6">
                    {articleData?.files?.filter(file => file.type === 'image').map((imageFile, index) => (
                      <img
                        key={`${import.meta.env.VITE_IMAGE_BASE_URL}/${imageFile.id}`}
                        src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${imageFile.preview_url}`}
                        alt={imageFile.name || `Image ${index + 1}`}
                        className=" mb-4"
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-5 text-xl">
                    <div>Attachments</div>
                    <div className="h-1.5 rounded-full w-1.5 bg-grayText"> </div>
                    <div className="bg-primaryOpacity px-2 py-0.5 text-primary rounded-lg font-bold !text-sm">
                      {articleData?.Attachments?.total_files || 0}
                    </div>
                  </div>

                  <div className="gap-3 justify-center grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3  2xl:grid-cols-4 3xl:grid-cols-5">
                    {articleData?.files?.length > 0 ? (
                      articleData.files.map((file, index) => (
                        console.log('file', file),
                        <Link
                          key={file.id || index}
                          className="flex items-center bg-darkGray rounded-2xl p-4 mb-2 border border-[#373737] mt-5 !w-auto"
                          to={`${import.meta.env.VITE_IMAGE_BASE_URL}/${file.preview_url}`}
                          target="_blank"
                        // onClick={()=>onClickAttachments(file)}
                        >
                          {/* Icon container */}
                          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-md bg-[#FF6D0033] mr-3">
                            <i className={`${getFileIcon(file.extension, file.type)} text-3xl text-primary`} />
                          </div>

                          {/* Text container */}
                          <div className="flex-grow min-w-0 mr-2">
                            <Text className="text-white text-sm block truncate w-full">
                              {file.name || `File.${file.extension}`}
                            </Text>
                            <Text className="text-grayText text-xs">{file.size}</Text>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="col-span-full text-center text-grayText mt-5">
                        No attachments available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Col>

        <Col sm={24} md={10} xl={8} className=" mb-4">
          <div className="w-full">
            <div
              className="rounded-3xl border hide-scrollbar bg-gray border-solid border-liteGray w-full relative p-4  "
              style={{
                height: isMobile ? "auto" : containerHeight,
                ...scrollableContentStyle,
              }}
            >
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Spin size="large" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mt-4 !text-xl">
                    <div>Articles</div>
                    <div className="h-1.5 rounded-full w-1.5 bg-grayText"> </div>
                    <div className="bg-primaryOpacity px-2 py-0.5 text-primary rounded-lg font-bold !text-sm">
                      {articleData?.articles?.count || 0}
                    </div>
                  </div>

                  <div className="mt-5 !text-md">
                    <div className="flex flex-col gap-0 sm:gap-1.5 ">
                      {articleData?.articles?.data?.length > 0 ? (
                        articleData.articles.data.map((article, index) => (
                          <Link key={article.id || index} to={`/support/article/${article.id}`} className="flex items-start gap-2 sm:gap-0 mt-2 hover:text-white hover:opacity-70">
                            <i className="demo-icon icon-documents !text-2xl sm:text-2xl text-primary flex-shrink-0 !mt-[-4px] sm:mt-0">
                            </i>
                            <div className="flex flex-row flex-wrap items-center gap-1 sm:gap-1">
                              <p>{article.title}</p>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="text-center text-grayText h-[50vh] flex justify-center items-center">
                          <Empty description="No Articles Available" />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Row>
  );
};

export default ArticleDetails;