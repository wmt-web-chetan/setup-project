import React from "react";
import { Modal, Button, Typography, Spin } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import "./FileViewerModal.scss";
import { IMAGE_BASE_URL } from "../../../utils/constant";

const { Text } = Typography;

const FileViewerModal = ({
  isVisible,
  onCancel,
  fileData,
  loading = false,
}) => {
  const getFileUrl = () => {
    // You might need to add your API base URL here
    // eslint-disable-next-line no-constant-binary-expression
    const File_url = import.meta.env.VITE_IMAGE_BASE_URL || "";
    return `${File_url}/${fileData?.file_path || ""}`;
  };
  const getFileName = () => {
    return fileData?.file_name || "Document";
  };

  const getFileExtension = () => {
    const fileName = fileData?.file_name || "";
    return fileName.split(".").pop().toLowerCase();
  };

  const isPdfFile = () => {
    return getFileExtension() === "pdf";
  };

  return (
    <Modal
      //   title={getFileName()}
      centered
      open={isVisible}
      className="file-viewer-modal"
      onCancel={onCancel}
      footer={null}
      width="90%"
      style={{ maxWidth: "1200px", top: 20, padding: 0 }}
      bodyStyle={{ padding: 0, height: "80vh" }}
      closeIcon={
        <Button
          shape="circle"
          icon={<CloseOutlined />}
          className="text-white hover:text-primary"
        />
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <Spin size="large" />
        </div>
      ) : fileData ? (
        isPdfFile() ? (
          <iframe
            src={getFileUrl()}
            title={getFileName()}
            width="100%"
            height="100%"
            style={{ border: "none" }}
          />
        ) : (
          <a
            target="_blank"
            href={`${ import.meta.env
              .VITE_IMAGE_BASE_URL }/${
              fileData?.file_path || ""
            }`}
          ></a>
          //   <div className="flex items-center justify-center h-full flex-col">
          //     <Text className="text-xl text-white mb-4">
          //       This file type ({getFileExtension()}) cannot be previewed directly.
          //     </Text>
          //     <Button
          //       type="primary"
          //       size="large"
          //       onClick={() => window.open(getFileUrl(), "_blank")}
          //     >
          //       Download File
          //     </Button>
          //   </div>
        )
      ) : (
        <div className="flex items-center justify-center h-full">
          <Text className="text-xl text-white">File not found</Text>
        </div>
      )}
    </Modal>
  );
};

export default FileViewerModal;
