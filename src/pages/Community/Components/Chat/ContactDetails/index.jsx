import React, { useState, useEffect } from "react";
import {
  Row,
  Avatar,
  Typography,
  Button,
  Input,
  Badge,
  message,
  Switch,
} from "antd";
import {
  CloseOutlined,
  RightOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import "./ContactDetails.scss";
import MediaDocsLinks from "../MediaDocsLinks";
import { useDispatch } from "react-redux";
import {
  fetchChatRoomDetails,
  leaveChatRoomAction,
} from "../../../../../services/Store/Chat/action";
import { toggleNotificationMuteAction } from "../../../../../services/Store/Users/action";

const ContactDetails = ({
  activeItem,
  activeTab,
  onClose,
  windowWidth,
  isUserJoinedRoom,
  setIsUserJoinedRoom,
  groupMemberStatus,
}) => {
  const { Text, Title } = Typography;
  const [showMediaDocsLinks, setShowMediaDocsLinks] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [roomDetails, setRoomDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const dispatch = useDispatch();

  // Ensure layout calculations are complete before revealing
  useEffect(() => {
    // Slight delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setMounted(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  // Fetch chat room details when activeItem changes
  useEffect(() => {
    if (activeItem?.id && activeTab === "chatRoom") {
      dispatch(fetchChatRoomDetails({ chat_room_id: activeItem?.id }))
        .then((response) => {
          if (response?.payload?.meta?.success) {
            setRoomDetails(response.payload.data);
          }
        })
        .catch((error) => {
          console.error("Error fetching chat room details:", error);
        });
    }
  }, [activeItem?.id, activeTab, dispatch]);

  // Ensure activeItem exists
  if (!activeItem) return null;

  // Check if we're on mobile
  const isMobile = windowWidth < 768;

  // Handle media/docs/links click
  const handleMediaDocsClick = () => {
    setShowMediaDocsLinks(true);
  };

  const handleMediaDocsClose = () => {
    setShowMediaDocsLinks(false);
  };

  const handleLeaveChatRoom = () => {
    if (activeItem?.id) {
      dispatch(leaveChatRoomAction({ chat_room_id: activeItem?.id }))
        .then((response) => {
          if (response?.payload?.meta?.success) {
            // Update the joined status to indicate user has left the group
            setIsUserJoinedRoom({
              data: {
                ...isUserJoinedRoom?.data,
                is_joined: 0,
                meeting_link: response?.payload?.data?.meeting_link,
              },
            });

            // Close the details sidebar after successful leave
            onClose();

            // Show success message
            // message.success("You have left the group successfully");
          }
        })
        .catch((error) => {
          console.error("Error leaving chat room:", error);
          message.error("Failed to leave the group. Please try again.");
        });
    }
  };

  // Handle copy link functionality
  const handleCopyLink = () => {
    const roomLink = roomDetails?.chat_room?.room_link;
    if (roomLink) {
      navigator.clipboard
        .writeText(roomLink)
        .then(() => {
          message.success("Room link copied to clipboard");
        })
        .catch((error) => {
          console.error("Failed to copy link:", error);
          message.error("Failed to copy link");
        });
    } else {
      message.warning("No room link available");
    }
  };

  // Handle toggle notification mute
  const handleToggleNotificationMute = (checked) => {
    let payload = {};
    let newMuteState;

    if (typeof checked === "boolean") {
      // Called from Switch component (individual chat)
      newMuteState = checked;
    } else {
      // Called from button click (chatRoom)
      newMuteState = !isMuted;
    }

    if (activeTab === "chatRoom") {
      // For chatRoom
      payload = {
        mute: newMuteState ? 1 : 0,
        chat_room_id: activeItem?.id,
      };
    } else {
      // For individual chat
      payload = {
        mute: newMuteState ? 1 : 0,
        user_id: activeItem?.id,
      };
    }

    dispatch(toggleNotificationMuteAction(payload))
      .then((response) => {
        if (response?.payload?.meta?.success) {
          setIsMuted(newMuteState);
          // message.success(
          //   `Notifications ${newMuteState ? 'muted' : 'unmuted'} successfully`
          // );
        }
      })
      .catch((error) => {
        console.error("Error toggling notification mute:", error);
        // message.error("Failed to toggle notification mute");
      });
  };

  // Filter members based on search term
  const filteredMembers = roomDetails?.members
    ? roomDetails.members.filter((member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Display different content based on activeTab (chat or chatRoom)
  const renderContent = () => {
    if (activeTab === "chatRoom") {
      const roomInfo = roomDetails?.chat_room;
      return (
        <>
          {/* Profile Section for Chat Room */}
          <div className="contact-profile flex flex-col items-center">
            {
              // roomInfo ?
              roomInfo?.profile_photo_path ? (
                <Avatar
                  src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                    roomInfo?.profile_photo_path
                  }`}
                  size={60}
                  className="mb-3 bg-primary"
                  style={{ backgroundColor: "#FF6D00" }}
                />
              ) : (
                <Avatar
                  size={60}
                  style={{ backgroundColor: "#fde3cf", color: "#f56a00" }}
                  className=" object-cover rounded-full !text-3xl mb-3"
                >
                  {roomInfo?.name?.[0]}
                </Avatar>
              )
              // : null
            }
            <Text className="text-white font-medium text-center">
              #
              {roomInfo?.name?.toLowerCase().replace(/\s+/g, "-") || "chatroom"}
            </Text>
            <div className="flex items-center justify-center gap-2">
              <div className="text-grayText text-xs  text-center">
                {groupMemberStatus?.total_members
                  ? groupMemberStatus?.total_members
                  : "0"}{" "}
                {(groupMemberStatus?.total_members || 0) === 1
                  ? "Member"
                  : "Members"}
              </div>
              <span className="mx-1 text-grayText">•</span>

              <div className="text-grayText flex items-center justify-center mb-1 xs:mt-0 xs:ml-2 bg-liteGray rounded-2xl py-0 px-0 sm:py-0 sm:px-2 ">
                <Badge
                  color="green"
                  text={`${
                    groupMemberStatus?.online_members
                      ? groupMemberStatus?.online_members
                      : "0"
                  }          ${
                    (groupMemberStatus?.online_members || 0) === 1
                      ? "Member"
                      : "Members"
                  }
`}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-2 mt-2 mb-4">
              <div
                className="flex flex-col items-center bg-darkGray rounded-2xl px-3 py-2 w-20 cursor-pointer"
                onClick={handleToggleNotificationMute}
              >
                <Button
                  type="text"
                  shape="circle"
                  className="flex items-center justify-center"
                  size="middle"
                  icon={
                    <i className="icon-mute" style={{ fontSize: "24px" }} />
                  }
                />
                <Text className="text-grayText text-xs">
                  {isMuted ? "Unmute" : "Mute"}
                </Text>
              </div>
              <div
                className="flex flex-col items-center bg-darkGray rounded-2xl px-3 py-2 w-20 cursor-pointer"
                onClick={handleCopyLink}
              >
                <Button
                  type="text"
                  shape="circle"
                  className="flex items-center justify-center"
                  size="middle"
                  icon={
                    <i
                      className="icon-attachments"
                      style={{ fontSize: "24px", color: "#ffff" }}
                    />
                  }
                />
                <span className="text-grayText text-xs">Copy Link</span>
              </div>
              <div
                className="flex flex-col items-center bg-darkGray rounded-2xl px-3 py-2 w-20 cursor-pointer"
                onClick={handleLeaveChatRoom}
              >
                <Button
                  type="text"
                  shape="circle"
                  className="flex items-center justify-center"
                  size="middle"
                  icon={
                    <i
                      className="icon-log-out"
                      style={{ fontSize: "24px", color: "#EF4444" }}
                    />
                  }
                />
                <span className="text-grayText text-xs">Leave</span>
              </div>
            </div>
          </div>
          {/* Options */}
          <div className="px-4 py-2">
            <div className="bg-darkGray rounded-lg mb-2">
              <div
                className="p-2 flex justify-between items-center w-full cursor-pointer"
                onClick={handleMediaDocsClick}
              >
                <div className="flex items-center gap-2">
                  <div className="bg-primaryOpacity rounded-lg text-primary">
                    <i className="icon-photo text-primary text-lg"></i>
                  </div>
                  <Text className="text-white">Docs, Links, Media</Text>
                </div>
                <RightOutlined className="text-grayText" />
              </div>
            </div>
          </div>
          <hr className="mx-3 text-grayText" />

          {/* Members section */}
          <div className="px-4 py-2">
            <div className="flex items-center my-3 gap-2">
              <div className="text-2xl font-normal">Members</div>

              <span className="text-grayText">&#8226;</span>
              <div className="bg-primaryOpacity rounded-lg px-3 py-1 text-primary">
                {roomInfo?.total_members || activeItem.totalMembers}
              </div>
            </div>

            {/* Search members input */}
            <div className="">
              <Input
                // size="large"
                placeholder="Search members"
                prefix={
                  <SearchOutlined className="chat-search-icon text-white mr-1" />
                }
                className=" rounded-full bg-darkGray border-[1px] border-solid border-[#373737] hover:!border-primary active:!border-primary focus:!border-primary target:!border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Members list - Responsive height */}
            <div
              className="members-list mt-2 overflow-y-auto"
              style={{
                height: isMobile
                  ? "calc(100vh - 532px)"
                  : "calc(100vh - 712px)",
              }}
            >
              {/* Use roomDetails?.members from API response if available, otherwise fallback to activeItem.members */}
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <div key={member.id} className="flex items-center py-2">
                    <div className="relative">
                      

                      {member?.profile_photo_path ? (
                        <Avatar
                          src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                            member?.profile_photo_path
                          }`}
                          size={36}
                          className="mr-3"
                        />
                      ) : (
                        <Avatar
                          size={36}
                          style={{
                            backgroundColor: "#fde3cf",
                            color: "#f56a00",
                          }}
                          className=" object-cover rounded-full !text-lg mr-3"
                        >
                          {member?.name?.[0]}
                        </Avatar>
                      )}
                      {member.status === "online" && (
                        <div className="absolute bottom-0 right-3 w-2 h-2 bg-green-500 rounded-full border-[1px] border-darkGray"></div>
                      )}
                    </div>
                    <Text className="text-white">{member.name}</Text>
                  </div>
                ))
              ) : (
                <div className="text-center text-grayText py-4">
                  {searchTerm
                    ? "No members match your search"
                    : "Loading members..."}
                </div>
              )}
            </div>
          </div>
        </>
      );
    } else {
      // Individual chat details
      return (
        <>
          {/* Profile Section for Individual Chat */}
          <div className="contact-profile flex flex-col items-center">

            {activeItem?.avatar ? (
              <Avatar
                src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${
                  activeItem.avatar
                }`}
                size={60}
                className="mb-2"
              />
            ) : (
              <Avatar
                size={60}
                style={{ backgroundColor: "#fde3cf", color: "#f56a00" }}
                className=" object-cover rounded-full !text-3xl mb-2"
              >
                {`${activeItem?.name?.[0]}`}
              </Avatar>
            )}

            <Title level={4} className="text-white m-0 text-center">
              {activeItem.name}
            </Title>
            <Text className="text-grayText mb-4 text-center">
              {activeItem?.userRole}
            </Text>
          </div>
          <hr className="mx-3 text-grayText" />
          {/* Options */}
          <div className="px-4 py-2">
            <div className="bg-darkGray rounded-lg mb-2">
              <div
                className="p-2 flex justify-between items-center w-full cursor-pointer"
                onClick={handleMediaDocsClick}
              >
                <div className="flex items-center gap-2">
                  <div className="bg-primaryOpacity rounded-lg text-primary">
                    <i className="icon-photo text-primary text-lg"></i>
                  </div>
                  <Text className="text-white">Docs, Links, Media</Text>
                </div>
                <RightOutlined className="text-grayText" />
              </div>
            </div>

            <div className="bg-darkGray rounded-lg">
              <div className="p-2 flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <div className="bg-primaryOpacity rounded-lg text-primary">
                    <i className="icon-notifications text-primary text-lg"></i>
                  </div>
                  <Text className="text-white">Mute notifications</Text>
                </div>
                <Switch
                  checked={isMuted}
                  onChange={handleToggleNotificationMute}
                  size="small"
                  style={{
                    backgroundColor: isMuted ? "#FF6D00" : "#373737",
                  }}
                />
              </div>
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <div
      className="contact-details-sidebar h-full border-l-[1px] border-solid border-[#373737] bg-gray"
      style={{
        height: "100vh",
        width: "100%",
        position: "relative",
        overflow: "hidden",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.2s ease-in-out",
      }}
    >
      {/* Main Contact Details */}
      <div
        className="contact-details-main"
        style={{
          display: showMediaDocsLinks ? "none" : "block",
          height: "100%",
        }}
      >
        {/* Header */}
        <Row className=" py-2 !px-5 border-b-[1px] border-solid border-[#373737] items-center justify-between">
          <div className="flex items-center h-[71px]">
            <Button
              type="text"
              onClick={onClose}
              className="border-liteGray bg-gray flex items-center justify-center p-0"
              shape="circle"
              size="middle"
            >
              <CloseOutlined className="text-base" />
            </Button>
            <Text className="text-white font-medium text-xl ml-3">Details</Text>
          </div>
        </Row>

        <div
          className="details-content overflow-y-auto"
          style={{ height: "calc(100vh - 92px)" }}
        >
          {renderContent()}
        </div>
      </div>

      {/* Media Docs Links Section - Fixed for desktop view */}
      {showMediaDocsLinks && (
        <div
          className="media-docs-links-section"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 20,
            backgroundColor: "var(--gray)",
          }}
        >
          <MediaDocsLinks
            onClose={handleMediaDocsClose}
            windowWidth={windowWidth}
            activeTab={activeTab}
            activeItem={activeItem}
            // mediaFiles={roomDetails?.media || []}
            // docFiles={roomDetails?.docs || []}
            // linkItems={roomDetails?.links || []}
          />
        </div>
      )}
    </div>
  );
};

export default ContactDetails;
