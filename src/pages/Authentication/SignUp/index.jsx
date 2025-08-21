import React, { useEffect, useState, useRef } from "react";
import "./SignUp.scss";
import {
  Col,
  Row,
  Typography,
  Divider,
  Form,
  Input,
  Button,
  Select,
  notification,
  Checkbox,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import { Turnstile } from '@marsidev/react-turnstile';
import {
  collectSlugsByRoleId,
  formatPhoneNumber,
  formatPhoneNumberWithOne,
  normalizeNMLSNumber,
  normalizePhoneNumber,
  setStorage,
  validatePhoneNumber,
} from "../../../utils/commonfunction";
import USFlag from "../../../assets/SVGs/US-Flag.svg";
import { useDispatch, useSelector } from "react-redux";
import { fetchRole, fetchSignUp } from "../../../services/Store/Auth/action";
import Website_Logo from "../../../assets/Website_Logo.png";
import BrainImage from "../../../assets/Broker_AIQ_Brain.webp";
import Community_HUB from "../../../assets/Community_HUB.webp";
import Pricing_Engine from "../../../assets/Pricing_Engine.webp";
import AI_Product_Genie from "../../../assets/AI_Product_Genie.webp";
import Daily_Live_Trainings from "../../../assets/Daily_Live_Trainings.webp";
import Live_Toll_Free_Support from "../../../assets/Live_Toll_Free_Support.webp";
const SignUp = () => {
  const { Text, Title } = Typography;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { signupLoading } = useSelector((state) => state?.auth);
  const turnstileRef = useRef();

  const [form] = Form.useForm();
  const [formValid, setFormValid] = useState(false);
  const [role, setRole] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [turnstileToken, setTurnstileToken] = useState(null);

  const [isTnc, setIsTnc] = useState(false);

  useEffect(() => {
    dispatch(fetchRole()).then((res) => {
      if (res.payload?.data?.role && Array.isArray(res.payload.data.role)) {
        const formattedRoles = res.payload.data.role.map((item) => ({
          value: item.name,
          label: item.full_name,
        }));
        setRole(formattedRoles);
      }
    });
  }, []);

  const handleRoleSelect = (value) => {
    setSelectedRole(value);
  };

  const onFinish = (values) => {
    if (!turnstileToken) {
      notification.error({
        message: "Please complete the security check",
        description: "Verify that you are not a robot.",
        duration: 3,
      });
      return;
    }

    const formattedPhone = values.phone_number
      ? `${values.phone_number.replace(/\D/g, "")}`
      : null;

    // formatPhoneNumber
    const finalData = {
      ...values,
      cf_turnstile_response: turnstileToken, 
      phone_number: formatPhoneNumberWithOne(formattedPhone),
      role: "LO",
      type: "EM",
    };

    dispatch(fetchSignUp(finalData)).then((res) => {
      if (res?.payload?.meta?.status === 200) {
        notification.success({
          message: "Registration Successfully",
          description: res?.payload?.meta?.message,
          duration: 3,
        });

        const defaultItem = res?.payload?.data?.user?.roles?.find(
          (item) => item.pivot && item.pivot.is_default === 1
        );

        const userLoginRole = {
          id: defaultItem?.id,
          name: defaultItem?.name,
          full_name: defaultItem?.full_name,
        };

        const allSlug = collectSlugsByRoleId(
          res?.payload?.data?.user?.roles,
          userLoginRole?.id
        );

        // const allSlug = collectSlugsByRoleId(res?.payload?.data?.user?.roles, userLoginRole?.id)
        setStorage("user", res?.payload?.data);
        setStorage("userLoginRole", userLoginRole);
        setStorage("loginUserPermission", allSlug);
        navigate("/otp-verify");
      } else {
        // Reset Turnstile on API error
        if (turnstileRef.current) {
          turnstileRef.current.reset();
        }
        setTurnstileToken(null);
        
       
      }
    }).catch((error) => {
      // Reset Turnstile on API error/catch
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
      setTurnstileToken(null);
      
      notification.error({
        message: "Registration Error",
        description: "Something went wrong. Please try again.",
        duration: 3,
      });
    });
  };

  const onTurnstileSuccess = (token) => {
    setTurnstileToken(token);
  };

  const onTurnstileError = () => {
    setTurnstileToken(null);
    notification.error({
      message: "Security verification failed",
      description: "Please try again.",
      duration: 3,
    });
  };

  // Track form validity on field changes
  const onFieldsChange = (_, allFields) => {
    // Check if any field has errors
    const hasErrors = allFields.some((field) => field.errors.length > 0);

    // Check if all required fields have values
    const requiredFields = ["role", "fname", "email", "nmls"];
    const hasRequiredValues = requiredFields.every((fieldName) => {
      const field = allFields.find((f) => f.name[0] === fieldName);
      return field && field.value;
    });

    // Form is valid when there are no errors and all required fields have values
    setFormValid(!hasErrors && hasRequiredValues);
  };
  const handleGoBack = () => {
    navigate("/");
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
          {/* <div className="p-5">
            <div className="bg-darkGray px-3  rounded-full flex w-fit items-center">
              <i className="icon-support text-primary flex-shrink-0 text-[24px] mr-2 before:!m-0"></i>
              <Text type="secondary" className="text-sm">
                Support:{" "}
              </Text>
              <Text className="text-sm">+1 (888) 706-7003</Text>
            </div>
          </div> */}
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
            <div
              className="logo flex justify-center items-center mb-8 cursor-pointer"
              onClick={handleGoBack}
            >
              <img
                src={Website_Logo}
                alt="Broker AIQ Logo"
                className="w-24 h-5 md:w-[280px] md:h-[60px]"
              />
            </div>
            <div className="text-center">
              <Title level={2} className="!m-0">
                Get Started Now!
              </Title>
              <div className="mt-3">
                <Text type="secondary" className="text-[18px]">
                  Register an account to access exclusive tools.
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
                  form={form}
                  name="signUp"
                  onFinish={onFinish}
                  layout="vertical"
                  autoComplete="off"
                  requiredMark={false}
                  onFieldsChange={onFieldsChange}
                >
                  {/* <Form.Item
                    label={<Text type="secondary">Select Role</Text>}
                    name="role"
                    // initialValue="LO"
                    // rules={[
                    //   {
                    //     required: true,
                    //     message: "Please select your role!",
                    //   },
                    // ]}
                  >
                    <Select
                      size="large"
                      allowClear
                      options={role}
                      placeholder="Loan Officer"
                      onChange={handleRoleSelect}
                      autoFocus={true}
                      disabled
                      suffixIcon={false}
                    />
                  </Form.Item> */}
                  <div className="mb-6 p-4 bg-primaryOpacity rounded-lg border-l-4 border-primary">
                    <Text className="text-primary font-medium">
                      <i className="icon-info-circle mr-2" />
                      You will be registered as Loan Officer
                    </Text>
                  </div>
                  <Form.Item
                    label={<Text type="secondary">Full Name</Text>}
                    name="name"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your full name!",
                      },
                      {
                        whitespace: true,
                        message: "Role name cannot contain only whitespace!",
                      },
                      {
                        min: 2,
                        message: "Name must be at least 2 characters!",
                      },
                      {
                        max: 150,
                        message: "Name cannot exceed 150 characters!",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Enter Full Name"
                      autoComplete="off"
                    />
                  </Form.Item>

                  <Form.Item
                    label={<Text type="secondary">Email</Text>}
                    name="email"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your email!",
                      },
                      {
                        type: "email",
                        message: "Please enter correct email!",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Enter Email"
                      autoComplete="off"
                    />
                  </Form.Item>

                  <Form.Item
                    label={<Text type="secondary">Contact Number</Text>}
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
                      prefix={
                        <div className="pr-3 border-r border-liteGray mr-3 flex items-center justify-center">
                          <img src={USFlag} alt="" className="mr-3" />
                          <Text>+1</Text>
                        </div>
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    label={<Text type="secondary">NMLS Number</Text>}
                    name="nmls_number"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your NMLS number!",
                      },
                    ]}
                    normalize={normalizeNMLSNumber}
                  >
                    <Input
                      size="large"
                      placeholder="Enter NMLS"
                      autoComplete="off"
                    />
                  </Form.Item>

                  <Form.Item
                    name="tnc"
                    valuePropName="checked"  // Add this line

                    rules={[
                      {
                        validator: (_, value) =>
                          value ? Promise.resolve() : Promise.reject(new Error('Please agree with Terms & Conditions!')),
                      },
                    ]}
                  >
                    <Checkbox value={isTnc} onChange={() => { setIsTnc(!isTnc) }}> <Text type="secondary">I agree with</Text> <Link to='/terms-and-conditions' className="text-primary hover:text-primary hover:opacity-75">Terms & Conditions</Link></Checkbox>
                  </Form.Item>

                  <Form.Item label={null}>
                    <div className="flex justify-center">
                      <Turnstile
                        ref={turnstileRef}
                        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                        onSuccess={onTurnstileSuccess}
                        onError={onTurnstileError}
                      />
                    </div>
                  </Form.Item>

                  <Form.Item label={null}>
                    <Button
                      type="primary"
                      size="large"
                      className="mt-2"
                      htmlType="submit"
                      block
                      loading={signupLoading}
                      disabled={!turnstileToken || signupLoading}
                    >
                      Register
                    </Button>
                  </Form.Item>
                </Form>
              </div>

              <div className="mt-10 text-center">
                <Text type="secondary" className="">
                  Already have an account?
                </Text>
                <Text className="text-primary">
                  &nbsp;
                  <Link to={"/signin"} className="!text-primary">
                    Login
                  </Link>
                </Text>
              </div>
              <div className="mt-5 text-center flex justify-center items-center">
                <Link to={"/"} className="flex justify-center items-center">
                  <i className="icon-back-arrow before:!m-0 text-primary text-2xl mr-2" />
                  <Text className=""> Go Back</Text>
                </Link>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default SignUp;
