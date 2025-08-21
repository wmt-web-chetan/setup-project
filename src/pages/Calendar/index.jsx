import React, { useState, useEffect, useRef } from "react";
import {
  Col,
  Row,
  Typography,
  Button,
  Input,
  Select,
  Spin,
  Avatar,
  Tooltip,
  message,
  notification,
  Modal,
  List,
  Tag,
  Divider,
} from "antd";
import { Link } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import zoomSvg from "../../assets/SVGs/zoomB.svg";
import { SearchOutlined, UserOutlined, EditOutlined } from "@ant-design/icons";
import "./Calendar.scss";
import CreateMeetingModal from "./CalenderEventAddModal";
import MiniCalendar from "./MiniCalender/index";
import useBreakpoint from "antd/lib/grid/hooks/useBreakpoint";
import {
  fetchMeetingCalendar,
  fetchMeetingTags,
} from "../../services/Store/Calender/action";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs"; // Added for date handling
import { getStorage } from "../../utils/commonfunction";

const { Text, Title } = Typography;

// Utility function to convert UTC time to system timezone
const convertUTCToSystemTimezone = (utcTimeString) => {
  if (!utcTimeString) return null;
  
  // If the string already has 'Z', it's already marked as UTC
  // If not, add 'Z' to explicitly mark it as UTC
  const utcString = utcTimeString.includes('Z') ? utcTimeString : utcTimeString + 'Z';
  
  // Create Date object - JavaScript will automatically convert UTC to local time
  const localDate = new Date(utcString);
  
  // Debug log (you can remove this later)
  console.log(`Converting UTC "${utcTimeString}" to local: ${localDate.toLocaleString()}`);
  
  return localDate;
};

// Attendees Modal Component
const AttendeesModal = ({ visible, onCancel, event, onEdit, canEdit }) => {
  if (!event) return null;

  const { extendedProps } = event;
  const participants = extendedProps?.participants || [];

  const formatEventTime = (start, end) => {
    // Convert UTC times to system timezone for display
    const startDate = convertUTCToSystemTimezone(start);
    const endDate = convertUTCToSystemTimezone(end);
    
    if (!startDate || !endDate) return "";
    
    const startTime = startDate.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const endTime = endDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${startTime} - ${endTime}`;
  };

  const handleEdit = () => {
    onEdit();
    onCancel(); // Close the attendees modal
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <UserOutlined className="text-primary" />
          <span>Meeting Details</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          Close
        </Button>,
        ...(canEdit
          ? [
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={handleEdit}
            >
              Edit Meeting
            </Button>,
          ]
          : []),
      ]}
      width={700}
      className="attendees-modal"
    >
      {/* Event Details Header */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start justify-between mb-2 flex-wrap">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {event.title}
          </h3>
          {extendedProps?.tag && (
            <Tag color={extendedProps.tag.color} className="font-medium">
              {extendedProps.tag.name}
            </Tag>
          )}
        </div>

        <div className="text-sm text-gray-600 mb-2">
          <i className="icon-time mr-2" />
          {formatEventTime(extendedProps?.originalStartTime, extendedProps?.originalEndTime)}
        </div>

        {extendedProps?.description && (
          <div className="text-sm text-gray-700 mb-2">
            <strong>Description:</strong> {extendedProps.description}
          </div>
        )}

        {extendedProps?.zoomUrl && (
          <div className="flex items-center gap-2 mt-2">
            <img src={zoomSvg} alt="Zoom" className="w-4 h-4" />
            <a
              href={extendedProps.zoomUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Join Zoom Meeting
            </a>
          </div>
        )}
      </div>

      <Divider />

      {/* Attendees List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base font-semibold text-gray-800">
            Attendees ({participants.length})
          </h4>
          {extendedProps?.createdBy && (
            <div className="text-xs text-gray-500">
              Created by: {extendedProps.createdBy.name}
            </div>
          )}
        </div>

        {participants.length > 0 ? (
          <div
            className="max-h-96 overflow-y-auto pr-2 fc-scroller"
          // style={{
          //   scrollbarWidth: "thin",
          //   scrollbarColor: "#d1d5db #f3f4f6",
          // }}
          >
            <List
              dataSource={participants}
              renderItem={(participant, index) => (
                <List.Item className="px-0">
                  <List.Item.Meta
                    avatar={
                      participant?.profile_photo_path ? (
                        <Avatar
                          src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${participant.profile_photo_path
                            }`}
                          size="large"
                        />
                      ) : (
                        <Avatar size="large" className="bg-primary">
                          {participant?.name
                            ? participant.name.charAt(0).toUpperCase()
                            : "U"}
                        </Avatar>
                      )
                    }
                    title={
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {participant?.name || "Unknown User"}
                        </span>
                        {participant?.id === extendedProps?.createdBy?.id && (
                          <Tag color="gold" size="small">
                            Organizer
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <div className="text-sm text-gray-600">
                        {participant?.email && <div>{participant.email}</div>}
                        {participant?.phone && <div>{participant.phone}</div>}
                        {participant?.department && (
                          <div className="text-xs text-gray-500 mt-1">
                            {participant.department}
                          </div>
                        )}
                      </div>
                    }
                  />
                  {/* You can add more participant details here */}
                  <div className="flex items-center gap-2">
                    {participant?.status && (
                      <Tag
                        color={
                          participant.status === "accepted"
                            ? "green"
                            : participant.status === "declined"
                              ? "red"
                              : "orange"
                        }
                        size="small"
                      >
                        {participant.status}
                      </Tag>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <UserOutlined className="text-2xl mb-2" />
            <div>No attendees found for this event</div>
          </div>
        )}
      </div>
    </Modal>
  );
};

