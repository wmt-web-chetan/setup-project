import React, { useState, useEffect, useMemo } from "react";
import {
  Typography,
  Row,
  Col,
  Switch,
  notification,
  Empty,
  Button,
} from "antd";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CardSlider from "../../components/AuthLayout/SliderComponent";
import { useNavigate, useLocation } from "react-router-dom";
import ShadowBoxContainer from "../../components/AuthLayout/ShadowBoxContainer";
import "./Dashboard.scss";
import { collectSlugsByRoleId, getStorage } from "../../utils/commonfunction";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDashboardData,
  updateDashboardReorderAction,
} from "../../services/Store/Dashboard/actions";
import Loading from "../../components/AuthLayout/Loading";

const { Text, Title } = Typography;

// Card component
const SortableCard = ({ card, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  // console.log("check4")
  const user = getStorage("user", true);
  const userLoginRole = getStorage("userLoginRole", true);

  const allSlug = collectSlugsByRoleId(user?.user?.roles, userLoginRole?.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Col
      xs={24}
      sm={12}
      md={8}
      lg={6}
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50" : ""}
    >
      <div
        {...attributes}
        {...listeners}
        className={`p-6 min-h-[240px] flex flex-col items-center text-center justify-between 
          bg-liteGray transition-all duration-300 cursor-move rounded-[32px] 
          ${card.title === "AI Genie" ? "border border-primary box" : ""}
          ${isDragging ? "shadow-xl" : ""}
          ${
            isHovered
              ? card.title === "AI Genie"
                ? "transform translate-y-[-8px]"
                : "shadow-[0_0_21px_rgba(255,109,0,0.2)] transform translate-y-[-8px]"
              : ""
          }`}
        style={{
          transition: "all 0.3s ease",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          // Stop propagation to prevent the drag and drop functionality from being triggered
          e.stopPropagation();
          if (onClick) onClick(card);
        }}
      >
        {card.title === "AI Genie" ? (
          <div className="flex justify-center items-center mt-2 mb-4">
            <Button
              type="text"
              className="border-liteGray custom-gradient flex items-center justify-center p-0 w-16 h-16"
              shape="circle"
              size="large"

              // onClick={onClickGeinie}
            >
              <i
                className="icon-star flex items-center justify-center"
                style={{ fontSize: "38px" }}
              />
            </Button>
          </div>
        ) : (
          <div
            className={`mt-2 mb-4 flex justify-center items-center ${
              isHovered && !card.title === "AI Genie"
                ? "bg-[#9b5e30] rounded-full p-5 text-primary"
                : card.title === "AI Genie"
                ? "rounded-full p-3"
                : "bg-[#242424] rounded-full p-3 text-grayText"
            }`}
          >
            {isHovered && card.title !== "AI Genie" ? (
              <i
                className={`${card.icon} before:!m-0 text-primary text-5xl `}
              />
            ) : (
              <i
                className={`${card.icon} before:!m-0 text-gray-300 text-5xl `}
              />
            )}
          </div>
        )}
        <div className="flex flex-col flex-grow justify-center my-2">
          <Title
            level={5}
            className="mb-3"
            style={{
              color:
                isHovered && card.title !== "AI Genie" ? "#FF6D00" : "white",
              transition: "color 0.3s ease",
            }}
          >
            {card.title}
          </Title>
          {!card.isAdmin && (
            <Text className="text-grayText text-sm">
              {card.description?.length >= 86
                ? card.description?.slice(0, 84) + "..."
                : card.description || ""}
            </Text>
          )}
        </div>
        {/* <div className="h-4"></div> */}
      </div>
    </Col>
  );
};

// Card for drag overlay
const CardPreview = ({ card }) => {
  return (
    <div className="w-full max-w-[300px]  ">
      <div
        className={`p-6 min-h-[240px] flex flex-col items-center text-center justify-between 
          bg-darkGray border-2 border-primary shadow-2xl rounded-[32px]`}
        style={{
          transition: "all 0.3s ease",
        }}
      >
        <div
          className={`mt-2 mb-4 flex justify-center items-center ${
            card.title === "AI Genie"
              ? "box rounded-full p-1"
              : "rounded-full p-5"
          }`}
        >
          <i className={`${card.icon} before:!m-0 text-gray-300 text-4xl `} />
        </div>
        <div className="flex flex-col flex-grow justify-center my-2">
          <Title level={5} className="text-white mb-3">
            {card.title}
          </Title>
          {!card.isAdmin && (
            <Text className="text-grayText text-sm">{card.description}</Text>
          )}
        </div>
        <div className="h-4"></div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const isAdminDashboard = location.pathname === "/admin";
  const [dashboardData, setDashboardData] = useState([]);
  const [adminDashboardData, setAdminDashboardData] = useState([]);
  const [isCardView, setIsCardView] = useState(true); // true for card view, false for slider view
  const [loading, setLoading] = useState(true); // true for card view, false for slider view

  const user = getStorage("user", true);
  const userLoginRole = getStorage("userLoginRole", true);

  const { userForEdit } = useSelector((state) => state?.usersmanagement);
  const { dashboardReorderLoading } = useSelector((state) => state?.dashboard);


  useEffect(() => {
    if (user?.onboarding?.onboarding_step !== 0) {
      navigate("/onboarding");
    }
  }, []);

  // Helper function to get redirect path for regular users
  const getRegularUserRedirectPath = (module) => {
    switch (module) {
      case "User Management":
        return "/user-management";
      case "Chat Room":
        return "/chat-management";
      case "Role & Permission Management":
        return "/roles";
      case "Subscription Management":
        return "/subscription-management";
      case "Video Management":
        return "/video-management";
      case "MCQ Management":
        return "/mcq-management";
      case "Platform Meetings":
        return "/platform-meetings";
      case "Coupon Management":
        return "/coupon-management";
      case "Vendor Categories Management":
        return "/vendor-store-categories";
      case "Vendor Store Management":
        return "/vendor-store-management";
      case "Coaching Program Management":
        return "/coaching-program-management";
      case "State License Management":
        return "/state-license-management";
      case "Link Management":
        return "/link-management";
      case "Guidelines & Matrices":
        return "/guidelines-&-matrices";
      case "Loan Category Management":
        return "/loan-category-management";
      case "Support Management":
        return "/support-management";
      case "Back Office Management":
        return "/admin";
      case "Community":
        return "/community/feed";
      default:
        return `/${module.toLowerCase().replace(/\s+/g, "-")}`;
    }
  };

  // Fetch dashboard data only once when component mounts
  useEffect(() => {
    setLoading(true);
    dispatch(fetchDashboardData())
      .then((res) => {
        setLoading(false);

        if (res?.payload?.data?.dashboard) {
          // Set regular dashboard data (General)
          let roleName =
            userLoginRole?.name === "SA" ? `General` : userLoginRole?.name;

          setDashboardData(res.payload.data.dashboard[roleName] || []);

          // Set admin dashboard data (SA)
          if (
            res.payload.data.dashboard.SA &&
            res.payload.data.dashboard.SA.length > 0
          ) {
            const adminData = res.payload.data.dashboard.SA.map((item) => ({
              id: item.id,
              title: item.module,
              icon: item.icon || "icon-onboarding",
              description: item.description,
              order_id: item.order_id,
              redirectTo:
                item.module === "Dashboard Management"
                  ? "/dashboard"
                  : item.module === "User Management"
                  ? "/admin/user-management"
                  : item.module === "Support Management"
                  ? "/admin/support-management"
                  : item.module === "Chat Room"
                  ? "/admin/chat-management"
                  : item.module === "Subscription Management"
                  ? "/admin/subscription-management"
                  : item.module === "Role & Permission Management"
                  ? "/admin/roles"
                  : item.module === "Video Management"
                  ? "/admin/video-management"
                  : item.module === "MCQ Management"
                  ? "/admin/mcq-management"
                  : item.module === "Platform Meetings"
                  ? "/admin/platform-meetings"
                  : item.module === "Loan Category Management"
                  ? "/admin/loan-category-management"
                  : item.module === "Guidelines & Matrices"
                  ? "/admin/guidelines-matrices"
                  : item.module === "Vendor Categories Management"
                  ? "/admin/vendor-store-categories"
                  : item.module === "Vendor Store Management"
                  ? "/admin/vendor-store-management"
                  : item.module === "Coupon Management"
                  ? "/admin/coupon-management"
                  : item.module === "Coaching Program Management"
                  ? "/admin/coaching-program-management"
                  : item.module === "Link Management"
                  ? "/admin/link-management"
                  : item.module === "State License Management"
                  ? "/admin/state-license-management"
                  : `/${item.module
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/&/g, "and")}`,
              access: item.access || [],
              isAdmin: true,
            }));

            // Add "Main Dashboard" card if it's not already in the admin data
            const hasMainDashboard = adminData.some(
              (item) => item.title === "Dashboard Management"
            );
            if (!hasMainDashboard) {
              adminData.push({
                id: 999, // Use a unique ID that's unlikely to conflict
                title: "Main Dashboard",
                icon: "icon-onboarding",
                description: "Return to the main dashboard view.",
                order_id: adminData.length + 1, // Place it at the end
                redirectTo: "/dashboard",
              });
            }

            setAdminDashboardData(adminData);
          } else {
            // Fallback to default if no SA data
            setAdminDashboardData([]);
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      });
  }, [dispatch]);

  // Use useMemo to convert dashboard data to regularCards format
  const regularCards = useMemo(() => {
    if (!dashboardData || dashboardData.length === 0) return [];

    return dashboardData.map((item) => ({
      id: item.id,
      title: item.module,
      icon: item.icon,
      description: item.description,
      order_id: item.order_id,
      access: item.access,
      redirectTo: getRegularUserRedirectPath(item.module),
    }));
  }, [dashboardData]);

  // Admin cards derived from adminDashboardData
  const adminCards = useMemo(() => {
    return adminDashboardData.length > 0 ? adminDashboardData : [];
  }, [adminDashboardData]);

  // Initialize cards based on the current route
  const [cards, setCards] = useState([]);

  // Update cards only when isAdminDashboard or regularCards/adminCards change
  useEffect(() => {
    setCards(isAdminDashboard ? adminCards : regularCards);
  }, [isAdminDashboard, regularCards, adminCards]);

  // Sort cards by order_id for display
  const [sortedCards, setSortedCards] = useState([]);

  console.log("sortedCards", sortedCards);

  // Sort cards whenever they change
  useEffect(() => {
    if (cards.length > 0) {
      const sorted = [...cards].sort((a, b) => a.order_id - b.order_id);
      setSortedCards(sorted);
    } else {
      setSortedCards([]);
    }
  }, [cards]);

  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggleChange = (checked) => {
    setIsCardView(!checked); // Toggle between card view and slider view
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setCards((items) => {
        // Find the cards we're working with
        const activeCard = items.find((item) => item.id === active.id);
        const overCard = items.find((item) => item.id === over.id);

        // Get their current order_ids
        const activeOrderId = activeCard.order_id;
        const overOrderId = overCard.order_id;

        // Create a new array of cards with updated order_ids
        const updatedCards = items.map((card) => {
          // If this is the card we're dragging, it gets the target position's order_id
          if (card.id === active.id) {
            return { ...card, order_id: overOrderId };
          }

          // If we're moving the card down (to a higher order_id)
          if (activeOrderId < overOrderId) {
            // Decrease the order_id of cards in between by 1
            if (card.order_id > activeOrderId && card.order_id <= overOrderId) {
              return { ...card, order_id: card.order_id - 1 };
            }
          }

          // If we're moving the card up (to a lower order_id)
          if (activeOrderId > overOrderId) {
            // Increase the order_id of cards in between by 1
            if (card.order_id >= overOrderId && card.order_id < activeOrderId) {
              return { ...card, order_id: card.order_id + 1 };
            }
          }

          // Other cards remain unchanged
          return card;
        });

        // Prepare payload for API call
        const orderPayload = {
          order: updatedCards.map((card) => ({
            id: card.id,
            order_id: card.order_id,
          })),
        };

        // Call the reorder API
        dispatch(updateDashboardReorderAction(orderPayload))
          .then((response) => {
            if (response?.payload?.meta?.success !== true) {
              // If API call fails, revert the changes
              setCards(items);
            }
          })
          .catch((error) => {
            console.error("Error updating dashboard order:", error);
            // Revert the changes on error
            setCards(items);
          });

        return updatedCards;
      });
    }

    setActiveId(null);
  };

  const handleCardClick = (card) => {
    if (card.redirectTo) {
      console.log("card.redirectTo", card.redirectTo);
      navigate(card.redirectTo);
    }
  };

  const activeCard = cards.find((card) => card.id === activeId);

  return (
    <Row
      className="bg-darkGray px-header-wrapper h-full w-full"
      gutter={[0, 24]}
    >
      <Col span={24}></Col>
      <Col span={24}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title
              level={window.innerWidth < 768 ? 4 : 3}
              className="text-white m-0 h-auto"
            >
              {isAdminDashboard ? "Back Office" : "Dashboard"}
            </Title>
          </Col>
          <Col>
            <Row align="middle" gutter={8}>
              <Col className="mx-3 relative">
                <Row align="middle">
                  <Col className="w-[5.5rem] h-12 flex items-center px-0 py-1 rounded-full border border-solid bg-gray border-liteGray relative overflow-hidden">
                    {/* Card view section */}
                    <div
                      className="w-[50%] flex justify-center z-10"
                      style={{ paddingLeft: "6px" }}
                    >
                      <Text
                        className={`${
                          isCardView ? "text-white" : "text-grayText"
                        }`}
                        style={{ transition: "color 0.3s" }}
                      >
                        <i
                          className="icon-grid-view flex items-center justify-center mr-1"
                          style={{ fontSize: "20px" }}
                        />
                      </Text>
                    </div>

                    {/* Slider view section */}
                    <div className="w-[50%] flex justify-center items-center z-10 px-0">
                      <Text
                        className={`${
                          !isCardView ? "text-white" : "text-grayText"
                        }`}
                        style={{
                          transition: "color 0.3s",
                          position: "relative",
                          left: "0px",
                        }}
                      >
                        <i
                          className="icon-carousel flex items-center justify-center mr-1"
                          style={{ fontSize: "20px" }}
                        />
                      </Text>
                    </div>

                    <div
                      className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-in-out"
                      style={{
                        left: isCardView ? "4px" : "calc(50%)",
                        width: "calc(50% - 4px)",
                        backgroundColor: "#FF6D00",
                        zIndex: 0,
                      }}
                    />
                  </Col>

                  <Switch
                    checked={!isCardView}
                    onChange={handleToggleChange}
                    className="w-full h-full opacity-0 absolute cursor-pointer rounded-2xl"
                    style={{
                      zIndex: 20,
                    }}
                    size="large"
                  />
                </Row>
              </Col>
            </Row>
          </Col>
        </Row>
      </Col>
      <Col span={24} className="h-full">
        <ShadowBoxContainer height="calc(100vh - 230px)">
          {loading ? (
            <Loading />
          ) : isCardView ? (
            sortedCards?.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="pb-5">
                  <SortableContext
                    items={sortedCards.map((card) => card.id)}
                    strategy={rectSortingStrategy}
                  >
                    <Row gutter={[20, 20]}>
                      {sortedCards.map((card) => (
                        <SortableCard
                          key={card.id}
                          card={card}
                          onClick={handleCardClick}
                        />
                      ))}
                    </Row>
                  </SortableContext>
                </div>
                <DragOverlay>
                  {activeId ? <CardPreview card={activeCard} /> : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <div className="h-full flex justify-center items-center ">
                <Text>
                  <Empty description="No data available on the dashboard." />
                </Text>
              </div>
            )
          ) : sortedCards?.length > 0 ? (
            <CardSlider cards={sortedCards} handleCardClick={handleCardClick} />
          ) : (
            "No Data"
          )}
        </ShadowBoxContainer>
      </Col>
    </Row>
  );
};

export default Dashboard;