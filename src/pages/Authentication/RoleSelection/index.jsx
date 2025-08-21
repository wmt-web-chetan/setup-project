import React, { useEffect, useState, useRef, useCallback } from "react";
import "./RoleSelection.scss";
import { Button, Col, Divider, Form, Row, Typography, Spin } from "antd";
import AppHeader from "../../../components/AuthLayout/Header";
import { useDispatch, useSelector } from "react-redux";
import {
  collectSlugsByRoleId,
  formatPhoneNumberWithOne,
  getStorage,
  setStorage,
} from "../../../utils/commonfunction";
import { Link, useNavigate } from "react-router-dom";
import RoleSelector from "../../../components/AuthLayout/RoleSelector";
import Website_Logo from "../../../assets/Website_Logo.png";
import { fetchUpdateRoleAuth } from "../../../services/Store/Auth/action";
import BrainImage from "../../../assets/Broker_AIQ_Brain.webp";
import Community_HUB from "../../../assets/Community_HUB.webp";
import Pricing_Engine from "../../../assets/Pricing_Engine.webp";
import AI_Product_Genie from "../../../assets/AI_Product_Genie.webp";
import Daily_Live_Trainings from "../../../assets/Daily_Live_Trainings.webp";
import Live_Toll_Free_Support from "../../../assets/Live_Toll_Free_Support.webp";

