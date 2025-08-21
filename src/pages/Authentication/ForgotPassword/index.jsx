import React, { useState } from "react";
import "./ForgotPassword.scss";
import {
  Col,
  Row,
  Typography,
  Divider,
  Form,
  Input,
  Button,
  Badge,
} from "antd";
import { Link } from "react-router-dom";
import PaymentForm from "../PaymentForm";
import aiBadge from "../../../assets/SVGs/AI-Bullet.svg";
import ogBadge from "../../../assets/SVGs/Orange-Bullet.svg";
import successBadge from "../../../assets/SVGs/Checklist.svg";
import pendingBadge from "../../../assets/SVGs/Pending-Checklist.svg";
import Website_Logo from "../../../assets/Website_Logo.png";
import BrainImage from "../../../assets/Broker_AIQ_Brain.webp";
import Community_HUB from "../../../assets/Community_HUB.webp";
import Pricing_Engine from "../../../assets/Pricing_Engine.webp";
import AI_Product_Genie from "../../../assets/AI_Product_Genie.webp";
import Daily_Live_Trainings from "../../../assets/Daily_Live_Trainings.webp";
import Live_Toll_Free_Support from "../../../assets/Live_Toll_Free_Support.webp";

const ForgotPassword = () => {
  const { Text, Title } = Typography;

  const [selectedRole, setSelectedRole] = useState("loanOfficer");
  const roles = [
    { value: "accountExecutive", label: "Account Executive" },
    { value: "contractProcessor", label: "Contract Processor" },
    { value: "realEstateAgent", label: "Real Estate Agent" },
    { value: "loanOfficer", label: "Loan Officer" },
  ];

  // Password validation regex patterns
  const passwordValidationRules = [
    {
      required: true,
      message: "Please enter your password!",
    },
    {
      min: 8,
      message: "Password must be at least 8 characters!",
    },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/,
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character!",
    },
  ];

  const handleRoleSelect = (value) => {
    setSelectedRole(value);
  };

  const onFinish = (values) => {
    // console.log("Success:", values);
    // console.log("selectedRole", selectedRole);
  };

  return (
    <div className="mainSignInCOntainer h-[100vh]">
      <Row className="p-6 h-full">
        <Col
          xs={24}
          md={24}
          lg={13}
          className="bg-primary rounded-2xl leftBoxSignUp hidden lg:block"
        >
          <div className="p-5">
            <div className="bg-darkGray px-3  rounded-full flex w-fit items-center">
              <i className="icon-support text-primary flex-shrink-0 text-[24px] mr-2 before:!m-0"></i>
              <Text type="secondary" className="text-sm">
                Support:{" "}
              </Text>
              <Text className="text-sm">+1 (888) 706-7003</Text>
            </div>
          </div>
           {/* Brain Image Section - Larger Size */}
                              <div className="absolute flex justify-center items-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <div className="relative">
                                  <div className="absolute inset-[-80px] blur-[60px] sm:inset-[-220px] rounded-full bg-white sm:blur-[120px] opacity-25 z-0"></div>
                                  <img
                                    src={BrainImage}
                                    alt="Brain Image"
                                    className="bqmain h-[180px] w-[240px] xs:h-[160px] relative !z-0 xs:w-[260px] sm:h-[200px] sm:w-[300px] md:h-[280px] md:w-[420px] lg:h-[280px] lg:w-[380px] xl:h-[300px] xl:w-[450px]"
                                  />
                    
                                  {/* Sub-Images Positioned Around the Brain - Larger Size */}
                                  {/* Top Sub-Image (Community Hub) */}
                                  {/* <img
                                    src={Community_HUB}
                                    alt="Community Hub"
                                    className="absolute h-[65px] xs:h-[75px] sm:h-[85px] md:h-[100px] lg:h-[105px] opacity-100 drop-shadow-md 
                                     top-5 xs:top-10 sm:top-12 md:top-14 lg:top-14 left-[68%] transform -translate-x-1/2 
                                     -translate-y-[80px] xs:-translate-y-[100px] sm:-translate-y-[120px] md:-translate-y-[140px] lg:-translate-y-[150px]"
                                  /> */}
                    
                                  {/* Top-Right Sub-Image (Pricing Engine) */}
                                  {/* <img
                                    src={Pricing_Engine}
                                    alt="Pricing Engine"
                                    className="absolute hero_icon2 h-[65px] xs:h-[75px] sm:h-[85px] md:h-[100px] lg:h-[105px] opacity-100 drop-shadow-md 
                                     top-0 xs:top-0 sm:top-1 md:top-1 lg:top-1 !left-[30%] md:!left-[32%] transform 
                                     translate-x-[130px] sm:translate-x-[140px] md:translate-x-[210px] lg:translate-x-[210px]"
                                  /> */}
                    
                                  {/* Bottom-Right Sub-Image (AI Product Genie) */}
                                  {/* <img
                                    src={AI_Product_Genie}
                                    alt="AI Product Genie"
                                    className="absolute h-[65px] xs:h-[75px] sm:h-[85px] md:h-[100px] lg:h-[105px] opacity-100 drop-shadow-md 
                                     bottom-3 right-[-13px] xs:bottom-6 sm:bottom-1 md:bottom-0 lg:bottom-[-10px] md:right-[28px] transform 
                                     translate-x-[110px] xs:translate-x-[70px] sm:translate-x-[140px] md:translate-x-[190px] lg:translate-x-[170px]"
                                  /> */}
                    
                                  {/* Left Sub-Image (Daily Live Trainings) */}
                                  {/* <img
                                    src={Daily_Live_Trainings}
                                    alt="Daily Live Trainings"
                                    className="absolute h-[65px] xs:h-[75px] sm:h-[85px] md:h-[100px] lg:h-[105px] opacity-100 drop-shadow-md 
                                     top-[-12px] xs:top-[-12px] sm:top-[-12px] md:top-[-12px] lg:top-[-12px] md:!left-[-24px] left-[-4px] transform 
                                     -translate-x-[90px] xs:-translate-x-[150px] sm:-translate-x-[140px] md:-translate-x-[160px] lg:-translate-x-[140px]"
                                  /> */}
                    
                                  {/* Bottom-Left Sub-Image (Live Toll-Free Support) */}
                                  {/* <img
                                    src={Live_Toll_Free_Support}
                                    alt="Live Toll-Free Support"
                                    className="absolute h-[65px] xs:h-[75px] sm:h-[85px] md:h-[100px] lg:h-[105px] opacity-100 drop-shadow-md 
                                     bottom-0 xs:bottom-1 sm:bottom-1 md:bottom-1 lg:bottom-1 left-[-5px] md:left-[55px] transform 
                                     -translate-x-[100px] xs:-translate-x-[150px] sm:-translate-x-[140px] md:-translate-x-[160px] lg:-translate-x-[160px]"
                                  /> */}
                                </div>
                              </div>
        </Col>
        <Col
          xs={24}
          md={24}
          lg={11}
          className="flex items-center justify-center"
        >
          <div className="w-[97%] md:w-[80%] lg:w-[70%] xl:w-[80%] 2xl:w-[70%] 3xl:w-[70%]  bg-gray rounded-2xl border border-liteGray p-6 md:p-8 lg:p-14 xl:p-8 2xl:p-14 3xl:p-14 my-10">
            {/* <div className="flex flex-col md:flex-row items-center justify-center mb-8">
              <Title className="!text-primary !m-0 pr-3">{`LO's`}</Title>
              <Title className="!m-0">Dashboard</Title>
            </div> */}
            <div className="logo flex justify-center items-center mb-8">
              <img
                src={Website_Logo}
                alt="Broker AIQ Logo"
                className="w-24 h-5 md:w-[280px] md:h-[60px]"
              />
            </div>
            <div className="text-center">
              <Title level={2} className="!m-0">
                Forgot Password?
              </Title>
              <div className="mt-3">
                <Text type="secondary" className="text-[18px]">
                  No worries, We’ll send you reset instructions on email.
                </Text>
              </div>
            </div>
            <div className=" flex justify-center items-center">
              <div className="w-[35%]">
                <Divider className="" />
              </div>
            </div>

            <div className="signUpForm">
              <div>
                <Form
                  name="signUp"
                  onFinish={onFinish}
                  layout="vertical"
                  autoComplete="off"
                  requiredMark={false}
                >
                  <Form.Item
                    label={<Text type="secondary">Email</Text>}
                    name="email"
                    rules={[
                      {
                        required: true,
                        message: "Please input your email!",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Enter Email"
                      autoComplete="off"
                    />
                  </Form.Item>

                  <Form.Item label={null}>
                    <Button
                      type="primary"
                      size="large"
                      className="mt-5"
                      htmlType="submit"
                      block
                    >
                      Send
                    </Button>
                  </Form.Item>
                </Form>
              </div>

              <div className="mt-10 text-center">
                <Text className="">Back to Login</Text>
              </div>
            </div>
          </div>
        </Col>
      </Row>
      <Row
        className="bg-gray m-6 rounded-2xl border border-liteGray p-6"
        gutter={[24, 24]}
      >
        <Col xs={24} md={24} lg={8} xl={10}>
          <div className="bg-gray rounded-2xl border border-liteGray">
            <div className="relative bg-darkGray rounded-t-2xl ">
              <div className="absolute h-full w-full overflow-hidden rounded-t-2xl">
                <div className="elipceBot absolute p-[360px] right-[50%] top-[-40%] "></div>
                <div className="elipceBot absolute p-[320px] left-[57%] bottom-[-44%] "></div>
              </div>
              <div className="py-14 text-center pb-28">
                <Text className="text-[32px] z-10">
                  Subscribe and unlock full access!
                </Text>
              </div>
              <div className="moneyPlant absolute bottom-[-24%] left-[7%] bg-liteGray flex items-center rounded-lg p-3 w-[86%] z-10">
                <div className="bg-primaryOpacity rounded-lg p-[6px]">
                  <i className="icon-subscription before:!m-0 text-primary text-7xl " />
                </div>
                <div className="ml-3">
                  <div className="">
                    <Text className="text-primary mb-3">Monthly Plan</Text>
                  </div>
                  <div className="flex items-end">
                    <Title level={2} className="!m-0">
                      $149
                    </Title>
                    <Text type="secondary" className="ml-1">
                      /month
                    </Text>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center ">
              <div className="mt-24 w-[86%] mb-8">
                <Title level={4} type="secondary">
                  Inclusions
                </Title>
                <div className="mb-1 flex">
                  <img src={aiBadge} alt="" className="mr-2" />
                  <Text>Onboarding & Training</Text>
                </div>
                <div className="mb-1 flex">
                  <img src={aiBadge} alt="" className="mr-2" />

                  <Text>Community Access</Text>
                </div>
                <div className="mb-1 flex">
                  <img src={ogBadge} alt="" className="mr-2" />

                  <Text>Recruitment & Referrals</Text>
                </div>
                <div className="mb-1 flex">
                  <img src={ogBadge} alt="" className="mr-2" />
                  <Text>Quickly Connect with Account Executives</Text>
                </div>
                <div className="mb-1 flex">
                  <img src={ogBadge} alt="" className="mr-2" />
                  <Text>Onboarding & Training</Text>
                </div>
                <div className="mb-1 flex">
                  <img src={ogBadge} alt="" className="mr-2" />
                  <Text>Quickly Connect with Account Executives</Text>
                </div>
                <div className="mb-1 flex">
                  <img src={ogBadge} alt="" className="mr-2" />
                  <Text>Onboarding & Training</Text>
                </div>
              </div>
            </div>
          </div>
        </Col>
        <Col xs={24} md={24} lg={16} xl={14}>
          <PaymentForm />
        </Col>
      </Row>

      <div className="w-full flex justify-center items-center py-5">
        <div className="w-[46%] bg-gray border border-liteGray rounded-2xl p-10">
          <div className="mb-8">
            <Title level={2}>Your Path to Full Access</Title>
            <Text className="text-[21px]" type="secondary">
              Each checklist item moves you closer to 100% of completion,
              unlocking full dashboard access.
              <Text className="text-primary text-[21px]">
                Please wait while your accounts listed below are being created
                by the admin.
              </Text>
            </Text>{" "}
          </div>

          <div className="flex items-center mb-5">
            <div className="mr-5">
              <img src={successBadge} alt="" />
            </div>
            <div>
              {" "}
              <Text className="text-[24px] ">BrokerAIQ Account Created</Text>
            </div>
          </div>

          <div className="flex items-center mb-5">
            <div className="mr-5">
              <img src={successBadge} alt="" />
            </div>
            <div>
              {" "}
              <Text className="text-[24px] ">
                Loan Originator Engagement Agreement Signed
              </Text>
            </div>
          </div>

          <div className="flex items-center mb-5">
            <div className="mr-5">
              <img src={successBadge} alt="" />
            </div>
            <div>
              {" "}
              <Text className="text-[24px] ">Platform Fee Paid</Text>
            </div>
          </div>

          <div className="flex items-center mb-5">
            <div className="mr-5">
              <img src={pendingBadge} alt="" />
            </div>
            <div>
              {" "}
              <Text className="text-[24px] opacity-50" type="secondary">
                Salesforce Account
              </Text>
            </div>
          </div>

          <div className="flex items-center mb-5">
            <div className="mr-5">
              <img src={pendingBadge} alt="" />
            </div>
            <div>
              {" "}
              <Text className="text-[24px] opacity-50" type="secondary">
                Meridian Link Account
              </Text>
            </div>
          </div>

          <div className="flex items-center mb-5">
            <div className="mr-5">
              <img src={pendingBadge} alt="" />
            </div>
            <div>
              {" "}
              <Text className="text-[24px] opacity-50" type="secondary">
                Credit Technology Inc. Account
              </Text>
            </div>
          </div>

          <div className="flex items-center mb-5">
            <div className="mr-5">
              <img src={pendingBadge} alt="" />
            </div>
            <div>
              {" "}
              <Text className="text-[24px] opacity-50" type="secondary">
                Office 365 Account
              </Text>
            </div>
          </div>

          <Button disabled block className="mt-5" size="large">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
