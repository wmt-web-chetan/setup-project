import React, { useEffect, useState, useCallback } from 'react'
import {
  Modal,
  Button,
  Row,
  Col,
  Typography,
  Tabs,
  Form,
  message,
  Spin,
} from "antd";
import {
  MessageOutlined,
  UserAddOutlined,
  BellOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import NotificationItem from "./NotificationItem";
import "./notification.scss";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotificationsList, markAllNotificationsAsReadAction } from '../../services/Store/Users/action';
import { useReverb } from "../../utils/useReverb";
import { getStorage } from '../../utils/commonfunction';

const { Text, Title } = Typography;

const NotificationPop = () => {
  const [activeTab, setActiveTab] = useState("all");
  const dispatch = useDispatch();

  const { userForEdit } = useSelector((state) => state?.usersmanagement);
  const { respondFriendRequest } = useSelector((state) => state?.contractProcessor);
  
  // Socket connection for real-time notifications
  const {
    data: notificationData,
    error: notificationError,
    isConnected: notificationisConnected,
  } = useReverb(`userNotification.${userForEdit?.user?.id}`, `.newNotification`);

  const userLoginRole = getStorage("userLoginRole", true);

  console.log('userLoginRole',userLoginRole)

  console.log('notificationData 1212', notificationData);
  console.log('respondFriendRequest 1212', respondFriendRequest);

  // State for notifications and counts
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [generalCount, setGeneralCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const [processingNotifications, setProcessingNotifications] = useState({}); // Track which notifications are being processed
  
  // CRITICAL: Add state to track declined notifications
  const [declinedNotifications, setDeclinedNotifications] = useState(new Set());

  console.log('notifications 1212', notifications);

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

    // Text truncation function (similar to ContractProcessorsTab)
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
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
            {/* <span className="text-white">{notif.sender.name}&nbsp;</span>{" "} */}
            <span className="text-[#6D6D6D]"> 
              {truncateText(notif.message.trim(),80)}.
            </span>
          </>
        ),
        action: notif.type.includes("like") || notif.type.includes("comment") || notif.type.includes("message") ? "Tap to view." : null,
        time: formatTime(notif.created_at),
        is_read: notif.is_read,
        actions: notif.type === "friend_request" ? ["Decline", "Approve"] : null,
        originalData: notif // Keep original data for reference
      }));
  };

  // Function to fetch notifications (only top 5 for popup)
  const fetchNotifications = useCallback(async (type = "all") => {
    try {
      setLoading(true);

      const params = {
        type: type,
        role: userLoginRole?.name,
        page: 1,
        per_page: 5 // Only get top 5 notifications for popup
      };

      const response = await dispatch(fetchNotificationsList(params));

      if (response?.payload?.data) {
        const {
          notifications: newNotifications,
          count,
          unread_count,
          general_count,
          request_count
        } = response.payload.data;

        const transformedNotifications = transformNotificationData(newNotifications);

        setNotifications(transformedNotifications);
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
    }
  }, [dispatch, declinedNotifications]); // Add declinedNotifications as dependency

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

  // Handle new notification from socket
  useEffect(() => {
    if (notificationData && Object.keys(notificationData).length > 0) {
      console.log('New notification received:', notificationData);

      // Check if the notification role matches the current user's role
      // if (notificationData.role !== userLoginRole?.name) {
      //   console.log('Notification role does not match user role, ignoring notification');
      //   console.log('Notification role:', notificationData.role);
      //   console.log('User role:', userLoginRole?.name);
      //   return;
      // }

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
              const originalNotification = prev.find(notification => 
                notification.type === "friend_request" &&
                notification.originalData?.reference?.friend_request_id === notificationData.reference.friend_request_id
              );

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
                return [newNotification, ...updatedNotifications].slice(0, 5);
              }

              return updatedNotifications.slice(0, 5);
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

            // FIXED: Don't increment unread count when replacing friend_request with friend_accept_request
            // The unread count should remain the same since we're replacing, not adding
            console.log("🔄 Replaced friend_request with friend_accept_request - unread count unchanged");
          } else {
            // Normal handling for other notification types
            // Prepend to notifications list and keep only top 5
            setNotifications(prev => [newNotification, ...prev].slice(0, 5));

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
          } else if (notificationData.type === "friend_request") {
            // Only increase request count for new friend_request, not friend_accept_request
            setRequestCount(prev => prev + 1);
          }
        }
      }
    }
  }, [notificationData, notifications, clearProcessingState, declinedNotifications, userLoginRole]);

  // Handle tab change - fetch notifications and update counts from server
  const handleTabChange = useCallback(async (key) => {
    setActiveTab(key);
    
    try {
      const params = {
        type: key,
        role: userLoginRole?.name,
        page: 1,
        per_page: 5
      };

      const response = await dispatch(fetchNotificationsList(params));

      if (response?.payload?.data) {
        const {
          notifications: newNotifications,
          count,
          unread_count,
          general_count,
          request_count
        } = response.payload.data;

        const transformedNotifications = transformNotificationData(newNotifications);

        setNotifications(transformedNotifications);
        // Update all counts from server response
        setTotalCount(count);
        setUnreadCount(unread_count);
        setGeneralCount(general_count);
        setRequestCount(request_count);
      }
    } catch (error) {
      console.log('Error fetching notifications on tab change:', error);
    }
  }, [dispatch, declinedNotifications, userLoginRole]);

  // Initial load
  useEffect(() => {
    fetchNotifications(activeTab);
  }, [fetchNotifications, activeTab]);

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case "Unread":
        return notifications.filter(n => !n.is_read);
      case "General":
        return notifications.filter(n =>
          n.type === "like" ||
          n.type === "comment" ||
          n.type === "chat_message" ||
          n.type === "chatroom_message" ||
          n.type === "chatroom_new_member"
        );
      case "Requests":
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
      case "Unread":
        return unreadCount;
      case "General":
        return generalCount;
      case "Requests":
        return requestCount;
      default:
        return 0;
    }
  };

  // Function to handle mark all as read
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
      key: "Unread",
      label: (
        <div className="py-0 flex gap-2 px-5 text-md items-center p-0">
          <span
            className={`${activeTab === "Unread" ? "text-primary" : "text-[#6D6D6D]"
              }`}
          >
            Unread
          </span>
          <span
            className={`h-5 w-5 text-center py-[1px] justify-center rounded-md !text-[12px] ${activeTab === "Unread"
              ? "bg-primaryOpacity text-primary"
              : "bg-[#373737] text-[#6D6D6D]"
              }`}
          >
            {getTabCount("Unread")}
          </span>
        </div>
      ),
    },
    {
      key: "General",
      label: (
        <div className="py-0 flex gap-2 px-5 text-md items-center p-0">
          <span
            className={`${activeTab === "General" ? "text-primary" : "text-[#6D6D6D]"
              }`}
          >
            General
          </span>
          <span
            className={`h-5 w-5 text-center py-[1px] justify-center rounded-md !text-[12px] ${activeTab === "General"
              ? "bg-primaryOpacity text-primary"
              : "bg-[#373737] text-[#6D6D6D]"
              }`}
          >
            {getTabCount("General")}
          </span>
        </div>
      ),
    },
    {
      key: "Requests",
      label: (
        <div className="py-0 flex gap-2 px-5 text-md items-center p-0">
          <span
            className={`${activeTab === "Requests" ? "text-primary" : "text-[#6D6D6D]"
              }`}
          >
            Requests
          </span>
          <span
            className={`h-5 w-5 text-center py-[1px] justify-center rounded-md !text-[12px] ${activeTab === "Requests"
              ? "bg-primaryOpacity text-primary"
              : "bg-[#373737] text-[#6D6D6D]"
              }`}
          >
            {getTabCount("Requests")}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className=' mx-3 p-5 bg-gray w-auto rounded-lg notbar border border-liteGray'>
      <div className="flex justify-between items-center">
        <span className='text-xl font-bold'>Notifications</span>
        <Button
          type="text"
          className="text-white text-base !mx-[-10px] p-0 pl-2"
          onClick={onClickReadAll}
          loading={markingAllAsRead}
          disabled={markingAllAsRead || unreadCount === 0}
        >
          Mark all as read
          <i className="icon-double-tick !text-2xl !p-0 ml-[-4px] " />
        </Button>
      </div>
      <Form layout="vertical" requiredMark={false} size="large">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          tabBarStyle={{ color: "white", borderBottom: "1px solid #4B5563" }}
          className="custom-tabs mt-4"
        />

        {/* Notification List */}
        <div className="mt-2 space-y-4 pb-3">
          {loading ? (
            <div className="flex justify-center items-center h-20">
              <Spin />
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
                      from='popup'
                      onNotificationAction={handleNotificationAction}
                      onRemoveNotification={removeNotification}
                      isProcessing={processingNotifications[notif.id]}
                    />
                  ))}
                </>
              )}

              {/* Empty state */}
              {!loading && filteredNotifications.length === 0 && (
                <div className="flex flex-col items-center justify-center h-20">
                  <BellOutlined style={{ fontSize: 32, color: '#6D6D6D' }} />
                  <Text className="text-[#6D6D6D] mt-2 text-sm">No notifications found</Text>
                </div>
              )}
            </>
          )}
        </div>

        <hr className="text-liteGray" />
        <Row gutter={16} className="mt-4 py-1.5">
          <Col span={24}>
            <Link to="/notifications">
              <Button
                block
                //  onClick={onCancel}
                className="bg-gray text-white hover:bg-liteGray border-liteGray font-bold"
              >
                View All Activity
              </Button>
            </Link>
          </Col>
        </Row>
      </Form>
    </div>
  )
}

export default NotificationPop