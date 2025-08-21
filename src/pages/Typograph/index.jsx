import React, { useRef, useState } from "react";
import "./Typography.scss";
import SignaturePad from "react-signature-canvas";
import { Button, Col, Divider, Input, Row } from "antd";
import SpeechToText from "../../components/AuthLayout/SpeechToText";
import RoleSelector from "../../components/AuthLayout/RoleSelector";
import { Typography } from "antd";
import MultiSelectWithSelectAll from "../../components/AuthLayout/MultiSelectWithSelectAll";
import AudioPlayer from "../../components/AuthLayout/AUdioPlayer";
import MicRecorder from "../../components/AuthLayout/MicRecorder";
import VideoPlayer from "../../components/AuthLayout/VideoPlayer";

const Typograph = () => {
  const { Title, Text } = Typography;

  // 1. Signature-pad start

  const sigCanvas = useRef({});
  const [imageURL, setImageURL] = useState(null); // create a state that will contain our image url

  const clear = () => sigCanvas.current.clear();

  const save = () => {
    // Use try-catch to handle potential errors
    try {
      // Get the raw canvas data directly
      const dataURL = sigCanvas.current.toDataURL("image/png");
      setImageURL(dataURL);
    } catch (error) {
      console.error("Error saving signature:", error);
    }
  };

  // Define the close function that was missing
  const close = () => {
    // Add your close functionality here
    console.log("Close button clicked");
    // For example, you could clear and hide the signature pad
    clear();
    setImageURL(null);
  };

  console.log("imageURL", imageURL);

  //   1. Signature-pad end

  // 1. My Speech Recognition App start

  const [transcriptData, setTranscriptData] = useState({
    final: "",
    interim: "",
  });

  const handleTranscriptChange = (newTranscript) => {
    setTranscriptData(newTranscript);
    console.log("Transcript updated:", newTranscript);
  };

  //   1. My Speech Recognition App end

  return (
    <div className="mainTypoBox">
      <div className="text-4xl w-full flex justify-center align-middle">
        Typography
      </div>
      <div>
        <Divider className="mt-24" />
        <div className="text-2xl w-full flex justify-start align-middle  py-10">
          1. Boiler
        </div>
        <Row></Row>
        <Divider className="mb-24" />
      </div>
      <div>
        <Divider className="mt-24" />
        <div className="text-2xl w-full flex justify-start align-middle  py-10">
          1. Elements
        </div>
        <Row>
          <Col xs={24}>
            <div className="p-10 bg-gray">
              <Row gutter={24}>
                <Col xs={8}>
                  <Input placeholder="Basic Usage" size="large" />
                </Col>
                <Col xs={8} className="flex">
                  <Button type="primary" size="large">
                    Primary Button
                  </Button>
                  <Button type="primary" size="large" disabled>
                    Primary Button
                  </Button>

                  <Button
                    className="bg-primaryOpacity text-primary border-primary"
                    size="large"
                    variant="filled"
                  >
                    Filled
                  </Button>
                </Col>
                <Col xs={8}>
                  <RoleSelector />
                </Col>
              </Row>
              <Row gutter={24}>
                <Col xs={8}>
                  <Title>h1. Ant Design</Title>
                  <Title level={2}>h2. Ant Design</Title>
                  <Title level={3}>h3. Ant Design</Title>
                  <Title level={4}>h4. Ant Design</Title>
                  <Title level={5}>h5. Ant Design</Title>
                </Col>

                <Col xs={8}>
                  <Text>Ant Design (default)</Text>
                  <Text type="secondary">Ant Design (secondary)</Text>
                </Col>

                <Col xs={8}>
                  <i className="icon-subscription before:!m-0 text-primary text-2xl " />
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
        <Divider className="mb-24" />
      </div>
      <div>
        <Divider className="mt-24" />
        <div className="text-2xl w-full flex justify-start align-middle  py-10">
          1. Signature-pad
        </div>
        <Row>
          <Col span={12}>
            <SignaturePad
              ref={sigCanvas}
              canvasProps={{
                className: "signatureCanvas",
              }}
            />
            {/* Button to trigger save canvas image */}
            <button onClick={save}>Save</button>
            <button onClick={clear}>Clear</button>
            <button onClick={close}>Close</button>
          </Col>
          <Col span={12}>
            {imageURL ? (
              <img
                src={imageURL}
                alt="my signature"
                style={{
                  display: "block",
                  margin: "0 auto",
                  border: "1px solid black",
                  // width: "150px",
                }}
              />
            ) : null}
          </Col>
        </Row>
        <Divider className="mb-24" />
      </div>

      <MultiSelectWithSelectAll />

      <div>
        <Divider className="mt-24" />
        <div className="text-2xl w-full flex justify-start align-middle  py-10">
          1. My Speech Recognition App
        </div>
        <Row>
          <SpeechToText
            title="Voice to Text Converter"
            lang="en-US"
            // onTranscriptChange={handleTranscriptChange}
          />

          <div className="transcript-actions">
            <h4>Total characters: {transcriptData.final.length}</h4>
            <button
              className="action-button"
              onClick={() =>
                navigator.clipboard.writeText(transcriptData.final)
              }
              disabled={!transcriptData.final}
            >
              Copy Text
            </button>
            <button
              className="action-button clear-button"
              onClick={() => setTranscriptData({ final: "", interim: "" })}
              disabled={!transcriptData.final}
            >
              Clear Text
            </button>
          </div>
        </Row>
        <Divider className="mb-24" />
      </div>

      <div>
        <Divider className="mt-24" />
        <div className="text-2xl w-full flex justify-start align-middle  py-10">
          1. Audio Player
        </div>
        <Row>
          <AudioPlayer
            audioSrc={
              "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3"
            }
          />

          <MicRecorder />
        </Row>
        <Divider className="mb-24" />
      </div>

      <div>
        <Divider className="mt-24" />
        <div className="text-2xl w-full flex justify-start align-middle  py-10">
          1. Vimeo R&D
        </div>
        <Row>
          <Col xs={24}>
            <VideoPlayer
              vimeoUrl={
                "https://player.vimeo.com/video/1069876021?h=4b8638dbcd"
              }
              startTime={120}
            />
          </Col>
        </Row>
        <Divider className="mb-24" />
      </div>
    </div>
  );
};

export default Typograph;
