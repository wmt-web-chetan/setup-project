import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Row,
  Col,
  Tabs,
  Input,
  Avatar,
  Typography,
  Button,
  Divider,
  Badge,
  Spin,
} from "antd";
import {
  SearchOutlined,
  LoadingOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import "./Chat.scss";

// Import ChatWindow component
import ChatWindow from "./ChatWindow";
import {
  fetchChatList,
  fetchChatRoomList,
  fetchUserChatTable,
} from "../../../../services/Store/Chat/action";
import { useDispatch, useSelector } from "react-redux";
import { useReverb } from "../../../../utils/useReverb";
import { useLocation } from "react-router-dom";

const { Text } = Typography;
const { TabPane } = Tabs;

const Chat = () => {
  // State variables for chat data
  const [apiChatList, setApiChatList] = useState([]);
  const [apiChatRooms, setApiChatRooms] = useState([]);
  const [paginationInfo, setPaginationInfo] = useState({
    totalRecords: 0,
    currentPage: 1,
    perPage: 10,
    totalPage: 1,
  });
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [currentChatMessages, setCurrentChatMessages] = useState([]);
  const [groupChatMessages, setGroupChatMessages] = useState([]);
  const [liveMeetings, setLiveMeetings] = useState([]);
  const { userForEdit } = useSelector((state) => state?.usersmanagement);
  // console.log("qq userForEdit", userForEdit);
  const location = useLocation();

  // console.log("location", location?.state);

  // New state to track which notification has been processed (by ID)
  const [processedNotificationId, setProcessedNotificationId] = useState(null);

  // State to track if we need to select a chat/chatroom after API refresh
  const [pendingChatroomSelection, setPendingChatroomSelection] =
    useState(null);
  const [pendingChatSelection, setPendingChatSelection] = useState(null);

  const {
    data: userListUpdate,
    error: userListUpdateError,
    isConnected: userListUpdateisConnected,
  } = useReverb(`user.${userForEdit?.user?.id}`, `.chatListUpdated`);

  const {
    data: userActivityUpdate,
    error: userActivityUpdateError,
    isConnected: userActivityUpdateisConnected,
  } = useReverb(`user-status.${userForEdit?.user?.id}`, `.userActivity`);

  const {
    data: userActivityUpdate1,
    error: userActivityUpdateError1,
    isConnected: userActivityUpdateisConnected1,
  } = useReverb(`all-users-status`, `.userActivity`);

  const {
    data: liveMeetingData,
    error: liveMeetingDataError,
    isConnected: liveMeetingDataisConnected,
  } = useReverb("live-meetings", ".LiveMeetingsUpdated");

  // console.log("oo userActivityUpdate", userActivityUpdate);
  // console.log("oo userActivityUpdate 1", userActivityUpdate1);
  // console.log("liveMeetingData", liveMeetingData);

  // New useEffect to update the chat list when new messages come in
  useEffect(() => {
    // console.log("qq userListUpdate", userListUpdate);
    // console.log("qq apiChatList", apiChatList);

    // Check if userListUpdate contains valid data
    if (userListUpdate && userListUpdate.chat_list) {
      const updatedChat = userListUpdate.chat_list;

      // console.log("oo updatedChat", updatedChat);

      // Check if this is a group chat update
      if (updatedChat.is_group) {
        // Format the updated chat room to match the apiChatRooms structure
        const formattedChatRoom = {
          id: updatedChat.chat_room_id || updatedChat.id,
          name: updatedChat.name,
          message: updatedChat.latest_message,
          time: formatChatTime(updatedChat.created_at),
          unread: parseInt(updatedChat.unread_count) || 0,
          avatar: updatedChat.profile_photo_path,
          totalMembers: updatedChat.participants_count || 0,
          activeMembers: 0, // Default value as not provided in the update
          members: [], // Empty members array as not provided in the update
          meeting_link: updatedChat.meeting_link,
        };

        // Update the apiChatRooms
        setApiChatRooms((prevRooms) => {
          // Check if the room already exists in the list
          const existingIndex = prevRooms.findIndex(
            (room) => room.id === formattedChatRoom.id
          );

          // Create a new array to avoid mutating state directly
          const newRooms = [...prevRooms];

          if (existingIndex !== -1) {
            // Remove the existing room
            newRooms.splice(existingIndex, 1);
          }

          // Add the updated room to the beginning of the array
          return [formattedChatRoom, ...newRooms];
        });
      } else {
        // This is a one-to-one chat update
        // Format the updated chat to match the apiChatList structure
        // console.log("updatehcat",updatedChat)
        const formattedChat = {
          id: updatedChat.user_id,
          name: updatedChat.name,
          message: updatedChat.latest_message,
          time: formatChatTime(updatedChat.created_at),
          unread: parseInt(updatedChat.unread_count) || 0,
          isOnline: updatedChat.is_user_active,
          avatar: updatedChat.profile_photo_path,
          chatId: updatedChat.chat_id,
          userRole: updatedChat?.role_name,
        };

        // Update the apiChatList
        setApiChatList((prevList) => {
          // Check if the user already exists in the list
          const existingIndex = prevList.findIndex(
            (chat) => chat.id === formattedChat.id
          );

          // Create a new array to avoid mutating state directly
          const newList = [...prevList];

          if (existingIndex !== -1) {
            // Remove the existing chat
            newList.splice(existingIndex, 1);
          }

          // Add the updated chat to the beginning of the array
          return [formattedChat, ...newList];
        });
      }
    }
  }, [userListUpdate]);

  // New useEffect to update user active status when userActivityUpdate1 changes
  useEffect(() => {
    // Check if userActivityUpdate1 contains valid data
    if (userActivityUpdate1 && userActivityUpdate1.user_id) {
      // console.log("Online status update received:", userActivityUpdate1);

      // Update the apiChatList with the new active status
      setApiChatList((prevList) => {
        // Find the index of the chat with the matching user_id
        const existingIndex = prevList.findIndex(
          (chat) => chat.id === userActivityUpdate1.user_id
        );

        // If the user is not in the list, no update needed
        if (existingIndex === -1) {
          return prevList;
        }

        // Create a new array to avoid mutating state directly
        const newList = [...prevList];

        // Update only the isOnline status for the matching chat
        newList[existingIndex] = {
          ...newList[existingIndex],
          isOnline: userActivityUpdate1.is_user_active,
        };

        return newList;
      });
    }
  }, [userActivityUpdate1]);

  // Function to check if a meeting is currently live
  const isMeetingLive = useCallback((meeting) => {
    const now = new Date();
    const startTime = new Date(meeting.start_time);
    const endTime = new Date(meeting.end_time);

    return now >= startTime && now <= endTime;
  }, []);

  // Function to format meetings data for the UI
  const formatMeetingsForUI = useCallback((meetings) => {
    if (!meetings || !Array.isArray(meetings)) return [];

    return meetings?.map((meeting) => ({
      id: meeting.id,
      name: meeting.title,
      zoom_join_url: meeting.zoom_join_url,
      zoom_meeting_id: meeting.zoom_meeting_id,
      start_time: meeting.start_time,
      end_time: meeting.end_time,
      participants: meeting.participants.map((participant) => ({
        id: participant.id,
        name: participant.name,
        avatar: participant.profile_photo_path,
      })),
    }));
  }, []);

  const dispatch = useDispatch();

  // State variables
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showContactList, setShowContactList] = useState(true);
  const [showNewContacts, setShowNewContacts] = useState(false);
  const [showLiveMeeting, setShowLiveMeeting] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [userConnections, setUserConnections] = useState([]);

  // Ref for the contacts list container for infinite scrolling
  const contactsListRef = useRef(null);
  const isLoadingMore = useRef(false); // Ref to prevent multiple load more requests

  // Improved notification handling function
  const handleNotificationNavigation = useCallback(() => {
    // console.log("location?.state?.originalData", location?.state?.originalData);
    if (!location?.state?.originalData) {
      return;
    }

    const notificationData = location.state.originalData;
    const currentNotificationId = notificationData.id;

    // Check if this notification has already been processed
    if (processedNotificationId === currentNotificationId) {
      return;
    }

    // console.log("Processing notification data:", notificationData);

    // Mark this notification as processed
    setProcessedNotificationId(currentNotificationId);

    if (notificationData.type === "chatroom_message") {
      // Handle chatroom message notification
      const chatRoomId = notificationData.reference?.chat_room_id;
      const chatRoomName = notificationData.reference?.chatroom_name;

      // console.log("Processing chatroom notification for ID:", chatRoomId);

      if (chatRoomId) {
        // Switch to chatRoom tab immediately
        setActiveTab("chatRoom");

        // Set pending chatroom selection - this will trigger the effect to handle selection
        setPendingChatroomSelection({
          id: chatRoomId,
          name: chatRoomName || "Chat Room",
          message: notificationData.message || "",
          time: formatChatTime(notificationData.created_at),
          sender: notificationData.sender,
          needsRefresh: true, // Flag to indicate we need to refresh data
        });
      }
    } else if (notificationData.type === "chat_message") {
      // Handle direct chat message notification
      const senderId = notificationData.sender?.id;
      const senderName = notificationData.sender?.name;
      const senderAvatar = notificationData.sender?.profile_photo_path;

      // console.log("Processing chat notification for user ID:", senderId);

      if (senderId) {
        // Switch to chat tab immediately
        setActiveTab("chat");

        // Set pending chat selection - this will trigger the effect to handle selection
        setPendingChatSelection({
          id: senderId,
          name: senderName || "User",
          message: notificationData.message || "",
          time: formatChatTime(notificationData.created_at),
          avatar: senderAvatar,
          chatId: notificationData.reference?.chat_id,
          role: notificationData.sender?.role,
          needsRefresh: true, // Flag to indicate we need to refresh data
        });
      }
    }
  }, [location?.state, processedNotificationId]);

  // New effect to process notification immediately when it arrives
  useEffect(() => {
    if (
      location?.state?.originalData &&
      processedNotificationId !== location.state.originalData.id
    ) {
      // console.log("New notification detected, processing...");
      // Process notification immediately, don't wait for lists to be loaded
      setTimeout(() => {
        handleNotificationNavigation();
      }, 100);
    }
  }, [location?.state, handleNotificationNavigation, processedNotificationId]);

  // Effect to reset processed notification ID when location state changes
  useEffect(() => {
    // If there's no notification data in location state, reset the processed ID
    if (!location?.state?.originalData) {
      setProcessedNotificationId(null);
      setPendingChatroomSelection(null);
      setPendingChatSelection(null);
    }
  }, [location?.state]);

  // Function to fetch chat list from API
  const fetchChatListData = useCallback(
    (page = 1, search = "", fromNotification = false) => {
      // If already loading, don't trigger another load
      if (isLoadingMore.current && !fromNotification) return;

      isLoadingMore.current = true;
      setLoading(true);
      // console.log(
      //   `Fetching chat list: page=${page}, search=${search}, fromNotification=${fromNotification}`
      // );

      const params = {
        page,
        per_page: 10,
        search,
      };

      dispatch(fetchChatList(params))
        .then((res) => {
          if (res?.payload?.meta?.success) {
            // console.log("oo res?.payload", res?.payload);

            const data = res?.payload?.data?.chat_list || [];
            const pagination = res?.payload?.data?.pagination || {
              totalRecords: 0,
              currentPage: 1,
              perPage: 10,
              totalPage: 1,
            };

            // console.log(
            //   `Received ${data.length} chat items. Current page: ${pagination.currentPage}, Total pages: ${pagination.totalPage}`
            // );
            setPaginationInfo(pagination);

            // Format the data to match the expected structure
            const formattedData = data.map((chat) => ({
              id: chat.user_id,
              name: chat.name,
              message: chat.latest_message,
              time: formatChatTime(chat.created_at),
              unread: parseInt(chat.unread_count) || 0,
              isOnline: chat.is_user_active,
              avatar: chat.profile_photo_path,
              chatId: chat.chat_id,
              userRole: chat?.role_name,
            }));

            if (page === 1) {
              setApiChatList(formattedData);
            } else {
              setApiChatList((prevList) => [...prevList, ...formattedData]);
            }

            // Determine if there are more pages to load
            const hasMorePages =
              parseInt(pagination.currentPage) < parseInt(pagination.totalPage);
            // console.log(`Has more pages: ${hasMorePages}`);
            setHasMore(hasMorePages);
          } else {
            // console.log("API response unsuccessful:", res);
          }
          setLoading(false);
          isLoadingMore.current = false;
        })
        .catch((e) => {
          // console.log("Error fetching chat list:", e);
          setLoading(false);
          setHasMore(false);
          isLoadingMore.current = false;
        });
    },
    [dispatch, selectedContact, pendingChatSelection]
  );

  // Function to fetch chat room list from API
  const fetchChatRoomData = useCallback(
    (page = 1, search = "", fromNotification = false) => {
      // If already loading, don't trigger another load
      if (isLoadingMore.current && !fromNotification) return;

      isLoadingMore.current = true;
      setLoading(true);
      // console.log(
      //   `Fetching chat room list: page=${page}, search=${search}, fromNotification=${fromNotification}`
      // );

      const params = {
        page,
        per_page: 10,
        search,
      };

      dispatch(fetchChatRoomList(params))
        .then((res) => {
          // console.log("Reschatroom", res);
          if (res?.payload?.meta?.success) {
            const data = res?.payload?.data?.chat_rooms || [];
            // console.log("chatroomdata", data);
            const pagination = {
              totalRecords: res?.payload?.data?.totalRecords || 0,
              currentPage: res?.payload?.data?.currentPage || 1,
              perPage: res?.payload?.data?.perPage || 10,
              totalPage: res?.payload?.data?.totalPage || 1,
            };

            // console.log(
            //   `Received ${data.length} chat room items. Current page: ${pagination.currentPage}, Total pages: ${pagination.totalPage}`
            // );
            setPaginationInfo(pagination);

            // Format the data to match the expected structure for UI
            const formattedData = data?.map((room) => ({
              id: room.id,
              name: room.name,
              message: room.latest_message || room.description,
              time: formatChatTime(room.latest_message_at || room.created_at),
              unread: parseInt(room.unread_count),
              avatar: room?.profile_photo_path,
              totalMembers: room.participants_count,
              activeMembers: 5,
              members: [],
              meeting_link: room.meeting_link,
              is_activeChatRoom: room.is_active,
              is_joined: room.is_joined,
            }));
            // console.log("formatteddata", formattedData);

            if (page === 1) {
              setApiChatRooms(formattedData);
            } else {
              setApiChatRooms((prevRooms) => [...prevRooms, ...formattedData]);
            }

            // Determine if there are more pages to load
            const hasMorePages =
              parseInt(pagination.currentPage) < parseInt(pagination.totalPage);
            // console.log(`Has more pages: ${hasMorePages}`);
            setHasMore(hasMorePages);

            // Then check if the selected chat room exists and is active
            if (selectedChatRoom && !fromNotification) {
              // console.log(
              //   "Checking if selected chat room still exists:",
              //   selectedChatRoom.id
              // );
              // Try to find the selected chat room in the formatted data
              const foundChatRoom = formattedData.find(
                (room) => room.id === selectedChatRoom.id
              );

              // If the chat room is not found OR it's not active, clear the selection
              if (!foundChatRoom) {
                // console.log(
                //   "Selected chat room not found - clearing selection"
                // );
                setSelectedChatRoom(null);
                setMessages([]);
              } else if (foundChatRoom.is_activeChatRoom !== 1) {
                // console.log(
                //   "Selected chat room is inactive - clearing selection"
                // );
                setSelectedChatRoom(null);
                setMessages([]);
              }
            }
          } else {
            // console.log("API response unsuccessful:", res);
          }
          setLoading(false);
          isLoadingMore.current = false;
        })
        .catch((e) => {
          // console.log("Error fetching chat room list:", e);
          setLoading(false);
          setHasMore(false);
          isLoadingMore.current = false;
        });
    },
    [dispatch, selectedChatRoom, activeTab, pendingChatroomSelection]
  );

  useEffect(() => {
    if (activeTab === "chatRoom" && showNewContacts) {
      toggleNewContacts();
    }
  }, [activeTab]);

  // Effect to process live meeting data and filter for live meetings
  useEffect(() => {
    // console.log("inuseeffect", liveMeetingData);

    if (
      liveMeetingData &&
      liveMeetingData.meetings &&
      Array.isArray(liveMeetingData.meetings)
    ) {
      // console.log("Live meeting data received:", liveMeetingData.meetings);

      // Filter meetings that are currently live AND where the current user is a participant
      const currentLiveMeetings = liveMeetingData.meetings.filter((meeting) => {
        // First check if the meeting is currently live
        const isLive = isMeetingLive(meeting);

        // Then check if the current user is a participant
        const isUserParticipant =
          meeting.participants &&
          meeting.participants.some(
            (participant) => participant.id === userForEdit?.user?.id
          );


        // Only include if both conditions are true
        return isLive && isUserParticipant;
      });


      // Format meetings for UI
      const formattedMeetings = formatMeetingsForUI(currentLiveMeetings);

      setLiveMeetings(formattedMeetings);
    } else {
      setLiveMeetings([]);
    }
  }, [
    liveMeetingData,
    isMeetingLive,
    formatMeetingsForUI,
    userForEdit?.user?.id,
  ]);

  useEffect(() => {
    if (activeTab === "chatRoom" && liveMeetings.length > 0) {
      setShowLiveMeeting(true);
    } else {
      setShowLiveMeeting(false);
    }
  }, [activeTab, liveMeetings]);

  // Format chat time from API timestamp
  const formatChatTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();

    // If it's today, return the time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // If it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    // Otherwise return the short date
    return date.toLocaleDateString([], { month: "2-digit", day: "numeric" });
  };

  // Initial data fetch
  useEffect(() => {
    fetchChatListData(1, "");
  }, [fetchChatListData]);

  // User connections fetch for "new contacts" view
  const fetchUserConnections = useCallback(
    (page = 1, search = "") => {
      // If already loading, don't trigger another load
      if (isLoadingMore.current) return;

      isLoadingMore.current = true;
      setLoading(true);

      const params = {
        page,
        per_page: 10,
        search,
      };

      dispatch(fetchUserChatTable(params))
        .then((res) => {
          const data = res?.payload?.data?.data || [];
          const pagination = res?.payload?.data?.pagination || {
            totalRecords: 0,
            currentPage: 1,
            perPage: 10,
            totalPage: 1,
          };

          
          setPaginationInfo(pagination);

          if (page === 1) {
            setUserConnections(data);
          } else {
            setUserConnections((prevConnections) => [
              ...prevConnections,
              ...data,
            ]);
          }

          // Determine if there are more pages to load
          const hasMorePages =
            parseInt(pagination.currentPage) < parseInt(pagination.totalPage);
          setHasMore(hasMorePages);

          setLoading(false);
          isLoadingMore.current = false;
        })
        .catch((e) => {
          setLoading(false);
          setHasMore(false); // Ensure we stop trying on error
          isLoadingMore.current = false;
        });
    },
    [dispatch]
  );

  // Handle window resize and mobile view
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 992) {
        setShowContactList(!selectedContact && !selectedChatRoom);
      } else {
        setShowContactList(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // Add a viewport meta tag to ensure proper scaling on mobile
    const viewportMeta = document.createElement("meta");
    viewportMeta.name = "viewport";
    viewportMeta.content =
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    document.getElementsByTagName("head")[0].appendChild(viewportMeta);

    return () => {
      window.removeEventListener("resize", handleResize);
      // Remove the meta tag when component unmounts
      const metaTag = document.querySelector('meta[name="viewport"]');
      if (metaTag) {
        metaTag.remove();
      }
    };
  }, [selectedContact, selectedChatRoom]);

  // Update messages based on selected contact/chat room
  useEffect(() => {
    if (activeTab === "chat" && selectedContact) {
      setMessages(currentChatMessages);
      setShowLiveMeeting(false);
      setActiveMeeting(null);
    } else if (activeTab === "chatRoom" && selectedChatRoom) {
      setMessages(groupChatMessages);

      // Don't automatically show live meeting for any chat room
      setShowLiveMeeting(false);
      setActiveMeeting(null);
    }
  }, [
    activeTab,
    selectedContact,
    selectedChatRoom,
    apiChatRooms,
    currentChatMessages,
    groupChatMessages,
  ]);

  // Handle infinite scroll for chat list
  const handleScroll = useCallback(() => {
    if (
      !contactsListRef.current ||
      loading ||
      !hasMore ||
      isLoadingMore.current
    )
      return;

    const { scrollTop, scrollHeight, clientHeight } = contactsListRef.current;

    // Check if scrolled to bottom (with a smaller threshold for better detection)
    if (scrollHeight - scrollTop - clientHeight < 20) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);

      if (showNewContacts) {
        fetchUserConnections(nextPage, searchQuery);
      } else if (activeTab === "chat") {
        fetchChatListData(nextPage, searchQuery);
      } else if (activeTab === "chatRoom") {
        fetchChatRoomData(nextPage, searchQuery);
      }
    }
  }, [
    loading,
    hasMore,
    fetchUserConnections,
    fetchChatListData,
    fetchChatRoomData,
    searchQuery,
    showNewContacts,
    activeTab,
    currentPage,
  ]);

  // Add scroll event listener for infinite scrolling
  useEffect(() => {
    const currentRef = contactsListRef.current;

    if (currentRef) {

      // Using a named function for the event listener to ensure proper cleanup
      const scrollHandler = () => {
        // Use requestAnimationFrame to limit how often the scroll handler fires
        requestAnimationFrame(() => {
          handleScroll();
        });
      };

      currentRef.addEventListener("scroll", scrollHandler);

      return () => {
        if (currentRef) {
          currentRef.removeEventListener("scroll", scrollHandler);
        }
      };
    }
  }, [handleScroll]);

  // New function to update chat list when a user sends a message
  const updateChatWithLatestMessage = (
    message,
    receiverId,
    receiverName,
    receiverAvatar
  ) => {
    // Check if we're in a group chat or individual chat
    if (activeTab === "chatRoom" && selectedChatRoom) {
      // Create a formatted chat room object
      const formattedChatRoom = {
        id: selectedChatRoom.id,
        name: selectedChatRoom.name,
        message: message,
        time: formatChatTime(new Date().toISOString()),
        unread: 0, // No unread for the sender
        avatar: selectedChatRoom.avatar,
        totalMembers: selectedChatRoom.totalMembers,
        activeMembers: selectedChatRoom.activeMembers,
        members: selectedChatRoom.members,
        meeting_link: selectedChatRoom.meeting_link,
      };

      // Update the apiChatRooms
      setApiChatRooms((prevRooms) => {
        // Find and remove the existing room
        const existingIndex = prevRooms.findIndex(
          (room) => room.id === formattedChatRoom.id
        );

        const newRooms = [...prevRooms];

        if (existingIndex !== -1) {
          newRooms.splice(existingIndex, 1);
        }

        // Add the updated room to the beginning
        return [formattedChatRoom, ...newRooms];
      });
    } else {
      // For individual chats - use existing functionality
      const formattedChat = {
        id: receiverId,
        name: receiverName,
        message: message,
        time: formatChatTime(new Date().toISOString()),
        unread: 0, // No unread messages for sender
        isOnline: true, // Maintaining current online status
        avatar: receiverAvatar,
        chatId: selectedContact?.chatId, // Using existing chatId
      };

      // Update the apiChatList similar to how we do with the event
      setApiChatList((prevList) => {
        // Check if the user already exists in the list
        const existingIndex = prevList.findIndex(
          (chat) => chat.id === formattedChat.id
        );

        // Create a new array to avoid mutating state directly
        const newList = [...prevList];

        if (existingIndex !== -1) {
          // Remove the existing chat
          newList.splice(existingIndex, 1);
        }

        // Add the updated chat to the beginning of the array
        return [formattedChat, ...newList];
      });
    }
  };

  // Handle switching from contact list to chat window on mobile
  const handleContactSelect = (contact) => {
    // console.log("selectedcontact", contact);
    setSelectedContact(contact);
    setMessages(currentChatMessages);

    // On mobile, hide the contact list and show the chat window
    if (windowWidth < 992) {
      setShowContactList(false);
    }

    setShowNewContacts(false);
    setActiveTab("chat");
    setShowLiveMeeting(false);
    setActiveMeeting(null);
  };

  // Handle switching from contact list to chat room on mobile
  const handleChatRoomSelect = (chatRoom) => {
    setSelectedChatRoom(chatRoom);
    setMessages(groupChatMessages);

    // On mobile, hide the contact list and show the chat window
    if (windowWidth < 992) {
      setShowContactList(false);
    }

    setShowNewContacts(false);
    setActiveTab("chatRoom");

    // Removed automatic live meeting display
    setShowLiveMeeting(false);
    setActiveMeeting(null);
  };

  // Effect to handle pending chat selections from notifications
  useEffect(() => {
    if (pendingChatSelection) {
      

      // If we need to refresh data first
      if (pendingChatSelection.needsRefresh) {
        fetchChatListData(1, "", true);
        // Remove the needsRefresh flag to avoid infinite loop
        setPendingChatSelection((prev) =>
          prev ? { ...prev, needsRefresh: false } : null
        );
        return;
      }

      // Look for the target chat in the current list
      const targetChat = apiChatList.find(
        (chat) => chat.id === pendingChatSelection.id
      );

      if (targetChat) {
        handleContactSelect(targetChat);
        setPendingChatSelection(null);
      } else if (apiChatList.length > 0) {
        // Create chat object from notification data
        const notificationChat = {
          id: pendingChatSelection.id,
          name: pendingChatSelection.name,
          message: pendingChatSelection.message,
          time: pendingChatSelection.time,
          unread: 0,
          isOnline: true,
          avatar: pendingChatSelection.avatar,
          chatId: pendingChatSelection.chatId,
          userRole: pendingChatSelection.role,
        };
        handleContactSelect(notificationChat);
        setPendingChatSelection(null);
      }
    }
  }, [pendingChatSelection, apiChatList, fetchChatListData]);

  // Effect to handle pending chatroom selections from notifications
  useEffect(() => {
    if (pendingChatroomSelection) {
      

      // If we need to refresh data first
      if (pendingChatroomSelection.needsRefresh) {
        fetchChatRoomData(1, "", true);
        // Remove the needsRefresh flag to avoid infinite loop
        setPendingChatroomSelection((prev) =>
          prev ? { ...prev, needsRefresh: false } : null
        );
        return;
      }

      // Look for the target chatroom in the current list
      const targetChatRoom = apiChatRooms.find(
        (room) => room.id === pendingChatroomSelection.id
      );

      if (targetChatRoom) {
        handleChatRoomSelect(targetChatRoom);
        setPendingChatroomSelection(null);
      } else if (apiChatRooms.length > 0) {
        
        // Create chatroom object from notification data
        const notificationChatRoom = {
          id: pendingChatroomSelection.id,
          name: pendingChatroomSelection.name,
          message: pendingChatroomSelection.message,
          time: pendingChatroomSelection.time,
          unread: 0,
          avatar: pendingChatroomSelection.sender?.profile_photo_path,
          totalMembers: 0,
          activeMembers: 0,
          members: [],
          meeting_link: null,
          is_activeChatRoom: 1,
          is_joined: 1,
        };
        handleChatRoomSelect(notificationChatRoom);
        setPendingChatroomSelection(null);
      }
    }
  }, [pendingChatroomSelection, apiChatRooms, fetchChatRoomData]);

  const handleJoinMeeting = useCallback((meeting) => {

    if (meeting.zoom_join_url) {
      // Open Zoom meeting in new tab
      window.open(meeting.zoom_join_url, "_blank");
    } else {
      console.error("No zoom URL available for meeting:", meeting);
    }
  }, []);

  const handleCloseMeetingBanner = () => {
    setShowLiveMeeting(false);
    setActiveMeeting(null);
  };

  // Improved back button handler for mobile
  const handleBackToList = () => {
    if (windowWidth < 992) {
      // Show the contact list and reset selection state
      setShowContactList(true);

      // Reset focus to the search input when back to list on mobile
      setTimeout(() => {
        const searchInput = document.querySelector(".chat-search-input input");
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  };

  // Toggle new contacts view and fetch data from API
  const toggleNewContacts = () => {
    const willShowNewContacts = !showNewContacts;
    setShowNewContacts(willShowNewContacts);
    setSearchQuery("");

    // Reset pagination state
    setCurrentPage(1);
    setHasMore(true);
    isLoadingMore.current = false;

    if (willShowNewContacts) {
      fetchUserConnections(1, "");
    }
  };

  const handleNewConnectionSelect = (connection) => {
    // Convert the connection object to the format expected by selectedContact
    const contactFormat = {
      id: connection.id,
      name: connection.name,
      message: "Start a conversation...", // Initial message placeholder
      time: formatChatTime(new Date().toISOString()), // Current time
      unread: 0,
      isOnline: true, // Assuming online
      avatar: connection.profile_photo_path,
      chatId: null, // No chat ID yet
      userRole: connection?.role_name,
    };

    // Set the selected contact
    setSelectedContact(contactFormat);

    // Switch to chat tab
    setActiveTab("chat");

    // Hide new contacts view
    setShowNewContacts(false);

    // On mobile, hide the contact list and show the chat window
    if (windowWidth < 992) {
      setShowContactList(false);
    }

    // Set empty message list since this is a new contact
    setMessages([]);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearchQuery("");

    // Reset pagination state when switching tabs
    setCurrentPage(1);
    setHasMore(true);
    isLoadingMore.current = false;

    if (key === "chat") {
      // Fetch fresh chat list when switching to chat tab
      fetchChatListData(1, "");

      // Maintain previously selected contact when returning to chat tab
      if (selectedContact) {
        setMessages(currentChatMessages);
      } else {
        setMessages([]);
      }

      // Hide live meeting banner
      setShowLiveMeeting(false);
      setActiveMeeting(null);
    } else if (key === "chatRoom") {
      // Fetch chat room data when switching to chat room tab
      fetchChatRoomData(1, "");

      // Maintain previously selected chat room when returning to chat room tab
      if (selectedChatRoom) {
        setMessages(groupChatMessages);
      } else {
        setMessages([]);
      }

      // Hide live meeting banner
      setShowLiveMeeting(false);
      setActiveMeeting(null);
    }
  };

  // Handle search with debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounce
    const timeout = setTimeout(() => {
      // Reset pagination state when starting a new search
      setCurrentPage(1);
      setHasMore(true);
      isLoadingMore.current = false;

      if (showNewContacts) {
        fetchUserConnections(1, query);
      } else if (activeTab === "chat") {
        fetchChatListData(1, query);
      } else if (activeTab === "chatRoom") {
        // Now using API search for chat rooms
        fetchChatRoomData(1, query);
      }
    }, 300); // 300ms debounce

    setSearchTimeout(timeout);
  };

  // Helper function to get avatar text for when image is not available
  const getAvatarText = (name) => {
    if (!name) return "";
    const nameParts = name.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}`.toUpperCase();
    }
    return name.substring(0, 1).toUpperCase();
  };

  const filteredItems = () => {
    if (showNewContacts) {
      return userConnections;
    } else if (activeTab === "chat") {
      return apiChatList;
    } else {
      // Now using API data for chat rooms
      return apiChatRooms;
    }
  };

  const renderActiveItem = () => {
    if (activeTab === "chat" && selectedContact) {
      return selectedContact;
    } else if (activeTab === "chatRoom" && selectedChatRoom) {
      return selectedChatRoom;
    }
    return null;
  };

  return (
    <Row className="chat-container bg-gray">
      {/* Left Column - Contact/ChatRoom List */}
      <Col
        xs={24}
        lg={8}
        className="chat-sidebar border-r-[1px] border-solid border-[#373737] h-full overflow-hidden relative"
        style={{
          display: windowWidth < 992 && !showContactList ? "none" : "block",
          position: windowWidth < 992 ? "absolute" : "relative",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 10,
        }}
      >
        {/* Tabs for Chat and Chat Room - Always present */}
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          className="chat-tabs pt-4"
          size="large"
          tabBarStyle={{
            display: "flex",
            height: "72px",
            alignItems: "center",
          }}
          centered
        >
          <TabPane
            tab={
              <Text
                type=""
                className={
                  activeTab === "chat" ? "text-primary" : "text-grayText"
                }
              >
                Chat
              </Text>
            }
            key="chat"
            style={{ width: "50%" }}
          />
          <TabPane
            tab={
              <Text
                type=""
                className={
                  activeTab === "chatRoom" ? "text-primary" : "text-grayText"
                }
              >
                Chat Room
              </Text>
            }
            key="chatRoom"
            style={{ width: "50%" }}
          />
        </Tabs>

        {/* <Divider className="chat-divider m-0" /> */}

        {!showNewContacts ? (
          <>
            {/* Regular Chat/ChatRoom View */}
            {/* Search Bar */}
            <div className="chat-search-container p-4">
              <Input
                size="large"
                placeholder={
                  activeTab === "chat" ? "Search messages" : "Search chat rooms"
                }
                prefix={
                  <SearchOutlined className="chat-search-icon text-white mr-1" />
                }
                className="rounded-full bg-darkGray border-[1px] border-solid border-[#373737]"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            {/* Contact/ChatRoom List */}
            <div
              ref={contactsListRef}
              className="chat-contacts-list overflow-y-auto"
              style={{
                height:
                  window.innerWidth < 768
                    ? "calc(100vh - 370px)"
                    : "calc(100vh - 358px)",
              }}
            >
              {loading && filteredItems().length === 0 ? (
                <div className="text-center py-8">
                  <Spin
                    indicator={
                      <LoadingOutlined
                        style={{ fontSize: 24, color: "#ff6d00" }}
                        spin
                      />
                    }
                  />
                </div>
              ) : filteredItems().length === 0 ? (
                <div className="text-center py-8">
                  <Text className="text-grayText">
                    No {activeTab === "chat" ? "Contacts" : "Chat Rooms"} found
                  </Text>
                </div>
              ) : (
                filteredItems().map((item) => (
                  <div
                    key={item.id}
                    className={`chat-contact-item p-4 cursor-pointer flex items-center hover:bg-darkGray transition-colors  border-solid border-b-[1px] border-[#373737] ${
                      (activeTab === "chat" &&
                        selectedContact?.id === item.id) ||
                      (activeTab === "chatRoom" &&
                        selectedChatRoom?.id === item.id)
                        ? "active" // Using the "active" class defined in CSS
                        : ""
                    }`}
                    onClick={() =>
                      activeTab === "chat"
                        ? handleContactSelect(item)
                        : handleChatRoomSelect(item)
                    }
                  >
                    <div className="chat-avatar-container relative">
                      {/* <Avatar size={40} src={item.avatar}>
                      {!item.avatar && getAvatarText(item.name)}
                    </Avatar> */}
                      {item.avatar ? (
                        <Avatar
                          size={40}
                          src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                            item.avatar
                          }`}
                          className="object-cover rounded-full"
                        ></Avatar>
                      ) : (
                        <Avatar
                          size={40}
                          style={{
                            backgroundColor: "#fde3cf",
                            color: "#f56a00",
                          }}
                          className=" object-cover rounded-full text-2xl"
                        >
                          {item.name[0]}
                        </Avatar>
                      )}
                    </div>
                    <div className="chat-contact-info ml-3 flex-grow overflow-hidden">
                      <div className="chat-contact-header flex justify-between items-center">
                        <Text className="chat-contact-name font-medium text-white">
                          {item.name}
                        </Text>
                        <Text className="chat-contact-time text-xs text-grayText">
                          {item.time}
                        </Text>
                      </div>

                      {(activeTab === "chat" ||
                        (activeTab === "chatRoom" && item.is_joined === 1)) && (
                        <div className="chat-contact-footer flex justify-between items-center">
                          <Text
                            className="chat-contact-message text-sm text-grayText truncate"
                            style={{ maxWidth: "100%" }}
                          >
                            {item.message}
                          </Text>
                          {item.unread > 0 &&
                            // Only show badge if this chat is not currently selected/open
                            ((activeTab === "chat" &&
                              selectedContact?.id !== item.id) ||
                              (activeTab === "chatRoom" &&
                                selectedChatRoom?.id !== item.id)) && (
                              <Badge
                                count={item.unread}
                                className="chat-unread-badge ml-2 !text-primary"
                                style={{ backgroundColor: "#ff6d0026" }}
                              />
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Loading indicator for infinite scroll */}
              {loading && filteredItems().length > 0 && (
                <div className="text-center py-4">
                  <Spin
                    indicator={
                      <LoadingOutlined
                        style={{ fontSize: 24, color: "#ff6d00" }}
                        spin
                      />
                    }
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* New Contacts View */}
            {/* Search Bar */}
            <div className="chat-search-container p-4">
              <Input
                size="large"
                placeholder="Search connections"
                prefix={
                  <SearchOutlined className="chat-search-icon text-white mr-1" />
                }
                className=" rounded-full bg-darkGray border-[1px] border-solid border-[#373737]"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            {/* New Connections List */}
            <div
              ref={contactsListRef}
              className="chat-contacts-list overflow-y-auto"
              style={{
                height:
                  window.innerWidth < 768
                    ? "calc(100vh - 370px)"
                    : "calc(100vh - 358px)",
              }}
            >
              {userConnections?.map((connection) => (
                <div
                  key={connection.id}
                  className="chat-contact-item p-4 cursor-pointer flex items-center hover:bg-gray transition-colors border-solid border-b-[1px] border-[#373737]"
                  onClick={() => handleNewConnectionSelect(connection)}
                >
                  <div className="chat-avatar-container">
                    <Avatar
                      size={40}
                      src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                        connection.profile_photo_path
                      }`}
                    >
                      {!connection.profile_photo_path &&
                        getAvatarText(connection.name)}
                    </Avatar>
                  </div>
                  <div className="chat-contact-info ml-3">
                    <Text className="chat-contact-name font-medium text-white">
                      {connection.name}
                    </Text>
                  </div>
                </div>
              ))}

              {/* Loading indicator for infinite scroll */}
              {loading && (
                <div className="text-center py-4">
                  <Spin
                    indicator={
                      <LoadingOutlined
                        style={{ fontSize: 24, color: "#ff6d00" }}
                        spin
                      />
                    }
                  />
                </div>
              )}

              {/* No results message */}
              {!loading && userConnections.length === 0 && (
                <div className="text-center py-8">
                  <Text className="text-grayText">No Connections Found</Text>
                </div>
              )}
            </div>
          </>
        )}

        {/* Add/Close Button - Fixed positioning revised for responsive layout */}
        {activeTab === "chat" ? (
          <div className="chat-new-button absolute bottom-10 right-6">
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={
                showNewContacts ? (
                  <PlusOutlined className="!text-2xl mt-1" rotate={45} />
                ) : (
                  <PlusOutlined rotate={90} className="!text-2xl mt-1" />
                )
              }
              onClick={toggleNewContacts}
            />
          </div>
        ) : null}
      </Col>

      {/* Right Column - Chat Window - Using our ChatWindow component */}
      <div
        className="flex-1 flex h-full"
        style={{
          display: windowWidth < 992 && showContactList ? "none" : "flex",
        }}
      >
        <ChatWindow
          activeItem={renderActiveItem()}
          messages={messages}
          setMessages={setMessages}
          showLiveMeeting={showLiveMeeting}
          activeMeeting={activeMeeting}
          windowWidth={windowWidth}
          handleBackToList={handleBackToList}
          handleJoinMeeting={handleJoinMeeting}
          handleCloseMeetingBanner={handleCloseMeetingBanner}
          activeTab={activeTab}
          showContactList={showContactList}
          updateChatWithLatestMessage={updateChatWithLatestMessage}
          liveMeetings={liveMeetings}
          apiChatRooms={apiChatRooms}
          handleTabChange={handleTabChange}
          handleChatRoomSelect={handleChatRoomSelect}
        />
      </div>
    </Row>
  );
};

export default Chat;
