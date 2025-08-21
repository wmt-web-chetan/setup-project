import React, { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Row,
  Col,
  Typography,
  Upload,
  Form,
  Input,
  message,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchLoanType } from "../../services/Store/ContractProcessor/actions";

const { Text, Title } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;

const ReportModal = ({
  isVisible,
  onCancel,
  companyName = "Elite Mortgage Solutions",
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const dispatch=useDispatch();
  const { loanType, loanTypeLoading } =
  useSelector((state) => state.contractProcessor);
  console.log(loanType,"loanType")
  useEffect(()=>{
    dispatch(fetchLoanType())
  },[])

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setUploading(true);
      const values = await form.validateFields();

      // Prepare the data for submission
      const formData = {
        concern: values.concern,
        files: fileList,
        companyName,
      };

      // Call the onSubmit callback with the form data
      if (onSubmit) {
        await onSubmit(formData);
      }

      // Reset form and close modal
      form.resetFields();
      setFileList([]);
      onCancel();
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setUploading(false);
    }
  };
  // Upload props configuration
  const uploadProps = {
    name: "file",
    multiple: true,
    fileList,
    accept: ".pdf,.doc,.docx",
    beforeUpload: (file, fileListArg) => {
      // First validate the file type
      if (!validateFile(file)) {
        return Upload.LIST_IGNORE;
      }

      // Count how many valid files we'll have after this upload
      const validExistingFiles = fileList.length;

      // If we already have 5 files, reject more
      if (validExistingFiles >= 5) {
        messageApi.error("You can only upload a maximum of 5 files!");
        return Upload.LIST_IGNORE;
      }

      return false; // Prevent auto upload
    },
    onChange: (info) => {
      // Filter out invalid files that might have been added
      let newFileList = info.fileList.filter((file) => {
        // For files that have been validated (have status)
        if (file.status === "error") {
          return false;
        }

        // For new files that haven't been fully processed yet
        if (!file.status && file.originFileObj) {
          return validateFile(file.originFileObj);
        }

        return true;
      });

      // Ensure we don't exceed 5 files
      if (newFileList.length > 5) {
        newFileList = newFileList.slice(0, 5);
        messageApi.warning("Only the first 5 files will be processed.");
      }

      //   setFileList(newFileList);
    },
    // onRemove: (file) => {
    //   // Remove file from fileList
    //   const index = fileList.findIndex(item => item.uid === file.uid);
    //   if (index !== -1) {
    //     const newFileList = [...fileList];
    //     newFileList.splice(index, 1);
    //     setFileList(newFileList);
    //   }
    // },
    customRequest: ({ onSuccess }) => {
      // Do nothing, prevent default upload behavior
      setTimeout(() => {
        onSuccess("ok");
      }, 0);
    },
  };
  return (
    <Modal
      title="Report"
      centered
      destroyOnClose
      open={isVisible}
      className="modalWrapperBox"
      onCancel={!uploading ? onCancel : undefined}
      footer={false}
      maskClosable={!uploading}
      closeIcon={
        <Button
          shape="circle"
          icon={<i className="icon-close before:!m-0 text-sm" />}
          disabled={uploading}
        />
      }
      width={600}
    >
      <Form form={form} layout="vertical" requiredMark={false} size="large">
        <div className="mt-6">
          <Text className="text-grayText text-sm">Report to</Text>
          <Text className="text-white text-sm font-bold ml-2">
            Elite Mortgage Solutions
          </Text>
        </div>
        <Row gutter={[]}>
          <Col span={24} className="mt-3">
            <Form.Item
              name="concern"
              label={<Text type="secondary text-sm">Add Concern</Text>}
              rules={[
                { required: true, message: "Please describe your concern" },
              ]}
            >
              <TextArea
                placeholder="I'd like to report an issue with Elite Mortgage Solutions. There have been inconsistencies in the document upload process, causing delays in loan approval. Could you please review this and provide updates?"
                autoSize={{ minRows: 4, maxRows: 8 }}
                className="bg-darkGray text-white border-liteGray"
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            
            <Form.Item name="files"  label={<Text type="secondary text-sm">Upload File</Text>} className="">
              <Dragger
                {...uploadProps}
                className="!bg-darkGray rounded-lg"
                style={{
                  padding: "0px 0",
                  border: "2px dashed #FF6D00",
                  borderRadius: "8px",
                }}
                disabled={uploading || fileList.length >= 5}
              >
                <div className="flex flex-col items-center">
                  <div className="bg-primaryOpacity w-16 h-16 flex items-center justify-center rounded-full">
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary">
                      <i className="icon-upload text-2xl" />
                    </div>
                  </div>
                  <Text className="text-white mb-1 mt-2">
                    Drag & drop or Choose files to upload
                  </Text>
                  <Text className="text-grayText text-xs">
                    Supported formats: PDF, DOC, DOCX
                  </Text>
                  {/* <Text className="text-grayText text-xs mt-1">
                    Maximum 5 files can be uploaded at once
                  </Text> */}
                  {fileList.length > 0 && (
                    <Text className="text-primary text-xs mt-1">
                      {fileList.length} of 5 files selected
                    </Text>
                  )}
                </div>
              </Dragger>
            </Form.Item>
          </Col>
        </Row>
        <hr className="  text-liteGray " />
        <Row gutter={16} className="mt-4">
          <Col span={12}>
            <Button
              
              block
              onClick={onCancel}
              disabled={uploading}
              className="bg-gray text-white hover:bg-liteGray border-liteGray"
            >
              Cancel
            </Button>
          </Col>
          <Col span={12}>
            <Button
              type="primary"
              
              block
              onClick={handleSubmit}
              loading={uploading}
              className="bg-red-600 text-white"
            >
              Report
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default ReportModal;
