import React, { useState, useEffect } from "react";
import { Row, Col, Typography, Button } from "antd";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs from "dayjs";
import EventModal from "./EventModal";

const { Text, Title } = Typography;

const CalendarComponent = () => {
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState();
  const [endDate, setEndDate] = useState();
  const [eventData, setEventData] = useState();
  const [isEdit, setIsEdit] = useState(false);
  const [timeHours, setHoursTime] = useState();
  const [minuteTime, setMinutesTime] = useState();
  const [formatTime, setFormatTime] = useState();
  const [calendarApi, setCalendarApi] = useState(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [miniCalendarDays, setMiniCalendarDays] = useState([]);
  
  const time = timeHours + ":" + minuteTime;

  // Generate mini calendar days
  useEffect(() => {
    const firstDayOfMonth = currentMonth.startOf("month");
    const firstDayOfCalendar = firstDayOfMonth.startOf("week");
    
    const days = [];
    const daysToShow = 42; // 6 weeks
    
    for (let i = 0; i < daysToShow; i++) {
      const currentDay = firstDayOfCalendar.add(i, "day");
      days.push({
        date: currentDay,
        isCurrentMonth: currentDay.month() === currentMonth.month(),
        isToday: currentDay.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD")
      });
    }
    
    setMiniCalendarDays(days);
  }, [currentMonth]);

  // Navigate to previous month in mini calendar
  const prevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, "month"));
  };

  // Navigate to next month in mini calendar
  const nextMonth = () => {
    setCurrentMonth(currentMonth.add(1, "month"));
  };

  // Handle mini calendar date click
  const handleMiniCalendarClick = (date) => {
    if (calendarApi) {
      calendarApi.gotoDate(date.format("YYYY-MM-DD"));
      setCurrentView("timeGridWeek");
      calendarApi.changeView("timeGridWeek");
    }
  };

  // Handle date selection in the main calendar
  const handleDateSelect = (info) => {
    setSelectedDate(info.start);
    setEndDate(info.end);
    setModalOpen(true);
  };

  // Handle event save
  const handleSaveEvent = (values) => {
    if (isEdit) {
      const index = events.findIndex((e) => e.id === values.id);
      const newEvents = [...events];
      newEvents.splice(index, 1, {
        title: values?.title || eventData.title,
        start: values?.start?.$d || selectedDate,
        end: values?.end?.$d || endDate,
        eventTime: values?.eventTime,
        color: values?.backgroundColor || eventData.backgroundColor,
        id: Date.now(),
      });
      setEvents(newEvents);
      setIsEdit(false);
      setModalOpen(false);
    } else {
      setEvents([
        ...events,
        {
          title: values?.title,
          start: values?.start?.$d || selectedDate,
          end: values?.end?.$d || endDate,
          eventTime: values?.eventTime,
          color: values?.backgroundColor,
          id: Date.now(),
        },
      ]);
      setFormatTime(values?.eventTime);
      setHoursTime(values?.eventTime?.$H);
      setMinutesTime(values?.eventTime?.$m);
      setModalOpen(false);
    }
  };

  // Handle event click
  const eventClick = (e) => {
    setEventData({
      title: e.event._def.title,
      start: e.event.start,
      end: e.event.end,
      backgroundColor: e.event.backgroundColor,
      id: e.event.id,
    });
    setSelectedDate(e.event.start);
    setEndDate(e.event.end);
    setIsEdit(true);
    setModalOpen(true);
  };

  // Handle event deletion
  const handleEventDelete = (id) => {
    if (isEdit) {
      const index = events.findIndex((e) => e.id === id);
      const newEvents = [...events];
      newEvents.splice(index, 1);
      setEvents(newEvents);
      setModalOpen(false);
      setIsEdit(false);
    }
  };

  // Custom render for event content
  const renderEventContent = (e) => {
    const id = e.event.id;
    let title =
      e.event._def.title.length > 8
        ? e.event._def.title.slice(0, 8) + "..."
        : e.event._def.title;
    let targetElement = e.event?._context?.options?.events?.filter(
      (e) => e.id === id
    );

    const date = dayjs(targetElement[0]?.eventTime);
    const formattedTime = date.format("hh:mm A");
    e.timeText = formattedTime;

    return (
      <div
        style={{
          backgroundColor: `${e.backgroundColor}`,
          color: `white`,
        }}
        className="p-1 pr-4 flex items-center w-full rounded"
      >
        <div
          style={{ backgroundColor: `${e.backgroundColor}` }}
          className="rounded-full w-2 h-2 mr-2"
        ></div>
        <div>{e.timeText}</div>
        <div className="pl-2 font-semibold">{title}</div>
      </div>
    );
  };

  // Handle view change
  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  return (
    <Row gutter={[16, 16]} className="w-full">
      {/* Mini Calendar */}
      <Col xs={24} md={8} lg={6} xl={5} className="mini-calendar">
        <div className="bg-darkGray rounded-lg p-4 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <Title level={5} className="m-0 text-white">
              {currentMonth.format("MMMM YYYY")}
            </Title>
            <div className="flex">
              <Button 
                type="text" 
                onClick={prevMonth}
                className="text-gray hover:text-primary"
              >
                &lt;
              </Button>
              <Button 
                type="text" 
                onClick={nextMonth}
                className="text-gray hover:text-primary"
              >
                &gt;
              </Button>
            </div>
          </div>
          
          <Row className="mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <Col span={3} key={day} className="text-center">
                <Text className="text-grayText text-xs">{day}</Text>
              </Col>
            ))}
          </Row>
          
          <Row gutter={[0, 4]}>
            {miniCalendarDays.map((day, index) => (
              <Col span={3} key={index} className="text-center">
                <div
                  className={`
                    w-8 h-8 mx-auto flex items-center justify-center rounded-full cursor-pointer
                    ${!day.isCurrentMonth ? "text-grayText opacity-50" : "text-white"}
                    ${day.isToday ? "bg-primary" : "hover:bg-liteGray"}
                  `}
                  onClick={() => handleMiniCalendarClick(day.date)}
                >
                  <Text className={day.isToday ? "text-white" : ""}>
                    {day.date.date()}
                  </Text>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </Col>
      
      {/* Main Calendar */}
      <Col xs={24} md={16} lg={18} xl={19}>
        <div className="calendar-box bg-darkGray rounded-lg p-4 shadow-md">
          <EventModal
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            selectedDate={selectedDate}
            endDate={endDate}
            setEvents={setEvents}
            events={events}
            onSave={handleSaveEvent}
            selectedEvent={eventData}
            setEventData={setEventData}
            isEdit={isEdit}
            handleEventDelete={handleEventDelete}
            data-testid="event-modal"
            setIsEdit={setIsEdit}
            time={time}
            formatTime={formatTime}
          />
          
          <FullCalendar
            editable
            selectable
            events={events}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,prev,next",
            }}
            initialView="dayGridMonth"
            view={currentView}
            dayMaxEvents={true}
            select={handleDateSelect}
            eventContent={renderEventContent}
            weekNumbers={false}
            eventClick={eventClick}
            eventTimeFormat={{
              hour: "numeric",
              minute: "2-digit",
              omitZeroMinute: true,
              meridiem: "narrow",
            }}
            dayCellClassNames="for-check custom-day-cell"
            viewDidMount={(info) => {
              setCalendarApi(info.view.calendar);
              setCurrentView(info.view.type);
            }}
            datesSet={(dateInfo) => {
              // Update mini calendar when main calendar changes month
              if (dateInfo.view.type === "dayGridMonth") {
                setCurrentMonth(dayjs(dateInfo.start));
              }
            }}
          />
        </div>
      </Col>
    </Row>
  );
};

export default CalendarComponent;