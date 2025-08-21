import React, { useState } from "react";
import "./NewPassword.scss";
import { Col, Row, Typography, Divider, Form, Input, Button } from "antd";
import { Link } from "react-router-dom";
import Website_Logo from "../../../assets/Website_Logo.png";
import BrainImage from "../../../assets/Broker_AIQ_Brain.webp";
import Community_HUB from "../../../assets/Community_HUB.webp";
import Pricing_Engine from "../../../assets/Pricing_Engine.webp";
import AI_Product_Genie from "../../../assets/AI_Product_Genie.webp";
import Daily_Live_Trainings from "../../../assets/Daily_Live_Trainings.webp";
import Live_Toll_Free_Support from "../../../assets/Live_Toll_Free_Support.webp";

const NewPassword = () => {
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
                Set New Password
              </Title>
              <div className="mt-3">
                <Text type="secondary" className="text-[18px]">
                  Your password must be at least 8 characters.
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
                    label={<Text type="secondary">Password</Text>}
                    name="password"
                    rules={passwordValidationRules}
                  >
                    <Input.Password
                      size="large"
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirm"
                    label={<Text type="secondary">Confirm Password</Text>}
                    dependencies={["password"]}
                    hasFeedback
                    rules={[
                      {
                        required: true,
                        message: "Please confirm your password!",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error(
                              "The new password that you entered do not match!"
                            )
                          );
                        },
                      }),
                    ]}
                    validateStatus={false}
                  >
                    <Input.Password
                      size="large"
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
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
                      Reset Password
                    </Button>
                  </Form.Item>
                </Form>
              </div>

              <div className="mt-10 text-center">
                <Text className="">Back to Login</Text>
                {/* <Text className="text-primary">
                  &nbsp;
                  <Link to={"/signup"} className="!text-primary">
                    Register
                  </Link>
                </Text> */}
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default NewPassword;
