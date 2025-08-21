import { Button, Col, Row, Typography, Spin, Tooltip, Modal } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./SubscriptionSettings.scss";
import aiBadge from "../../../assets/SVGs/AI-Bullet.svg";
import ogBadge from "../../../assets/SVGs/Orange-Bullet.svg";
import ShadowBoxContainer from "../../../components/AuthLayout/ShadowBoxContainer";
import { fetchCancleSubscription, fetchCurrentSubscriptionDetails, fetchUpdateCard } from "../../../services/Store/Subscription/action";
import InvoiceHistoryTable from "./InvoiceHistoryTable";
import {
  ExclamationOutlined
} from "@ant-design/icons";

const SubscriptionSettings = () => {
  const { Title, Text } = Typography;
  const dispatch = useDispatch();
  const [subscriptionData, setSubscriptionData] = useState({});
  const [cancelSubscription, setCancelSubscription] = useState(false);
  const [subscriptionCancelDate, setSubscriptionCancelDate] = useState(null);

  const { currentSubscriptionLoading } = useSelector(
    (state) => state.subscriptions
  );

  useEffect(() => {
    dispatch(fetchCurrentSubscriptionDetails())
      .then((response) => {
        console.log("Subscription data fetched:", response);
        if (response?.payload?.data) {
          setSubscriptionData(response.payload.data);
          setSubscriptionCancelDate(response.payload.data.cancel_plan_date)
        }
      })
      .catch((error) => {
        console.error("Error fetching subscription:", error);
      });
  }, [dispatch]);

  const isActive = subscriptionData?.status === "active";

  console.log('subscriptionData', subscriptionData)

  const onClickEditCard = () => {
    dispatch(fetchUpdateCard()).then((res) => {
      if (res?.payload?.meta?.success) {
        console.log('Update card response', res?.payload?.data?.url)
        window.open(res?.payload?.data?.url, '_blank')
      }
    }).catch((error) => {
      console.log('Error:', error)
    })
  }
  const onClickCancel = () => {
    setCancelSubscription(true);
  }

  const handleCancelDelete = () => {
    setCancelSubscription(false);
  }

  const handleConfirmDelete = () => {
    dispatch(fetchCancleSubscription()).then((res) => {
      console.log('Update card response', res)
      setSubscriptionCancelDate(res.payload.data.cancel_plan_date)
      setCancelSubscription(false);
    }).catch((error) => {
      console.log('Error:', error)
    })
  }

  return (
    <>
      <Row>
        <div className="font-bold text-2xl">Subscription</div>
      </Row>
      <Row className=" rounded-2xl bg-liteGrayV1 p-6 pb-14 mt-3" gutter={[0, 24]}>
        <Col xs={24} md={24} lg={8} xl={16}>
          <div className="relative bg-darkGray rounded-3xl h-[88%] pb-28">
            <div className="absolute h-full w-full overflow-hidden rounded-3xl">
              <div className="elipceBot absolute p-[360px] right-[50%] top-[-40%] "></div>
              <div className="elipceBot absolute p-[320px] left-[57%] bottom-[-44%] "></div>
            </div>

            <div className="px-6 text-left   pt-6">
              <Row>
                <div className=" text-center mb-4 flex justify-between w-full items-center ">
                  <Text className="text-4xl  font-medium z-10">
                    Current Subscription Plan{" "}
                  </Text>
                  {
                    !currentSubscriptionLoading ?
                      <div className="flex items-center">

                        {
                          !subscriptionCancelDate ?
                            <>

                              <Button
                                type="primary"
                                size="large"
                                className={
                                  'mr-3'
                                  // isActive ? "bg-green-500 hover:bg-green-600" : ""
                                }
                                onClick={onClickEditCard}
                              >
                                Edit Card
                              </Button>



                              <Button
                                type="primary"
                                size="large"
                                danger
                                onClick={onClickCancel}
                              // className={
                              //   isActive ? "bg-green-500 hover:bg-green-600" : ""
                              // }
                              >
                                Cancel
                              </Button>
                            </>
                            : <Tooltip placement="top" className="planInfo" 
                            overlayStyle={{
                              maxWidth: '300px',
                              fontSize: '14px'
                            }}
                              // overlayInnerStyle={{
                              //   color: 'white',
                              //   borderRadius: '8px',
                              //   padding: '12px 16px'
                              // }}
                               title={`We’ve processed your cancellation request for the Your Plan. Your subscription remains active until ${subscriptionCancelDate ? subscriptionCancelDate : 'the end of your billing period'} , during which you can continue using all features.
                        After ${subscriptionCancelDate ? subscriptionCancelDate : 'that date'}, access will end per our policy.`}>
                              <Button type="primary" icon={<ExclamationOutlined />} size='small' danger />
                            </Tooltip>
                        }
                      </div>
                      : null
                  }

                </div>
              </Row>

              {currentSubscriptionLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Spin size="large" />
                </div>
              ) : (
                <>
                  <Row className="mt-2">
                    <Col span={4}>
                      <Text className="text-primary text-sm">
                        Billing Cycle
                      </Text>
                    </Col>
                    <Col span={1}>
                      <Text className="text-primary text-sm ml-4">:</Text>
                    </Col>
                    <Col span={19}>
                      <Text className="text-white text-sm ml-3">
                        {subscriptionData?.billing_cycle || "Monthly"}
                      </Text>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={4}>
                      <Text className="text-primary text-sm">Duration</Text>
                    </Col>
                    <Col span={1}>
                      <Text className="text-primary text-sm ml-4">:</Text>
                    </Col>
                    <Col span={19}>
                      <Text className="text-white text-sm ml-3">
                        {subscriptionData?.duration || "Mar 2025 - Apr 2025"}
                      </Text>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={4}>
                      <Text className="text-primary text-sm">Renewal Date</Text>
                    </Col>
                    <Col span={1}>
                      <Text className="text-primary text-sm ml-4">:</Text>
                    </Col>
                    <Col span={19}>
                      <Text className="text-white text-sm ml-3">
                        {subscriptionData?.renewal_date || "Apr 3, 2025"}
                      </Text>
                    </Col>
                  </Row>
                </>
              )}
            </div>

            <div className="moneyPlant absolute bottom-[-24%] left-[5%] bg-liteGray flex items-center rounded-2xl p-3 w-[90%] z-10">
              <div className="bg-primaryOpacity rounded-2xl p-[6px]">
                <i className="icon-subscription before:!m-0 text-primary text-7xl " />
              </div>
              <div className="ml-3">
                <div className="">
                  <Text className="text-primary mb-3">
                    {subscriptionData?.billing_cycle
                      ? `${subscriptionData.billing_cycle} Plan`
                      : "Monthly Plan"}
                  </Text>
                </div>
                <div className="flex items-end">
                  {currentSubscriptionLoading ? (
                    <Spin size="small" />
                  ) : (
                    <>
                      <Title level={2} className="!m-0">
                        {subscriptionData?.amount || "$149"}
                      </Title>
                      <Text type="secondary" className="ml-1">
                        /
                        {subscriptionData?.billing_cycle?.toLowerCase() ||
                          "month"}
                      </Text>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Col >
        <Col xs={24} md={24} lg={16} xl={8}>
          <div className="flex justify-end h-full  ">
            <div className=" w-[86%]  border border-liteGray p-5 rounded-3xl h-full">
              <Title level={4} type="secondary">
                Inclusions
              </Title>
              <div className="mb-[6px] flex">
                <img src={aiBadge} alt="" className="mr-2" />
                <Text>Product & Pricing Genie</Text>
              </div>
              <div className="mb-[6px] flex">
                <img src={aiBadge} alt="" className="mr-2" />
                <Text>Automated AI Loan Matching</Text>
              </div>
              <div className="mb-[6px] flex">
                <img src={ogBadge} alt="" className="mr-2" />
                <Text>Onboarding & Training</Text>
              </div>
              <div className="mb-[6px] flex">
                <img src={ogBadge} alt="" className="mr-2" />
                <Text>Community Access</Text>
              </div>
              <div className="mb-[6px] flex">
                <img src={ogBadge} alt="" className="mr-2" />
                <Text>Recruitment & Referrals</Text>
              </div>
              <div className="mb-[6px] flex">
                <img src={ogBadge} alt="" className="mr-2" />
                <Text>Quickly Connect with Account Executives</Text>
              </div>
            </div>
          </div>
        </Col>
      </Row >

      <Modal
        title="Cancel Plan"
        centered
        destroyOnClose
        open={cancelSubscription}
        footer={false}
        // width={"40%"}
        onCancel={handleCancelDelete}
        closeIcon={
          <Button
            shape="circle"
            icon={<i className="icon-close before:!m-0 text-sm" />}
          />
        }
      >
        <div className=" border-t-2 border-solid border-[#373737] mt-5">
          <Row gutter={16} className="">
            <div className="w-full pt-5 flex  items-center justify-center  pb-5">
              <Text className=" text-base font-normal text-grayText text-center">
                Are you sure you want to cancel this plan?
              </Text>
              {/* <Text className="text-grayText text-center px-24 py-3">
                    This action is permanent and cannot be undone. Please confirm if you
                    want to delete the MCQ titled {mcqToDelete?.question_title}.
                  </Text> */}
            </div>
            <Col span={12}>
              <Button block onClick={handleCancelDelete} size="large">
                Cancel
              </Button>
            </Col>
            <Col span={12}>
              <Button
                block
                danger
                type="primary"
                size="large"
                onClick={handleConfirmDelete}
              >
                End Subscription
              </Button>
            </Col>
          </Row>
        </div>
      </Modal>

      <Row>
        {/* <div className="font-bold text-2xl">Plan History</div> */}
        <InvoiceHistoryTable />
      </Row>
    </>
  );
};

export default SubscriptionSettings;
