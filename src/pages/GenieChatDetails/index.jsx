import { Button, Col, Form, Input, Row, Typography, Dropdown, Modal, Tooltip, Skeleton, Tag, Popover } from 'antd';
import React, { useEffect, useState, useRef } from 'react'
import './/GenieChatDetails.scss'
import { Link, useNavigate, useParams } from 'react-router-dom';
import GeminieVoiceSearchModal from '../../components/AuthLayout/GeminieVoiceSearchModal';
import { FormOutlined, CloseOutlined, ExportOutlined, EllipsisOutlined } from "@ant-design/icons";
import PDFViewerModal from '../../components/AuthLayout/PDFViewerModal';
import RenameChat from './Components/RenameChat';
import DeleteChat from './Components/DeleteChat';
import SelectCategory from './Components/SelectCategory';
import { useDispatch, useSelector } from 'react-redux';
import { createRecommendationAction, fetchChatConversations, fetchChatHistory } from '../../services/Store/Genie/action';
import moment from 'moment';
import HtmlMessage from '../../components/AuthLayout/HtmlMessage';
import genieGIF from '../../assets/AI_Genie.gif'

const GenieChatDetails = () => {
    const { Text, Title } = Typography;

    const param = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        userForEdit
    } = useSelector((state) => state?.usersmanagement);

    const { chatHistory, chatHistoryLoading, recommendationLoading, renamedConversation, deletedConversation } = useSelector((state) => state?.genie);

    console.log('294 detail chatHistory', chatHistory)
    console.log('294 detail deletedConversation', deletedConversation)

    const [form] = Form.useForm();
    const [userQuestion, setUserQuestion] = useState('');
    const [hoveredItem, setHoveredItem] = useState(null);
    const [openVoiceModal, setOpenVoiceModal] = useState(false);
    const [openPDFModal, setOpenPDFModal] = useState(false);
    const [openRenameModal, setOpenRenameModal] = useState(false);
    const [renameChatData, setRenameChatData] = useState(null);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [deleteChatData, setDeleteChatData] = useState(null);
    const [toggleChat, setToggleChat] = useState(false);
    const [openLinkModal, setOpenLinkModal] = useState(false);
    const [linkData, setLinkData] = useState(null);
    const [searchValue, setSearchValue] = useState('');
    const [openCategoryModal, setOpenCategoryModal] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [openViewCategoryModal, setOpenViewCategoryModal] = useState(false);
    const [categoryData, setCategoryData] = useState(null);


    // Pagination state for chat history
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [chatsList, setChatsList] = useState([]);
    const historyContainerRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    // Conversation messages state
    const [conversationData, setConversationData] = useState({
        conversation: {
            // conversation_id: "",
            created_at: "",
            messages: [],
            title: "",
            updated_at: ""
        },
        pagination: {
            currentPage: 1,
            perPage: 5,
            totalPages: 1,
            totalRecords: 0
        }
    });
    const [conversationPage, setConversationPage] = useState(1);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesContainerRef = useRef(null);

    // Fetch chat history
    const fetchHistory = (pageNum = 1, searchTerm = '') => {
        const params = {
            page: pageNum,
            per_page: 18,
            user_id: userForEdit?.user?.id,
            search: searchTerm
        };

        dispatch(fetchChatHistory(params)).then((res) => {
            const conversations = res?.payload?.data?.conversations || [];
            const pagination = res?.payload?.data?.pagination || {};

            // Check if there are more pages to load
            setHasMore(pageNum < pagination.totalPages);

            if (pageNum === 1) {
                // First page - reset chats list
                setChatsList(conversations);
            } else {
                // Append new conversations to existing list, avoiding duplicates
                setChatsList(prevChats => {
                    const existingIds = new Set(prevChats.map(chat => chat.conversation_id));
                    const newChats = conversations.filter(chat => !existingIds.has(chat.conversation_id));
                    return [...prevChats, ...newChats];
                });
            }

            setIsInitialLoad(false);
        }).catch((err) => {
            console.log('error', err);
            setIsInitialLoad(false);
        });
    };

    // Fetch conversation messages with pagination
    const fetchConversationMessages = (pageNum = 1, loadMore = false) => {
        if (!param?.id || !userForEdit?.user?.id) return;

        setLoadingMessages(true);

        const payload = {
            conversation_id: param?.id,
            user_id: userForEdit?.user?.id,
            page: pageNum,
            per_page: 5
        };

        dispatch(fetchChatConversations(payload)).then((res) => {
            const newMessages = res?.payload?.data?.conversation?.messages || [];
            const pagination = res?.payload?.data?.pagination || {};

            // Check if there are more pages to load
            setHasMoreMessages(pageNum < (pagination?.totalPages || 0));

            if (loadMore) {
                // Append new messages to existing ones
                setConversationData(prevData => ({
                    ...prevData,
                    conversation: {
                        ...prevData.conversation,
                        messages: [...newMessages, ...prevData.conversation.messages]
                    },
                    pagination: pagination
                }));
            } else {
                // Replace with new messages
                setConversationData({
                    conversation: res?.payload?.data?.conversation || {
                        conversation_id: "",
                        created_at: "",
                        messages: [],
                        title: "",
                        updated_at: ""
                    },
                    pagination: pagination
                });
            }

            setLoadingMessages(false);
        }).catch((error) => {
            console.log('Get specific chat details error', error);
            setLoadingMessages(false);
        });
    };

    // Update conversation title when renamedConversation changes
    useEffect(() => {
        if (renamedConversation?.data?.conversation?.conversation_id && renamedConversation?.meta?.success) {
            const renamedId = renamedConversation.data.conversation.conversation_id;
            const newTitle = renamedConversation.data.conversation.new_title;

            // Update chats list with the new title
            setChatsList(prevChats =>
                prevChats.map(chat =>
                    chat.conversation_id === renamedId
                        ? { ...chat, title: newTitle }
                        : chat
                )
            );

            // If the current conversation is being renamed, update conversationData too
            if (param?.id === renamedId) {
                setConversationData(prevData => ({
                    ...prevData,
                    conversation: {
                        ...prevData.conversation,
                        title: newTitle
                    }
                }));
            }
        }
    }, [renamedConversation]);

    // Handle chat deletion when deletedConversation changes
    useEffect(() => {
        if (deletedConversation?.data?.conversation?.conversation_id && deletedConversation?.meta?.success) {
            const deletedId = deletedConversation.data.conversation.conversation_id;

            // Remove the deleted chat from the list
            setChatsList(prevChats =>
                prevChats.filter(chat => chat.conversation_id !== deletedId)
            );

            // If the current conversation is being deleted, navigate to the main genie page
            if (param?.id === deletedId) {
                navigate('/ai-genie');
            }
        }
    }, [deletedConversation]);

    // Initial load for chat history
    useEffect(() => {
        if (userForEdit?.user?.id) {
            setIsInitialLoad(true);
            setPage(1);
            setHasMore(true);
            fetchHistory(1, searchValue);
        }
    }, [userForEdit?.user?.id]);

    // Initial load for conversation messages when param.id changes
    useEffect(() => {
        if (param?.id && userForEdit?.user?.id) {
            // Reset state for new conversation
            setConversationPage(1);
            setHasMoreMessages(true);

            // Fetch first page of messages
            fetchConversationMessages(1, false);
        }
    }, [param?.id, userForEdit?.user?.id]);

    // Handle scroll for infinite loading of chat history
    const handleScroll = () => {
        if (!historyContainerRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = historyContainerRef.current;
        const scrollPosition = scrollTop + clientHeight;
        const scrollThreshold = scrollHeight - 100; // Load more when within 100px of bottom

        // Load more when user scrolls near bottom and we're not already loading and there's more to load
        if (scrollPosition >= scrollThreshold && !chatHistoryLoading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchHistory(nextPage, searchValue);
        }
    };

    // Handle scroll for infinite loading of conversation messages
    const handleMessagesScroll = () => {
        if (!messagesContainerRef.current) return;

        const { scrollTop } = messagesContainerRef.current;

        // Load more when user scrolls near top (for older messages)
        if (scrollTop < 50 && !loadingMessages && hasMoreMessages) {
            const nextPage = conversationPage + 1;
            setConversationPage(nextPage);
            fetchConversationMessages(nextPage, true);
        }
    };

    // Set up scroll event listener for chat history with throttling
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

        scrollContainer.addEventListener('scroll', throttledScrollHandler);
        return () => scrollContainer.removeEventListener('scroll', throttledScrollHandler);
    }, [historyContainerRef, chatHistoryLoading, hasMore, page, searchValue]);

    // Set up scroll event listener for conversation messages
    useEffect(() => {
        const scrollContainer = messagesContainerRef.current;
        if (!scrollContainer) return;

        let isScrolling = false;

        const throttledScrollHandler = () => {
            if (!isScrolling) {
                isScrolling = true;
                window.requestAnimationFrame(() => {
                    handleMessagesScroll();
                    isScrolling = false;
                });
            }
        };

        scrollContainer.addEventListener('scroll', throttledScrollHandler);
        return () => scrollContainer.removeEventListener('scroll', throttledScrollHandler);
    }, [messagesContainerRef, loadingMessages, hasMoreMessages, conversationPage]);

    // Scroll to bottom of chat when new messages are added
    useEffect(() => {
        if (messagesContainerRef.current && !loadingMessages) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [conversationData.conversation.messages?.length, loadingMessages]);

    const handleSend = () => {
        if (userQuestion.trim()) {
            // Create new user message object
            const userMessage = {
                content: userQuestion,
                isQuery: true,
                isResponse: false,
                role: "user",
                timestamp: new Date().toUTCString()
            };

            // Add user's message to the conversation immediately
            setConversationData(prevData => ({
                ...prevData,
                conversation: {
                    ...prevData.conversation,
                    messages: [...prevData.conversation.messages, userMessage]
                }
            }));

            const payload = {
                query: userQuestion,
                conversation_id: param?.id,
                user_id: userForEdit?.user?.id,
                user_name: userForEdit?.user?.name,
                category_id: selectedCategories.map(cat => cat.id) // Send category IDs
            };

            dispatch(createRecommendationAction(payload)).then((res) => {
                console.log('new chat res', res?.payload?.data);

                // Get the full conversation data from the response
                const fullConversationData = res?.payload?.data?.conversation;
                
                if (fullConversationData && fullConversationData.messages) {
                    // Find the assistant message (response) from the API
                    const assistantMessage = fullConversationData.messages.find(msg => msg.isResponse === true);
                    
                    console.log('assistantMessage found:', assistantMessage);
                    console.log('assistantMessage sources:', assistantMessage?.sources);

                    if (assistantMessage) {
                        // Add the complete assistant message with all properties including sources
                        setConversationData(prevData => ({
                            ...prevData,
                            conversation: {
                                ...prevData.conversation,
                                conversation_id: fullConversationData.conversation_id || prevData.conversation.conversation_id,
                                messages: [...prevData.conversation.messages, {
                                    ...assistantMessage,
                                    // Ensure sources are preserved
                                    sources: assistantMessage.sources || [],
                                    category_ids: assistantMessage.category_id || assistantMessage.category_ids || []
                                }]
                            }
                        }));
                    }
                }

                // If this is a new conversation, update the URL
                if (!param?.id && res?.payload?.data?.conversation?.conversation_id) {
                    navigate(`/ai-genie/${res?.payload?.data?.conversation?.conversation_id}`);
                }

                // Refresh chat history after sending a message (for new conversations)
                if (!param?.id) {
                    setPage(1);
                    setHasMore(true);
                    fetchHistory(1, searchValue);
                }

                // Clear selected categories after sending
                // setSelectedCategories([]);
            }).catch((error) => {
                console.log('new chat error', error);
            });

            // Clear the input field
            setUserQuestion('');
            form.resetFields();
        }
    };

    const onSearchChatHistory = (e) => {
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
                key: 'rename',
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
                key: 'delete',
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
        setToggleChat(false);
        navigate(`/ai-genie/${id}`);
    };

    const onClickGetLinks = (items) => {
        console.log('items 11', items);
        setOpenLinkModal(true);
        setLinkData(items?.sources);
    }

    const onClickViewCategory = (items) => {
        console.log('items category', items);
        setOpenViewCategoryModal(true);
        // Set the actual category data instead of just category_ids
        setCategoryData(items?.category_ids || items?.category_id || []);
    }


    const handleCancelLinkModal = () => {
        setOpenLinkModal(false);
        setLinkData(null);
    }

    const handleCancelViewCategoryModal = () => {
        setOpenViewCategoryModal(false);
        setCategoryData(null);
    }

    const onClickCategoriesSelect = () => {
        setOpenCategoryModal(true);
    }

    // Handle selected categories from modal
    const handleCategoriesSelected = (categories) => {
        setSelectedCategories(categories);
    };

    // Remove a specific category
    const removeCategory = (categoryId) => {
        setSelectedCategories(prev => prev.filter(cat => cat.id !== categoryId));
    };

    // Render selected categories as tags with single line and more button
    const renderSelectedCategories = () => {
        if (selectedCategories.length === 0) return null;

        const maxVisibleCategories = 3; // Show max 4 categories in the main line
        const visibleCategories = selectedCategories.slice(0, maxVisibleCategories);
        const hiddenCategories = selectedCategories.slice(maxVisibleCategories);

        // Render a single category tag
        const renderCategoryTag = (category, showClose = true) => {
            const backgroundColor = category.isSubcategory
                ? category.parentColor
                : null;
            const starColor = category.isSubcategory
                ? category.color
                : category.color;

            return (
                <Tag
                    key={category.id}
                    className="flex items-center px-3 py-1 rounded-full border-none text-white whitespace-nowrap"
                    closable={showClose}
                    closeIcon={showClose ? <CloseOutlined style={{ color: 'white', fontSize: '12px' }} /> : null}
                    onClose={showClose ? () => removeCategory(category.id) : undefined}
                >
                    <i
                        className="icon-star flex items-center justify-center before:!m-0"
                        style={{
                            color: starColor,
                            fontSize: '20px',
                            marginRight: '6px',
                            padding: '4px',
                            backgroundColor: backgroundColor,
                            borderRadius: '100%'
                        }}
                    />
                    <Text className="text-white" title={category.name?.length >= 20 ? category.name : undefined}>{category.name?.length >= 20
                        ? category.name?.slice(0, 18) + "..."
                        : category.name || ""}</Text>
                </Tag>
            );
        };

        // Render popover content for hidden categories
        const renderPopoverContent = () => (
            <div className="">
                <div className="flex flex-wrap gap-2">
                    {hiddenCategories.map((category) => renderCategoryTag(category, true))}
                </div>
            </div>
        );

        return (
            <div className="mb-8">
                <div className="flex items-center gap-2 overflow-hidden">
                    {/* Visible categories */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {visibleCategories.map((category) => renderCategoryTag(category, true))}
                    </div>

                    {/* More button for hidden categories */}
                    {hiddenCategories.length > 0 && (
                        <Popover
                            content={renderPopoverContent()}
                            title={`${hiddenCategories.length} more categories`}
                            trigger="hover"
                            placement="bottom"
                            overlayClassName="my-pop-genie-category w-[600px] !p-4"
                        >
                            <Tag
                                className="flex items-center px-3 py-1 rounded-full border-none text-white bg-gray-600 hover:bg-gray-500 cursor-pointer whitespace-nowrap"
                            >
                                <EllipsisOutlined style={{ fontSize: '16px', marginRight: '4px' }} />
                                <span className="text-white">+{hiddenCategories.length} more</span>
                            </Tag>
                        </Popover>
                    )}
                </div>
            </div>
        );
    };

    const renderChatHistoryItem = (chat, index) => {
        // Use conversation_id as unique ID or fallback to index
        const itemId = chat.conversation_id || `chat-${index}`;

        return (
            <div
                className={`historyName mt-3 ps-2 pr-2 whitespace-nowrap overflow-hidden text-ellipsis relative  ${param?.id === itemId || hoveredItem === itemId ? '!bg-darkGray z-[99]' : ''} hover:!darkGray hover:!z-[99] `}
                key={itemId}
                onMouseEnter={() => setHoveredItem(itemId)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => onClickChat(chat.conversation_id || itemId)}
            >
                <Text>{chat.title || 'Untitled Conversation'}</Text>
                {hoveredItem === itemId && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-darkGray z-[9999]">
                        <Dropdown
                            menu={{ items: getDropdownItems(chat) }}
                            trigger={['click']}
                        >
                            <button className={`text-white focus:outline-none ${param?.id === itemId || hoveredItem === itemId ? '!bg-transparent ' : ''} `} onClick={(e) => e.stopPropagation()}>
                                <i className="icon-more-options" style={{ fontSize: "18px" }} />
                            </button>
                        </Dropdown>
                    </div>
                )}
            </div>
        );
    };

    const onClickVoicetoText = () => {
        setOpenVoiceModal(true);
    };

    const onClickNewChat = () => {
        navigate(`/ai-genie`);
    };

    const onClickBack = () => {
        setToggleChat(true);
    };

    // Render the history sections
    const renderHistorySections = () => {
        // Show skeleton loader during initial load
        if (isInitialLoad) {
            return (
                <div className="mt-6 text-center">
                    <Text type='secondary'>Loading more chats...</Text>
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
                <div className='history'>
                    <div className='dayBox text-grayText text-sm mt-6'>Chat History</div>
                    {chatsList.map((chat, index) => renderChatHistoryItem(chat, index))}
                </div>

                {chatHistoryLoading && page > 1 && (
                    <div className='text-center mt-4 text-grayText'>
                        Loading more chats...
                    </div>
                )}

                {!hasMore && !chatHistoryLoading && page > 1 && (
                    <div className='text-center mt-4 text-grayText'>
                        No more chat history
                    </div>
                )}
            </>
        );
    };

    return (
        <Row
            className="bg-darkGray px-header-wrapper h-full w-full"
            gutter={[0, 24]}
        >
            <GeminieVoiceSearchModal openVoiceModal={openVoiceModal} setOpenVoiceModal={setOpenVoiceModal} />
            <PDFViewerModal openPDFModal={openPDFModal} setOpenPDFModal={setOpenPDFModal} />
            <RenameChat openRenameModal={openRenameModal} setOpenRenameModal={setOpenRenameModal} renameChatData={renameChatData} setRenameChatData={setRenameChatData} />
            <DeleteChat openDeleteModal={openDeleteModal} setOpenDeleteModal={setOpenDeleteModal} deleteChatData={deleteChatData} setDeleteChatData={setDeleteChatData} />
            <SelectCategory
                openCategoryModal={openCategoryModal}
                setOpenCategoryModal={setOpenCategoryModal}
                onCategoriesSelected={handleCategoriesSelected}
                selectedCategories={selectedCategories}
            />

            <Modal
                title="Attachment Links"
                centered
                destroyOnClose
                open={openLinkModal}
                footer={false}
                width={"40%"}
                onCancel={handleCancelLinkModal}
                closeIcon={
                    <Button
                        shape="circle"
                        icon={<i className="icon-close before:!m-0 text-sm" />}
                    />
                }
            >
                <div className=" border-t-2 border-solid border-[#373737] mt-5">
                    <Row gutter={16} className="">
                        <div className="linkBox w-full pt-5 pb-5">
                            {linkData?.map((item, index) => (
                                <a href={`${item?.file_url}#page=${item?.page}`} target='_blank' className='!mr-3' key={index}>{item?.file} <Text>|</Text> {item?.lender_name
                                }</a>
                            ))
                            }
                        </div>
                        {/* <Col span={12}>
                            <Button block onClick={handleCancelLinkModal} size="large">
                                Cancel
                            </Button>
                        </Col> */}
                        {/* <Col span={12}>
                            <Button
                                block
                                danger
                                type="primary"
                                size="large"
                                onClick={handleConfirmDelete}
                            >
                                Confirm Deletion
                            </Button>
                        </Col> */}
                    </Row>
                </div>
            </Modal>

            <Modal
                title="Category"
                centered
                destroyOnClose
                open={openViewCategoryModal}
                footer={false}
                width={"20%"}
                onCancel={handleCancelViewCategoryModal}
                closeIcon={
                    <Button
                        shape="circle"
                        icon={<i className="icon-close before:!m-0 text-sm" />}
                    />
                }
            >
                <div className="border-t-2 border-solid border-[#373737] mt-5">
                    <Row gutter={16} className="">
                        <div className="categoryBox w-full pt-5 pb-5">
                            {categoryData && categoryData.length > 0 ? (
                                categoryData.map((data, index) => (
                                    <span
                                        className='inline-flex items-center gap-2 mr-4 mb-2 p-3 border border-liteGray rounded-full'
                                        key={index}
                                    >
                                        <i
                                            className="icon-star flex items-center justify-center before:!m-0"
                                            style={{
                                                color: data?.color || '#ffffff', // Fallback color
                                                fontSize: '18px',
                                                borderRadius: '100%'
                                            }}
                                        />
                                        <Text className="text-sm">|</Text>
                                        <Text className="text-sm">{data?.name || 'Unknown Category'}</Text>
                                    </span>
                                ))
                            ) : (
                                <div className="text-center text-grayText">
                                    No categories available
                                </div>
                            )}
                        </div>
                    </Row>
                </div>
            </Modal>

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
                        <Text className="text-white text-lg sm:text-2xl">
                            AI Genie
                        </Text>
                    </Title>
                </div>
            </Col>
            <Col span={24} className="h-full bg-gray rounded-3xl">
                <div className={`w-full`} >
                    <div className="rounded-3xl border overflow-hidden bg-gray border-solid border-liteGray w-full relative">
                        <div
                            className=" overflow-x-hidden py-4 px-4"
                            style={{
                                height: window.innerWidth < 768 ? "calc(100vh - 212px)" : "calc(100vh - 200px)",
                                overflowY: "auto",
                                scrollbarGutter: "stable both-edges",
                            }}
                        >
                            <Row className=" h-full" gutter={[24, 24]}>
                                <Col xs={24} md={24} lg={5} className={` ${toggleChat ? 'block' : 'hidden'} lg:block bg-liteGray rounded-2xl py-4 !ps-4`}>
                                    {/* Right side shadow overlay that hides long text */}
                                    <div
                                        className="shadowRight absolute top-[10%] right-0 bottom-0 pointer-events-none z-10 rounded-3xl"
                                    ></div>
                                    <div
                                        className="shadowBottom absolute left-0 right-0 bottom-0 pointer-events-none z-10 rounded-3xl"
                                    ></div>
                                    <div className='flex'>
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
                                            onChange={onSearchChatHistory}
                                            value={searchValue}
                                            allowClear
                                        />
                                        <Tooltip placement="topLeft" title={<Text className='px-3 py-2 inline-block'>Start New Chat</Text>}>
                                            <FormOutlined style={{ color: "white", fontSize: "26px", fontWeight: "bolder", cursor: "pointer" }} onClick={onClickNewChat} />
                                        </Tooltip>
                                    </div>

                                    <div
                                        className='sidebarHistory overflow-auto relative'
                                        style={{
                                            height: "calc(100% - 50px)",
                                            overflowY: "auto",
                                            maxHeight: "calc(100vh - 320px)",
                                            position: "relative"
                                        }}
                                        ref={historyContainerRef}
                                    >
                                        {/* Bottom shadow overlay */}
                                        {renderHistorySections()}
                                    </div>
                                </Col>
                                <Col xs={24} md={24} lg={19} className={`${!toggleChat ? 'flex' : 'hidden'} lg:flex justify-center items-center !pr-0 relative`}>
                                    <i
                                        className="flex lg:hidden icon-down-arrow rotate-90 items-center justify-center absolute z-50 top-0 left-[-4%]"
                                        style={{ fontSize: "24px" }}
                                        onClick={onClickBack}
                                    />
                                    <div className='w-[95%] lg:w-[75%] h-full'>
                                        <div className=" h-full">
                                            {/* <div
                                                className="shadowBottomForChatArea absolute left-0 right-0 bottom-24 pointer-events-none z-10 rounded-3xl"
                                            ></div> */}
                                            <div
                                                className='chatArea flex flex-col overflow-auto relative pb-8'
                                                style={{
                                                    height: `${selectedCategories.length > 0 ? 'calc(100% - 8rem)' : 'calc(100% - 6rem)'}`,
                                                    maxHeight: `${selectedCategories.length > 0 ? "calc(100vh - 366px)" : "calc(100vh - 320px)"}`,
                                                    overflowY: "auto",
                                                    position: "relative",
                                                }}
                                                ref={messagesContainerRef}
                                            >
                                                {loadingMessages && conversationPage > 1 && (
                                                    <div className='text-center mt-4 text-grayText'>
                                                        Loading more messages...
                                                    </div>
                                                )}

                                                {!hasMoreMessages && conversationPage > 1 && !loadingMessages && (
                                                    <div className='text-center mt-4 text-grayText'>
                                                        Beginning of conversation
                                                    </div>
                                                )}

                                                {conversationData?.conversation?.messages?.map((item, index) => {
                                                    console.log('conversationData in',conversationData)
                                                    console.log('item being rendered:', item);
                                                    console.log('item sources:', item?.sources);
                                                    return (
                                                        item?.isResponse ?
                                                            <div className='flex1' key={`message-${index}`}>
                                                                <div className='pr-3'>
                                                                    <Button
                                                                        type="text"
                                                                        className="border-liteGray custom-gradient flex items-center justify-center p-0"
                                                                        shape="circle"
                                                                        size="large"
                                                                    >
                                                                        <i
                                                                            className="icon-star flex items-center justify-center"
                                                                            style={{ fontSize: "28px" }}
                                                                        />
                                                                    </Button>
                                                                </div>

                                                                {console.log('item', item)}

                                                                {/* <div
                                                                    className="pt-1 htmlMessage"
                                                                    dangerouslySetInnerHTML={{ __html: item?.content }}
                                                                /> */}
                                                                <HtmlMessage content={item?.content} from={'Genie'} />
                                                                <div className='flex items-center'>
                                                                    <div>
                                                                        {
                                                                            item?.sources?.length > 0 ?
                                                                                <Button
                                                                                    // type="primary"
                                                                                    size="large"
                                                                                    onClick={() => onClickGetLinks(item)}
                                                                                    className="rounded-full flex items-center justify-center mt-7 mb-5"
                                                                                    icon={<ExportOutlined />}
                                                                                    iconPosition='end'
                                                                                >
                                                                                    Get Links
                                                                                </Button>
                                                                                : null
                                                                        }
                                                                    </div>
                                                                    <div>

                                                                        {/* {
                                                                            (item?.category_ids?.length > 0 || item?.category_id?.length > 0) ?
                                                                                <Button
                                                                                    // type="primary"
                                                                                    size="large"
                                                                                    onClick={() => onClickViewCategory(item)}
                                                                                    className="rounded-full flex items-center justify-center mt-7 mb-5 ml-3"
                                                                                    icon={<i
                                                                                        className="icon-star flex items-center justify-center before:!m-0"
                                                                                        style={{
                                                                                            // color: 'white',
                                                                                            fontSize: '20px',
                                                                                            // marginRight: '6px',
                                                                                            // padding: '4px',
                                                                                            // backgroundColor: backgroundColor,
                                                                                            borderRadius: '100%'
                                                                                        }}
                                                                                    />}
                                                                                    iconPosition='end'
                                                                                >
                                                                                    View Category
                                                                                </Button>
                                                                                : null
                                                                        } */}
                                                                        {/* {
                                                                            item?.category_ids?.length >= 0 ?

                                                                                <div className='ml-5 flex items-center'>
                                                                                    Category:
                                                                                    {item?.category_ids?.map((data, index) => (
                                                                                        <div className='flex items-center' key={index}>
                                                                                            <i
                                                                                                className="icon-star flex items-center justify-center before:!m-0"
                                                                                                style={{
                                                                                                    color: data?.color,
                                                                                                    fontSize: '20px',
                                                                                                    marginRight: '6px',
                                                                                                    padding: '4px',
                                                                                                    // backgroundColor: backgroundColor,
                                                                                                    borderRadius: '100%'
                                                                                                }}
                                                                                            />
                                                                                            <Text>{data?.name}</Text>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                                : null
                                                                        } */}
                                                                    </div>


                                                                </div>

                                                            </div>
                                                            :
                                                            <div className='flex justify-end p-4 w-fit bg-liteGray self-end my-8 lg:my-14 rounded-l-2xl rounded-tr-2xl' key={`message-${index}`}>
                                                                {item?.content}
                                                            </div>
                                                    )
                                                })}

                                                {
                                                    recommendationLoading ?
                                                        <div className='messageLoading flex mt-12 mb-5'>
                                                            <div className='pr-3'>
                                                                {/* <Button
                                                                    type="text"
                                                                    className="border-liteGray custom-gradient flex items-center justify-center p-0"
                                                                    shape="circle"
                                                                    size="large"
                                                                >
                                                                    <i
                                                                        className="icon-star flex items-center justify-center"
                                                                        style={{ fontSize: "28px" }}
                                                                    />
                                                                </Button> */}
                                                                <img src={genieGIF} height={54} width={54} />
                                                            </div>
                                                            <Skeleton active className='' />
                                                        </div>
                                                        : null
                                                }

                                            </div>

                                            {/* Show selected categories */}
                                            {renderSelectedCategories()}

                                            <div className='chatInput' >
                                                <div className="relative w-full"
                                                    style={{ boxShadow: `${selectedCategories.length > 0 ? 'transparent 11px -20px 20px 20px' : '#1e1e1ea4 11px -20px 20px 20px'}` }}
                                                >
                                                    <Form form={form} requiredMark={false}>
                                                        <Form.Item name="question" className="mb-0">
                                                            <Input
                                                                value={userQuestion}
                                                                onChange={(e) => setUserQuestion(e.target.value)}
                                                                // onPressEnter={handleSend}
                                                                placeholder="Send a message..."
                                                                size="large"
                                                                disabled={recommendationLoading}
                                                                className="rounded-full bg-darkGray w-full pr-[16.5rem] py-4 h-[68px] border-liteGray"
                                                            />
                                                        </Form.Item>
                                                    </Form>
                                                    <Button
                                                        size="large"
                                                        onClick={onClickCategoriesSelect}
                                                        className="absolute right-[6.5rem] top-2 rounded-full flex items-center justify-center border-none hover:!text-white"
                                                        icon={<i
                                                            className="icon-star flex items-center justify-center before:!m-0"
                                                            style={{ fontSize: "24px" }}
                                                        />}
                                                        iconPosition='end'
                                                    >
                                                        Category
                                                    </Button>
                                                    <Button
                                                        type="primary"
                                                        size="large"
                                                        onClick={handleSend}
                                                        className="absolute right-2 top-2 rounded-full flex items-center justify-center"
                                                        disabled={userQuestion?.length < 1 || recommendationLoading || selectedCategories.length <= 0}
                                                    >
                                                        Send
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </div>
                </div>
            </Col>
        </Row>
    );
}

export default GenieChatDetails;