const RoleSelection = () => {
  const navigate = useNavigate();
  const { otpLoading } = useSelector((state) => state?.auth);
  const user = getStorage("user", true);
  const { Text, Title } = Typography;

  const [isVerified, setIsVerified] = useState(true);
  const [selectedRole, setSelectedRole] = useState();
  const [isAutoRedirecting, setIsAutoRedirecting] = useState(false);

  // Refs to prevent multiple API calls
  const hasProcessedAutoRedirect = useRef(false);
  const isProcessingRole = useRef(false);
  const timeoutRef = useRef(null);

  const dispatch = useDispatch();

  // console.log("user role selection", user);

  useEffect(() => {
    const defaultItem = user?.user?.roles?.find(
      (item) => item.pivot && item.pivot.is_default === 1
    );
    if (defaultItem && !selectedRole) {
      setSelectedRole({
        id: defaultItem?.id,
        name: defaultItem?.name,
        full_name: defaultItem?.full_name,
      });
    }
  }, []); // Remove user dependency to prevent multiple runs

  // Auto-redirect logic for single role users with proper guards
  useEffect(() => {
    // Guard clauses to prevent multiple executions
    if (hasProcessedAutoRedirect.current || isProcessingRole.current) {
      return;
    }

    const userRoles = user?.user?.roles;

    // Check if user has only one role
    if (userRoles && userRoles.length === 1) {
      hasProcessedAutoRedirect.current = true;
      setIsAutoRedirecting(true);

      const singleRole = userRoles[0];
      const roleToSet = {
        id: singleRole?.id,
        name: singleRole?.name,
        full_name: singleRole?.full_name,
      };

      // Set the role
      setSelectedRole(roleToSet);

      // Auto-trigger the role save process with debounce
      timeoutRef.current = setTimeout(() => {
        handleAutoRoleSave(roleToSet);
      }, 500);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Empty dependency array to run only once

  const handleAutoRoleSave = useCallback(
    (roleToSave) => {
      // Prevent multiple simultaneous calls
      if (isProcessingRole.current || !roleToSave?.id) {
        return;
      }

      isProcessingRole.current = true;

      dispatch(fetchUpdateRoleAuth({ role_id: roleToSave?.id }))
        .then((res) => {
          // console.log("Auto Role Save Res", res);

          if (res?.payload?.meta?.success) {
            const allSlug = collectSlugsByRoleId(
              user?.user?.roles,
              roleToSave?.id
            );

            setStorage("userLoginRole", roleToSave);
            setStorage("loginUserPermission", allSlug);

            if (user?.user?.is_active) {
              if (user.onboarding.onboarding_step === 0) {
                window.location.replace("/dashboard");
              } else {
                window.location.replace("/onboarding");
              }
            } else if (!user?.user?.is_active) {
              navigate("/under-review");
            } else {
              // console.log("else");
            }
          } else {
            // If auto-save fails, reset flags and show the role selection UI
            hasProcessedAutoRedirect.current = false;
            isProcessingRole.current = false;
            setIsAutoRedirecting(false);
          }
        })
        .catch((error) => {
          // console.log("Auto Role Save Error:", error);
          // If auto-save fails, reset flags and show the role selection UI
          hasProcessedAutoRedirect.current = false;
          isProcessingRole.current = false;
          setIsAutoRedirecting(false);
        });
    },
    [dispatch, navigate, user]
  );

  const handleRoleSelect = useCallback((value) => {
    // console.log("handleRoleSelect value", value);
    setSelectedRole({
      id: value?.id,
      name: value?.name,
      full_name: value?.full_name,
    });
  }, []);

  const onClickSaveSelectedRole = useCallback(() => {
    // Prevent multiple simultaneous calls
    if (isProcessingRole.current || !selectedRole?.id) {
      return;
    }

    isProcessingRole.current = true;

    dispatch(fetchUpdateRoleAuth({ role_id: selectedRole?.id }))
      .then((res) => {
        // console.log("Manual Role Save Res", res);

        if (res?.payload?.meta?.success) {
          const allSlug = collectSlugsByRoleId(
            user?.user?.roles,
            selectedRole?.id
          );

          setStorage("userLoginRole", selectedRole);
          setStorage("loginUserPermission", allSlug);

          if (user?.user?.is_active) {
            if (user.onboarding.onboarding_step === 0) {
              window.location.replace("/dashboard");
            } else {
              window.location.replace("/onboarding");
            }
          } else if (!user?.user?.is_active) {
            navigate("/under-review");
          } else {
            // console.log("else");
          }
        } else {
          isProcessingRole.current = false;
        }
      })
      .catch((error) => {
        // console.log("Manual Role Save Error:", error);
        isProcessingRole.current = false;
      });
  }, [selectedRole, dispatch, navigate, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Show loading state when auto-redirecting for single role users
  if (isAutoRedirecting) {
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
              <div className="logo flex justify-center items-center mb-8">
                <img
                  src={Website_Logo}
                  alt="Broker AIQ Logo"
                  className="w-24 h-5 md:w-[280px] md:h-[60px]"
                />
              </div>
              <div className="text-center">
                <Title level={2} className="!m-0 !mb-4">
                  Setting up your account...
                </Title>
                <div className="flex justify-center items-center mb-6">
                  <Spin size="large" />
                </div>
                <Text type="secondary" className="text-lg">
                  Please wait while we prepare your dashboard.
                </Text>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  }

  // Only show role selection UI if user has multiple roles and not auto-redirecting
  const userRoles = user?.user?.roles;
  const hasMultipleRoles = userRoles && userRoles.length > 1;

  if (!hasMultipleRoles) {
    // This should not render as single role users are auto-redirected
    // But keeping as fallback
    return null;
  }

  return (
    <div className="mainSignInCOntainer h-[100vh]">
      {isVerified ? (
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
              <div className="logo flex justify-center items-center mb-8">
                <img
                  src={Website_Logo}
                  alt="Broker AIQ Logo"
                  className="w-24 h-5 md:w-[280px] md:h-[60px]"
                />
              </div>
              <div className="text-center">
                <Title level={2} className="!m-0">
                  Select Role
                </Title>
                <div className="mt-3">
                  <Text type="secondary" className="">
                    Choose your role to continue accessing your account.
                  </Text>
                </div>
              </div>
              <div className=" flex justify-center items-center mb-6">
                <div className="w-[35%]">
                  <Divider className="mb-0" />
                </div>
              </div>

              <div className="signUpForm">
                <div>
                  <RoleSelector
                    selectedRole={selectedRole}
                    setSelectedRole={setSelectedRole}
                    handleRoleSelect={handleRoleSelect}
                  />

                  <Button
                    type="primary"
                    size="large"
                    className="mt-10"
                    block
                    onClick={onClickSaveSelectedRole}
                    loading={otpLoading}
                    disabled={isProcessingRole.current}
                  >
                    Continue
                  </Button>
                </div>

                <div className="mt-5 text-center flex justify-center items-center">
                  <div className="mt-5 text-center flex justify-center items-center">
                    <Link to={-1} className="flex justify-center items-center">
                      <i className="icon-back-arrow before:!m-0 text-primary text-2xl mr-2" />
                      <Text className=""> Go Back</Text>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      ) : (
        <>
          <Row className="w-full">
            <Col xs={24}>
              <div className="topAnimated"></div>
            </Col>
            <Col xs={24}>
              <AppHeader />
            </Col>
          </Row>
          <Row>
            <div className="w-full loadingClass">
              <div className="w-[94%] sm:w-[40%] flex flex-col items-center justify-center">
                <div className="bg-primaryOpacity p-4 rounded-full w-fit">
                  <div className="bg-primary p-4 rounded-full">
                    <i className="icon-referral-partner-perks before:!m-0 text-white text-7xl " />
                  </div>
                </div>

                <Text type="secondary" className="text-xl mt-5 text-center">
                  Your account is currently under review. Once it gets approved,
                  you will be able to track other progress here.
                </Text>
              </div>
            </div>
          </Row>
        </>
      )}
    </div>
  );
};

export default RoleSelection;