const Calendar = () => {
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); // Added for edit mode
  const [modalMode, setModalMode] = useState("create"); // Added to track modal mode

  // New state for attendees modal
  const [attendeesModalVisible, setAttendeesModalVisible] = useState(false);
  const [selectedEventForAttendees, setSelectedEventForAttendees] =
    useState(null);

  const calendarRef = useRef(null);
  const screen = useBreakpoint();
  const dispatch = useDispatch();
  const { userForEdit } = useSelector((state) => state?.usersmanagement);
  // console.log(userForEdit?.user?.id, "userForEdit");
  const {
    meetingCalendar,
    meetingCalendarLoading,
    meetingTags,
    meetingTagsLoading,
    createMeeting,
    updateMeeting,
  } = useSelector((state) => state.meetings);

  console.log('meetingCalendarmeetingCalendar',meetingCalendar)

  const userLoginRole = getStorage("userLoginRole", true);

  // Transform API data to FullCalendar format
  const transformCalendarData = (meetingCalendar) => {
    if (!meetingCalendar?.data?.calendar) {
      return [];
    }

    const events = [];

    // Loop through each date in the calendar data
    meetingCalendar.data.calendar.forEach((dateItem) => {
      if (dateItem?.events?.length > 0) {
        // Loop through each event for this date
        dateItem.events.forEach((event) => {
          // Filter events based on search term if one exists
          if (
            searchTerm &&
            !event?.title?.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            return;
          }
          // Filter by selected tags if any
          if (
            selectedTags.length > 0 &&
            (!event?.tag || !selectedTags.includes(event.tag?.id))
          ) {
            return;
          }
          
          // Convert UTC times to system timezone
          const systemStartTime = convertUTCToSystemTimezone(event?.start_time);
          const systemEndTime = convertUTCToSystemTimezone(event?.end_time);
          
          if (!systemStartTime || !systemEndTime) {
            return;
          }
          
          // Transform to FullCalendar event format
          events.push({
            id: event?.id,
            title: event?.title || "Untitled Event",
            start: systemStartTime,
            end: systemEndTime,
            extendedProps: {
              description: event?.description,
              color: event?.tag?.color || "#9C27B0",
              attendees: event?.participants?.length || 0,
              zoomUrl: event?.zoom_join_url,
              zoomPassword: event?.zoom_password,
              status: event?.status,
              accessType: event?.access_type,
              participants: event?.participants || [],
              createdBy: event?.created_by,
              tag: event?.tag,
              originalEvent: event,
              originalStartTime: event?.start_time, // Keep original UTC times for modal
              originalEndTime: event?.end_time,
            },
          });
        });
      }
    });

    return events;
  };

  // Update events when meeting calendar data changes
  useEffect(() => {
    if (meetingCalendar?.data) {
      const formattedEvents = transformCalendarData(meetingCalendar);
      setEvents(formattedEvents);
    } else {
      setEvents([]);
    }
  }, [meetingCalendar, selectedTags, searchTerm]);

  // Fetch meeting calendar data when component mounts or date changes
  useEffect(() => {
    const formatDateForAPI = (date) => {
      return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    };

    // Calculate first and last day of the month being displayed
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // Prepare params for API call
    const params = {
      start_date: formatDateForAPI(firstDayOfMonth),
      end_date: formatDateForAPI(lastDayOfMonth),
      tag_id: selectedTags,
      search: searchTerm,
    };
    // Dispatch the action to fetch calendar data
    dispatch(fetchMeetingCalendar(params));
  }, [
    dispatch,
    currentDate,
    searchTerm,
    selectedTags,
    createMeeting,
    updateMeeting,
  ]);

  //fetch tags
  useEffect(() => {
    dispatch(fetchMeetingTags());
  }, []);

  // Fixed goToPrevious function
  const goToPrevious = () => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.prev();
    setCurrentDate(calendarApi.getDate());
  };

  // Fixed goToNext function
  const goToNext = () => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.next();
    setCurrentDate(calendarApi.getDate());
  };

  // Fixed goToToday function
  const goToToday = () => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.today();
    setCurrentDate(calendarApi.getDate());
  };

  // Updated handleViewChange function
  const handleViewChange = (value) => {
    let newView;
    switch (value) {
      case "month":
        newView = "dayGridMonth";
        break;
      case "week":
        newView = "timeGridWeek";
        break;
      case "day":
        newView = "timeGridDay";
        break;
      default:
        newView = "dayGridMonth";
    }

    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(newView);
      setCurrentView(newView);
    }
  };

  // Helper function to get the correct Select value from the current view
  const getSelectValueFromView = (viewType) => {
    switch (viewType) {
      case "dayGridMonth":
        return "month";
      case "timeGridWeek":
        return "week";
      case "timeGridDay":
        return "day";
      default:
        return "month";
    }
  };

  // Format time for display - now handles already converted system timezone
  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format the current date and view for the header
  const formatViewTitle = () => {
    const options = { year: "numeric" };
    let viewText = "";

    switch (currentView) {
      case "dayGridMonth":
        options.month = "long";
        viewText = "Month View";
        break;
      case "timeGridWeek":
        options.month = "long";
        options.day = "numeric";
        viewText = "Week View";
        break;
      case "timeGridDay":
        options.month = "long";
        options.day = "numeric";
        viewText = "Day View";
        break;
      default:
        options.month = "long";
        viewText = "Month View";
    }

    return `${currentDate.toLocaleDateString("en-US", options)}`;
  };

  // Handle date selection from MiniCalendar
  const handleMiniCalendarDateSelect = (date) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(date);
      setCurrentDate(date);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Updated custom event rendering without hover buttons
  const renderEventContent = (eventInfo) => {
    const { event, view } = eventInfo;

    const { extendedProps } = event || {};
    const isTimeGridView =
      view.type === "timeGridDay" || view.type === "timeGridWeek";

    const isWeekview = view.type === "timeGridWeek";
    // Create a style object for the background color from the tag color
    const tagColor = extendedProps?.color || "#9C27B0";
    const bgStyle = { backgroundColor: tagColor };

    return (
      <div
        className="rounded-md text-white overflow-y-auto w-full h-full cursor-pointer"
        style={bgStyle}
      >
        <div className={`p-1 xl:p-2 ${isWeekview ? "hidden" : ""}`}>
          <div className="w-full lg:break-words lg:whitespace-normal">
            <Text className="text-white block line-clamp-2 lg:font-semibold">
              {event?.title || "Untitled Event"}
            </Text>
          </div>
          <div>
            <div className="hidden lg:flex items-center text-[10px] text-white break-words whitespace-normal opacity-50">
              <i className="icon-time before:!m-0 text-lg mr-1 hidden lg:block" />{" "}
              {formatTime(event?.start)} - {formatTime(event?.end)}
            </div>
            {extendedProps?.zoomUrl && (
              <div className="bg-white bg-opacity-15 py-1 px-1 rounded-lg truncate hidden lg:flex mt-1">
                <div className="flex items-center truncate">
                  <img src={zoomSvg} alt="Zoom" className="w-4 h-4 " />
                  <a
                    href={extendedProps.zoomUrl}
                    target="_blank"
                    className="text-white text-xs truncate ml-1"
                    onClick={(e) => e.stopPropagation()} // Prevent event click when clicking on Zoom link
                  >
                    Join Zoom Meeting
                  </a>
                </div>
              </div>
            )}
            {extendedProps?.participants?.length > 0 && (
              <div className="hidden mt-2 lg:flex">
                {extendedProps.participants
                  .slice(0, 2)
                  .map((participant, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full bg-gray-300 -ml-1 first:ml-0 border-[1px] border-white"
                    >
                      {participant?.profile_photo_path ? (
                        <img
                          src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${participant.profile_photo_path
                            }`}
                          alt={participant?.name || "User"}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Avatar
                          className="w-full h-full flex items-center"
                          size="small"
                        >
                          {participant?.name ? participant.name.charAt(0) : "U"}
                        </Avatar>
                      )}
                    </div>
                  ))}
                {extendedProps.participants.length > 2 && (
                  <div className="ml-1 break-words whitespace-normal">
                    <Text className="text-white text-[10px]">
                      +{extendedProps.participants.length - 2} others
                    </Text>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className={`p-2 ${isWeekview ? "block" : " hidden"}`}>
          <div className="truncate w-full">
            <Text className="text-white text-xs font-medium block truncate">
              {event?.title || "Untitled Event"}
            </Text>
          </div>
        </div>
      </div>
    );
  };

  // Check if user can edit the event
  const canEditEvent = (event) => {
    if (!event) return false;

    const originalEvent = event.extendedProps?.originalEvent;
    if (!originalEvent) return false;

    // Convert UTC end time to system timezone for proper comparison
    const eventEndTime = convertUTCToSystemTimezone(originalEvent.end_time);
    const currentTime = new Date();

    if (eventEndTime < currentTime) {
      return false; // Meeting has already ended
    }

    // Check if current user is the creator of the event
    const currentUserId = userForEdit?.user?.id;
    const eventCreatorId = originalEvent?.created_by?.id;

    console.log('Edit check:', {
      currentUserId,
      eventCreatorId,
      isCreator: currentUserId === eventCreatorId,
      eventEndTime: eventEndTime.toLocaleString(),
      currentTime: currentTime.toLocaleString(),
      hasTimeLeft: eventEndTime > currentTime
    });

    return currentUserId === eventCreatorId;
  };

  // Handle edit from attendees modal
  const handleEditFromModal = () => {
    const originalEvent =
      selectedEventForAttendees.extendedProps?.originalEvent;

    if (!originalEvent) return;

    // Convert UTC times to system timezone for the edit modal
    const convertedStartTime = convertUTCToSystemTimezone(originalEvent.start_time);
    const convertedEndTime = convertUTCToSystemTimezone(originalEvent.end_time);

    // Format as local datetime string (YYYY-MM-DDTHH:MM:SS format for datetime-local inputs)
    const formatForDateTimeLocal = (date) => {
      if (!date) return null;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    // Create a modified event object with converted times for the modal
    const eventForModal = {
      ...originalEvent,
      start_time: formatForDateTimeLocal(convertedStartTime),
      end_time: formatForDateTimeLocal(convertedEndTime),
    };

    console.log('Edit modal times:', {
      original_start: originalEvent.start_time,
      original_end: originalEvent.end_time,
      converted_start: eventForModal.start_time,
      converted_end: eventForModal.end_time
    });

    // Set selected event with converted times
    setSelectedEvent(eventForModal);
    // Set modal mode to edit
    setModalMode("edit");
    // Show the edit modal
    setIsModalVisible(true);
  };

  // Updated event click handler - now just shows attendees
  const handleEventClick = (eventInfo) => {
    const event = eventInfo.event;
    setSelectedEventForAttendees(event);
    setAttendeesModalVisible(true);
  };

  // Show modal for creating new meeting
  const showModal = () => {
    setModalMode("create");
    setSelectedEvent(null);
    setIsModalVisible(true);
  };

  // Close modal handler
  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedEvent(null);
    setModalMode("create");
  };

  // Close attendees modal handler
  const handleAttendeesModalCancel = () => {
    setAttendeesModalVisible(false);
    setSelectedEventForAttendees(null);
  };

  // Handle calendar view change event
  const handleCalendarViewChange = (info) => {
    setCurrentView(info.view.type);
  };

  //Initial Loading

  if (meetingCalendarLoading && meetingTagsLoading) {
    return (
      <div className="h-[60vh] flex justify-center items-center">
        <Spin />
      </div>
    );
  }

  return (
    <>
      <CreateMeetingModal
        visible={isModalVisible}
        onCancel={handleCancel}
        meetingTags={meetingTags}
        selectedEvent={selectedEvent}
        mode={modalMode}
      />

      <AttendeesModal
        visible={attendeesModalVisible}
        onCancel={handleAttendeesModalCancel}
        event={selectedEventForAttendees}
        onEdit={handleEditFromModal}
        canEdit={canEditEvent(selectedEventForAttendees)}
      />

      <Row
        className="bg-darkGray px-header-wrapper h-full w-full "
        gutter={[0, 24]}
      >
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
                Training Calendar
              </Text>
            </Title>
          </div>
        </Col>
        <Col span={24} className="h-full bg-gray rounded-2xl">
          {meetingCalendarLoading && meetingTagsLoading ? (
            <div className="flex justify-center h-full items-center">
              <Spin />
            </div>
          ) : (
            <Row>
              <Col
                xl={7}
                xxl={6}
                className={`xl:p-4 w-full overflow-y-auto`}
                style={{
                  height: window.innerWidth >= 1200 ? containerHeight : "auto",
                  overflowY: "auto",
                  // Hide scrollbar for webkit browsers
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                  // Hide scrollbar for IE, Edge and Firefox
                  msOverflowStyle: "none",
                  scrollbarWidth: "none",
                }}
              >
                {/* Mini Calendar Component */}
                <MiniCalendar
                  onDateSelect={handleMiniCalendarDateSelect}
                  meetingTags={meetingTags}
                  selectedTags={selectedTags}
                  setSelectedTags={setSelectedTags}
                />
              </Col>
              <Col
                xl={17}
                xxl={18}
                style={{ height: screen?.xl ? containerHeight : "" }}
                className="overflow-y-auto lg:border-l-[1px] p-3 xl:p-0 border-grayText w-full relative"
              >
                <Row justify="center">
                  <Col md={12} className="w-full">
                    <div className="md:flex items-center p-4">
                      <Text className="text-white text-lg">
                        {formatViewTitle()}
                      </Text>
                      <Button
                        className="ml-2 xl:ml-4 bg-gray shadow-none"
                        onClick={goToPrevious}
                        icon={
                          <i className="text-white icon-left-arrow border-liteGray" />
                        }
                        shape="circle"
                      />
                      <Button
                        className="ml-2 bg-gray shadow-none"
                        onClick={goToNext}
                        icon={<i className="text-white icon-right-arrow" />}
                        shape="circle"
                      />
                      <Button
                        className="ml-2 bg-gray shadow-none py-5 rounded-full xl:ml-4"
                        onClick={goToToday}
                      >
                        Today
                      </Button>
                      <Select
                        value={getSelectValueFromView(currentView)}
                        style={{
                          width: "100px",
                          height: "42px",
                          backgroundColor: "#212121",
                        }}
                        className="ml-2 rounded-full text-white filterSelection"
                        dropdownStyle={{
                          backgroundColor: "#212121",
                          borderRadius: "8px",
                          color: "white",
                        }}
                        size="large"
                        suffixIcon={
                          <i className="icon-down-arrow text-white" />
                        }
                        options={[
                          { value: "month", label: "Month" },
                          { value: "week", label: "Week" },
                          { value: "day", label: "Day" },
                        ]}
                        onChange={handleViewChange}
                      />
                    </div>
                  </Col>
                  <Col md={12} className="mb-3 md:mb-0">
                    <div className="flex items-center h-full justify-end xl:pr-4">
                      <Input
                        className="rounded-full w-2/3 py-2"
                        prefix={<SearchOutlined className="text-liteGray" />}
                        placeholder="Search"
                        size="large"
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                      {
                        userLoginRole?.name === 'SA' ?
                          <Button
                            className="ml-3 py-5"
                            shape="round"
                            type="primary"
                            onClick={showModal}
                          >
                            <i className="icon-add before:!m-0 text-white" /> Create
                            Meeting
                          </Button>
                          : null
                      }

                    </div>
                  </Col>
                </Row>

                {/* Calendar */}
                {meetingCalendarLoading || meetingTagsLoading ? (
                  <div className="flex justify-center h-full items-center">
                    <Spin />
                  </div>
                ) : (
                  <div className="rounded-lg">
                    <FullCalendar
                      ref={calendarRef}
                      plugins={[
                        dayGridPlugin,
                        timeGridPlugin,
                        interactionPlugin,
                      ]}
                      initialView={currentView}
                      initialDate={currentDate}
                      events={events}
                      headerToolbar={false} // Hide the default header
                      eventContent={renderEventContent}
                      dayMaxEvents={2} // Increased to show more events
                      eventTimeFormat={{
                        hour: "numeric",
                        minute: "2-digit",
                        meridiem: "short",
                      }}
                      dayHeaderFormat={{
                        weekday: "short",
                      }}
                      firstDay={1} // Start week on Monday
                      fixedWeekCount={false}
                      showNonCurrentDates={true}
                      slotDuration="00:15:00"
                      slotLabelFormat={{
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      }}
                      allDaySlot={true}
                      allDayText="All Day"
                      contentHeight="auto"
                      eventOverlap={true}
                      slotEventOverlap={false}
                      expandRows={true}
                      viewDidMount={handleCalendarViewChange}
                      eventMaxStack={2}
                      eventClick={handleEventClick}
                    />
                  </div>
                )}
              </Col>
            </Row>
          )}
        </Col>
      </Row>
    </>
  );
};

export default Calendar;