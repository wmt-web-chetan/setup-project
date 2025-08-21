import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Row,
  Col,
  Form,
  Input,
  Select,
  Button,
  Modal,
  message,
  notification,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Requirment from "../../assets/SVGs/reqruitment.svg";
import { normalizePhoneNumber, validatePhoneNumber } from "../../utils/commonfunction";
import { addReferral } from "../../services/Store/Refer/action";
import USFlag from '../../../src/assets/SVGs/US-Flag.svg';
// Import the phone validation functions

// Import your US flag image
// import USFlag from "../../assets/images/us-flag.png";

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Recruitment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHowItWorksModalOpen, setIsHowItWorksModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [messageValue, setMessageValue] = useState("");
  const messageRef = useRef(null);

  const { createReferralLoading } = useSelector((state) => state?.referrals);
  // Set container height based on screen size
  useEffect(() => {
    const handleResize = () => {
      setContainerHeight(
        window.innerWidth < 768 ? "calc(100vh - 212px)" : "calc(100vh - 241px)"
      );
    };

    // Set initial height
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const showHowItWorksModal = () => {
    setIsHowItWorksModalOpen(true);
  };

  const handleHowItWorksCancel = () => {
    setIsHowItWorksModalOpen(false);
  };

  const handleCancel = () => {
    if (submitting) return;
    setIsModalOpen(false);
    form.resetFields();
    setMessageValue("");
  };

  // Handler for text area input change with character limit
  const handleMessageChange = (e) => {
    const value = e.target.value;
    if (value.length <= 3000) {
      setMessageValue(value);
      form.setFieldsValue({ message: value });
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      console.log("Form values:", values);



      dispatch(addReferral(values)).then((res) => {
        console.log('Referel Response', res)
        notification.success({
          message: "Success",
          description: res?.payload?.meta?.message,
          duration: 2,
        });
        setIsModalOpen(false);
        form.resetFields();
        setMessageValue("");
        navigate('/recruitment/myreferral')

      }).catch((error) => {
        console.log('Error: ', error)
      })


    } catch (error) {
      console.error("Form submission error:", error);
      // message.error("Failed to send invitation. Please try again");
    } finally {
      setSubmitting(false);
    }
  };

  // How It Works steps data
  const howItWorksSteps = [
    {
      number: 1,
      title: 'Click on "Send a Referral"',
      description: ""
    },
    {
      number: 2,
      title: "Enter the prospective LO's details and send an invitation",
      description: ""
    },
    {
      number: 3,
      title: "Track the status of your referrals",
      description: ""
    }
  ];

  return (
    <Row className="bg-darkGray h-full w-full flex flex-col gap-3 sm:gap-6 px-header-wrapper">
      <div className="w-full"></div>

      <Col
        span={24}
        className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0"
      >
        <div className="flex justify-center items-center">
          <Title
            level={3}
            className="text-white !m-0 h-auto flex flex-wrap sm:flex-nowrap justify-center items-center text-base sm:text-lg md:text-xl"
          >
            <Link
              to="/dashboard"
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Dashboard
              </Text>
            </Link>

            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Text className="text-white text-lg sm:text-2xl">Recruitment</Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <div className={`w-full`}>
          <div
            className={`rounded-3xl border overflow-hidden bg-gray border-solid border-liteGray w-full relative p-4`}
            style={{ height: containerHeight }}
          >
            {/* Shadow effect at the bottom inside the container */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-12
           bg-gradient-to-t from-black/50 to-transparent 
           pointer-events-none z-10`}
            ></div>

            <div className="flex justify-end">
              <Button className="rounded-full bg-gray" size="large" onClick={() => navigate("/recruitment/myreferral")}>
                My Referrals
              </Button>
            </div>
            <div className="flex justify-center flex-col items-center h-[80%]">
              <div className="">
                <div className="flex justify-center">
                  <img src={Requirment} alt="requirment" className="h-[60%] w-[80%]" />
                </div>
              </div>
              <div className="flex justify-center">
                <Text className="text-md w-2/3 text-center">
                  Welcome to the Loan Officer Referral Program! Invite other
                  professionals to join our company and expand your network.
                </Text>
              </div>
              <Row gutter={[16, 16]} className="w-full justify-center mt-6">
                <Col xs={24} sm={12} md={10} lg={8} xl={6}>
                  <Button
                    size="large"
                    className="w-full bg-gray text-white border-liteGray hover:border-primary hover:text-primary"
                    onClick={showHowItWorksModal}
                  >
                    How It Works?
                  </Button>
                </Col>
                <Col xs={24} sm={12} md={10} lg={8} xl={6}>
                  <Button
                    size="large"
                    type="primary"
                    className="w-full"
                    onClick={showModal}
                  >
                    Send a Referral
                  </Button>
                </Col>
              </Row>
            </div>
          </div>
        </div>
      </Col>

      {/* How It Works Modal */}
      <Modal
        title="How It Works?"
        centered
        open={isHowItWorksModalOpen}
        onCancel={handleHowItWorksCancel}
        footer={null}
        width={'52%'}
        className="modalWrapperBox "
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
          />
        }
      >
        <div className="mt-8 mb-6">
          <Text className="text-grayText">
            Learn about the referral process and how you can invite potential Loan Officers to join by following the below mentioned steps.
          </Text>
        </div>

        <Row gutter={[16, 16]} className="mb-4 mt-3">
          {howItWorksSteps.map((step) => (
            <Col xs={24} md={8} key={step.number}>
              <div className="bg-liteGrayV1 rounded-2xl p-4 py-5 h-full flex flex-col items-center text-center">
                <div className="bg-primaryOpacity w-16 h-16 !rounded-full flex items-center justify-center mb-4 ">
                  <div className="bg-primary !rounded-full w-12 h-12 flex items-center justify-center border-3 border-red-700">
                    <Text className="text-white text-xl font-bold">{step.number}</Text>
                  </div>
                </div>
                <Text className="text-white text-sm font-medium">{step.title}</Text>
              </div>
            </Col>
          ))}
        </Row>
      </Modal>

      {/* Referral Modal */}
      <Modal
        title="Send a Referral"
        centered
        destroyOnClose
        open={isModalOpen}
        onCancel={!submitting ? handleCancel : undefined}
        footer={false}
        maskClosable={!submitting}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
            disabled={submitting}
          />
        }
        width={700}
        className="modalWrapperBox px-3"
      >
        <div className="mt-4 mb-4">
          <Text className="text-grayText">
            Fill in the details of the Prospective Loan Officer to send a referral invitation and help them join our network.
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          size="large"
          className="referral-form"
        >
          <Row >
            <Col span={24}>
              <Form.Item
                name="name"
                label={<Text type="secondary" className="text-sm">Name</Text>}
                rules={[{ required: true, message: "Please Enter a Name" }]}
              >
                <Input
                  placeholder="Enter Name"
                  className="bg-darkGray text-white border-liteGray"
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="email"
                label={<Text type="secondary" className="text-sm">Email</Text>}
                rules={[
                  { required: true, message: "Please Enter an Email" },
                  { type: "email", message: "Please Enter a Valid Email" }
                ]}
              >
                <Input
                  placeholder="Enter Email"
                  className="bg-darkGray text-white border-liteGray"
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label={<Text type="secondary" className="text-sm">Contact Number</Text>}
                name="phone_number"
                rules={[
                  {
                    validator: validatePhoneNumber,
                  },
                ]}
                normalize={normalizePhoneNumber}
              >
                <Input
                  size="large"
                  placeholder="215 456-7890"
                  autoComplete="tel"
                  maxLength={12} // Account for format characters: 3 + 1 + 3 + 1 + 4 = 12
                  className="bg-darkGray text-white border-liteGray"
                  prefix={
                    <div className="pr-3 border-r border-liteGray mr-3 flex items-center justify-center">
                      <img src={USFlag} alt="" className="mr-3" />
                      <Text>+1</Text>
                    </div>
                  }
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="msg"
                label={<Text type="secondary" className="text-sm">Message</Text>}
                rules={[{ required: true, message: "Please Enter a Message" }]}
              >
                <TextArea
                  ref={messageRef}
                  value={messageValue}
                  onChange={handleMessageChange}
                  autoSize={{ minRows: 4, maxRows: 8 }}
                  placeholder="Enter Message..."
                  className="bg-darkGray text-white border-liteGray"
                  maxLength={3000}
                />
              </Form.Item>
              <div className="flex justify-end mb-3">
                <Text className="text-grayText text-xs">
                  {messageValue.length}/3000
                </Text>
              </div>
            </Col>
          </Row>

          <hr className="text-liteGray " />

          <Row gutter={16} className="mt-4">
            <Col xs={24} sm={12}>
              <Button
                size="large"
                className="w-full bg-gray text-white hover:bg-liteGray border-liteGray"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
            </Col>
            <Col xs={24} sm={12}>
              <Button
                size="large"
                type="primary"
                onClick={handleSubmit}
                loading={submitting}
                className="w-full"
              >
                Send Invitation
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Row>
  );
};

export default Recruitment;