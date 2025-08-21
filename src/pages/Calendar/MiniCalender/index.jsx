import React, { useState, useEffect } from "react";
import { Dropdown, Checkbox, Space, Button, Typography } from "antd";
import { DownOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchMeetingCalendarForMini } from "../../../services/Store/Calender/action";

const { Text, Title } = Typography;

const MiniCalendar = ({
  onDateSelect,
  meetingTags,
  setSelectedTags,
  selectedTags,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventsDropdownOpen, setEventsDropdownOpen] = useState(true);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const dispatch = useDispatch();
  const { meetingCalendarMini, meetingCalendarLoadingMini } = useSelector(
    (state) => state.meetings
  );


  // Initialize with all tags selected if meetingTags is available
  useEffect(() => {
    if (
      meetingTags?.data?.tags &&
      meetingTags.data.tags.length > 0 &&
      selectedTags.length === 0
    ) {
      // Select all tags by default when component mounts and tags are loaded
      const allTagIds = meetingTags.data.tags.map((tag) => tag.id);
      setSelectedTags(allTagIds);
    }
  }, [meetingTags, setSelectedTags]);

  // Format date for API
  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Get current year and month
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Initial fetch of calendar data when component mounts
  useEffect(() => {
    // Calculate first and last day of the month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Prepare params for API call
    const params = {
      start_date: formatDateForAPI(firstDayOfMonth),
      end_date: formatDateForAPI(lastDayOfMonth),
      tag_id: null,
    };

    // Dispatch the action to fetch calendar data only when component mounts
    if (dispatch) {
      dispatch(fetchMeetingCalendarForMini(params));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]); // Only run on mount, not when currentDate changes

  // Get month name
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Generate days for the calendar
  const generateDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // Handle month change
  const handleMonthChange = (monthIndex) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
    setShowMonthSelector(false);

    // Directly call the API when month changes from selector
    const firstDayOfMonth = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      newDate.getFullYear(),
      newDate.getMonth() + 1,
      0
    );

    // Prepare params for API call
    const params = {
      start_date: formatDateForAPI(firstDayOfMonth),
      end_date: formatDateForAPI(lastDayOfMonth),
      tag_id: null,
    };

    // Dispatch the action to fetch calendar data
    if (dispatch) {
      dispatch(fetchMeetingCalendarForMini(params));
    }
  };

  // Handle previous month
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);

    // Directly call the API when month changes
    const firstDayOfMonth = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      newDate.getFullYear(),
      newDate.getMonth() + 1,
      0
    );

    // Prepare params for API call
    const params = {
      start_date: formatDateForAPI(firstDayOfMonth),
      end_date: formatDateForAPI(lastDayOfMonth),
      tag_id: null,
    };

    // Dispatch the action to fetch calendar data
    if (dispatch) {
      dispatch(fetchMeetingCalendarForMini(params));
    }
  };

  // Handle next month
  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);

    // Directly call the API when month changes
    const firstDayOfMonth = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      newDate.getFullYear(),
      newDate.getMonth() + 1,
      0
    );

    // Prepare params for API call
    const params = {
      start_date: formatDateForAPI(firstDayOfMonth),
      end_date: formatDateForAPI(lastDayOfMonth),
      tag_id: null,
    };

    // Dispatch the action to fetch calendar data
    if (dispatch) {
      dispatch(fetchMeetingCalendarForMini(params));
    }
  };

  // Toggle event selection - Only deselect the clicked event
  const toggleEventSelection = (eventId) => {
    if (selectedTags.includes(eventId)) {
      // If this tag is being deselected, only deselect this specific tag
      setSelectedTags(selectedTags.filter((id) => id !== eventId));
    } else {
      // If this tag is being selected, add it to the selection
      setSelectedTags([...selectedTags, eventId]);
    }
  };

  // Handle date selection
  const handleDateClick = (day) => {
    if (!day) return;
    const selectedDate = new Date(currentYear, currentMonth, day);
    if (onDateSelect) {
      // Only pass the date to the parent callback
      // Don't trigger any dispatch actions here
      // onDateSelect(selectedDate);
    }
  };

  // Check if a day is today
  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  // Check if a day has a holiday
  const hasHoliday = (day) => {
    if (!day) return false;

    // Format the current date to match the format in the API data
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;

    // Find the date object for the current day
    const dateData = meetingCalendarMini?.data?.calendar?.find(
      (date) => date.date === formattedDate
    );

    // If we have events on this date, check if any of them has the "Holidays" tag
    if (dateData && dateData.events && dateData.events.length > 0) {
      return dateData.events.some(
        (event) => event.tag && event.tag.name === "Holidays"
      );
    }

    return false;
  };

  // Toggle all events
  const toggleAllEvents = () => {
    if (areAllTagsSelected()) {
      // If all tags are already selected, deselect all
      setSelectedTags([]);
    } else {
      // If any tag is unselected, select all tags
      const allTagIds = meetingTags?.data?.tags.map((tag) => tag.id) || [];
      setSelectedTags(allTagIds);
    }
  };

  // Create rows of 7 days each for the calendar grid
  const createCalendarRows = () => {
    const days = generateDays();
    const rows = [];
    let row = [];

    days.forEach((day, index) => {
      row.push(day);

      if ((index + 1) % 7 === 0 || index === days.length - 1) {
        rows.push([...row]);
        row = [];
      }
    });

    // Add empty cells to complete the last row if needed
    if (row.length > 0) {
      while (row.length < 7) {
        row.push(null);
      }
      rows.push(row);
    }

    return rows;
  };

  // Render month selector grid
  const renderMonthSelector = () => {
    return (
      <div className="bg-[#171717] p-4 rounded-lg">
        <div className="mb-4 flex justify-between items-center">
          <Text className="text-white font-medium text-lg">{currentYear}</Text>
          <Space size="small">
            <Button
              icon={<i className="text-white text-sm icon-left-arrow" />}
              className="bg-[#212121] border-none text-white"
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setFullYear(currentDate.getFullYear() - 1);
                setCurrentDate(newDate);
              }}
              size="small"
            />
            <Button
              icon={<i className="text-white text-sm icon-right-arrow" />}
              className="bg-[#212121] border-none text-white"
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setFullYear(currentDate.getFullYear() + 1);
                setCurrentDate(newDate);
              }}
              size="small"
            />
          </Space>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {monthNames.map((month, index) => (
            <div key={index}>
              <div
                className="p-2 text-center rounded-md hover:bg-darkGray cursor-pointer transition-colors"
                onClick={() => handleMonthChange(index)}
              >
                <Text
                  className={`${
                    currentMonth === index ? "text-primary" : "text-white"
                  }`}
                >
                  {month.substring(0, 3)}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const calendarRows = createCalendarRows();

  // Check if all tags are selected
  const areAllTagsSelected = () => {
    if (!meetingTags?.data?.tags || meetingTags.data.tags.length === 0)
      return false;
    return meetingTags.data.tags.every((tag) => selectedTags.includes(tag.id));
  };

  return (
    <div>
      <div className="border border-liteGray p-3 lg:p-6 rounded-lg h-full overflow-auto">
        {showMonthSelector ? (
          renderMonthSelector()
        ) : (
          <>
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <div
                  className="cursor-pointer"
                  onClick={() => setShowMonthSelector(true)}
                >
                  <div className="flex items-center space-x-1">
                    <Text className="text-white font-medium text-lg">
                      {monthNames[currentMonth]} {currentYear}
                    </Text>
                    <i className="text-white text-sm icon-down-arrow" />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-4">
                  <i
                    className="text-white cursor-pointer icon-left-arrow"
                    onClick={handlePrevMonth}
                  />
                  <i
                    className="text-white cursor-pointer icon-right-arrow"
                    onClick={handleNextMonth}
                  />
                </div>
              </div>
            </div>

            {/* Calendar Days Header - Using Tailwind Grid */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day, index) => (
                  <div key={index} className="text-center">
                    <Text className="text-white text-sm">{day}</Text>
                  </div>
                )
              )}
            </div>

            {/* Calendar Dates - Using Tailwind Grid */}
            <div className="space-y-4">
              {calendarRows.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-7 gap-1">
                  {row.map((day, colIndex) => (
                    <div key={colIndex} className="text-center">
                      {day && (
                        <div className="relative">
                          {hasHoliday(day) && (
                            <div className="absolute right-0 md:right-[18px] xl:right-0 w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          )}
                          <div
                            className={`
                            mx-auto w-8 h-8 flex items-center justify-center rounded-md cursor-pointer
                            ${isToday(day) ? "bg-primary" : "hover:bg-darkGray"}
                          `}
                            onClick={() => handleDateClick(day)}
                          >
                            <Text className="text-white">{day}</Text>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="border border-liteGray p-3 lg:p-3 mt-4 rounded-lg h-full overflow-auto">
        {/* Events Section */}
        <div className="">
          <div
            className={`flex justify-between items-center cursor-pointer ${
              eventsDropdownOpen ? "mb-2" : ""
            }`}
            onClick={() => setEventsDropdownOpen(!eventsDropdownOpen)}
          >
            <Text className="text-white font-medium">Events</Text>
            <i
              className={`text-white text-sm transition-transform icon-down-arrow ${
                eventsDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          {eventsDropdownOpen && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <Text className="text-white text-sm">All</Text>
                <Checkbox
                  checked={areAllTagsSelected()}
                  onChange={toggleAllEvents}
                />
              </div>

              {meetingTags?.data?.tags?.map((event) => (
                <div
                  key={event.id}
                  className="flex justify-between items-center mb-3"
                >
                  <div className="flex items-center">
                    <div
                      className="w-2 h-2 mr-2 rounded-sm"
                      style={{ backgroundColor: event?.color }}
                    />
                    <Text className="text-white text-sm">{event?.name}</Text>
                  </div>
                  <Checkbox
                    checked={selectedTags.includes(event.id)}
                    onChange={() => toggleEventSelection(event.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiniCalendar;
