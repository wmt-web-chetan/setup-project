import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Typography,
  Row,
  Col,
  Tag,
  Space,
  Avatar,
  message,
  Divider,
  Tabs,
} from "antd";
import {
  CloseOutlined,
  SearchOutlined,
  CloseCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs"; // For date formatting
import {
  addMeeting,
  updateMeetingAction,
} from "../../services/Store/Calender/action";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoleUserList } from "../../services/Store/Users/action";
import { getStorage } from "../../utils/commonfunction";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const CreateMeetingModal = ({
  visible,
  onCancel,
  meetingTags,
  selectedEvent,
  mode = "create",
}) => {
  const [form] = Form.useForm();
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const { roleUsers, roleUsersLoading } = useSelector(
    (state) => state.usersmanagement
  );
  const isEditMode = mode === "edit";
  const [hostUser, setHostUser] = useState(null);
  const dispatch = useDispatch();

  const userLoginRole = getStorage("userLoginRole", true);

  // Format the meeting tags data from the API for the Select component
  const tagOptions =
    meetingTags?.data?.tags?.map((tag) => ({
      value: tag.id,
      label: tag.name,
      color: tag.color,
    })) || [];

  // Transform role user data into categorized options
  const getCategorizedOptions = () => {
    if (!roleUsers?.data || !Array.isArray(roleUsers.data)) {
      return [];
    }

    // console.log("roleUsers", roleUsers);

    return roleUsers.data
      .filter((role) => role.user && role.user.length > 0) // Only include roles with users
      .map((role) => ({
        category: role.full_name || role.name,
        categoryKey: role.name,
        options: role.user.map((user) => ({
          value: user.id,
          label: user.name || "Unnamed",
          email: user.email || "",
          roleId: role.id,
          roleName: role.name,
          photo: role.profile_photo_path,
        })),
      }));
  };

  const categorizedOptions = getCategorizedOptions();

  // Get all options for easier processing
  const allOptions = categorizedOptions.flatMap((category) => category.options);

  // Fetch role user list when modal opens
  useEffect(() => {
    if (visible) {
      dispatch(fetchRoleUserList());
    }
  }, [visible, dispatch]);

  // Set default active category when data loads
  useEffect(() => {
    if (categorizedOptions.length > 0 && !activeCategory) {
      setActiveCategory(categorizedOptions[0].categoryKey);
    }
  }, [categorizedOptions, activeCategory]);

  // Initialize form with selected event data when in edit mode
  useEffect(() => {
    if (visible && isEditMode && selectedEvent) {
      // Parse the start and end times to dayjs objects
      const startDateTime = selectedEvent.start_time
        ? dayjs(selectedEvent.start_time)
        : null;
      const endDateTime = selectedEvent.end_time
        ? dayjs(selectedEvent.end_time)
        : null;

      // Set the form values
      form.setFieldsValue({
        title: selectedEvent.title,
        date: startDateTime ? startDateTime.startOf("day") : null,
        startTime: startDateTime,
        endTime: endDateTime,
        tag_id: selectedEvent.tag?.id,
      });

      // Extract and store the host separately from participants
      let participantsList = [];
      let hostUserData = null;

      if (
        selectedEvent.participants &&
        Array.isArray(selectedEvent.participants)
      ) {
        // Separate host and regular participants
        selectedEvent.participants.forEach((participant) => {
          if (participant.role === "host") {
            hostUserData = {
              id: participant.id,
              name: participant.name || "Unnamed",
              email: participant.email || "",
              role: "host",
            };
          } else {
            participantsList.push({
              id: participant.id,
              name: participant.name || "Unnamed",
              email: participant.email || "",
              role: participant.role,
            });
          }
        });

        // Store the host
        setHostUser(hostUserData);

        // Set selected guests (excluding host)
        setSelectedGuests(participantsList.map((guest) => guest.id));

        // Set form guests field with just the participant IDs (not the host)
        form.setFieldsValue({
          guests: participantsList.map((guest) => guest.id),
        });
      }
    } else if (visible && !isEditMode) {
      // Clear form when creating a new meeting
      form.resetFields();
      setSelectedGuests([]);
      setHostUser(null);
    }
  }, [visible, isEditMode, selectedEvent, form]);

  // Clear state when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedGuests([]);
      setFilterText("");
      setActiveCategory("");
      setHostUser(null);
    }
  }, [visible]);

  // Enhanced modal close handler
  const handleModalClose = () => {
    // Clear form
    form.resetFields();

    // Clear local state
    setSelectedGuests([]);
    setHostUser(null);
    setFilterText("");
    setActiveCategory("");

    // Call the original onCancel function
    onCancel();
  };

  // Function to handle guest selection changes
  const handleGuestChange = (values) => {
    setSelectedGuests(values);
    form.setFieldsValue({ guests: values });
  };

  // Function to handle select all for the current category view
  const handleSelectAll = () => {
    const currentCategoryOptions =
      categorizedOptions.find((cat) => cat.categoryKey === activeCategory)
        ?.options || [];

    const currentCategoryValues = currentCategoryOptions.map(
      (option) => option.value
    );

    // Check if all visible options are selected
    const allVisibleSelected = currentCategoryValues.every((value) =>
      selectedGuests.includes(value)
    );

    if (allVisibleSelected) {
      // Remove all visible options
      const newSelectedGuests = selectedGuests.filter(
        (value) => !currentCategoryValues.includes(value)
      );
      setSelectedGuests(newSelectedGuests);
      form.setFieldsValue({ guests: newSelectedGuests });
    } else {
      // Add all visible options that aren't already selected
      const newValues = [...selectedGuests];
      currentCategoryValues.forEach((value) => {
        if (!selectedGuests.includes(value)) {
          newValues.push(value);
        }
      });
      setSelectedGuests(newValues);
      form.setFieldsValue({ guests: newValues });
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilterText(e.target.value);
  };

  // Handle category tab change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  // Get current category options based on active tab
  const getCurrentOptions = () => {
    const options =
      categorizedOptions.find((cat) => cat.categoryKey === activeCategory)
        ?.options || [];

    // Apply text filter if any
    return options.filter((option) =>
      option.label.toLowerCase().includes(filterText.toLowerCase())
    );
  };

  // Check if all visible options are selected
  const areAllVisibleOptionsSelected = () => {
    const visibleOptions = getCurrentOptions();
    const visibleValues = visibleOptions.map((option) => option.value);

    return (
      visibleValues.length > 0 &&
      visibleValues.every((value) => selectedGuests.includes(value))
    );
  };

  // Get options to display in dropdown
  const displayOptions = getCurrentOptions();

  // Function to round time to the nearest 15-minute interval
  const roundToNearest15Min = (time) => {
    if (!time) return null;

    const minutes = time.minute();
    const remainder = minutes % 15;

    if (remainder === 0) return time;

    // Round up to next 15-min interval
    return time.minute(minutes - remainder + 15).second(0);
  };

  // Function to handle date changes and validate time selections
  const handleDateChange = (date) => {
    // Get current selections
    const startTime = form.getFieldValue("startTime");
    const endTime = form.getFieldValue("endTime");
    const now = dayjs();

    // Check if the date is today
    const isToday = date && date.isSame(dayjs(), "day");

    // Only need to validate times if the selected date is today
    if (isToday && (startTime || endTime)) {
      // Create full datetime objects for comparison
      const startDateTime = startTime
        ? date.hour(startTime.hour()).minute(startTime.minute())
        : null;
      const endDateTime = endTime
        ? date.hour(endTime.hour()).minute(endTime.minute())
        : null;

      // Check if start time has passed
      if (startDateTime && startDateTime.isBefore(now)) {
        // Reset the start time
        form.setFieldsValue({ startTime: null });

        // Since start time is reset, end time should also be reset to avoid inconsistency
        form.setFieldsValue({ endTime: null });

        // Show notification to user
        message.info(
          "Selected start time has already passed and has been reset"
        );
      }
      // If start time is valid but end time has passed
      else if (endDateTime && endDateTime.isBefore(now)) {
        // Reset only the end time
        form.setFieldsValue({ endTime: null });

        // Show notification to user
        message.info("Selected end time has already passed and has been reset");
      }
    }
  };

  const handleTimeChange = (field, time) => {
    // If no time selected, just return
    if (!time) return;

    // Round the selected time to the nearest 15-min interval
    const roundedTime = roundToNearest15Min(time);

    if (field === "startTime") {
      // If end time exists, check if it needs adjustment
      const endTime = form.getFieldValue("endTime");

      if (roundedTime && endTime) {
        // Calculate minutes for comparison to avoid precision issues
        const startMinutes = roundedTime.hour() * 60 + roundedTime.minute();
        const endMinutes = endTime.hour() * 60 + endTime.minute();
        const diffMinutes = endMinutes - startMinutes;

        if (diffMinutes < 15) {
          // Set end time to exactly start time + 15 minutes
          const newEndTime = roundedTime.clone().add(15, "minutes");
          form.setFieldsValue({ endTime: newEndTime });
        }
      } else if (roundedTime) {
        // Set default end time to start time + 15 minutes if no end time is set
        form.setFieldsValue({
          endTime: roundedTime.clone().add(15, "minutes"),
        });
      }

      // Update form with rounded time
      form.setFieldsValue({ startTime: roundedTime });
    } else if (field === "endTime") {
      const startTime = form.getFieldValue("startTime");

      if (roundedTime && startTime) {
        // Calculate minutes for comparison to avoid precision issues
        const startMinutes = startTime.hour() * 60 + startTime.minute();
        const endMinutes = roundedTime.hour() * 60 + roundedTime.minute();
        const diffMinutes = endMinutes - startMinutes;

        if (diffMinutes < 15) {
          // Set end time to exactly start time + 15 minutes
          const newEndTime = startTime.clone().add(15, "minutes");
          form.setFieldsValue({ endTime: newEndTime });
          return;
        }
      }

      // Update form with rounded time
      form.setFieldsValue({ endTime: roundedTime });
    }
  };

  const handleSubmitMeeting = () => {
  form.validateFields().then((values) => {
    // Format date and time to match required format
    const dateObj = values.date ? values.date.format("YYYY-MM-DD") : "";
    const startTimeObj = values.startTime
      ? values.startTime.format("HH:mm:ss")
      : "";
    const endTimeObj = values.endTime
      ? values.endTime.format("HH:mm:ss")
      : "";

    // Create Date objects and convert to UTC
    const startDateTime = new Date(`${dateObj} ${startTimeObj}`);
    const endDateTime = new Date(`${dateObj} ${endTimeObj}`);

    // Convert to UTC and format as "YYYY-MM-DD HH:mm:ss"
    const start_time = startDateTime.toISOString().slice(0, 19).replace('T', ' ');
    const end_time = endDateTime.toISOString().slice(0, 19).replace('T', ' ');

    // Extract participant IDs from selected guests
    const participants = selectedGuests || [];

    // Create the payload in the required format
    const payload = {
      title: values?.title || "",
      description: null, // Empty description as it's not needed
      start_time,
      end_time,
      tag_id: values?.tag_id,
      participants,
    };

    // Dispatch appropriate action based on mode
    if (isEditMode && selectedEvent) {
      // Add meeting ID to payload for update
      const updatePayload = {
        ...payload,
        id: selectedEvent.id,
      };
      dispatch(updateMeetingAction(updatePayload)).then((res) => {
        if (res?.payload?.meta?.status === 200) {
          console.log('res?.payload?.meta?.status', res?.payload?.meta?.status);
          handleModalClose();
        }
      });
    } else {
      dispatch(addMeeting(payload)).then((res) => {
        if (res?.payload?.meta?.status === 200) {
          console.log('res?.payload?.meta?.status', res?.payload?.meta?.status);
          handleModalClose();
        }
      });
    }
    // Close modal and reset everything
  });
};

  // Function to truncate name to max 7 characters
  const truncateName = (name) => {
    if (!name) return "";
    if (name.length <= 7) return name;
    return name.substring(0, 7) + "...";
  };

  // Disable past dates in the date picker
  const disabledDate = (current) => {
    // Can select today and future dates, but not past dates
    // For edit mode, we might need to allow the original date even if it's in the past
    if (isEditMode && selectedEvent) {
      const eventDate = dayjs(selectedEvent.start_time).startOf("day");
      // If the current date being checked is the event's date, allow it even if it's in the past
      if (current.isSame(eventDate, "day")) {
        return false;
      }
    }
    // Standard check for past dates
    return current && current < dayjs().startOf("day");
  };

  // Get the original event time (for edit mode)
  const getOriginalEventTime = (field) => {
    if (!isEditMode || !selectedEvent) return null;
    return dayjs(
      field === "startTime" ? selectedEvent.start_time : selectedEvent.end_time
    );
  };

  // Disable past times for start time picker
  const disabledStartTime = () => {
    const selectedDate = form.getFieldValue("date");
    const isToday = selectedDate && selectedDate.isSame(dayjs(), "day");
    const now = dayjs();
    const originalStartTime = getOriginalEventTime("startTime");

    return {
      disabledHours: () => {
        // Get current hour if today
        const currentHour = isToday ? now.hour() : -1;

        // In edit mode, we need to exclude the original event's hour if the date matches
        if (
          isEditMode &&
          selectedEvent &&
          originalStartTime &&
          selectedDate &&
          selectedDate.isSame(originalStartTime, "day")
        ) {
          // If it's today and the original hour is in the past, allow only that specific hour
          if (isToday && originalStartTime.hour() < currentHour) {
            // Create an array of all hours except the original hour
            return Array.from({ length: 24 }, (_, i) => i).filter(
              (h) =>
                h !== originalStartTime.hour() &&
                (isToday ? h < currentHour : false)
            );
          }

          // For today, disable all past hours
          return isToday
            ? Array.from({ length: currentHour }, (_, i) => i)
            : [];
        }

        // For today, disable all past hours
        return isToday ? Array.from({ length: currentHour }, (_, i) => i) : [];
      },
      disabledMinutes: (selectedHour) => {
        // If we're on today and the selected hour is the current hour
        if (isToday && selectedHour === now.hour()) {
          // Round up to nearest 15 minutes
          const roundedUpMinute = Math.ceil(now.minute() / 15) * 15;
          return Array.from({ length: roundedUpMinute }, (_, i) => i);
        }

        // In edit mode, if the selected hour is the original hour, disable all minutes except the original
        if (
          isEditMode &&
          selectedEvent &&
          originalStartTime &&
          selectedDate &&
          selectedDate.isSame(originalStartTime, "day") &&
          selectedHour === originalStartTime.hour()
        ) {
          // Round original minute to nearest 15
          const origMinute = Math.floor(originalStartTime.minute() / 15) * 15;

          // If it's also today and we're in the current hour, combine both constraints
          if (isToday && selectedHour === now.hour()) {
            const roundedUpMinute = Math.ceil(now.minute() / 15) * 15;

            // Allow only the original minute if it's not in the past, otherwise disable all
            if (origMinute >= roundedUpMinute) {
              return Array.from({ length: 60 }, (_, i) => i).filter(
                (m) => m % 15 === 0 && m !== origMinute && m < roundedUpMinute
              );
            } else {
              return Array.from({ length: 60 }, (_, i) => i).filter(
                (m) => m % 15 === 0
              );
            }
          }

          // For past hours, allow only the original minute
          if (isToday && selectedHour < now.hour()) {
            return Array.from({ length: 60 }, (_, i) => i).filter(
              (m) => m % 15 === 0 && m !== origMinute
            );
          }
        }

        // For non-current hours or non-today days, show only 15-minute intervals
        return Array.from({ length: 60 }, (_, i) => i).filter(
          (m) => m % 15 !== 0
        );
      },
    };
  };

  // Disable past times for end time picker (considers start time as well)
  const disabledEndTime = () => {
    const selectedDate = form.getFieldValue("date");
    const startTime = form.getFieldValue("startTime");
    const isToday = selectedDate && selectedDate.isSame(dayjs(), "day");
    const now = dayjs();
    const originalEndTime = getOriginalEventTime("endTime");

    return {
      disabledHours: () => {
        // First priority: respect the selected start time
        if (startTime) {
          const startHour = startTime.hour();
          return Array.from({ length: startHour }, (_, i) => i);
        }

        // Second priority: respect current time for today
        const currentHour = isToday ? now.hour() : -1;

        // Third priority: in edit mode, allow the original end time
        if (
          isEditMode &&
          selectedEvent &&
          originalEndTime &&
          selectedDate &&
          selectedDate.isSame(originalEndTime, "day")
        ) {
          // If it's today and the original hour is in the past, allow only that specific hour
          if (isToday && originalEndTime.hour() < currentHour) {
            // Create an array of all hours except the original hour
            return Array.from({ length: 24 }, (_, i) => i).filter(
              (h) =>
                h !== originalEndTime.hour() &&
                (isToday ? h < currentHour : false)
            );
          }

          // For today, disable all past hours
          return isToday
            ? Array.from({ length: currentHour }, (_, i) => i)
            : [];
        }

        // For today, disable all past hours
        return isToday ? Array.from({ length: currentHour }, (_, i) => i) : [];
      },
      disabledMinutes: (selectedHour) => {
        // First priority: respect the selected start time
        if (startTime && selectedHour === startTime.hour()) {
          const startMinute = startTime.minute();
          const minEndMinute = startMinute + 15;
          return Array.from({ length: minEndMinute }, (_, i) => i);
        }

        // Second priority: respect current time for today
        if (isToday && selectedHour === now.hour()) {
          // Round up to nearest 15 minutes
          const roundedUpMinute = Math.ceil(now.minute() / 15) * 15;
          return Array.from({ length: roundedUpMinute }, (_, i) => i);
        }

        // Third priority: in edit mode, allow the original end time
        if (
          isEditMode &&
          selectedEvent &&
          originalEndTime &&
          selectedDate &&
          selectedDate.isSame(originalEndTime, "day") &&
          selectedHour === originalEndTime.hour()
        ) {
          // Round original minute to nearest 15
          const origMinute = Math.floor(originalEndTime.minute() / 15) * 15;

          // If it's also today and we're in the current hour, combine both constraints
          if (isToday && selectedHour === now.hour()) {
            const roundedUpMinute = Math.ceil(now.minute() / 15) * 15;

            // Allow only the original minute if it's not in the past, otherwise disable all
            if (origMinute >= roundedUpMinute) {
              return Array.from({ length: 60 }, (_, i) => i).filter(
                (m) => m % 15 === 0 && m !== origMinute && m < roundedUpMinute
              );
            } else {
              return Array.from({ length: 60 }, (_, i) => i).filter(
                (m) => m % 15 === 0
              );
            }
          }

          // For past hours, allow only the original minute
          if (isToday && selectedHour < now.hour()) {
            return Array.from({ length: 60 }, (_, i) => i).filter(
              (m) => m % 15 === 0 && m !== origMinute
            );
          }
        }

        // For non-current hours or non-today days, show only 15-minute intervals
        return Array.from({ length: 60 }, (_, i) => i).filter(
          (m) => m % 15 !== 0
        );
      },
    };
  };

  return (
    <Modal
      open={visible}
      footer={null}
      onCancel={handleModalClose}
      destroyOnClose
      width={780}
      
      closeIcon={
        <div className="border border-1 rounded-full p-1 border-liteGray flex justify-center items-center">
          <i className="icon-close text-sm" />
        </div>
      }
      className="bg-gray rounded-2xl py-2"
      title={
        <Row className="mb-4">
          <Col span={24}>
            <Title level={5} className="text-white m-0">
              {isEditMode ? "Edit Meeting" : "Create New Meeting"}
            </Title>
          </Col>
        </Row>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        className="w-full"
      >
        {/* Title Field */}
        <Form.Item
          name="title"
          label={<Text type="secondary">Title</Text>}
          rules={[
            { required: true, message: "Please enter a title" },
            { max: 50, message: "Title can't be more than 50 character" },
            {
              whitespace: true,
              message: "Title Cannot Contain Only Whitespace!",
            },
          ]}
        >
          <Input placeholder="Enter Title" className="w-full py-2" />
        </Form.Item>

        {/* When Fields */}
        <Text type="secondary" className="mb-3 block">
          When
        </Text>
        <Row gutter={[12, 12]} justify={"center"}>
          <Col xs={24} md={8}>
            <Form.Item
              name="date"
              rules={[
                { required: true, message: "Please select a date" },
                {
                  validator: (_, value) => {
                    // In edit mode, allow the original date even if it's in the past
                    if (isEditMode && selectedEvent) {
                      const originalDate = dayjs(
                        selectedEvent.start_time
                      ).startOf("day");
                      if (value && value.isSame(originalDate, "day")) {
                        return Promise.resolve();
                      }
                    }

                    // Standard validation for future dates
                    if (value && value < dayjs().startOf("day")) {
                      return Promise.reject("Cannot select a past date");
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker
                placeholder="Select Date"
                className="w-full py-2"
                format="MM/DD/YYYY"
                disabledDate={disabledDate}
                onChange={handleDateChange}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="startTime"
              rules={[
                { required: true, message: "Please select start time" },
                {
                  validator: (_, value) => {
                    // Ensure time is in 15-minute intervals
                    if (value && value.minute() % 15 !== 0) {
                      return Promise.reject(
                        "Time must be in 15-minute intervals"
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker
                placeholder="From"
                className="w-full py-2"
                picker="time"
                format="hh:mm A"
                minuteStep={15}
                onChange={(time) => handleTimeChange("startTime", time)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="endTime"
              rules={[
                { required: true, message: "Please select end time" },
                {
                  validator: (_, value) => {
                    // Ensure time is in 15-minute intervals
                    if (value && value.minute() % 15 !== 0) {
                      return Promise.reject(
                        "Time must be in 15-minute intervals"
                      );
                    }
                    // Ensure end time is at least 15 minutes after start time
                    const startTime = form.getFieldValue("startTime");
                    if (startTime && value) {
                      const startMinutes =
                        startTime.hour() * 60 + startTime.minute();
                      const endMinutes = value.hour() * 60 + value.minute();
                      const diffMinutes = endMinutes - startMinutes;
                      // Only reject if the difference is less than 15 minutes
                      if (diffMinutes < 15) {
                        return Promise.reject(
                          "End time must be at least 15 minutes after start time"
                        );
                      }
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker
                placeholder="To"
                className="w-full py-2"
                picker="time"
                format="hh:mm A"
                minuteStep={15}
                onChange={(time) => handleTimeChange("endTime", time)}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Guests Field with Role-based Multi-Select */}

        <Form.Item
  name="guests"
  label={<Text type="secondary">Guests</Text>}
  rules={[
    { required: true, message: "Please select at least one guest" },
  ]}
>
  <Select
    mode="multiple"
    style={{ width: "100%" }}
    placeholder="Select Guests by Role"
    value={selectedGuests}
    onChange={handleGuestChange}
    maxTagCount={10}
    loading={roleUsersLoading}
    showSearch={false}
    filterOption={false}
    // Add this prop to render dropdown in the correct container
    getPopupContainer={(triggerNode) => triggerNode.parentElement}
    // Or alternatively, render in document body
    // getPopupContainer={() => document.body}
    dropdownRender={(menu) => (
      <div>
        <div
          style={{ padding: "8px", cursor: "pointer" }}
          onClick={handleSelectAll}
        >
          {areAllVisibleOptionsSelected()
            ? `✓ Deselect All ${activeCategory}`
            : `☐ Select All ${activeCategory}`}
        </div>
        <Divider style={{ margin: "4px 0" }} />

        <Input
          placeholder="Search Users..."
          style={{ margin: "4px 8px", width: "calc(100% - 16px)" }}
          value={filterText}
          onChange={handleFilterChange}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => e.stopPropagation()}
        />

        <Divider style={{ margin: "4px 0" }} />

        <Tabs
          activeKey={activeCategory}
          onChange={handleCategoryChange}
          style={{ padding: "0 8px" }}
          size="small"
          onClick={(e) => e.stopPropagation()}
        >
          {categorizedOptions.map((category) => (
            <TabPane
              tab={category.category}
              key={category.categoryKey}
            />
          ))}
        </Tabs>

        <Divider style={{ margin: "4px 0" }} />

        {displayOptions?.length === 0 ? (
          <div
            style={{
              padding: "8px",
              textAlign: "center",
              color: "#999",
            }}
          >
            No matching users
          </div>
        ) : (
          menu
        )}
      </div>
    )}
    tagRender={(props) => {
      const { value, closable, onClose } = props;
      const user = allOptions?.find((opt) => opt.value === value);
      return (
        <Tag
          closable={closable}
          onClose={onClose}
          style={{ marginRight: 3, marginBottom: 3 }}
          className="bg-primaryOpacity text-primary border-none"
        >
          <Space size={4}>
            {user
              ? truncateName(user.label)
              : `+${selectedGuests.length - 10}`}
          </Space>
        </Tag>
      );
    }}
  >
    {displayOptions.map((option) => (
      <Option
        key={option.value}
        value={option.value}
        className="border-b border-[#6e6e6e84]"
      >
        <Space>
          {option.profile_photo_path ? (
            <Avatar
              size={40}
              src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${option.profile_photo_path}`}
              icon={!option.profile_photo_path && <UserOutlined />}
              className="bg-gray-700"
            />
          ) : (
            <Avatar
              size={40}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginRight: "12px",
              }}
              className="bg-primaryOpacity !rounded-full"
            >
              {option?.label?.[0]}
            </Avatar>
          )}
          <div>
            <div>{option.label}</div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {option.email} • {option.roleName}
            </Text>
          </div>
        </Space>
      </Option>
    ))}
  </Select>
</Form.Item>

        {/* Display selected users summary */}
        {/* {selectedGuests.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Selected: {selectedGuests.length} user
              {selectedGuests.length !== 1 ? "s" : ""}
            </Text>
            <div style={{ marginTop: "8px" }}>
              {selectedGuests.slice(0, 5).map((guestId) => {
                const user = allOptions.find((opt) => opt.value === guestId);
                const category = categorizedOptions.find((cat) =>
                  cat.options.some((opt) => opt.value === guestId)
                );

                return user ? (
                  <Tag key={guestId} color="blue" style={{ margin: "2px" }}>
                    {user.label} ({category?.categoryKey})
                  </Tag>
                ) : null;
              })}
              {selectedGuests.length > 5 && (
                <Tag style={{ margin: "2px" }}>
                  +{selectedGuests.length - 5} more
                </Tag>
              )}
            </div>
          </div>
        )} */}

        {/* Tags Field */}
        <Form.Item
          name="tag_id"
          label={<Text type="secondary">Tags</Text>}
          rules={[{ required: true, message: "Please Select a Tag" }]}
        >
          <Select
            placeholder="Select Tags"
            options={tagOptions}
            className="w-full h-11"
            optionLabelProp="label"
            optionRender={(option) => (
              <Space>
                <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: option?.data?.color,
                  }}
                />
                <span>{option?.data?.label}</span>
              </Space>
            )}
          />
        </Form.Item>
        <hr className="my-4 border-liteGray mt-2 mb-2" />

        {/* Action Buttons */}
        <Row gutter={[16, 16]} className="mt-5">
          <Col xs={24} md={12}>
            <Button block onClick={handleModalClose} className="py-5">
              Cancel
            </Button>
          </Col>
          {
            userLoginRole?.name === 'SA' ?
              <Col xs={24} md={12}>
                <Button
                  type="primary"
                  block
                  onClick={handleSubmitMeeting}
                  className="py-5"
                >
                  {isEditMode ? "Update Meeting" : "Create Meeting"}
                </Button>
              </Col>
              : null
          }

        </Row>
      </Form>
    </Modal>
  );
};

export default CreateMeetingModal;
