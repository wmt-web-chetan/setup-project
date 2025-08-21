import { Button, Modal, Typography } from "antd";
import React, { useRef, forwardRef, useImperativeHandle } from "react";
import MicRecorder from "./MicRecorder";

const GeminieVoiceSearchModal = forwardRef(
  (
    { openVoiceModal, setOpenVoiceModal, from, handleSend, setUserQuestion },
    ref
  ) => {
    const { Text, Title } = Typography;
    const micRecorderRef = useRef(null);

    // Expose functions to parent component
    useImperativeHandle(ref, () => ({
      resetTimer: () => {
        if (micRecorderRef.current && micRecorderRef.current.resetTimer) {
          micRecorderRef.current.resetTimer();
        }
      },
      stopRecordingWithoutSending: () => {
        if (
          micRecorderRef.current &&
          micRecorderRef.current.stopRecordingWithoutSending
        ) {
          micRecorderRef.current.stopRecordingWithoutSending();
        }
      },
      isRecording: () => {
        return micRecorderRef.current
          ? micRecorderRef.current.isRecording
          : false;
      },
    }));

    const onClickVoicetoTextCancel = () => {
      // Stop recording WITHOUT sending the message
      if (
        micRecorderRef.current &&
        micRecorderRef.current.stopRecordingWithoutSending
      ) {
        micRecorderRef.current.stopRecordingWithoutSending();
      }
      setOpenVoiceModal(false);
    };

    return (
      <Modal
        title={false}
        centered
        destroyOnClose
        open={openVoiceModal}
        width={"40%"}
        onCancel={onClickVoicetoTextCancel} // Use the new handler
        footer={false}
        maskClosable={false} // Prevent accidental closing
        closable={true}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
          />
        }
      >
        <MicRecorder
          ref={micRecorderRef} // Add ref to control the recorder
          setOpenVoiceModal={setOpenVoiceModal}
          from={from}
          handleSend={handleSend}
          setUserQuestion={setUserQuestion}
        />
      </Modal>
    );
  }
);

// Add display name for better debugging
GeminieVoiceSearchModal.displayName = "GeminieVoiceSearchModal";

export default GeminieVoiceSearchModal;
