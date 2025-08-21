import { Button, Col, Form, Input, Modal, Row, Typography } from "antd";
import React, { useEffect, useState } from "react";

const { Text } = Typography;

const CreateRenameModal = ({
  isCreateFolderModalVisible,
  setIsCreateFolderModalVisible,
  isRenameFolderModalVisible,
  setIsRenameFolderModalVisible,
  folderToRename,
  onCreateFolder,
  onRenameFolder,
  createLoading = false,
  renameLoading = false,
  // New props for customization
  createTitle = "Create Lender",
  renameTitle = "Rename Lender",
  labelText = "Lender Name",
  placeholder = "Enter Lender Name",
  requiredMessage = "Please enter a lender name",
  maxLengthMessage = "lender name cannot exceed 25 characters",
}) => {
  // Form instances
  const [createForm] = Form.useForm();
  const [renameForm] = Form.useForm();

  // Handle create folder modal
  const handleCancelCreateFolder = () => {
    createForm.resetFields();
    setIsCreateFolderModalVisible(false);
  };

  const handleConfirmCreateFolder = () => {
    createForm
      .validateFields()
      .then((values) => {
        onCreateFolder(values?.folderName);
        // Don't reset fields or close modal here - we'll let the API response handle this
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  // Handle rename folder modal
  const handleCancelRenameFolder = () => {
    renameForm.resetFields();
    setIsRenameFolderModalVisible(false);
  };

  const handleConfirmRenameFolder = () => {
    renameForm
      .validateFields()
      .then((values) => {
        onRenameFolder(folderToRename?.id, values.folderName);
        // Don't reset fields or close modal here - we'll let the API response handle this
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  // Set initial form values for rename when folder changes
  useEffect(() => {
    if (folderToRename && isRenameFolderModalVisible) {
      renameForm.setFieldsValue({
        folderName: folderToRename.name,
      });
    }
  }, [folderToRename, isRenameFolderModalVisible, renameForm]);

  return (
    <>
      {/* Create Folder Modal */}
      <Modal
        title={createTitle}
        centered
        destroyOnClose
        open={isCreateFolderModalVisible}
        className="modalWrapperBox"
        onCancel={handleCancelCreateFolder}
        footer={false}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
            disabled={createLoading}
          />
        }
        maskClosable={!createLoading}
        afterClose={() => createForm.resetFields()}
      >
        <div className="border-t-2 border-solid border-[#373737] mt-5">
          <Form
            form={createForm}
            layout="vertical"
            requiredMark={false}
            className="pt-5"
          >
            <Form.Item
              name="folderName"
              label={<Text className="text-grayText">{labelText}</Text>}
              rules={[
                {
                  required: true,
                  message: requiredMessage,
                },
                {
                  max: 25,
                  message: maxLengthMessage,
                },
              ]}
            >
              <Input
                size="large"
                placeholder={placeholder}
                className="bg-[#171717] border-[#373737]"
                disabled={createLoading}
                maxLength={50}
                // showCount
              />
            </Form.Item>

            <Row gutter={16} className="mt-9">
              <Col span={12}>
                <Button
                  block
                  size="large"
                  onClick={handleCancelCreateFolder}
                  disabled={createLoading}
                >
                  Cancel
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  block
                  type="primary"
                  size="large"
                  onClick={handleConfirmCreateFolder}
                  loading={createLoading}
                >
                  Create
                </Button>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>

      {/* Rename Folder Modal */}
      <Modal
        title={renameTitle}
        centered
        destroyOnClose
        open={isRenameFolderModalVisible}
        className="modalWrapperBox"
        onCancel={handleCancelRenameFolder}
        footer={false}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
            disabled={renameLoading}
          />
        }
        maskClosable={!renameLoading}
      >
        <div className="border-t-2 border-solid border-[#373737] mt-5">
          <Form
            form={renameForm}
            layout="vertical"
            requiredMark={false}
            className="pt-5"
          >
            <Form.Item
              name="folderName"
              label={<Text className="text-grayText">{labelText}</Text>}
              rules={[
                {
                  required: true,
                  message: requiredMessage,
                },
                {
                  max: 25,
                  message: maxLengthMessage,
                },
              ]}
            >
              <Input
                size="large"
                placeholder={placeholder}
                className="bg-[#171717] border-[#373737] "
                disabled={renameLoading}
              />
            </Form.Item>

            <Row gutter={16} className="mt-9">
              <Col span={12}>
                <Button
                  block
                  size="large"
                  onClick={handleCancelRenameFolder}
                  disabled={renameLoading}
                >
                  Cancel
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  block
                  type="primary"
                  size="large"
                  onClick={handleConfirmRenameFolder}
                  loading={renameLoading}
                >
                  Rename
                </Button>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>
    </>
  );
};

export default CreateRenameModal;