import {
  Button,
  Col,
  Form,
  Input,
  Row,
  Typography,
  Dropdown,
  Modal,
  Tooltip,
  Skeleton,
} from "antd";
import React, { useState, useEffect, useRef } from "react";
import "./GPT.scss";
import { Link, useNavigate } from "react-router-dom";
import GeminieVoiceSearchModal from "../../components/AuthLayout/GeminieVoiceSearchModal";
import { FormOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import genieGIF from "../../assets/AI_Genie.gif";
import {
  createRecommendationActionGPT,
  fetchChatHistoryGPT,
} from "../../services/Store/GPT/action";
import RenameChat from "../GPTDetails/Components/RenameChat";
import DeleteChat from "../GPTDetails/Components/DeleteChat";

const GPT = () => {
  const { Text, Title } = Typography;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [form] = Form.useForm();
  const [userQuestion, setUserQuestion] = useState("");
  const [hoveredItem, setHoveredItem] = useState(null);
  const [openVoiceModal, setOpenVoiceModal] = useState(false);
  const [toggleChat, setToggleChat] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [openRenameModal, setOpenRenameModal] = useState(false);
  const [renameChatData, setRenameChatData] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteChatData, setDeleteChatData] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [chatsList, setChatsList] = useState([]);
  const historyContainerRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const voiceModalRef = useRef(null);

  const { userForEdit } = useSelector((state) => state?.usersmanagement);

  const {
    chatHistory,
    chatHistoryLoading,
    recommendationLoading,
    renamedConversation,
    deletedConversation,
  } = useSelector((state) => state?.gpt);

  // Fetch chat history
  const fetchHistory = (pageNum = 1, searchTerm = "") => {
    const params = {
      page: pageNum,
      per_page: 18,
      user_id: userForEdit?.user?.id,
      search: searchTerm,
    };

    dispatch(fetchChatHistoryGPT(params))
      .then((res) => {
        const conversations = res?.payload?.data?.conversations || [];
        const pagination = res?.payload?.data?.pagination || {};

        // Check if there are more pages to load
        setHasMore(pageNum < pagination.totalPages);

        if (pageNum === 1) {
          // First page - reset chats list
          setChatsList(conversations);
        } else {
          // Append new conversations to existing list, avoiding duplicates
          setChatsList((prevChats) => {
            const existingIds = new Set(
              prevChats.map((chat) => chat.conversation_id)
            );
            const newChats = conversations.filter(
              (chat) => !existingIds.has(chat.conversation_id)
            );
            return [...prevChats, ...newChats];
          });
        }

        setIsInitialLoad(false);
      })
      .catch((err) => {
        console.log("error", err);
        setIsInitialLoad(false);
      });
  };

  // Update conversation title when renamedConversation changes
  useEffect(() => {
    if (
      renamedConversation?.data?.conversation?.conversation_id &&
      renamedConversation?.meta?.success
    ) {
      const renamedId = renamedConversation.data.conversation.conversation_id;
      const newTitle = renamedConversation.data.conversation.new_title;

      // Update chats list with the new title
      setChatsList((prevChats) =>
        prevChats.map((chat) =>
          chat.conversation_id === renamedId
            ? { ...chat, title: newTitle }
            : chat
        )
      );
    }
  }, [renamedConversation]);

  // Handle chat deletion when deletedConversation changes
  useEffect(() => {
    if (
      deletedConversation?.data?.conversation?.conversation_id &&
      deletedConversation?.meta?.success
    ) {
      const deletedId = deletedConversation.data.conversation.conversation_id;

      // Remove the deleted chat from the list
      setChatsList((prevChats) =>
        prevChats.filter((chat) => chat.conversation_id !== deletedId)
      );
    }
  }, [deletedConversation]);

  // Initial load
  useEffect(() => {
    if (userForEdit?.user?.id) {
      setIsInitialLoad(true);
      setPage(1);
      setHasMore(true);
      fetchHistory(1, searchValue);
    }
  }, [userForEdit?.user?.id]);

  // Handle scroll for infinite loading
  const handleScroll = () => {
    if (!historyContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      historyContainerRef.current;
    const scrollPosition = scrollTop + clientHeight;
    const scrollThreshold = scrollHeight - 100; // Load more when within 100px of bottom

    // Load more when user scrolls near bottom and we're not already loading and there's more to load
    if (scrollPosition >= scrollThreshold && !chatHistoryLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHistory(nextPage, searchValue);
    }
  };

  // Set up scroll event listener with throttling
  useEffect(() => {
    const scrollContainer = historyContainerRef.current;
    if (!scrollContainer) return;

    // Use throttled scroll handler to prevent too many calls
    let isScrolling = false;

    const throttledScrollHandler = () => {
      if (!isScrolling) {
        isScrolling = true;
        // Use requestAnimationFrame for better performance
        window.requestAnimationFrame(() => {
          handleScroll();
          isScrolling = false;
        });
      }
    };

    scrollContainer.addEventListener("scroll", throttledScrollHandler);
    return () =>
      scrollContainer.removeEventListener("scroll", throttledScrollHandler);
  }, [historyContainerRef, chatHistoryLoading, hasMore, page, searchValue]);

  const handleSend = () => {
    if (userQuestion.trim()) {
      console.log("User question:", userQuestion);
      // Here you would normally handle the submission logic
      setUserQuestion("");
      form.resetFields();

      const payload = {
        query: userQuestion,
        conversation_id: null,
        user_id: userForEdit?.user?.id,
        user_name: userForEdit?.user?.name,
      };

      dispatch(createRecommendationActionGPT(payload))
        .then((res) => {
          console.log("new chat res", res);
          navigate(`/gpt/${res?.payload.data.conversation.conversation_id}`);

          // Refresh chat history after creating a new chat
          setPage(1);
          setHasMore(true);
          fetchHistory(1, searchValue);
        })
        .catch((error) => {
          console.log("new chat res", error);
        });
    }
  };

  const onSearchChange = (e) => {
    const searchTerm = e.target.value;
    setSearchValue(searchTerm);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Reset pagination when search changes
    setPage(1);
    setHasMore(true);
    setIsInitialLoad(true);

    // Debounce the search to avoid too many API calls
    searchTimeoutRef.current = setTimeout(() => {
      fetchHistory(1, searchTerm);
    }, 300);
  };

  const handleRename = (historyItem) => {
    setOpenRenameModal(true);
    setRenameChatData(historyItem);
  };

  const handleDelete = (historyItem) => {
    setOpenDeleteModal(true);
    setDeleteChatData(historyItem);
  };

  const getDropdownItems = (historyItem) => {
    return [
      {
        key: "rename",
        label: (
          <div
            className="text-white"
            onClick={(e) => {
              e.stopPropagation(); // Stop the event from bubbling up
              handleRename(historyItem);
            }}
          >
            Rename
          </div>
        ),
      },
      {
        key: "delete",
        label: (
          <div
            className="text-error"
            onClick={(e) => {
              e.stopPropagation(); // Stop the event from bubbling up
              handleDelete(historyItem);
            }}
          >
            Delete
          </div>
        ),
      },
    ];
  };

  const onClickChat = (id) => {
    navigate(`/gpt/${id}`);
  };

  const renderHistoryItem = (chat, index) => {
    // Use conversation_id as unique ID or fallback to index
    const itemId = chat.conversation_id || `chat-${index}`;

    return (
      <div
        className={`historyName mt-3 ps-2 pr-2 whitespace-nowrap overflow-hidden text-ellipsis relative ${
          hoveredItem === itemId ? "!bg-darkGray z-[99]" : ""
        }`}
        key={itemId}
        onMouseEnter={() => setHoveredItem(itemId)}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={() => onClickChat(chat.conversation_id || itemId)}
      >
        <Text>{chat.title || "Untitled Conversation"}</Text>
        {hoveredItem === itemId && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-darkGray z-[9999]">
            <Dropdown
              menu={{ items: getDropdownItems(chat) }}
              trigger={["click"]}
              overlayClassName="z-[999999]"
            >
              <button
                className="text-white focus:outline-none bg-transparent"
                onClick={(e) => e.stopPropagation()}
              >
                <i className="icon-more-options" style={{ fontSize: "18px" }} />
              </button>
            </Dropdown>
          </div>
        )}
      </div>
    );
  };

  // Render the history sections
  const renderHistorySections = () => {
    // Show skeleton loader during initial load
    if (isInitialLoad) {
      return (
        <div className="mt-6 text-center">
          <Text type="secondary">Loading more chats...</Text>
        </div>
      );
    }

    // Check if there are any chats
    if (chatsList.length === 0) {
      // Show no results message if search has no results
      if (searchValue) {
        return (
          <div className="text-center mt-6 text-grayText">
            No chat history found for {searchValue}
          </div>
        );
      }

      // Show no chats message if there are no chats at all
      return (
        <div className="text-center mt-6 text-grayText">
          No chat history available
        </div>
      );
    }

    return (
      <>
        <div className="history">
          <div className="dayBox text-grayText text-sm mt-6">Chat History</div>
          {chatsList.map((chat, index) => renderHistoryItem(chat, index))}
        </div>

        {chatHistoryLoading && page > 1 && (
          <div className="text-center mt-4 text-grayText">
            Loading more chats...
          </div>
        )}

        {!hasMore && !chatHistoryLoading && page > 1 && (
          <div className="text-center mt-4 text-grayText">
            No more chat history
          </div>
        )}
      </>
    );
  };

  const commonQuestions = [
    {
      id: 1,
      question: "How do I complete a loan application in Salesforce?",
    },
    {
      id: 2,
      question: "How do I generate reports? Let me guide you step by step.",
    },
    {
      id: 3,
      question: "Looking for the perfect lender? Lets begin!",
    },
    {
      id: 4,
      question: "Enter loan details, and Ill fetch the best options!",
    },
  ];

  const onClickVoicetoText = () => {
    setOpenVoiceModal(true);
    // Reset timer when modal opens
    setTimeout(() => {
      if (voiceModalRef.current && voiceModalRef.current.resetTimer) {
        voiceModalRef.current.resetTimer();
      }
    }, 100); // Small delay to ensure component is mounted
  };

  const onClickNewChat = () => {
    navigate(`/gpt`);
  };

  const onClickBack = () => {
    setToggleChat(true);
  };

  return (
    <Row
      className="bg-darkGray px-header-wrapper h-full w-full"
      gutter={[0, 24]}
    >
      <GeminieVoiceSearchModal
        ref={voiceModalRef}
        openVoiceModal={openVoiceModal}
        setOpenVoiceModal={setOpenVoiceModal}
        from="new"
        handleSend={handleSend}
        setUserQuestion={setUserQuestion}
      />
      <RenameChat
        openRenameModal={openRenameModal}
        setOpenRenameModal={setOpenRenameModal}
        renameChatData={renameChatData}
        setRenameChatData={setRenameChatData}
      />
      <DeleteChat
        openDeleteModal={openDeleteModal}
        setOpenDeleteModal={setOpenDeleteModal}
        deleteChatData={deleteChatData}
        setDeleteChatData={setDeleteChatData}
      />

      <Col
        span={24}
        className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mt-6"
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
            <Text className="text-white text-lg sm:text-2xl">GPT</Text>
          </Title>
        </div>
      </Col>
      <Col span={24} className="h-full bg-gray rounded-3xl">
        <div className={`w-full`}>
          <div className="rounded-3xl border overflow-hidden bg-gray border-solid border-liteGray w-full relative">
            <div
              className=" overflow-x-hidden py-4 px-4"
              style={{
                height:
                  window.innerWidth < 768
                    ? "calc(100vh - 212px)"
                    : "calc(100vh - 200px)",
                overflowY: "auto",
                scrollbarGutter: "stable both-edges",
              }}
            >
              <Row className=" h-full" gutter={[24, 24]}>
                <Col
                  xs={24}
                  md={24}
                  lg={5}
                  className={`${
                    toggleChat ? "block" : "hidden"
                  } lg:block bg-liteGray rounded-2xl py-4 !ps-4`}
                >
                  {/* Right side shadow overlay that hides long text */}
                  <div className="shadowRight absolute top-[10%] right-0 bottom-0 pointer-events-none z-10 rounded-3xl"></div>
                  <div className="shadowBottom absolute left-0 right-0 bottom-0 pointer-events-none z-10 rounded-3xl"></div>
                  <div className="flex">
                    <Input
                      size="large"
                      suffix={
                        <i
                          className="icon-search text-grayText flex items-center justify-center"
                          style={{ fontSize: "28px" }}
                        />
                      }
                      placeholder="Search Chat History"
                      className="bg-gray border-liteGray mr-3"
                      style={{ width: "100%" }}
                      onChange={onSearchChange}
                      value={searchValue}
                      allowClear
                    />
                    <Tooltip
                      placement="topLeft"
                      title={
                        <Text className="px-3 py-2 inline-block">
                          Start New Chat
                        </Text>
                      }
                    >
                      <FormOutlined
                        style={{
                          color: "white",
                          fontSize: "26px",
                          fontWeight: "bolder",
                          cursor: "pointer",
                        }}
                        onClick={onClickNewChat}
                      />
                    </Tooltip>
                  </div>

                  <div
                    className="sidebarHistory overflow-auto relative"
                    style={{
                      height: "calc(100% - 50px)",
                      overflowY: "auto",
                      maxHeight: "calc(100vh - 320px)",
                      position: "relative",
                    }}
                    ref={historyContainerRef}
                  >
                    {/* Bottom shadow overlay */}
                    {renderHistorySections()}
                  </div>
                </Col>
                <Col
                  xs={24}
                  md={24}
                  lg={19}
                  className={`${
                    !toggleChat ? "flex" : "hidden"
                  } lg:flex justify-center items-center !ps-0 lg:ps-2 !pr-0 relative`}
                >
                  <i
                    className="block lg:hidden icon-down-arrow rotate-90 items-center justify-center absolute z-50 top-0 left-[-4%]"
                    style={{ fontSize: "24px" }}
                    onClick={onClickBack}
                  />
                  <div className="w-[95%] lg:w-[75%] my-5 lg:my-0 ">
                    <Row justify="center">
                      <Col
                        xs={24}
                        className="text-center mb-8 flex flex-col items-center"
                      >
                        <Text className="text-white text-xl">
                          Hi, {userForEdit?.user?.name}!
                        </Text>
                        <Text
                          className="text-white text-4xl font-bold mt-2 mb-6"
                          style={{
                            background:
                              "linear-gradient(175deg, #FF6D00 0%, #FF47CC 50%, rgb(91, 58, 236) 100%)",
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          How can GPT help you today?
                        </Text>
                        <Text className="block mx-auto max-w-2xl">
                          Your intelligent assistant for anything related to
                          this platform—searching all internal documents in
                          seconds.
                        </Text>
                      </Col>
                    </Row>

                    {
                      <Row justify="center" className="mb-10 mt-12">
                        <Col xs={24}>
                          <div className="relative w-full">
                            <Form form={form} requiredMark={false}>
                              <Form.Item name="question" className="mb-0">
                                <Input
                                  value={userQuestion}
                                  onChange={(e) =>
                                    setUserQuestion(e.target.value)
                                  }
                                  onPressEnter={handleSend}
                                  placeholder="Send a message..."
                                  size="large"
                                  className="rounded-full bg-darkGray w-full pr-40 py-4 h-[68px] border-liteGray"
                                />
                              </Form.Item>
                            </Form>
                            <i
                              className="icon-voice text-grayText absolute right-[6.5rem] top-5 flex items-center justify-center cursor-pointer"
                              style={{ fontSize: "30px" }}
                              onClick={onClickVoicetoText}
                            />
                            {recommendationLoading ? (
                              <div className="absolute right-2 top-2 w-full flex justify-end mb-10">
                                <img src={genieGIF} height={52} width={52} />
                              </div>
                            ) : (
                              <Button
                                type="primary"
                                size="large"
                                onClick={handleSend}
                                className="absolute right-2 top-2 rounded-full flex items-center justify-center"
                                disabled={
                                  userQuestion?.length < 1 ||
                                  recommendationLoading
                                }
                              >
                                Send
                              </Button>
                            )}
                          </div>
                        </Col>
                      </Row>
                    }

                    {/* {recommendationLoading ? 'Loading...' : null} */}
                    {/* <Row gutter={[16, 16]} className="mt-4">
                                            {commonQuestions.map((item) => (
                                                <Col xs={24} md={12} key={item.id}>
                                                    <Button
                                                        className="w-full h-auto py-4 px-5 bg-liteGrayV1 border border-liteGray hover:!border-liteGray flex justify-start question-button rounded-2xl"
                                                        onClick={() => {
                                                            setUserQuestion(item.question);
                                                            form.setFieldsValue({ question: item.question });
                                                        }}
                                                    >
                                                        <Text className="text-white text-base !text-left overflow-hidden whitespace-nowrap text-ellipsis w-full">{item.question}</Text>
                                                    </Button>
                                                </Col>
                                            ))}
                                        </Row> */}
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default GPT;
