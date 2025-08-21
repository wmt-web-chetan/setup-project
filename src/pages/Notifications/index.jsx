import {
  Modal,
  Button,
  Row,
  Col,
  Typography,
  Upload,
  Form,
  Input,
  message,
  Badge,
  Tabs,
  Spin,
} from "antd";
import {
  BellOutlined,
  InboxOutlined,
  MessageOutlined,
  UserAddOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
// import Title from 'antd/es/skeleton/Title'
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import ShadowBoxContainer from "../../components/AuthLayout/ShadowBoxContainer";
import NotificationItem from "./NotificationItem";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotificationsList, markAllNotificationsAsReadAction } from "../../services/Store/Users/action";
import { useReverb } from "../../utils/useReverb";
import { getStorage } from "../../utils/commonfunction";

const NotificationPage = () => {
  const { Text, Title } = Typography;
  const [activeTab, setActiveTab] = useState("all");
  const dispatch = useDispatch();

  const [containerHeight, setContainerHeight] = useState("calc(100vh - 200px)");
  const [containerHeightInner, setContainerHeightInner] = useState("calc(100vh - 286px)");

  const { userForEdit } = useSelector((state) => state?.usersmanagement);
  const { respondFriendRequest } = useSelector((state) => state?.contractProcessor);

  const {
    data: notificationData,
    error: notificationError,
    isConnected: notificationisConnected,
  } = useReverb(`userNotification.${userForEdit?.user?.id}`, `.newNotification`);

  const userLoginRole = getStorage("userLoginRole", true);

  console.log('notificationData', notificationData);
  console.log('respondFriendRequest', respondFriendRequest);

  // New state for notifications and pagination
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [generalCount, setGeneralCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const [processingNotifications, setProcessingNotifications] = useState({}); // Track which notifications are being processed

  // CRITICAL: Add state to track declined notifications
  const [declinedNotifications, setDeclinedNotifications] = useState(new Set());

  console.log('notifications', notifications);

  useEffect(() => {
    const handleResize = () => {
      setContainerHeight(
        window.innerWidth < 768 ? "calc(100vh - 212px)" : "calc(100vh - 200px)"
      );
      setContainerHeightInner(
        window.innerWidth < 768 ? "calc(100vh - 212px)" : "calc(100vh - 286px)"
      );
    };

    // Set initial height
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Function to get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return <i className="icon-like-filled" />;
      case "comment":
        return <i className="icon-comment" />;
      case "chat_message":
        return <i className="icon-chats" />;
      case "chatroom_message":
        return <i className="icon-chats" />;
      case "chatroom_new_member":
        return <UserAddOutlined className='text-[20px]' />;
      case "friend_request":
        return <i className="icon-profile" />;
      case "friend_accept_request":
        return (
          <div className="relative inline-block">
            <UserAddOutlined className="text-white text-xl" />
            <i className="icon-tick absolute rounded-full bg-[#244430] text-success border border-gray text-xs mt-5 left-3" />
          </div>
        );
      default:
        return <BellOutlined className='text-[20px]' />;
    }
  };

  // Function to format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes < 1 ? "Just now" : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  // Function to transform API data to component format
  const transformNotificationData = (apiNotifications) => {
    return apiNotifications
      .filter(notif => {
        // Filter out declined notifications
        if (declinedNotifications.has(notif.id)) {
          console.log(`🚫 Filtering out declined notification ${notif.id}`);
          return false;
        }
        return true;
      })
      .map(notif => ({
        id: notif.id,
        type: notif.type,
        icon: getNotificationIcon(notif.type),
        content: (
          <>
            {/* <span className="text-white">{notif.sender.name} &nbsp;</span>{" "} */}
            <span className="text-[#6D6D6D]">{notif.message.trim()}.</span>
          </>
        ),
        action: notif.type.includes("like") || notif.type.includes("comment") || notif.type.includes("message") ? "Tap to view." : null,
        time: formatTime(notif.created_at),
        is_read: notif.is_read,
        actions: notif.type === "friend_request" ? ["Decline", "Approve"] : null,
        originalData: notif // Keep original data for reference
      }));
  };

  // Handle notification actions (Accept/Decline/Clear/Declined)
  const handleNotificationAction = useCallback((notificationId, action, friendRequestId) => {
    console.log(`🔧 handleNotificationAction called:`, { notificationId, action, friendRequestId });

    if (action === 'approve') {
      // Set processing state for approve - will be cleared when socket event is received
      setProcessingNotifications(prev => ({
        ...prev,
        [notificationId]: { action: 'approve', friendRequestId }
      }));
    } else if (action === 'decline') {
      // Set processing state for decline
      setProcessingNotifications(prev => ({
        ...prev,
        [notificationId]: { action: 'decline', friendRequestId }
      }));
    } else if (action === 'declined') {
      // CRITICAL: Track this notification as declined to prevent re-adding
      console.log(`🚫 Marking notification ${notificationId} as declined`);
      setDeclinedNotifications(prev => new Set([...prev, notificationId]));

      // Clear processing state
      setProcessingNotifications(prev => {
        const newState = { ...prev };
        delete newState[notificationId];
        return newState;
      });
    } else if (action === 'clear') {
      // Clear processing state for a specific notification
      setProcessingNotifications(prev => {
        const newState = { ...prev };
        delete newState[notificationId];
        return newState;
      });
    }
  }, []);

  // Clear processing state for a notification
  const clearProcessingState = useCallback((notificationId) => {
    setProcessingNotifications(prev => {
      const newState = { ...prev };
      delete newState[notificationId];
      return newState;
    });
  }, []);

  // Remove notification from list (for decline case)
  const removeNotification = useCallback((notificationId) => {
    console.log(`🗑️ removeNotification called for ID: ${notificationId}`);

    // First clear the processing state
    clearProcessingState(notificationId);

    // Then remove the notification from the list
    setNotifications(prev => {
      console.log(`🗑️ Before removal - notifications count: ${prev.length}`);
      const removedNotification = prev.find(n => n.id === notificationId);
      const filtered = prev.filter(n => n.id !== notificationId);
      console.log(`🗑️ After removal - notifications count: ${filtered.length}`);

      // Update unread count if the removed notification was unread
      if (removedNotification && !removedNotification.is_read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }

      return filtered;
    });

    // Update counts
    setTotalCount(prev => Math.max(0, prev - 1));
    setRequestCount(prev => Math.max(0, prev - 1));
  }, [clearProcessingState]);

  // Function to fetch notifications
  const fetchNotifications = useCallback(async (page = 1, type = "all", reset = false) => {
    try {
      if (page === 1) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const params = {
        type: type,
        role: userLoginRole?.name,
        page: page,
        per_page: 14
      };

      const response = await dispatch(fetchNotificationsList(params));

      if (response?.payload?.data) {
        const { notifications: newNotifications, count, current_page, last_page, unread_count, general_count, request_count } = response.payload.data;

        const transformedNotifications = transformNotificationData(newNotifications);

        if (reset || page === 1) {
          setNotifications(transformedNotifications);
        } else {
          setNotifications(prev => [...prev, ...transformedNotifications]);
        }

        setCurrentPage(current_page);
        setHasMore(current_page < last_page);
        setTotalCount(count);
        setUnreadCount(unread_count);
        setGeneralCount(general_count);
        setRequestCount(request_count);
      }
    } catch (error) {
      console.log('Error fetching notifications:', error);
      message.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [dispatch, declinedNotifications]); // Add declinedNotifications as dependency

  // Handle new notification from socket
  useEffect(() => {
    if (notificationData && Object.keys(notificationData).length > 0) {
      console.log('New notification received:', notificationData);

      // Check if this notification was declined
      if (declinedNotifications.has(notificationData.id)) {
        console.log(`🚫 Ignoring declined notification ${notificationData.id}`);
        return;
      }

      // Check if notification already exists to avoid duplicates
      const existingNotification = notifications.find(n => n.id === notificationData.id);
      if (!existingNotification) {
        // Transform the new notification data
        const transformedNewNotification = transformNotificationData([notificationData]);

        if (transformedNewNotification.length > 0) {
          const newNotification = transformedNewNotification[0];

          // Special handling for friend_accept_request - replace the original friend_request
          if (notificationData.type === "friend_accept_request" && notificationData.reference?.friend_request_id) {
            setNotifications(prev => {
              // Find the original friend_request notification to replace
              const updatedNotifications = prev.map(notification => {
                // Check if this is the friend_request we want to replace
                if (notification.type === "friend_request" &&
                  notification.originalData?.reference?.friend_request_id === notificationData.reference.friend_request_id) {
                  // Clear processing state for this notification
                  clearProcessingState(notification.id);
                  return newNotification; // Replace with the new friend_accept_request
                }
                return notification;
              });

              // If we didn't find the original friend_request to replace, just add the new notification
              const wasReplaced = updatedNotifications.some(n => n.id === newNotification.id);
              if (!wasReplaced) {
                return [newNotification, ...updatedNotifications];
              }

              return updatedNotifications;
            });

            // Clear any processing state for notifications with this friend_request_id
            setProcessingNotifications(prev => {
              const newState = { ...prev };
              Object.keys(newState).forEach(key => {
                if (newState[key].friendRequestId === notificationData.reference.friend_request_id) {
                  delete newState[key];
                }
              });
              return newState;
            });

            // Don't increment total count since we're replacing, not adding
            // But update unread count if the new notification is unread
            if (!notificationData.is_read) {
              setUnreadCount(prev => prev + 1);
            }
          } else {
            // Normal handling for other notification types
            // Prepend to notifications list
            setNotifications(prev => [newNotification, ...prev]);

            // Update counts
            setTotalCount(prev => prev + 1);

            // Update unread count if the new notification is unread
            if (!notificationData.is_read) {
              setUnreadCount(prev => prev + 1);
            }
          }

          // Update specific category counts based on notification type
          if (notificationData.type === "like" ||
            notificationData.type === "comment" ||
            notificationData.type === "chat_message" ||
            notificationData.type === "chatroom_message" ||
            notificationData.type === "chatroom_new_member") {
            setGeneralCount(prev => prev + 1);
          } else if (notificationData.type === "friend_request" ||
            notificationData.type === "friend_accept_request") {
            // For friend_accept_request, we don't increase request count since it's replacing a friend_request
            if (notificationData.type === "friend_request") {
              setRequestCount(prev => prev + 1);
            }
          }
        }
      }
    }
  }, [notificationData, notifications, clearProcessingState, declinedNotifications]);

  // Initial load
  useEffect(() => {
    fetchNotifications(1, activeTab, true);
  }, [fetchNotifications, activeTab]);

  // Function to handle scroll for infinite loading
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    if (scrollHeight - scrollTop <= clientHeight + 5) {
      if (!loading && hasMore) {
        fetchNotifications(currentPage + 1, activeTab, false);
      }
    }
  }, [loading, hasMore, currentPage, activeTab, fetchNotifications]);

  // Function to handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
    setCurrentPage(1);
    setHasMore(true);
  };

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case "unread":
        return notifications.filter(n => !n.is_read);
      case "general":
        return notifications.filter(n =>
          n.type === "like" ||
          n.type === "comment" ||
          n.type === "chat_message" ||
          n.type === "chatroom_message" ||
          n.type === "chatroom_new_member"
        );
      case "requests":
        return notifications.filter(n =>
          n.type === "friend_request" ||
          n.type === "friend_accept_request"
        );
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  // Function to get count for each tab
  const getTabCount = (tabKey) => {
    switch (tabKey) {
      case "all":
        return totalCount;
      case "unread":
        return unreadCount;
      case "general":
        return generalCount;
      case "requests":
        return requestCount;
      default:
        return 0;
    }
  };

  const tabItems = [
    {
      key: "all",
      label: (
        <div className="py-0 flex gap-2 px-7 text-md items-center p-0">
          <span
            className={`${activeTab === "all" ? "text-primary" : "text-[#6D6D6D]"
              }`}
          >
            All
          </span>
          <span
            className={`h-5 w-5 text-center py-[1px] justify-center rounded-md !text-[12px] ${activeTab === "all"
              ? "bg-primaryOpacity text-primary"
              : "bg-[#373737] text-[#6D6D6D]"
              }`}
          >
            {getTabCount("all")}
          </span>
        </div>
      ),
    },
    {
      key: "unread",
      label: (
        <div className="py-0 flex gap-2 px-5 text-md items-center p-0">
          <span
            className={`${activeTab === "unread" ? "text-primary" : "text-[#6D6D6D]"
              }`}
          >
            Unread
          </span>
          <span
            className={`h-5 w-5 text-center py-[1px] justify-center rounded-md !text-[12px] ${activeTab === "unread"
              ? "bg-primaryOpacity text-primary"
              : "bg-[#373737] text-[#6D6D6D]"
              }`}
          >
            {getTabCount("unread")}
          </span>
        </div>
      ),
    },
    {
      key: "general",
      label: (
        <div className="py-0 flex gap-2 px-5 text-md items-center p-0">
          <span
            className={`${activeTab === "general" ? "text-primary" : "text-[#6D6D6D]"
              }`}
          >
            General
          </span>
          <span
            className={`h-5 w-5 text-center py-[1px] justify-center rounded-md !text-[12px] ${activeTab === "general"
              ? "bg-primaryOpacity text-primary"
              : "bg-[#373737] text-[#6D6D6D]"
              }`}
          >
            {getTabCount("general")}
          </span>
        </div>
      ),
    },
    {
      key: "requests",
      label: (
        <div className="py-0 flex gap-2 px-5 text-md items-center p-0">
          <span
            className={`${activeTab === "requests" ? "text-primary" : "text-[#6D6D6D]"
              }`}
          >
            Requests
          </span>
          <span
            className={`h-5 w-5 text-center py-[1px] justify-center rounded-md !text-[12px] ${activeTab === "requests"
              ? "bg-primaryOpacity text-primary"
              : "bg-[#373737] text-[#6D6D6D]"
              }`}
          >
            {getTabCount("requests")}
          </span>
        </div>
      ),
    },
  ];

  const onClickReadAll = async () => {
    console.log('onClickReadAll');

    setMarkingAllAsRead(true);

    try {
      const response = await dispatch(markAllNotificationsAsReadAction());
      console.log('Mark All read response', response);

      if (response?.payload || response?.type?.includes('fulfilled')) {
        // Update all notifications to mark them as read in local state
        setNotifications(prevNotifications =>
          prevNotifications.map(notification => ({
            ...notification,
            is_read: true
          }))
        );

        // Set unread count to 0 since all notifications are now read
        setUnreadCount(0);
      }
    } catch (error) {
      console.log('Error: ', error);
    } finally {
      setMarkingAllAsRead(false);
    }
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
              <Text className="text-white text-lg sm:text-2xl">
                Notifications
              </Text>
            </Link>
          </Title>
        </div>
      </Col>

      <div className={`w-full rounded-3xl border bg-gray border-solid border-liteGray h-${containerHeight}`} style={{ height: containerHeight }}>
        <Form layout="vertical" requiredMark={false} size="large" className="relative">
          <Button
            type="text"
            className="absolute text-white text-base !mx-[-10px] p-0 pl-2 right-[1%] top-[0%] z-10 !hover:bg-transparent"
            onClick={onClickReadAll}
            size="middle"
            loading={markingAllAsRead}
            disabled={markingAllAsRead || unreadCount === 0}
          >
            Mark all as read
            <i className="icon-double-tick !text-2xl !p-0 ml-[-4px] " />
          </Button>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={tabItems}
            tabBarStyle={{ color: "white", borderBottom: "1px solid #4B5563" }}
            className="custom-tabs mt-4"
          />

          {/* Notification List */}
          <div
            className={`space-y-4 px-6 !overflow-y-auto !h-${containerHeightInner}`}
            style={{ height: containerHeightInner }}
            onScroll={handleScroll}
          >
            {initialLoading ? (
              <div className="flex justify-center items-center h-32">
                <Spin size="large" />
              </div>
            ) : (
              <>
                {filteredNotifications.length > 0 && (
                  <>
                    {/* <h3 className="text-md text-[#6D6D6D]">Today</h3> */}
                    {filteredNotifications.map((notif, index) => (
                      <NotificationItem
                        key={`${notif.id}-${index}`}
                        {...notif}
                        from='page'
                        onNotificationAction={handleNotificationAction}
                        onRemoveNotification={removeNotification}
                        isProcessing={processingNotifications[notif.id]}
                      />
                    ))}

                    {/* Loading indicator for infinite scroll */}
                    {loading && (
                      <div className="flex justify-center py-4">
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 16, color: '#primary' }} spin />} />
                      </div>
                    )}

                    {/* End of list indicator */}
                    {/* {!hasMore && filteredNotifications.length > 0 && (
                      <div className="text-center py-4">
                        <Text className="text-[#6D6D6D] text-sm">No More Notifications</Text>
                      </div>
                    )} */}
                  </>
                )}

                {/* Empty state */}
                {!initialLoading && filteredNotifications.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-[56vh]">
                    <BellOutlined style={{ fontSize: 48, color: '#6D6D6D' }} />
                    <Text className="text-[#6D6D6D] mt-2">No Notifications Found</Text>
                  </div>
                )}
              </>
            )}
          </div>
        </Form>
      </div>
    </Row>
  );
};

export default NotificationPage;