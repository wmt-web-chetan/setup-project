import React from "react";
import { Avatar, Button } from "antd";
import { useDispatch } from "react-redux";
import { respondToFriendRequestAction } from "../../services/Store/ContractProcessor/actions";
import { useNavigate } from "react-router-dom";

const NotificationItem = ({
  id,
  icon,
  type,
  content,
  action,
  time,
  actions,
  is_read,
  from = "page",
  originalData = null, // Added to access original API data if needed
  onNotificationAction = null, // Callback for notification actions
  onRemoveNotification = null, // Callback to remove notification
  isProcessing = null, // Processing state from parent
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Function to get notification title based on type
  const getNotificationTitle = (type) => {
    switch (type) {
      case "like":
        return "New Like";
      case "comment":
        return "New Comment";
      case "chat_message":
        return "New Message";
      case "chatroom_message":
        return "New Chat Room Message";
      case "chatroom_new_member":
        return "New Chat Room Member";
      case "friend_request":
        return "New Friend Request";
      case "friend_accept_request":
        return "Friend Request Approved";
      default:
        return "Notification";
    }
  };

  // Handle action click
  const handleActionClick = (e) => {
    e.preventDefault();
    // Add your navigation logic here based on notification type
    if (originalData) {
      switch (type) {
        case "like":
          // Navigate to feed post
          console.log("Navigate to feed:", originalData.reference?.feed_id);
          console.log("Navigate to feed:", originalData);
          navigate("/community/feed", {
            state: { originalData: originalData },
          });
          break;

        case "comment":
          // Navigate to feed post
          console.log("Navigate to feed:", originalData.reference?.feed_id);
          navigate("/community/feed", {
            state: { originalData: originalData },
          });
          break;

        case "chat_message":
          // Navigate to direct chat
          console.log("Navigate to chat:", originalData);
          navigate("/community/chat", {
            state: { originalData: originalData },
          });
          break;

        case "chatroom_message":
          // Navigate to chat room
          console.log(
            "Navigate to chat room:",
            originalData.reference?.chat_room_id
          );
          navigate("/community/chat", {
            state: { originalData: originalData },
          });
          break;

        case "chatroom_new_member":
          // Navigate to chat room
          console.log(
            "Navigate to chat room:",
            originalData.reference?.chat_room_id
          );
          break;

        default:
          console.log("Action clicked for:", type);
      }
    }
  };

  // Handle friend request actions
  const handleFriendRequestAction = async (actionType, e) => {
    e.preventDefault();
    e.stopPropagation();

    const friendRequestId = originalData?.reference?.friend_request_id;
    
    console.log(`=== ${actionType.toUpperCase()} ACTION STARTED ===`);
    console.log(`Notification ID: ${id}`);
    console.log(`Friend Request ID: ${friendRequestId}`);

    if (!friendRequestId) {
      console.error("Friend request ID not found in notification data");
      return;
    }

    if (actionType === "approve") {
      // Notify parent that we're starting the approve process
      if (onNotificationAction) {
        onNotificationAction(id, "approve", friendRequestId);
      }

      const payload = {
        id: friendRequestId,
        status: "accepted",
      };

      try {
        const res = await dispatch(respondToFriendRequestAction(payload));
        console.log("📥 Approve API Response:", res);
        
        // Check if the response indicates success
        if (res?.payload?.meta?.success || res?.type?.includes('fulfilled')) {
          console.log("✅ Approve request successful - waiting for socket event");
          // Keep loading state - will be cleared when socket event is received
        } else {
          console.error("❌ Approve request failed:", res);
          if (onNotificationAction) {
            onNotificationAction(id, "clear");
          }
        }
      } catch (error) {
        console.error("💥 Error approving friend request:", error);
        if (onNotificationAction) {
          onNotificationAction(id, "clear");
        }
      }
    } else if (actionType === "decline") {
      // Notify parent that we're starting the decline process
      if (onNotificationAction) {
        onNotificationAction(id, "decline", friendRequestId);
      }

      const payload = {
        id: friendRequestId,
        status: "rejected",
      };

      try {
        console.log("📤 Dispatching decline request...", payload);
        const res = await dispatch(respondToFriendRequestAction(payload));
        console.log("📥 Decline API Response:", res);

        // Check if the response indicates success
        if (res?.payload?.meta?.success || res?.type?.includes('fulfilled')) {
          console.log("✅ Decline request successful!");
          
          // CRITICAL: Mark this notification as declined to prevent re-adding
          if (onNotificationAction) {
            console.log("🚫 Marking notification as declined to prevent re-adding");
            onNotificationAction(id, "declined", friendRequestId);
          }
          
          // Remove the notification immediately
          if (onRemoveNotification) {
            console.log("🗑️ Removing notification from list");
            onRemoveNotification(id);
          }
          
        } else {
          console.error("❌ Decline request failed:", res);
          if (onNotificationAction) {
            onNotificationAction(id, "clear");
          }
        }
      } catch (error) {
        console.error("💥 Error declining friend request:", error);
        if (onNotificationAction) {
          onNotificationAction(id, "clear");
        }
      }
    }
    
    console.log(`=== ${actionType.toUpperCase()} ACTION COMPLETED ===`);
  };

  // Determine loading states based on processing info
  const isApproving = isProcessing?.action === "approve";
  const isDeclining = isProcessing?.action === "decline";
  const isAnyActionProcessing = isApproving || isDeclining;

  return (
    <div
      className={`flex space-x-3 ${from === "page"
        ? "!mb-5 border border-liteGray rounded-xl p-3 bg-liteGrayV1"
        : ""
        } `}
    >
      {console.log("originalData", originalData)}

      {type === "friend_request" || type === "friend_accept_request" ? (
        <div className="relative">
          {
            originalData?.sender?.profile_photo_path ?
              <Avatar
                src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${originalData?.sender?.profile_photo_path
                  }`}
                alt="Profile picture"
                size={46}
              />
              :
              <Avatar
                style={{ backgroundColor: "#fde3cf", color: "#f56a00" }}
                className="w-full h-full object-cover rounded-full !text-xl"
                size={46}
              >
                {originalData?.sender?.name?.[0]}
              </Avatar>
          }

          {type === "friend_accept_request" ? (
            <i className="icon-tick absolute rounded-full bg-[#244430] text-success border border-gray text-xs left-[70%] top-[60%]" />
          ) : null}
        </div>
      ) : (
        <div className="text-primary text-2xl h-[46px] w-[46px] justify-center items-center flex rounded-full bg-[#373737]">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <p className="text-sm">
          <div className="flex !justify-between mb-0.5">
            <span className="font-semibold text-white">
              {getNotificationTitle(type)}
            </span>
            <span className="text-sm !text-grayText">{time}</span>
          </div>

          <div className="flex justify-between items-center">
            <p className="mb-0 flex items-center">
              {content}
              {action && (
                <span className="block ml-1">
                  <a
                    href="#"
                    className="text-orange-400 text-sm hover:text-orange-300"
                    onClick={handleActionClick}
                  >
                    {action}
                  </a>
                </span>
              )}
            </p>
            <div
              className={`${is_read === false ? "block" : "hidden"
                } h-1.5 rounded-full w-1.5 bg-primary ml-2 flex-shrink-0`}
            >
              {" "}
            </div>
          </div>
        </p>
        {actions && (
          <div className="mt-3 mb-1 flex flex-col sm:flex-row gap-2">
            <Button
              type="default"
              size="middle"
              className="w-[220px] bg-transparent text-white hover:bg-liteGray border-liteGray"
              onClick={(e) => handleFriendRequestAction("decline", e)}
              loading={isDeclining}
              disabled={isAnyActionProcessing}
            >
              Decline
            </Button>
            <Button
              type="primary"
              size="middle"
              className="w-[220px] shadow-none"
              onClick={(e) => handleFriendRequestAction("approve", e)}
              loading={isApproving}
              disabled={isAnyActionProcessing}
            >
              Accept
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;