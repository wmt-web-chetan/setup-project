import React, { useState, useEffect } from "react";
import { Typography, Row, Col, Avatar } from "antd";
import {
  UserOutlined,
  CreditCardOutlined,
  KeyOutlined,
  LinkOutlined,
  FileOutlined,
  EditOutlined,
} from "@ant-design/icons";
import Profile from "./Profile/index";
import MyContract from "./MyContracts";
import StateLicense from "./StateLicense";
import MyLinks from "./MyLinks";
import { Link, useParams, useNavigate } from "react-router-dom";
import { clearStorage, getStorage } from "../../utils/commonfunction";
import SubscriptionSettings from "./SubscriptionSettings";
import { useSelector } from "react-redux";

const { Text, Title } = Typography;

const Settings = () => {
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 241px)");
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { userForEdit } = useSelector((state) => state?.usersmanagement);
  console.log("userForEdit", userForEdit);
  const userLoginRole = getStorage('userLoginRole', true);
  console.log("userLoginRole", userLoginRole)

  // Get the tab parameter from URL
  const { tab } = useParams();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState(tab || "profile");

  // Get user's primary role (role at index 0)
  const primaryRole = userLoginRole?.name;
  console.log("Primary role:", primaryRole);

  // Menu items data - all available menu items
  const allMenuItems = [
    { key: "profile", icon: <UserOutlined />, text: "Profile" },
    { key: "subscription", icon: <CreditCardOutlined />, text: "Subscription" },
    { key: "contract", icon: <FileOutlined />, text: "My Contract" },
    { key: "license", icon: <KeyOutlined />, text: "State License" },
    { key: "links", icon: <LinkOutlined />, text: "All Links" },
  ];

  // Filter menu items based on role
  const getMenuItemsForRole = (role) => {
    switch (role) {
      case "LO":
        // LO: show all menu items
        return allMenuItems;

      case "CP":
        // CP: show only Profile
        return allMenuItems.filter(item => item.key === "profile");

      case "AE":
        // AE: show Profile, State License, and Links
        return allMenuItems.filter(item =>
          item.key === "profile" ||
          item.key === "license"
        );

      case "REA":
        // REA: show only Profile
        return allMenuItems.filter(item => item.key === "profile");

      default:
        // Default: show only Profile for unknown roles
        return allMenuItems.filter(item => item.key === "profile");
    }
  };

  const menuItems = getMenuItemsForRole(primaryRole);

  // Set default tab and sync URL with state
  useEffect(() => {
    if (!tab) {
      // If no tab in URL, default to profile and update URL
      navigate("/settings/profile", { replace: true });
    } else if (!menuItems.some((item) => item.key === tab)) {
      // If invalid tab in URL or tab not allowed for this role, redirect to profile
      navigate("/settings/profile", { replace: true });
    } else {
      // Sync state with URL parameter
      setActiveItem(tab);
    }
  }, [tab, navigate, menuItems]);

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

  // Handle menu item click
  const handleMenuItemClick = (key) => {
    setActiveItem(key);
    navigate(`/settings/${key}`);
  };

  // Render active component based on menu selection
  const renderActiveComponent = () => {
    switch (activeItem) {
      case "profile":
        return <Profile containerHeight={containerHeight} />;
      case "subscription":
        return <SubscriptionSettings />;
      case "contract":
        return <MyContract />;
      case "license":
        return <StateLicense />;
      case "links":
        return <MyLinks />;
      default:
        return <Profile />;
    }
  };

  // Get current item text for heading
  const getCurrentItemText = () => {
    const currentItem = menuItems.find((item) => item.key === activeItem);
    return currentItem ? currentItem.text : "Profile";
  };

  const onClickLogout = () => {
    clearStorage();
    window.location.replace("/signin");
  };

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
            <Link
              to="/settings/profile"
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Settings
              </Text>
            </Link>

            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Text className="text-white text-lg sm:text-2xl">
              {getCurrentItemText()}
            </Text>
          </Title>
        </div>
      </Col>

      <Col span={24} className="h-full mb-4">
        <div className="w-full">
          <div
            className="rounded-3xl border overflow-hidden bg-gray border-solid border-liteGray w-full relative"
            style={{ height: containerHeight }}
          >
            <Row className="h-full">
              {/* Left Column - Menu */}
              <Col xs={4} md={7} xl={5} className="h-full">
                <div className="bg-liteGrayV1 p-2 md:p-4 h-full relative overflow-y-auto">
                  {menuItems.map((item) => (
                    <div
                      key={item.key}
                      className={`flex items-center px-3 py-1 md:py-2 rounded-lg mb-3 cursor-pointer transition-colors duration-200 ${activeItem === item.key
                          ? "bg-primaryOpacity"
                          : "hover:bg-gray"
                        }`}
                      onClick={() => handleMenuItemClick(item.key)}
                    >
                      <span
                        className={
                          activeItem === item.key
                            ? "text-primary text-lg"
                            : "text-grayText text-lg"
                        }
                      >
                        {item.icon}
                      </span>
                      <Text
                        className={`ml-3 hidden md:block ${activeItem === item.key
                            ? "text-primary"
                            : "text-grayText"
                          }`}
                      >
                        {item.text}
                      </Text>
                    </div>
                  ))}
                  <div className="absolute bottom-20 left-0 right-0 h-1  mx-3">
                    <hr className="border-liteGray" />
                    <div className="flex items-center mt-3">
                      <span className="flex items-center cursor-pointer" onClick={onClickLogout}>
                        <i className="icon-log-out text-[#EF4444] text-2xl" />
                        <Text className="text-base ml-3 text-grayText hidden  md:inline">
                          Logout
                        </Text>
                      </span>
                    </div>
                  </div>
                </div>
              </Col>

              {/* Right Column - Content */}
              <Col
                xs={20}
                md={17}
                xl={19}
                style={{ height: containerHeight }}
                className="p-3 md:p-6 overflow-y-auto"
              >
                {renderActiveComponent()}
              </Col>
            </Row>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default Settings;