import React, { useState, useRef, useEffect } from "react";
import "./OTPVerification.scss";
import {
  Col,
  Row,
  Typography,
  Divider,
  Form,
  Input,
  Button,
  notification,
  Spin,
} from "antd";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  collectSlugsByRoleId,
  formatPhoneNumber,
  formatPhoneNumberWithOne,
  getStorage,
  normalizeOTPNumber,
  setStorage,
} from "../../../utils/commonfunction";
import { useDispatch, useSelector } from "react-redux";
import { fetchOTP, fetchResendOTP,fetchAttemptCount } from "../../../services/Store/Auth/action";
import AppHeader from "../../../components/AuthLayout/Header";
import Website_Logo from "../../../assets/Website_Logo.png";
import BrainImage from "../../../assets/Broker_AIQ_Brain.webp";
import Community_HUB from "../../../assets/Community_HUB.webp";
import Pricing_Engine from "../../../assets/Pricing_Engine.webp";
import AI_Product_Genie from "../../../assets/AI_Product_Genie.webp";
import Daily_Live_Trainings from "../../../assets/Daily_Live_Trainings.webp";
import Live_Toll_Free_Support from "../../../assets/Live_Toll_Free_Support.webp";
import Loading from "../../../components/AuthLayout/Loading";

const OTPVerification = () => {
  const { otpLoading, resendOTPLoading } = useSelector((state) => state?.auth);
  const user = getStorage("user", true);
  const userLoginRole = getStorage("userLoginRole", true);
  const formRef = useRef(null);
  const dispatch = useDispatch();

  console.log("user11", user?.user?.email);
  // console.log("userLoginRole", userLoginRole);

  const navigate = useNavigate();
  const { Text, Title } = Typography;

  // const isVerified = true;
  const [formValid, setFormValid] = useState(false);
  const [isVerified, setIsVerified] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const {remainingAttempt, remainingLoading}=useSelector(state=> state.auth)
  console.log(remainingAttempt,"remainingAttempt")

  const onChange = (text) => {
    // console.log('onChange:', text);
  };
  useEffect(()=>{
      dispatch(fetchAttemptCount({email:user?.user?.email}))
  },[])

  // Timer effect for countdown when attempts are 0
  useEffect(() => {
    if (remainingAttempt?.remaining_attempts === 0 && remainingAttempt?.last_attempt_at) {
      const lastAttemptTime = new Date(remainingAttempt.last_attempt_at).getTime();
      const fiveMinutesInMs = 5 * 60 * 1000; // 5 minutes in milliseconds
      const targetTime = lastAttemptTime + fiveMinutesInMs;
      
      const updateTimer = () => {
        const now = new Date().getTime();
        const timeLeft = targetTime - now;
        
        if (timeLeft <= 0) {
          setTimeRemaining(0);
          // Fetch remaining attempts when timer expires
          dispatch(fetchAttemptCount({email:user?.user?.email}));
        } else {
          setTimeRemaining(timeLeft);
        }
      };
      
      updateTimer(); // Initial call
      const interval = setInterval(updateTimer, 1000);
      
      return () => clearInterval(interval);
    } else {
      setTimeRemaining(0);
    }
  }, [remainingAttempt?.remaining_attempts, remainingAttempt?.last_attempt_at, dispatch, user?.user?.email])

  // Format time remaining for display
  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const onInput = (value) => {
    if (value?.length === 6) {
      setFormValid(true);
    } else {
      setFormValid(false);
    }
    // console.log('onInput:', value);
  };
  const sharedProps = {
    onChange,
    onInput,
  };

  const onFinish = (values) => {
    if (user?.user?.phone_number) {
      dispatch(
        fetchOTP({
          phone_number: formatPhoneNumberWithOne(user?.user?.phone_number),
          otp: values?.otp,
        })
      )
        .then((res) => {
          if (res?.payload?.meta?.status === 200) {
            notification.success({
              message: "OTP Verification Successfully",
              description: res?.payload?.meta?.message,
              duration: 3,
            });

            setStorage("user", res?.payload?.data);
            setIsVerified(res?.payload?.data?.user?.is_active);
            dispatch(fetchAttemptCount({email:user?.user?.email}))

            // console.log(
            //   `!userLoginRole?.name === 'LO' && res?.payload?.data?.user?.is_active`,
            //   userLoginRole?.name,
            //   res?.payload?.data?.user?.is_active
            // );

            //When user is sign up then we storr user,userLoginRole and loginUserPermission in storage.

            if (
              userLoginRole?.name === "LO" &&
              !res?.payload?.data?.user?.is_active
            ) {
              // for lo login
              navigate("/under-review");
            } else if (
              userLoginRole?.name !== "LO" &&
              userLoginRole?.name !== undefined &&
              res?.payload?.data?.user?.is_active
            ) {
              // for non-lo login
              window.location.replace("/onboarding");
              // navigate('/onboarding');
            } else {
              navigate("/role-selection");
            }
          } else {
            formRef.current.resetFields();
          }
        })
        .catch((e) => {
          console.log("OTP Error:", e);
        });
    }
  };

  const onClickResendCode = () => {
    if (user?.user?.phone_number) {
      dispatch(
        fetchResendOTP({
          phone_number: formatPhoneNumberWithOne(user?.user?.phone_number),
          email: formatPhoneNumberWithOne(user?.user?.email),
          type: "EM",
          function:"resend"
        })
      ).then((res) => {
        if (res?.payload?.meta?.status === 200) {
          // console.log("OTP resend res", res);
          dispatch(fetchAttemptCount({email:user?.user?.email}))
          notification.success({
            message: "OTP Sent Successfully",
            description: res?.payload?.meta?.message,
            duration: 3,
          });
        }
      });
    }
  };

  // if(remainingLoading){
  //   return (
  //     <>
  //     <Loading className="h-[100vh] bg-darkGray"></Loading>
  //     </>
  //   )
  // }

  return (
    <div className="mainSignInCOntainer h-[100vh]">
      {/* {
                isVerified ? */}
      <Row className="p-6 h-full">
        <Col
          xs={24}
          md={24}
          lg={13}
          className="bg-primary rounded-2xl leftBoxSignUp hidden lg:block"
        >
          {/* <div className="p-5">
            <div className="bg-darkGray px-3  rounded-full flex w-fit items-center">
              <i className="icon-support text-primary flex-shrink-0 text-[24px] mr-2 before:!m-0"></i>
              <Text type="secondary" className="text-sm">
                Support:{" "}
              </Text>
              <Text className="text-sm">+1 (800) 555-1234</Text>
            </div>
          </div> */}
          {/* Brain Image Section - Larger Size */}
          <div className="absolute flex justify-center items-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="absolute inset-[-80px] blur-[60px]  rounded-full bg-white sm:blur-[120px] opacity-25 z-0"></div>
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
                OTP Verification
              </Title>
              <div className="mt-3">
                <Text type="secondary" className="text-[18px]">
                  We’ve sent you an code to &nbsp;
                </Text>
                <Text className="text-[18px] font-semibold">
                  {formatPhoneNumberWithOne(user?.user?.email)}
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
                  name="OTPForm"
                  onFinish={onFinish}
                  layout="vertical"
                  autoComplete="off"
                  requiredMark={false}
                  ref={formRef}
                >
                  <Form.Item
                    // label={<Text type="secondary">Password</Text>}
                    name="otp"
                    className="OTPInput mt-5"
                    // normalize={normalizeOTPNumber}
                  >
                    <Input.OTP
                      length={6}
                      formatter={(str) => str.replace(/\D/g, "")}
                      {...sharedProps}
                      size="large"
                      autoFocus={true}
                    />
                  </Form.Item>

                  <Form.Item label={null}>
                    <Button
                      type="primary"
                      size="large"
                      className="mt-5"
                      htmlType="submit"
                      block
                      disabled={!formValid}
                      loading={otpLoading}
                    >
                      Continue
                    </Button>
                  </Form.Item>
                </Form>
              </div>

              <div className="mt-5 text-center flex justify-center items-center">
                <Link to={-1} className="flex justify-center items-center">
                  <i className="icon-back-arrow before:!m-0 text-primary text-2xl mr-2" />
                  <Text className=""> Go Back</Text>
                </Link>
              </div>
              <div className="mt-10 flex justify-center items-center flex-col">
                <div className="flex justify-center items-center">
                  <Text type="secondary" className="">
                    Didn't received code? &nbsp;
                  </Text>
                  <Text
                    className={` ${
                      (remainingAttempt?.remaining_attempts === 0 && timeRemaining > 0) || resendOTPLoading
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-primary cursor-pointer"
                    }`}
                    onClick={
                      (remainingAttempt?.remaining_attempts === 0 && timeRemaining > 0) || resendOTPLoading
                        ? null
                        : onClickResendCode
                    }
                  >
                    {resendOTPLoading ? "Sending..." : "Resend Code"}
                  </Text>
                </div>
                {remainingAttempt?.remaining_attempts !== undefined && (
                  <Text 
                    type="secondary" 
                    className={`text-sm mt-2 ${
                      remainingAttempt.remaining_attempts === 0 ? "text-red-500" : ""
                    }`}
                  >
                    {remainingAttempt.remaining_attempts === 0 
                      ? timeRemaining > 0 
                        ? `Try again in ${formatTime(timeRemaining)} min`
                        : "You can now resend the code"
                      : `${remainingAttempt.remaining_attempts} attempts remaining`
                    }
                  </Text>
                )}
              </div>
            </div>
          </div>
        </Col>
      </Row>
      {/* : 
                    <Navigate to="/under-review" />
            } */}
    </div>
  );
};

export default OTPVerification;
