import { useEffect, useState } from "react";
import "./Header.scss";
import {
  Layout,
  Row,
  Col,
  Button,
  Dropdown,
  Avatar,
  Badge,
  Typography,
  Switch,
  notification,
  Popover,
} from "antd";
import {
  MenuOutlined,
  BellOutlined,
  SettingOutlined,
  CalendarOutlined,
  DownOutlined,
} from "@ant-design/icons";
import {
  clearStorage,
  collectSlugsByRoleId,
  getStorage,
  setStorage,
} from "../../../utils/commonfunction";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserForEdit } from "../../../services/Store/Users/action";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import NotificationPop from "../../../pages/Notifications/NotificationPop";
import CalendarUI from "../CalendarPopup";
import { useReverb } from "../../../utils/useReverb";
import roketProIcon from "../../../assets/SVGs/roket_pro.svg";

const { Header } = Layout;
const { Text, Title } = Typography;

const AppHeader = () => {
  const user = getStorage("user", true);
  const userLoginRole = getStorage("userLoginRole", true);
  const location = useLocation();
  const currentPath = location.pathname;
  const isOnboarding =
    currentPath === "/onboarding" || currentPath === "/under-review";
  const isHome = currentPath === "/dashboard";

  const isGPT = currentPath.includes("gpt");

  const isCalender = currentPath.includes("training-calendar");
  // console.log('isCalender', isCalender);

  const allSlug = collectSlugsByRoleId(user?.user?.roles, userLoginRole?.id);

  // console.log('allSlug from header', allSlug)

  const { userForEdit } = useSelector((state) => state?.usersmanagement);
  // console.log(userForEdit, "userForEdit");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 640);
  const [toggleState, setToggleState] = useState("dashboard");
  const [isOpenCalendar, setIsOpenCalendar] = useState("false");
  const [placement, setPlacement] = useState("bottom");

  const {
    data: notificationReadData,
    error: notificationReadError,
    isConnected: notificationReadisConnected,
  } = useReverb(`userNotification.${userForEdit?.user?.id}`, ".notificationStatusChanged");

  // console.log('notificationReadData has_unread', notificationReadData)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 906) {
        // Large screens
        setPlacement("bottomLeft");
      } else {
        // Smaller screens
        setPlacement("bottom");
      }
    };

    // Call on mount
    handleResize();

    // Listen for window resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // console.log('Header User Strore===>', userForEdit);
  // console.log('Header User Local111===>', user);
  useEffect(() => {
    setToggleState(isGPT ? "gpt" : "dashboard");
  }, [isGPT]);

  // Toggle handler
  const handleToggleChange = (checked) => {
    setToggleState(checked ? "gpt" : "dashboard");
    if (checked) {
      navigate('/gpt')
    } else {
      navigate('/dashboard')
    }
    // console.log('checked', checked)
  };

  // Monitor screen size changes
  useEffect(() => {

    setToggleState(isGPT ? "gpt" : "dashboard");

    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };

    // Call once on initial render
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch user data when component mounts and user cookie is available
  useEffect(() => {
    if (user?.user?.id) {
      // console.log("here111", user)
      dispatch(fetchUserForEdit(user?.user?.id))
        .then((res) => {
          if (res?.payload?.meta?.status === 200) {
            // console.log('Profile API Res===>', res)
            setStorage("user", res?.payload?.data);
          }
        })
        .catch((error) => {
          console.log("Error:", error);
        });

      // fetchUserData();
    }
  }, [user?.user?.id]);

  // Fetch user data function
  const fetchUserData = async () => {
    if (user?.user?.id) {
      try {
        const result = await dispatch(fetchUserForEdit(user?.user?.id));

        if (result?.payload?.meta?.status === 200) {
          // Update the user data in cookie with the fresh data

          const userData = result.payload.data.user;
          const updatedUserData = { ...user, user: userData };

          setStorage("user", result?.payload?.data);

          // notification.success({
          //   message: "Success",
          //   description: "User data refreshed successfully",
          //   duration: 3,
          // });
        }
      } catch (error) {
        notification.error({
          message: "Error",
          description: "Failed to fetch user data",
          duration: 3,
        });
      }
    }
  };
  const onClickLogout = () => {
    clearStorage();
    window.location.replace("/signin");
  };

  // User menu items
  const userMenuItems = [
    {
      key: "1",
      label: "Profile Settings",
      onClick: () => navigate("/settings/profile"),
    },
    {
      key: "2",
      label: "Logout",
      onClick: onClickLogout,
    },
  ];

  // Notification menu items
  const notificationItems = [
    {
      key: "1",
      label: "New message from support",
    },
    {
      key: "2",
      label: "New feature released",
    },
    {
      key: "3",
      label: "Your request has been approved",
    },
  ];

  // Render logout button for onboarding page
  const renderLogoutButton = () => {
    return (
      <Button
        type="text"
        onClick={onClickLogout}
        className="border border-liteGray bg-gray flex items-center justify-center rounded-full px-4"
        size="large"
      >
        <i
          className="icon-log-out flex items-center justify-center "
          style={{ fontSize: "28px", color: "#EF4444" }}
        />
        <Text className="font-medium my-0">Logout</Text>
      </Button>
    );
  };

  const onClickGeinie = () => {
    navigate("/ai-genie");
  };

  const onClickCalender = () => {
    navigate("/training-calendar");
  };

  return (
    <>
      <Header
        className={`p-0 h-20 bg-darkGray ${isOnboarding ? "" : "border-b border-gray"
          }  px-header-wrapper`}
      >
        <Row align="middle" className="h-full" justify="space-between">
          {/* Logo and Support */}
          <Col flex="auto" className="flex items-center">
            <div className="flex items-center pl-1">
              {!isSmallScreen && (
                <>
                  <div className="flex items-center h-8 border border-liteGray bg-gray rounded-full px-3">
                    {/* Fixed icon with specific height/width and flex alignment */}
                    <i className="icon-support text-primary flex-shrink-0 h-4 w-4 flex items-center mr-2"></i>
                    <Text className="text-grayText my-0 flex items-center text-xs">
                      Support:
                    </Text>
                    <Text className="text-gray-400 ml-2 my-0 flex items-center text-xs">
                      {/* {user?.user?.phone_number} */}
                      +1 (888) 706-7003
                    </Text>
                  </div>
                  <div className="flex items-center h-8 border border-liteGray bg-gray rounded-full px-3 ml-3">
                    {/* Fixed icon with specific height/width and flex alignment */}
                    
                    <img src={roketProIcon} alt="" className="" />
                    <Text className="text-gray-400 ml-2 my-0 flex items-center text-xs">
                      {/* {user?.user?.phone_number} */}
                      +1 (844) 937-7567
                    </Text>
                  </div>
                </>
              )}
            </div>
          </Col>

          {/* Right side controls */}
          <Col flex="none" className="h-full flex items-center justify-end">
            {isOnboarding ? (
              renderLogoutButton()
            ) : (
              <div className="flex items-center gap-4">
                {/* Mobile menu button - only visible on small screens */}
                {isSmallScreen && (
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: "dashboard",
                          label: "Dashboard",
                          onClick: () => setToggleState("dashboard"),
                        },
                        {
                          key: "gpt",
                          label: "GPT",
                          onClick: () => setToggleState("gpt"),
                        },
                        {
                          key: "support",
                          label: "Support: +1 (888) 706-7003",
                        },
                        {
                          type: "divider",
                        },
                        ...userMenuItems,
                      ],
                    }}
                    placement="bottomRight"
                    trigger={["click"]}
                  >
                    <Button
                      type="text"
                      icon={<MenuOutlined style={{ color: "#FF6D00" }} />}
                      className="border-liteGray bg-gray flex items-center justify-center"
                      style={{
                        borderRadius: "8px",
                        height: "34px",
                        width: "34px",
                      }}
                    />
                  </Dropdown>
                )}

                {/* Custom Toggle Switch for Dashboard/GPT - hide on very small screens */}
                {!isSmallScreen && (
                  <div className="relative flex items-center">
                    <div
                      className="w-48 h-12 flex items-center px-0 py-1 rounded-full border border-solid bg-gray border-liteGray"
                      style={{
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {/* Dashboard section */}
                      <div className="w-[65%] h-full flex items-center justify-center z-10">
                        <Text
                          className={`${toggleState === "dashboard"
                            ? "text-white"
                            : "text-grayText"
                            } my-0`}
                          style={{ transition: "color 0.3s" }}
                        >
                          Dashboard
                        </Text>
                      </div>

                      {/* GPT section */}
                      <div className="w-[35%] h-full flex items-center justify-center z-10">
                        <Text
                          className={`${toggleState === "gpt"
                            ? "text-white"
                            : "text-grayText"
                            } my-0`}
                          style={{ transition: "color 0.3s" }}
                        >
                          GPT
                        </Text>
                      </div>

                      {/* Active background pill that moves */}
                      <div
                        className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-in-out"
                        style={{
                          left:
                            toggleState === "dashboard"
                              ? "4px"
                              : "calc(65% + 4px)",
                          width:
                            toggleState === "dashboard"
                              ? "calc(65% - 8px)"
                              : "calc(35% - 8px)",
                          backgroundColor: "#FF6D00",
                          zIndex: 0,
                        }}
                      />
                    </div>

                    {/* Hidden actual toggle switch for functionality */}
                    <Switch
                      checked={toggleState === "gpt"}
                      onChange={handleToggleChange}
                      className="opacity-0 absolute"
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        cursor: "pointer",
                        zIndex: 20,
                        borderRadius: "16px",
                      }}
                    />
                  </div>
                )}

                {/* Icons - show fewer on mobile */}
                <div className="flex items-center gap-4">
                  {!isSmallScreen && (
                    <>
                      {allSlug?.includes('view-training-calendar') ?
                        !isCalender ?
                          <Button
                            type="text"
                            className="border-liteGray bg-gray flex items-center justify-center p-0"
                            shape="circle"
                            size="large"
                            onClick={onClickCalender}
                          >
                            <i
                              className="icon-calendar flex items-center justify-center"
                              style={{ fontSize: "28px" }}
                            />
                          </Button>
                          : null
                        : null
                      }

                      {
                        allSlug?.includes('view-ai-genie') ?
                          !isHome ? (
                            <Button
                              type="text"
                              className="border-liteGray custom-gradient flex items-center justify-center p-0"
                              shape="circle"
                              size="large"
                              onClick={onClickGeinie}
                            >
                              <i
                                className="icon-star flex items-center justify-center"
                                style={{ fontSize: "28px" }}
                              />
                            </Button>
                          ) : null : null
                      }
                      {/* <Button
                        type="text"
                        className="border-liteGray bg-gray flex items-center justify-center p-0"
                        shape="circle"
                        size="large"
                      >
                        <i
                          className="icon-settings flex items-center justify-center"
                          style={{ fontSize: "28px" }}
                        />
                      </Button> */}
                    </>
                  )}

                  {/* Notification icon with badge */}
                  {/* <Dropdown
                    menu={{ items: notificationItems }}
                    placement="bottomRight"
                    arrow
                  >
                    <Button
                      type="text"
                      className="border-liteGray bg-gray relative flex items-center justify-center p-0"
                      shape="circle"
                      size="large"
                    >
                      <span className="flex items-center justify-center">
                        <i
                          className="icon-notifications"
                          style={{ fontSize: "28px" }}
                        />
                        <Badge
                          dot
                          size="small"
                          color="#FF6D00"
                          offset={[0, 0]}
                          className="absolute"
                          style={{
                            top: "1px",
                            right: "18px",
                            transform: "translate(25%, -25%)",
                          }}
                        />
                      </span>
                    </Button>
                  </Dropdown> */}

                  {
                    currentPath !== '/notifications' ?
                      <Popover
                        placement={placement}
                        trigger="click"
                        content={<NotificationPop />}
                        overlayInnerStyle={{
                          background: "transparent", // remove background
                          boxShadow: "none",
                        }}
                      >
                        <Button
                          type="text"
                          className="border-liteGray bg-gray relative flex items-center justify-center p-0"
                          shape="circle"
                          size="large"
                        >
                          <span className="flex items-center justify-center">
                            <i
                              className="icon-notifications"
                              style={{ fontSize: "28px" }}
                            />
                            {
                              notificationReadData?.has_unread ?
                                <Badge
                                  dot
                                  size="small"
                                  color="#FF6D00"
                                  offset={[0, 0]}
                                  className="absolute"
                                  style={{
                                    top: "1px",
                                    right: "18px",
                                    transform: "translate(25%, -25%)",
                                  }}
                                />
                                : null
                            }
                          </span>
                        </Button>
                      </Popover>
                      : null
                  }

                </div>

                {/* User profile - simplified on mobile */}
                {!isSmallScreen ? (
                  <Dropdown
                    menu={{ items: userMenuItems }}
                    placement="bottomRight"
                    arrow
                  >
                    <div className="flex items-center cursor-pointer bg-gray rounded-full border border-liteGray overflow-hidden pr-2">
                      {userForEdit?.user?.profile_photo_path ? (
                        <Avatar
                          src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${userForEdit?.user?.profile_photo_path
                            }`}
                          size={48}
                          style={{ borderRadius: "50%" }}
                        />
                      ) : (
                        <Avatar
                          style={{
                            backgroundColor: "#fde3cf",
                            color: "#f56a00",
                          }}
                          className="w-full h-full object-cover rounded-full !text-3xl"
                          size={48}
                        >
                          {userForEdit?.user?.name?.[0]}
                        </Avatar>
                      )}
                      {console.log("userforedit111", userForEdit)}
                      <div className="flex items-center ml-2">
                        <div className="flex flex-col mr-1 py-2">
                          <Text className="text-white font-semibold block leading-tight whitespace-nowrap truncate mb-1">
                            {userForEdit?.user?.name?.length >= 22
                              ? userForEdit?.user?.name?.slice(0, 20) + "..."
                              : userForEdit?.user?.name || ""}
                          </Text>

                          {/* {
                            console.log('userForEdit oooo', userForEdit)
                          } */}
                          {/* {
                            console.log('userLoginRole oooo', userLoginRole)
                          } */}

                          <Text className="text-grayText block text-xs leading-none whitespace-nowrap truncate my-0">
                            {userLoginRole?.full_name?.length >=
                              22
                              ? userLoginRole?.full_name?.slice(
                                0,
                                20
                              ) + "..."
                              : userLoginRole?.full_name || ""}
                          </Text>
                        </div>
                        <i
                          className="icon-down-arrow flex items-center justify-center ml-1"
                          style={{ fontSize: "16px" }}
                        />
                      </div>
                    </div>
                  </Dropdown>
                ) : (
                  <Avatar
                    src={`${import.meta.env.VITE_IMAGE_BASE_URL}/${userForEdit?.user?.profile_photo_path
                      }`}
                    size={40}
                    style={{ borderRadius: "50%", marginLeft: "8px" }}
                  />
                )}
              </div>
            )}
          </Col>
        </Row>
      </Header>
      {/* {isOpenCalendar && <CalendarUI open={isOpenCalendar}/>} */}
    </>
  );
};

export default AppHeader;
