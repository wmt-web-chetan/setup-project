import React, { Children, useEffect } from "react";
import { Button, Form, Input, TimePicker, Typography } from "antd";
import { Modal } from "antd";
import { DatePicker, Popconfirm } from "antd";
import { Select } from "antd";
import dayjs from "dayjs";
import { CheckCircleFilled, CloseOutlined } from "@ant-design/icons";

const EventModal = ({
  modalOpen,
  setModalOpen,
  selectedDate,
  setEvents,
  events,
  endDate,
  onSave,
  selectedEvent,
  setEventData,
  isEdit,
  handleEventDelete,
  setIsEdit,
  time,
  formatTime
}) => {
  const [form] = Form.useForm();
  const { Text, Title } = Typography;
  const onFinish = (values) => {
    onSave(values);
    form.resetFields();
    setModalOpen(false);
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };
  useEffect(() => {
    if (!modalOpen) {
      form.resetFields();
      setEventData(null);
    }
  }, [modalOpen]);
  useEffect(() => {
    form.setFieldsValue({
      start: dayjs(selectedDate),
      end: dayjs(endDate),
    });
    if (isEdit) {
      form.setFieldsValue({
        title: selectedEvent?.title,
        start: dayjs(selectedDate),
        end: dayjs(endDate),
        backgroundColor: selectedEvent?.backgroundColor,
        eventTime: dayjs(formatTime)
      });
    }
  }, [modalOpen]);

  const handleCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEventData(null);
    setIsEdit(false);
  };
  const dateFormatList = "DD/MM/YYYY";
  const validateEndDate = (_, value) => {
    const startDate = form.getFieldValue("start");
    if (value && startDate && value.isBefore(startDate, "day")) {
      return Promise.reject("End date must be after start date");
    }
    return Promise.resolve();
  };

  return (
    <div>
      <Modal
        title="Add new Event"
        open={modalOpen}
        footer={[]}
        destroyOnClose={true}
        closeIcon={
          <CloseOutlined onClick={handleCancel} data-testid="cancel-btn" />
        }
        data-testid="modal-event-data-id"
      >
        <Form
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          form={form}
          layout="vertical"
          data-testid="event-modal"
        >
          <Form.Item
            label={<Text type="secondary">Title</Text>}
            name="title"
            rules={[
              {
                required: true,
                message: "Please input your username!",
              },
            ]}
          >
            <Input placeholder="Please enter title" size="large" />
          </Form.Item>

          <Form.Item label={<Text type="secondary">Start Date</Text>} name="start">
            <DatePicker
              format={dateFormatList}
              style={{ width: "100%" }}
              size="large"
            />
          </Form.Item>
          <Form.Item
            label={<Text type="secondary">End Date</Text>}
            name="end"
            rules={[
              {
                validator: validateEndDate,
              },
            ]}
          >
            <DatePicker
              format={dateFormatList}
              style={{ width: "100%" }}
              size="large"
            />
          </Form.Item>
          <Form.Item label={<Text type="secondary">Event Time</Text>} name="eventTime">
            <TimePicker format="HH:mm" style={{ width: "100%" }} size="large" />
          </Form.Item>

          <Form.Item
            label={<Text type="secondary">Prefered</Text>}
            name="backgroundColor"
            style={{ width: "100%" }}
            rules={[
              {
                required: !isEdit,
                message: "Please select the color!",
              },
            ]}
          >
            <Select
              placeholder="Select a color"
              optionFilterProp="children"
              size="large"
              options={[
                {
                  value: "red",
                  label: (
                    <>
                      <span>
                        <CheckCircleFilled
                          style={{ color: "red" }}
                          className="pr-2"
                        />{" "}
                        Red
                      </span>
                    </>
                  ),
                },
                {
                  value: "orange",
                  label: (
                    <>
                      <span>
                        <CheckCircleFilled
                          style={{ color: "orange" }}
                          className="pr-2"
                        />{" "}
                        Orange
                      </span>
                    </>
                  ),
                },
                {
                  value: "green",
                  label: (
                    <>
                      <span>
                        <CheckCircleFilled
                          style={{ color: "green" }}
                          className="pr-2"
                        />{" "}
                        Green
                      </span>
                    </>
                  ),
                },
                {
                  value: "blue",
                  label: (
                    <>
                      <span>
                        <CheckCircleFilled
                          style={{ color: "blue" }}
                          className="pr-2"
                        />{" "}
                        Blue
                      </span>
                    </>
                  ),
                },
              ]}
            />
          </Form.Item>

          <Form.Item className="d-flex justify-end">
            <Button type="primary" htmlType="submit" size="large" data-testid='submit-btn'>
              {isEdit ? "Edit" : "Submit"}
            </Button>
            {isEdit && (
              <Popconfirm
                title="Delete the task"
                description="Are you sure to delete this task?"
                okText="Yes"
                cancelText="No"
                onConfirm={() => handleEventDelete(selectedEvent?.id)}
              >
                <Button type="primary" danger size="large" className="ml-3">
                  Delete
                </Button>
              </Popconfirm>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EventModal;
