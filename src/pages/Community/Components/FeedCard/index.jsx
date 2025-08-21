import {
  Button,
  Col,
  DatePicker,
  Divider,
  Input,
  Row,
  TimePicker,
  Typography,
  Modal,
  Skeleton,
  Avatar,
  Dropdown,
  message,
} from "antd";
import React, { useEffect, useState, useRef, useCallback } from "react";
import "./FeedCard.scss";
import EmojiPicker from "emoji-picker-react"; // You need to install this package
import {
  addComment,
  deleteFeedAction,
  feedCommentList,
  publishExistingFeedAction,
  scheduleExistingFeedAction,
  toggleFeedLikeAction,
  toggleFeedPinAction,
  fetchFeedById,
  toggleFeedLikeCommentAction,
} from "../../../../services/Store/Feed/action";
import { useDispatch, useSelector } from "react-redux";
import {
  LikeOutlined,
  LikeFilled,
  PushpinFilled,
  PushpinOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useReverb } from "../../../../utils/useReverb";
import Slider from "react-slick";
import NewPostModal from "../NewPostModal";
import {
  convertUTCToBrowserTimezone,
  getStorage,
} from "../../../../utils/commonfunction";

// Recursive Comment Component
const CommentItem = ({
  commentItem,
  level = 1,
  onReply,
  onLikeComment,
  userForEdit,
  formatDate,
  isLast = false,
  hasParent = false,
}) => {
  const { Text } = Typography;
  const [showReplies, setShowReplies] = useState(false);
  const [visibleRepliesCount, setVisibleRepliesCount] = useState(5); // Show 5 replies initially
  const REPLIES_PER_LOAD = 5; // Load 5 more replies each time

  // Calculate margin based on level
  const getMarginLeft = () => {
    if (level === 1) return "0px";
    if (level === 2) return "40px";
    if (level === 3) return "40px";
    return "40px"; // Max depth
  };

  const hasChildren = commentItem.replies && commentItem.replies.length > 0;
  const totalReplies = commentItem.replies?.length || 0;
  const remainingReplies = totalReplies - visibleRepliesCount;
  const hasMoreReplies = remainingReplies > 0;

  const toggleReplies = () => {
    setShowReplies(!showReplies);
    // Reset visible count when closing replies
    if (showReplies) {
      setVisibleRepliesCount(REPLIES_PER_LOAD);
    }
  };

  const loadMoreReplies = () => {
    setVisibleRepliesCount((prev) => prev + REPLIES_PER_LOAD);
  };

  // Get the replies to display based on visible count
  const visibleReplies =
    commentItem.replies?.slice(0, visibleRepliesCount) || [];

  return (
    <div style={{ marginLeft: getMarginLeft() }} className="relative">
      {/* Vertical line from parent (for child comments) */}
      {level > 1 && (
        <>
          {/* Horizontal line connecting to parent's vertical line */}
          {/* <div
            style={{
              position: "absolute",
              left: "-20px",
              top: "20px",
              width: "20px",
              height: "1px",
              backgroundColor: "#404040",
              zIndex: 1,
            }}
          /> */}
          {/* Vertical line continuing from parent (only if not last comment) */}
          {/* {!isLast && (
            <div
              style={{
                position: "absolute",
                left: "-20px",
                top: "20px",
                height: "calc(100% + 20px)",
                width: "1px",
                backgroundColor: "#404040",
                zIndex: 1,
              }}
            />
          )} */}
        </>
      )}

      <div className="commentSection mt-5 relative">
        {/* Vertical line from this comment to its children */}
        {/* {hasChildren && showReplies && (
          <div
            style={{
              position: "absolute",
              left: "20px", // Position at center of avatar (16px radius + 4px margin)
              top: "45px", // Below the avatar
              bottom: "0px",
              width: "1px",
              backgroundColor: "#404040",
              zIndex: 1,
            }}
          />
        )} */}

        <div className="flex items-start justify-between comment-content relative z-10">
          <div className="flex gap-3 items-center">
            <div className="h-8 w-8 rounded-full relative">
              {commentItem.profile_photo_path ? (
                <Avatar
                  src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${commentItem.profile_photo_path
                    }`}
                  alt="Profile picture"
                  className="object-cover h-full w-full rounded-full"
                />
              ) : (
                <Avatar
                  style={{
                    backgroundColor: "#fde3cf",
                    color: "#f56a00",
                  }}
                  alt="Profile picture"
                  className="object-cover h-full w-full rounded-full !text-[20px] font-normal"
                >
                  {commentItem.name[0]}
                </Avatar>
              )}
            </div>
            <div>
              <div className="font-semibold text-white text-sm">
                {commentItem.name}
              </div>
              <div className="text-grayText text-sm flex items-center gap-1 mt-1">
                {commentItem.role} • {formatDate(commentItem.created_at)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 comment-content relative z-10">
          <p className="text-zinc-300 mb-3">
            {commentItem.mentionedUser && (
              <span className="text-primary font-semibold">
                @{commentItem.mentionedUser.name}{" "}
              </span>
            )}
            {commentItem.content}
          </p>
        </div>

        {/* Comment Actions */}
        <div className="flex items-center gap-4 mt-2 comment-content relative z-10">
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => onLikeComment(commentItem.id, commentItem.name, commentItem.level)}
          >
            {commentItem.is_comment_liked ? (
              <LikeFilled className="text-primary text-sm cursor-pointer" />
            ) : (
              <LikeOutlined className="text-grayText text-sm cursor-pointer" />
            )}
            <Text className="text-xs">
              {commentItem.likes_count > 0 ? commentItem.likes_count : "Like"}
            </Text>
          </div>

          {/* Show reply button for all levels */}
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={() =>
              onReply(commentItem.id, commentItem.name, commentItem.level)
            }
          >
            <i className="icon-comment text-grayText text-sm" />
            <Text className="text-xs">Reply</Text>
          </div>

          {/* Toggle replies - Hide for level 3 comments */}
          {commentItem.replies_count > 0 && commentItem.level <= 2 && (
            <div
              className="flex items-center gap-1 cursor-pointer"
              onClick={toggleReplies}
            >
              <span className="text-grayText text-xs">
                {showReplies ? (
                  <Text className="text-xs">Hide replies</Text>
                ) : (
                  <span>
                    <Text className="text-xs">View</Text> &nbsp;
                    {commentItem.replies_count === 1 ? (
                      <Text className="text-xs">reply</Text>
                    ) : (
                      <Text className="text-xs">replies</Text>
                    )}{" "}
                    ({commentItem.replies_count})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Render replies with pagination */}
      {hasChildren && showReplies && (
        <div className="mt-1 relative border-l border-liteGray ml-2">
          {/* Render visible replies */}
          {visibleReplies.map((reply, index) => {
            const isLastReply =
              index === visibleReplies.length - 1 && !hasMoreReplies;
            return (
              <CommentItem
                key={reply.id}
                commentItem={reply}
                level={level + 1}
                onReply={onReply}
                onLikeComment={onLikeComment}
                userForEdit={userForEdit}
                formatDate={formatDate}
                isLast={isLastReply}
                hasParent={true}
              />
            );
          })}

          {/* Show "View more" button if there are more replies */}
          {hasMoreReplies && (
            <div className="mt-3 ml-6">
              <div
                className="flex items-center gap-1 cursor-pointer"
                onClick={loadMoreReplies}
              >
                <span className="text-grayText text-xs font-medium hover:text-primary transition-colors">
                  View +{remainingReplies} more{" "}
                  {remainingReplies === 1 ? "reply" : "replies"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FeedCard = ({ type = "all", feedData = {}, onFeedUpdate }) => {
  const { Text, Title } = Typography;

  const dispatch = useDispatch();

  // Add styles for comment tree lines
  const commentTreeStyles = `
    .comment-tree-container {
      position: relative;
    }
    
    .comment-tree-container .commentSection {
      position: relative;
    }
    
    .comment-tree-line {
      pointer-events: none;
      z-index: 1;
    }
    
    .comment-tree-line.horizontal {
      position: absolute;
      height: 1px;
      background-color: #404040;
      left: -20px;
      top: 20px;
      width: 20px;
    }
    
    .comment-tree-line.vertical {
      position: absolute;
      width: 1px;
      background-color: #404040;
      left: -20px;
      top: 20px;
    }
    
    .comment-content {
      position: relative;
      z-index: 2;
    }
  `;

  // Insert styles into document head
  React.useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = commentTreeStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Replace your existing useReverb call with:
  const {
    data: commentData,
    error: commentError,
    isConnected: commentisConnected,
  } = useReverb(`feed.${feedData?.id}`, ".commentCountUpdated");

  const {
    data: likeData,
    error: likeError,
    isConnected: likeisConnected,
  } = useReverb(`feed.${feedData?.id}`, ".likeCountUpdated");

  const {
    data: userActivityUpdate,
    error: userActivityUpdateError,
    isConnected: userActivityUpdateisConnected,
  } = useReverb(`all-users-status`, `.userActivity`);

  const { userForEdit } = useSelector((state) => state?.usersmanagement);
  const { feedDetailsLoading } = useSelector((state) => state?.feeds);

  const userLoginRole = getStorage("userLoginRole", true);

  const [width, setWidth] = useState(0);
  const [isCommentSection, setIsCommentSection] = useState(false);
  const [isSchedule, setIsSchedule] = useState(false);
  const [showCommentButton, setShowCommentButton] = useState(true);
  const [comment, setComment] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [datePicker, setDatePicker] = useState("");
  const [timePicker, setTimePicker] = useState("");

  // Add loading states for buttons
  const [discardLoading, setDiscardLoading] = useState(false);
  const [scheduleButtonLoading, setScheduleButtonLoading] = useState(false);
  const [postLoading, setPostLoading] = useState(false);

  // Local feed data state to manage updates
  const [localFeedData, setLocalFeedData] = useState(feedData);

  // Comments data state - Updated to handle nested structure
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [totalCommentPages, setTotalCommentPages] = useState(1);
  const [loadingComments, setLoadingComments] = useState(false);
  const [totalCommentsCount, setTotalCommentsCount] = useState(0);

  // Reply state
  const [replyingTo, setReplyingTo] = useState(null); // { id, name, level }

  // Media modal state
  const [isMediaModalVisible, setIsMediaModalVisible] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const [selectedDate, setSelectedDate] = useState(null);

  // Add state for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  // Add state for fetched feed data for editing
  const [fetchedEditFeedData, setFetchedEditFeedData] = useState(null);

  const emojiPickerRef = useRef(null);
  const inputRef = useRef(null);
  const carouselRef = useRef(null);
  const commentsEndRef = useRef(null);

  // Add ref for video elements in modal
  const videoRefs = useRef([]);

  // Helper function to ensure comments have proper level property
  const setCommentLevels = (commentsList, currentLevel = 1) => {
    return commentsList.map((comment) => {
      const updatedComment = {
        ...comment,
        level: currentLevel,
        replies: comment.replies || [], // Ensure replies array exists
      };

      if (comment.replies && comment.replies.length > 0) {
        updatedComment.replies = setCommentLevels(
          comment.replies,
          currentLevel + 1
        );
      }

      return updatedComment;
    });
  };

  // Helper function to count total comments recursively
  const countTotalComments = (commentsList) => {
    let count = 0;
    commentsList.forEach((comment) => {
      count++;
      if (comment.replies && comment.replies.length > 0) {
        count += countTotalComments(comment.replies);
      }
    });
    return count;
  };

  // Helper function to find comment by ID recursively
  const findCommentById = (commentsList, id) => {
    for (let comment of commentsList) {
      if (comment.id === id) {
        return comment;
      }
      if (comment.replies && comment.replies.length > 0) {
        const found = findCommentById(comment.replies, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Fixed Helper function to update comment like status recursively
  const updateCommentLikeStatus = (commentsList, commentId, isLiked, likeCount) => {
    return commentsList.map((comment) => {
      if (comment.id === commentId) {
        return {
          ...comment,
          is_comment_liked: isLiked, // Fixed: use correct field name
          likes_count: likeCount,
        };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentLikeStatus(comment.replies, commentId, isLiked, likeCount),
        };
      }
      return comment;
    });
  };

  // Helper function to add reply to comment tree
  const addReplyToCommentTree = (commentsList, parentId, newReply) => {
    return commentsList.map((comment) => {
      if (comment.id === parentId) {
        // If this is the parent comment, check its level
        if (comment.level === 3) {
          // Level 3 comments should not have children, just update reply count
          return {
            ...comment,
            replies_count: (comment.replies_count || 0) + 1,
          };
        }

        // Normal nesting for level 1 and 2
        return {
          ...comment,
          replies: comment.replies
            ? [newReply, ...comment.replies]
            : [newReply],
          replies_count: (comment.replies_count || 0) + 1,
        };
      }

      if (comment.replies && comment.replies.length > 0) {
        // Check if any direct reply is the parent we're looking for
        const parentExists = comment.replies.some(
          (reply) => reply.id === parentId
        );

        if (parentExists) {
          // Find the parent comment to check its level
          const parentComment = comment.replies.find(
            (reply) => reply.id === parentId
          );

          // If the parent is at level 3, add reply as sibling and increase level 2 parent count
          if (parentComment && parentComment.level === 3) {
            return {
              ...comment,
              replies: addReplyToLevel3(comment.replies, parentId, newReply),
              replies_count: (comment.replies_count || 0) + 1, // Increase level 2 parent count
            };
          }
          // Otherwise, normal nesting
          else {
            return {
              ...comment,
              replies: addReplyToCommentTree(
                comment.replies,
                parentId,
                newReply
              ),
            };
          }
        }

        // Continue recursive search in deeper levels
        const updatedReplies = addReplyToCommentTree(
          comment.replies,
          parentId,
          newReply
        );
        if (updatedReplies !== comment.replies) {
          return {
            ...comment,
            replies: updatedReplies,
          };
        }
      }

      return comment;
    });
  };

  // Helper function to add reply to level 3 comments as siblings
  const addReplyToLevel3 = (commentsList, parentId, newReply) => {
    let parentIndex = -1;

    // Find the parent comment index
    for (let i = 0; i < commentsList.length; i++) {
      if (commentsList[i].id === parentId) {
        parentIndex = i;
        break;
      }
    }

    if (parentIndex !== -1) {
      // Create a new array
      const updatedComments = [...commentsList];

      // DON'T update the level 3 parent's reply count here
      // The level 2 parent count will be updated in addReplyToCommentTree

      // Insert the new reply right after the parent comment
      updatedComments.splice(parentIndex + 1, 0, newReply);

      return updatedComments;
    }

    return commentsList;
  };

  // Function to pause all videos
  const pauseAllVideos = useCallback(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.pause();
        video.currentTime = 0; // Reset to beginning
      }
    });
  }, []);

  // Function to handle modal close
  const handleModalClose = useCallback(() => {
    pauseAllVideos();
    setIsMediaModalVisible(false);
  }, [pauseAllVideos]);

  // Function to convert date and time to UTC
  const convertToUTC = (dateString, timeString) => {
    if (!dateString || !timeString) {
      console.warn("Date or time is missing");
      return null;
    }

    try {
      // Combine date and time strings
      const dateTimeString = `${dateString} ${timeString}`;

      // Create a Date object from the combined string (this will be in local timezone)
      const localDateTime = new Date(dateTimeString);

      // Check if the date is valid
      if (isNaN(localDateTime.getTime())) {
        console.error("Invalid date/time combination:", dateTimeString);
        return null;
      }

      // Convert to UTC ISO string
      const utcDateTime = localDateTime.toISOString();

      return utcDateTime;
    } catch (error) {
      console.error("Error converting to UTC:", error);
      return null;
    }
  };

  // Disable dates before today
  const disabledDate = (current) => {
    return current && current < new Date().setHours(0, 0, 0, 0);
  };

  // Disable times before current time if the date is today
  const disabledTime = (now) => {
    const currentDate = new Date();
    const isToday =
      selectedDate &&
      selectedDate.year() === currentDate.getFullYear() &&
      selectedDate.month() === currentDate.getMonth() &&
      selectedDate.date() === currentDate.getDate();

    if (isToday) {
      return {
        disabledHours: () => {
          return Array.from({ length: currentDate.getHours() }, (_, i) => i);
        },
        disabledMinutes: (hour) => {
          if (hour === currentDate.getHours()) {
            return Array.from(
              { length: currentDate.getMinutes() },
              (_, i) => i
            );
          }
          return [];
        },
      };
    }
    return {};
  };

  // Function to check if user is active
  const isUserActive = () => {
    if (!userActivityUpdate || !localFeedData) return false;

    // Check if the user_id from the activity update matches the feed creator's id
    return (
      userActivityUpdate.user_id === localFeedData.user_id &&
      userActivityUpdate.is_user_active === true
    );
  };

  // Fixed Like comment function with optimistic updates
  const onClickLikeComment = useCallback((commentId, commentName, commentLevel) => {
    // Get current comment state for optimistic update
    const currentComment = findCommentById(comments, commentId);
    if (!currentComment) return;

    // Optimistic update - toggle immediately
    const optimisticIsLiked = !currentComment.is_comment_liked;
    const optimisticLikeCount = optimisticIsLiked 
      ? (currentComment.likes_count || 0) + 1 
      : Math.max((currentComment.likes_count || 0) - 1, 0);

    // Update UI immediately for better UX
    setComments((prevComments) =>
      updateCommentLikeStatus(prevComments, commentId, optimisticIsLiked, optimisticLikeCount)
    );

    const payload = {
      comment_id: commentId,
    };

    dispatch(toggleFeedLikeCommentAction(payload))
      .then((res) => {
        if (res?.payload?.meta?.status === 200) {
          // Extract the like status and count from response
          const responseData = res?.payload?.data;
          
          // Handle different possible response structures
          const isLiked = responseData?.is_liked ?? responseData?.is_comment_liked ?? responseData?.liked ?? optimisticIsLiked;
          const likeCount = responseData?.like_count ?? responseData?.likes_count ?? responseData?.total_likes ?? optimisticLikeCount;

          console.log("Like comment response:", {
            responseData,
            isLiked,
            likeCount,
            commentId,
            optimisticIsLiked,
            optimisticLikeCount
          });

          // Update with actual API response (in case optimistic update was wrong)
          setComments((prevComments) =>
            updateCommentLikeStatus(prevComments, commentId, isLiked, likeCount)
          );
        }
      })
      .catch((error) => {
        console.error("Error liking comment:", error);
        // Revert optimistic update on error
        setComments((prevComments) =>
          updateCommentLikeStatus(prevComments, commentId, currentComment.is_comment_liked, currentComment.likes_count || 0)
        );
      });
  }, [dispatch, comments]);

  // Update local feed data when feedData prop changes
  useEffect(() => {
    setLocalFeedData(feedData);
  }, [feedData]);

  // Clean up videos when component unmounts
  useEffect(() => {
    return () => {
      pauseAllVideos();
    };
  }, [pauseAllVideos]);

  // Listen for comment count updates via socket
  useEffect(() => {
    if (commentData && commentData.feedId === localFeedData?.id) {
      // Update the local feed data with the new comment count
      setLocalFeedData((prevData) => ({
        ...prevData,
        engagement: {
          ...prevData.engagement,
          comment_count: commentData.commentCount,
        },
      }));

      // Notify parent component about the update
      if (onFeedUpdate) {
        onFeedUpdate(localFeedData.id, "commented", {
          engagement: {
            ...localFeedData.engagement,
            comment_count: commentData.commentCount,
          },
        });
      }
    }
  }, [commentData]);

  // Listen for like count updates via socket
  useEffect(() => {
    if (likeData && likeData.feedId === localFeedData?.id) {
      // Update the local feed data with the new like count
      setLocalFeedData((prevData) => ({
        ...prevData,
        engagement: {
          ...prevData.engagement,
          like_count: likeData.likeCount,
        },
      }));

      // Notify parent component about the update
      if (onFeedUpdate) {
        onFeedUpdate(localFeedData.id, "liked", {
          engagement: {
            ...localFeedData.engagement,
            like_count: likeData.likeCount,
          },
        });
      }
    }
  }, [likeData]);

  // Get slider settings based on media count
  const getSliderSettings = () => {
    const baseSettings = {
      dots: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      // Add beforeChange handler to pause videos when sliding
      beforeChange: (current, next) => {
        // Pause all videos when changing slides
        pauseAllVideos();
      },
    };

    // Check if we have media and how many items
    if (hasMedia() && localFeedData.media.length === 1) {
      // For a single item, disable infinite scroll and arrows
      return {
        ...baseSettings,
        infinite: false,
        arrows: false,
      };
    }

    // Default settings for multiple items
    return {
      ...baseSettings,
      infinite: true,
    };
  };

  useEffect(() => {
    setWidth(window.innerWidth);

    // Add event listener for clicks outside emoji picker
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  window.addEventListener("resize", () => {
    setWidth(window.innerWidth);
  });

  const onChangeDate = (date, dateString) => {
    setDatePicker(dateString);
    setSelectedDate(date);
  };

  const onChangeTime = (time, timeString) => {
    setTimePicker(timeString);
  };

  const onClickSchedule = () => {
    setScheduleButtonLoading(true);
    setIsSchedule(!isSchedule);

    // Add a small delay to show the loading state before turning it off
    setTimeout(() => {
      setScheduleButtonLoading(false);
    }, 300);
  };

  const handleCommentKeyPress = (e) => {
    // Check if Enter key is pressed and there's no loading state
    if (e.key === "Enter" && !loadingComments) {
      e.preventDefault(); // Prevent default Enter behavior
      handleSubmitComment();
    }
  };

  const onClickPost = () => {
    setPostLoading(true);

    if (isSchedule) {
      // Convert date and time to UTC before sending
      const utcDateTime = convertToUTC(datePicker, timePicker);

      if (!utcDateTime) {
        setPostLoading(false);
        message.error("Please select a valid date and time");
        return;
      }

      const payload = {
        feed_id: localFeedData?.id,
        scheduled_at: utcDateTime,
      };

      dispatch(scheduleExistingFeedAction(payload))
        .then((res) => {
          setPostLoading(false);
          if (res?.payload?.meta?.status === 200) {
            setIsSchedule(false);

            // Update local feed data immediately with scheduled status
            const updatedFeed = res?.payload?.data?.feed || {
              ...localFeedData,
              status: "Scheduled",
              scheduled_at: utcDateTime,
            };

            // Normalize the updated feed
            const normalizedFeed = {
              ...updatedFeed,
              status: "Scheduled",
            };

            setLocalFeedData(normalizedFeed);

            // Notify parent component about the update with the complete updated feed
            if (onFeedUpdate) {
              onFeedUpdate(localFeedData.id, "scheduled", normalizedFeed);
            }
          }
        })
        .catch(() => {
          setPostLoading(false);
        });
    } else {
      const payload = {
        feed_id: localFeedData?.id,
        role: userLoginRole?.name,
      };

      dispatch(publishExistingFeedAction(payload))
        .then((res) => {
          setPostLoading(false);
          if (res?.payload?.meta?.status === 200) {
            // Update local feed data immediately with published status
            const updatedFeed = res?.payload?.data?.feed || {
              ...localFeedData,
              status: "Published",
            };

            // Normalize the updated feed
            const normalizedFeed = {
              ...updatedFeed,
              status: "Published",
            };

            setLocalFeedData(normalizedFeed);

            // Notify parent component about the update
            if (onFeedUpdate) {
              onFeedUpdate(localFeedData?.id, "published", normalizedFeed);
            }
          }
        })
        .catch(() => {
          setPostLoading(false);
        });
    }
  };

  const onClickDiscard = () => {
    setDiscardLoading(true);

    dispatch(deleteFeedAction(localFeedData?.id))
      .then((res) => {
        setDiscardLoading(false);
        if (res?.payload?.meta?.status === 200) {
          // Notify parent component about the update
          if (onFeedUpdate) {
            onFeedUpdate(localFeedData.id, "deleted");
          }
        }
      })
      .catch(() => {
        setDiscardLoading(false);
      });
  };

  const onClickComment = () => {
    setIsCommentSection(!isCommentSection);
  };

  useEffect(() => {
    if (width < 768) {
      setShowCommentButton(false);
    } else {
      setShowCommentButton(true);
    }
  }, [width]);

  // Fetch comments when comment section is opened
  useEffect(() => {
    if (isCommentSection && localFeedData?.id) {
      // Reset comment state when opening the section
      setComments([]);
      setCommentPage(1);
      fetchComments(1);
    } else if (!isCommentSection) {
      // Clear reply state when closing comment section
      setReplyingTo(null);
      setComment("");
    }
  }, [isCommentSection]);

  // Updated function to fetch comments with new structure
  const fetchComments = useCallback(
    (page = 1) => {
      if (!localFeedData?.id || loadingComments) return;

      setLoadingComments(true);

      let data = {
        data: {
          feed_id: localFeedData?.id,
        },
        params: {
          page: page,
          per_page: 10,
        },
      };

      dispatch(feedCommentList(data))
        .then((res) => {
          if (res?.payload?.meta?.status === 200) {
            const responseData = res?.payload?.data;

            if (responseData && responseData.comments) {
              // Set proper levels for all comments and ensure they have replies array
              const commentsWithLevels = setCommentLevels(
                responseData.comments
              );

              // Update comments state with the new nested structure
              setComments((prevComments) =>
                page === 1
                  ? commentsWithLevels
                  : [...prevComments, ...commentsWithLevels]
              );

              // Update pagination info
              setTotalCommentPages(responseData.last_page || 1);
              setTotalCommentsCount(responseData.count || 0);
            }
          }
          setLoadingComments(false);
        })
        .catch(() => {
          setLoadingComments(false);
        });
    },
    [dispatch, localFeedData?.id, loadingComments]
  );

  // Handle infinite scroll for comments
  const handleScroll = useCallback(
    (e) => {
      if (
        !commentsEndRef.current ||
        loadingComments ||
        commentPage >= totalCommentPages
      )
        return;

      const element = e.target;
      if (
        element.scrollHeight - element.scrollTop <=
        element.clientHeight + 100
      ) {
        const nextPage = commentPage + 1;
        setCommentPage(nextPage);
        fetchComments(nextPage);
      }
    },
    [commentPage, totalCommentPages, loadingComments, fetchComments]
  );

  const handleEmojiClick = (emojiObject) => {
    setComment((prevComment) => prevComment + emojiObject.emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const onClickPin = () => {
    const payload = {
      feed_id: localFeedData?.id,
    };
    dispatch(toggleFeedPinAction(payload)).then((res) => {
      if (res?.payload?.meta?.status === 200) {
        // Update local state immediately
        const updatedFeed = res?.payload?.data?.feed;
        const isPinned = res?.payload?.data?.is_pinned;

        if (updatedFeed) {
          // Update entire feed data if available
          setLocalFeedData(updatedFeed);

          // Notify parent component with full updated feed data
          if (onFeedUpdate) {
            onFeedUpdate(localFeedData.id, "pinned", updatedFeed);
          }
        } else if (isPinned !== undefined) {
          // Create updated feed with pin status
          const updatedFeedData = {
            ...localFeedData,
            is_pinned: isPinned,
          };

          // Update local state
          setLocalFeedData(updatedFeedData);

          // Notify parent component with the updated feed for proper handling
          if (onFeedUpdate) {
            onFeedUpdate(localFeedData.id, "pinned", updatedFeedData);
          }
        }
      }
    });
  };

  const onClickLike = () => {
    const payload = {
      feed_id: localFeedData?.id,
      role: userLoginRole?.name,
    };
    dispatch(toggleFeedLikeAction(payload)).then((res) => {
      if (res?.payload?.meta?.status === 200) {
        // Extract data from response
        const isLiked = res?.payload?.data?.is_liked;
        const likeCount = res?.payload?.data?.like_count;

        // Create updated feed object
        const updatedFeed = {
          ...localFeedData,
          is_liked: isLiked,
          engagement: {
            ...localFeedData.engagement,
            like_count: likeCount,
          },
        };

        // Update local state
        setLocalFeedData(updatedFeed);

        // Notify parent component
        if (onFeedUpdate) {
          onFeedUpdate(localFeedData.id, "liked", {
            is_liked: isLiked,
            engagement: {
              ...localFeedData.engagement,
              like_count: likeCount,
            },
          });
        }
      }
    });
  };

  const toggleEmojiPicker = (e) => {
    e.stopPropagation();
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleDelete = () => {
    setIsDeleteModalVisible(true);
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setIsDeleteModalVisible(false);
  };

  // Handle edit button click - fetch feed data first
  const handleEdit = () => {
    dispatch(fetchFeedById(localFeedData?.id))
      .then((res) => {
        if (res?.payload?.meta?.status === 200) {
          setFetchedEditFeedData(res?.payload?.data?.feed);
          setIsEditModalOpen(true);
        } else {
          console.error("Failed to fetch feed data for editing");
          message.error("Failed to load feed data for editing");
        }
      })
      .catch((error) => {
        console.error("Error fetching feed data:", error);
        message.error("Failed to load feed data for editing");
      });
  };

  // Updated handleSubmitComment to handle both regular comments and replies
  const handleSubmitComment = () => {
    // Only proceed if there's actual comment text
    if (!comment.trim()) return;

    if (replyingTo) {
      // Remove the @username mention from the beginning of the comment
      const mentionPrefix = `@${replyingTo.name} `;
      const actualContent = comment.startsWith(mentionPrefix)
        ? comment.slice(mentionPrefix.length).trim()
        : comment.trim();

      // Don't submit if there's no actual content after removing mention
      if (!actualContent) return;

      // Handle reply submission
      const payload = {
        feed_id: localFeedData?.id,
        content: actualContent, // Send only the actual typed content
        parent_id: replyingTo.id,
        mentioned_user: replyingTo.name,
        role: userLoginRole?.name,
      };

      // Clear the input field and reset reply state immediately
      setComment("");
      const replyingToData = replyingTo;
      setReplyingTo(null);

      dispatch(addComment(payload)).then((res) => {
        if (res?.payload?.meta?.status === 200) {
          const newReply = res?.payload?.data?.comment;

          if (newReply) {
            // Determine the level for the new reply
            let newLevel;
            if (replyingToData.level === 1) {
              newLevel = 2;
            } else if (replyingToData.level === 2) {
              newLevel = 3;
            } else if (replyingToData.level === 3) {
              // Level 3 replies stay at level 3 (siblings)
              newLevel = 3;
            }

            // Set the proper level for the new reply
            const adjustedReply = {
              ...newReply,
              level: newLevel,
              replies: newReply.replies || [],
            };

            // Add the reply to the appropriate parent comment
            setComments((prevComments) =>
              addReplyToCommentTree(
                prevComments,
                replyingToData.id,
                adjustedReply
              )
            );

            // Update total comments count
            setTotalCommentsCount((prev) => prev + 1);

            // Update engagement
            const commentCount = res?.payload?.data?.comment_count;
            const updatedEngagement = {
              ...localFeedData.engagement,
              comment_count:
                commentCount ||
                localFeedData.engagement?.comment_count + 1 ||
                1,
            };

            setLocalFeedData((prev) => ({
              ...prev,
              engagement: updatedEngagement,
            }));

            if (onFeedUpdate) {
              onFeedUpdate(localFeedData.id, "commented", {
                engagement: updatedEngagement,
              });
            }
          }
        }
      });
    } else {
      // Handle regular comment submission
      const payload = {
        feed_id: localFeedData?.id,
        content: comment.trim(),
        role: userLoginRole?.name,
      };

      // Clear the input field immediately so the user sees the change
      setComment("");

      dispatch(addComment(payload)).then((res) => {
        if (res?.payload?.meta?.status === 200) {
          // Get the new comment from the response
          const newComment = res?.payload?.data?.comment;

          if (newComment) {
            // Ensure the new comment has proper level property
            const commentWithLevel = {
              ...newComment,
              level: 1,
              replies: newComment.replies || [],
            };

            // Add the new comment to the beginning of the comments list
            setComments((prevComments) => [commentWithLevel, ...prevComments]);

            // Update total comments count
            setTotalCommentsCount((prev) => prev + 1);

            // Get the updated comment count from the response
            const commentCount = res?.payload?.data?.comment_count;

            // Create updated engagement object
            const updatedEngagement = {
              ...localFeedData.engagement,
              comment_count:
                commentCount ||
                localFeedData.engagement?.comment_count + 1 ||
                1,
            };

            // Update local feed data with new engagement info
            setLocalFeedData((prev) => ({
              ...prev,
              engagement: updatedEngagement,
            }));

            // Optionally notify parent component about the comment count update
            if (onFeedUpdate) {
              onFeedUpdate(localFeedData.id, "commented", {
                engagement: updatedEngagement,
              });
            }
          }
        }
      });
    }
  };

  // Updated function to handle reply button clicks
  const handleReply = useCallback((commentId, commentName, commentLevel) => {
    setReplyingTo({ id: commentId, name: commentName, level: commentLevel });
    // Prefill the input with the user's name
    setComment(`@${commentName} `);
    // Focus the main input
    if (inputRef.current) {
      inputRef.current.focus();
      // Set cursor position after the prefilled text
      setTimeout(() => {
        if (inputRef.current) {
          const input = inputRef.current.input;
          const cursorPos = `@${commentName} `.length;
          input.setSelectionRange(cursorPos, cursorPos);
        }
      }, 0);
    }
  }, []);

  // Function to cancel reply mode
  const cancelReply = () => {
    setReplyingTo(null);
    setComment("");
  };

  // Handle delete action
  const handleConfirmDelete = () => {
    setDeleteLoading(true);
    dispatch(deleteFeedAction(localFeedData?.id))
      .then((res) => {
        setDeleteLoading(false);
        if (res?.payload?.meta?.status === 200) {
          // Close the modal
          setIsDeleteModalVisible(false);
          // Notify parent component about the deletion
          if (onFeedUpdate) {
            onFeedUpdate(localFeedData.id, "deleted");
          }
        }
      })
      .catch((error) => {
        setDeleteLoading(false);
        console.error("Delete error:", error);
      });
  };

  // More options menu items
  const moreOptionsMenu = {
    items: [
      {
        key: "edit",
        icon: <EditOutlined />,
        label: "Edit",
        onClick: handleEdit,
        disabled: feedDetailsLoading,
      },
      {
        key: "delete",
        icon: <DeleteOutlined />,
        label: "Delete",
        danger: true,
        onClick: handleDelete,
      },
    ],
  };

  // Check if current user is the owner of the feed
  const isOwner = () => {
    return localFeedData?.user_id === userForEdit?.user?.id;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();

      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "pm" : "am";
      const formattedHours = hours % 12 === 0 ? 12 : hours % 12;

      return `${month}/${day}, ${formattedHours}:${minutes} ${ampm}`;
    } catch (error) {
      return "";
    }
  };

  // Check if media exists
  const hasMedia = () => {
    return localFeedData.media && localFeedData.media.length > 0;
  };

  // Helper to determine if feed is pinned
  const isPinned = () => {
    return localFeedData.is_pinned === true;
  };

  // Helper to determine if feed is a draft
  const isDraft = () => {
    return localFeedData.status === "Draft";
  };

  // Helper to determine if feed is scheduled
  const isScheduled = () => {
    return localFeedData.status === "Scheduled";
  };

  // Open media modal with specific index
  const openMediaModal = (index) => {
    setSelectedMediaIndex(index);
    setIsMediaModalVisible(true);

    // Wait for modal to open, then go to the selected slide
    setTimeout(() => {
      if (carouselRef.current) {
        carouselRef.current.slickGoTo(index);
      }
    }, 100);
  };

  // Function to render content with hashtags in red
  const renderContentWithHashtags = (content) => {
    if (!content) return null;

    // First, replace HTML br tags with actual newlines
    const contentWithNewlines = content
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/\n\s*\n/g, "\n\n"); // Clean up multiple consecutive newlines

    // Split by newlines to handle line breaks
    const lines = contentWithNewlines.split("\n");

    return lines.map((line, lineIndex) => {
      if (line.trim() === "") {
        // Empty line - render as line break
        return <br key={`br-${lineIndex}`} />;
      }

      // Split each line by spaces to handle hashtags
      const parts = line.split(/(\s+)/);

      const processedLine = parts.map((part, partIndex) => {
        // Check if the part is a hashtag
        if (part.startsWith("#") && part.length > 1) {
          return (
            <span
              key={`${lineIndex}-${partIndex}`}
              style={{ color: "#5A76FF" }}
            >
              {part}
            </span>
          );
        }
        // Return normal text
        return <span key={`${lineIndex}-${partIndex}`}>{part}</span>;
      });

      return (
        <span key={lineIndex}>
          {processedLine}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  // Render media thumbnails
  const renderMediaThumbnails = () => {
    if (!hasMedia()) return null;

    const mediaItems = localFeedData.media;

    // If only one media item
    if (mediaItems.length === 1) {
      const media = mediaItems[0];
      return (
        <div className="mt-2 cursor-pointer" onClick={() => openMediaModal(0)}>
          {media.type === "image" ? (
            <img
              src={media.url}
              alt="Post media"
              className={`w-full ${type === "published" || type === "pinned" || type === "draft"
                ? "h-[24vh]"
                : "h-[40vh]"
                } object-cover rounded-2xl`}
            />
          ) : (
            <div className="relative">
              <video
                src={media.url}
                className={`w-full ${type === "published" || type === "pinned" || type === "draft"
                  ? "h-[24vh]"
                  : "h-[40vh]"
                  } object-cover rounded-2xl`}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  type="primary"
                  shape="circle"
                  size="large"
                  icon={
                    <i
                      className="icon-play text-white pl-1"
                      style={{ fontSize: "42px" }}
                    />
                  }
                  className={`flex justify-center items-center p-8 !px-8 borderbtn "}`}
                />
              </div>
            </div>
          )}
        </div>
      );
    }

    // If multiple media items
    return (
      <div className="mt-2">
        <div className="grid grid-cols-2 gap-2">
          {/* First item (larger) */}
          <div
            className="col-span-2 cursor-pointer"
            onClick={() => openMediaModal(0)}
          >
            {mediaItems[0].type === "image" ? (
              <img
                src={mediaItems[0].url}
                alt="Post media"
                className="w-full h-[35vh] object-cover rounded-2xl"
              />
            ) : (
              <div className="relative">
                <video
                  src={mediaItems[0].url}
                  className="w-full h-[35vh] object-cover rounded-2xl"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={
                      <i
                        className="icon-play text-white pl-1"
                        style={{ fontSize: "42px" }}
                      />
                    }
                    className={`flex justify-center items-center p-8 !px-8 borderbtn "}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Show up to 3 more thumbnails */}
          {mediaItems.slice(1, 3).map((media, index) => (
            <div
              key={index + 1}
              className="cursor-pointer relative h-[15vh]"
              onClick={() => openMediaModal(index + 1)}
            >
              {media.type === "image" ? (
                <img
                  src={media.url}
                  alt={`Media ${index + 2}`}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="relative h-full">
                  <video
                    src={media.url}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      type="primary"
                      shape="circle"
                      size="large"
                      icon={
                        <i
                          className="icon-play text-white pl-1"
                          style={{ fontSize: "28px" }}
                        />
                      }
                      className={`flex justify-center items-center p-6 !px-6 borderbtn "}`}
                    />
                  </div>
                </div>
              )}

              {/* Changed: Show +X on the 2nd small thumbnail (3rd total) */}
              {index === 1 && mediaItems.length > 3 && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-xl">
                  <Text className="text-white text-xl font-bold">
                    +{mediaItems.length - 3}
                  </Text>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render media modal content
  const renderMediaModalContent = () => {
    if (!hasMedia()) return null;

    return (
      <Slider {...getSliderSettings()} ref={carouselRef}>
        {localFeedData.media.map((media, index) => (
          <div key={index} className="carousel-item-container">
            {media.type === "image" ? (
              <div className={`flex items-center justify-center h-full`}>
                <img
                  src={media.url}
                  alt={`Media ${index + 1}`}
                  className="max-h-[80vh] max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <video
                  ref={(el) => (videoRefs.current[index] = el)}
                  src={media.url}
                  controls
                  className="max-h-[80vh] max-w-full"
                  onLoadedData={() => {
                    // Optional: You can add any initialization logic here
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </Slider>
    );
  };

  return (
    <>
      <div className="mb-10">
        <div className="w-full bg-liteGrayV1 rounded-2xl border border-solid border-liteGray">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="h-12 w-12 rounded-full relative">
                  {localFeedData.profile_photo_path ? (
                    <Avatar
                      src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${localFeedData.profile_photo_path
                        }`}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <Avatar
                      style={{ backgroundColor: "#fde3cf", color: "#f56a00" }}
                      className="w-full h-full object-cover rounded-full text-2xl"
                    >
                      {localFeedData?.name?.[0]}
                    </Avatar>
                  )}

                  {/* Status indicator - Show green dot if active, gray dot if inactive */}
                  {isUserActive() ||
                    localFeedData?.user_id === userForEdit?.user?.id ? (
                    <div
                      className={`absolute bottom-0 right-[-6px] w-4 h-4 bg-success rounded-full border-2 border-liteGrayV1`}
                    />
                  ) : null}
                </div>
                <div className="">
                  <div className="font-semibold text-white">
                    {localFeedData.name || ""}
                  </div>

                  <div className="text-grayText text-sm flex items-center gap-1 mt-1">
                    {localFeedData.role} •{" "}
                    {/* Check if scheduled_at exists and show it based on status */}
                    {localFeedData.scheduled_at &&
                      localFeedData.status === "Scheduled" ? (
                      <span className="flex items-center gap-1">
                        <i className="icon-calendar text-lg" />
                        <span className="!text-grayText">
                          {formatDate(localFeedData.scheduled_at) || "-"}
                        </span>
                      </span>
                    ) : localFeedData.scheduled_at &&
                      localFeedData.status === "Published" ? (
                      <span className="flex items-center gap-1">
                        <span className="text-grayText">
                          {formatDate(localFeedData.scheduled_at) || "-"}
                        </span>
                      </span>
                    ) : (
                      formatDate(localFeedData.created_at) || "-"
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 md:gap-2 items-center">
                {type === "all" && !isPinned() ? (
                  <>
                    {localFeedData?.is_pinned ? (
                      <PushpinFilled
                        className="text-grayText text-2xl cursor-pointer"
                        onClick={onClickPin}
                      />
                    ) : (
                      <i
                        className="icon-pin text-grayText text-3xl cursor-pointer"
                        onClick={onClickPin}
                      />
                    )}
                  </>
                ) : null}
                {type === "pinned" || isPinned() ? (
                  <div
                    className="flex items-center justify-center bg-darkGray px-3 rounded-full cursor-pointer"
                    onClick={onClickPin}
                  >
                    <i className="icon-pin before:!m-0 text-grayText text-xl cursor-pointer mr-1" />
                    <Text type="secondary" className="text-sm ">
                      Pinned
                    </Text>
                  </div>
                ) : null}

                {/* Show Scheduled label first (higher priority) */}
                {isScheduled() ? (
                  <div className="flex items-center justify-center bg-[#ffaa1633] px-4 py-1 rounded-full">
                    <Text className="text-sm !text-[#ffaa16]">Scheduled</Text>
                  </div>
                ) : /* Show Draft label only if not scheduled */
                  type === "draft" && isDraft() ? (
                    <div className="flex items-center justify-center bg-[#ffaa1633] px-4 py-1 rounded-full">
                      <Text className="text-sm !text-[#ffaa16]">Draft</Text>
                    </div>
                  ) : null}

                {/* Add more options dropdown - Only show for owner */}
                {isOwner() && (
                  <Dropdown menu={moreOptionsMenu} trigger={["click"]}>
                    <i
                      className={`icon-more-options text-grayText text-3xl cursor-pointer hover:text-white transition-colors ${feedDetailsLoading
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                        }`}
                    />
                  </Dropdown>
                )}
              </div>
            </div>

            {/* Post content */}
            <div className="mt-4">
              {localFeedData.content && (
                <p className="text-zinc-300 mb-3 break-words overflow-wrap-anywhere">
                  {renderContentWithHashtags(localFeedData.content)}
                </p>
              )}
            </div>

            {/* Media Section */}
            {renderMediaThumbnails()}

            {/* Media Modal */}
            <Modal
              open={isMediaModalVisible}
              onCancel={handleModalClose}
              footer={null}
              centered
              width="80%"
              className="media-modal"
              closeIcon={
                <Button
                  shape="circle"
                  icon={<i className="icon-close before:!m-0 text-sm" />}
                />
              }
              // Add afterClose callback to ensure cleanup
              afterClose={pauseAllVideos}
            >
              {renderMediaModalContent()}
            </Modal>

            {/* Schedule Section */}
            {isSchedule && (
              <Row className="mt-7 mb-5" gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <DatePicker
                    onChange={onChangeDate}
                    size="large"
                    className="w-full"
                    disabledDate={disabledDate}
                    placeholder="Select Date"
                  />
                </Col>
                <Col xs={24} md={12}>
                  <TimePicker
                    onChange={onChangeTime}
                    size="large"
                    className="w-full"
                    // disabledTime={disabledTime}
                    showNow={false}
                    use12Hours={true}
                    format="h:mm A"
                    placeholder="Select Time"
                  />
                </Col>
              </Row>
            )}

            {/* Draft Actions */}
            {type === "draft" ? (
              <>
                <Divider className="mt-6 mb-7" />
                <Row gutter={[24, 24]}>
                  {!isSchedule ? (
                    <Col xs={8}>
                      <Button
                        className="bg-erroOpacityr text-error border-error hover:!text-error hover:!border-error"
                        size="large"
                        variant="filled"
                        block
                        onClick={onClickDiscard}
                        disabled={
                          isSchedule ||
                          discardLoading ||
                          scheduleButtonLoading ||
                          postLoading
                        }
                        loading={discardLoading}
                      >
                        Discard
                      </Button>
                    </Col>
                  ) : null}
                  <Col xs={isSchedule ? 12 : 8}>
                    <Button
                      className="bg-primaryOpacity text-primary border-primary"
                      size="large"
                      variant="filled"
                      block
                      icon={
                        <i className="icon-calendar before:!m-0 text-2xl" />
                      }
                      iconPosition={"start"}
                      onClick={onClickSchedule}
                      disabled={
                        discardLoading || scheduleButtonLoading || postLoading
                      }
                      loading={scheduleButtonLoading}
                    >
                      Schedule
                    </Button>
                  </Col>
                  <Col xs={isSchedule ? 12 : 8}>
                    <Button
                      type="primary"
                      size="large"
                      block
                      icon={<i className="icon-send before:!m-0 text-2xl" />}
                      iconPosition={"end"}
                      onClick={onClickPost}
                      disabled={
                        discardLoading || scheduleButtonLoading || postLoading
                      }
                      loading={postLoading}
                    >
                      {isSchedule ? "Schedule Post" : `Post`}
                    </Button>
                  </Col>
                </Row>
              </>
            ) : (
              <>
                {/* Like comment share */}
                <div
                  className={`mt-4 ${isCommentSection ? "mb-4" : ""
                    } flex gap-8`}
                >
                  <div className="flex gap-4 items-center">
                    <div className="flex items-center cursor-pointer">
                      {localFeedData?.is_liked ? (
                        <LikeFilled
                          className="text-primary text-xl cursor-pointer mr-1"
                          onClick={onClickLike}
                        />
                      ) : (
                        <LikeOutlined
                          className="text-grayText text-xl cursor-pointer mr-1"
                          onClick={onClickLike}
                        />
                      )}
                      <span className="text-sm cursor-pointer">
                        Like{" "}
                        {localFeedData.engagement &&
                          localFeedData.engagement.like_count > 0 &&
                          `(${localFeedData.engagement.like_count})`}
                      </span>
                    </div>
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={onClickComment}
                    >
                      <i className="icon-comment text-grayText text-2xl cursor-pointer" />
                      <span className="text-sm cursor-pointer">
                        Comments{" "}
                        {localFeedData.engagement &&
                          localFeedData.engagement.comment_count > 0 &&
                          `(${localFeedData.engagement.comment_count})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comment Section - Updated to use recursive component */}
                {isCommentSection && (
                  <div>
                    <Divider className="m-0" />

                    {/* Comments list with scroll event for infinite scrolling */}
                    <div
                      className="max-h-[400px] overflow-y-auto pr-2 comment-tree-container"
                      onScroll={handleScroll}
                      style={{
                        // Ensure proper stacking context for tree lines
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {comments.length > 0 ? (
                        comments.map((commentItem, index) => {
                          const isLastComment = index === comments.length - 1;
                          return (
                            <CommentItem
                              key={commentItem.id}
                              commentItem={commentItem}
                              level={1}
                              onReply={handleReply}
                              onLikeComment={onClickLikeComment}
                              userForEdit={userForEdit}
                              formatDate={formatDate}
                              isLast={isLastComment}
                              hasParent={false}
                            />
                          );
                        })
                      ) : loadingComments && commentPage === 1 ? (
                        <div className="text-center py-4">
                          <Skeleton avatar />
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <Text type="secondary">No comments yet</Text>
                        </div>
                      )}

                      {/* Loading indicator for infinite scroll */}
                      {loadingComments && commentPage > 1 && (
                        <div className="text-center py-2">
                          <Text type="secondary">Loading more comments...</Text>
                        </div>
                      )}

                      {/* Invisible element to detect scroll position */}
                      <div ref={commentsEndRef} />
                    </div>

                    {/* Main comment input */}
                    <div className="flex gap-3 items-center mt-5 mb-1">
                      <div className="h-14 w-14 rounded-full border border-zinc-700 overflow-hidden">
                        {userForEdit?.user?.profile_photo_path ? (
                          <Avatar
                            src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${userForEdit?.user?.profile_photo_path
                              }`}
                            alt="Profile picture"
                            className="object-cover h-full w-full rounded-full"
                          />
                        ) : (
                          <Avatar
                            style={{
                              backgroundColor: "#fde3cf",
                              color: "#f56a00",
                            }}
                            alt="Profile picture"
                            className="object-cover h-full w-full rounded-full !text-[26px] font-normal"
                          >
                            {userForEdit?.user?.name?.[0]}
                          </Avatar>
                        )}
                      </div>
                      <div className="w-full relative py-2">
                        {/* Reply indicator */}
                        {replyingTo && (
                          <div className="flex items-center gap-2 mb-2 text-sm text-grayText">
                            <span>
                              Replying to{" "}
                              <span className="text-primary font-semibold">
                                {replyingTo.name}
                              </span>
                            </span>
                            <button
                              onClick={cancelReply}
                              className="text-grayText hover:text-white transition-colors"
                            >
                              <i className="icon-close text-sm" />
                            </button>
                          </div>
                        )}
                        <Input
                          ref={inputRef}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          onKeyDown={handleCommentKeyPress}
                          placeholder={
                            replyingTo
                              ? `Reply to ${replyingTo.name}...`
                              : "Add a comment..."
                          }
                          className="p-2 pl-5 rounded-full"
                          suffix={
                            <div className="flex md:gap-3 items-center">
                              <i
                                className="icon-emoji text-grayText text-3xl cursor-pointer"
                                onClick={toggleEmojiPicker}
                              />
                              {showCommentButton ? (
                                <Button
                                  type="primary"
                                  disabled={!comment.trim()}
                                  shape="round"
                                  size="middle"
                                  className="p-5"
                                  onClick={handleSubmitComment}
                                >
                                  {replyingTo ? "Reply" : "Comment"}
                                </Button>
                              ) : (
                                <i
                                  className="icon-send text-primary text-3xl"
                                  onClick={handleSubmitComment}
                                />
                              )}
                            </div>
                          }
                        />
                        {showEmojiPicker && (
                          <div
                            ref={emojiPickerRef}
                            className="absolute bottom-16 right-0 z-10"
                          >
                            <EmojiPicker
                              onEmojiClick={handleEmojiClick}
                              theme="dark"
                              height={320}
                              preload={false}
                              searchDisabled={false}
                              skinTonesDisabled={false}
                              className="customEmojiPicker"
                              allowExpandReactions={false}
                              reactionsDefaultOpen={false}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Post Modal */}
      {isEditModalOpen && fetchedEditFeedData && (
        <NewPostModal
          isOpenNewChatModal={isEditModalOpen}
          setIsOpenNewChatModal={setIsEditModalOpen}
          setCreatedPostResponse={() => { }}
          isEditMode={true}
          editFeedData={fetchedEditFeedData}
          onEditSuccess={(updatedFeed) => {
            try {
              // Update local state with edited feed
              if (updatedFeed) {
                setLocalFeedData(updatedFeed);

                // Notify parent component with the updated feed data
                if (onFeedUpdate) {
                  onFeedUpdate(
                    updatedFeed.id || localFeedData.id,
                    "edited",
                    updatedFeed
                  );
                }
              }

              // Close the modal and reset fetched data
              setIsEditModalOpen(false);
              setFetchedEditFeedData(null);
            } catch (error) {
              console.error("Error in edit success handler:", error);
            }
          }}
        />
      )}

      <Modal
        title="Delete Feed"
        centered
        destroyOnClose
        open={isDeleteModalVisible}
        footer={false}
        onCancel={handleCancelDelete}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
          />
        }
      >
        <div className="border-t-2 border-solid border-[#373737] mt-5">
          <Row gutter={16} className="">
            <div className="w-full pt-5 flex flex-col items-center justify-center pb-5">
              <Text className="text-base font-normal text-grayText text-center">
                Are you sure you want to delete this Feed?
              </Text>
            </div>
            <Col span={12}>
              <Button
                block
                onClick={handleCancelDelete}
                size="large"
                disabled={deleteLoading}
              >
                Cancel
              </Button>
            </Col>
            <Col span={12}>
              <Button
                block
                danger
                type="primary"
                size="large"
                onClick={handleConfirmDelete}
                loading={deleteLoading}
              >
                Confirm Deletion
              </Button>
            </Col>
          </Row>
        </div>
      </Modal>
    </>
  );
};

export default FeedCard;