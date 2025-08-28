import React, { useState } from "react";
import { Modal, Input, Form } from "antd";
import { DeleteFilled } from "@ant-design/icons";

const { TextArea } = Input;

const DeleteModal = ({ openModal, onCancel, onOk, text }) => {
  const [form] = Form.useForm();

  const handleOk = () => {
    form.validateFields().then((values) => {
      onOk(values.reason);
      form.resetFields();
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      centered
      title=""
      open={openModal}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Delete"
      okButtonProps={{ danger: true }}
    >
      <div className="flex flex-col justify-center items-center">
        <DeleteFilled
          className="text-red-700 text-3xl pr-3 mt-4 mb-4"
          style={{ color: "#ee4b4f" }}
        />
        <p className="mb-4">{text}</p>
        <Form form={form} layout="vertical" className="w-full">
          <Form.Item
            name="reason"
            label="Reason for deletion"
            rules={[
              {
                required: true,
                message: "Please provide a reason for deletion",
              },
             
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Please provide a reason for deletion"
            
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default DeleteModal;