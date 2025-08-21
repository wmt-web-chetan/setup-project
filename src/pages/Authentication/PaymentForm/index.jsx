// PaymentForm.jsx
import { Button, Input, notification, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { getStorage, setStorage } from "../../../utils/commonfunction";
import { STRIPE_PK } from "../../../utils/constant";
import { useDispatch, useSelector } from "react-redux";
import { addSubscription, processThreeDSecureSuccess } from "../../../services/Store/Subscription/action";
import { editeUserData } from "../../../services/Store/Users/slice";

const PaymentForm = ({ onNext, setCurrentStep, setOnboardingProcess }) => {
  const { Text, Title } = Typography;
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);

  const user = getStorage("user", true);

  const dispatch = useDispatch();
  const {
    newSubscriptionLoading
  } = useSelector((state) => state?.subscriptions);
  const {
    userForEdit
  } = useSelector((state) => state?.usersmanagement);

  useEffect(() => {
    // Load Stripe.js script
    const loadStripe = () => {
      if (!window.Stripe) {
        const script = document.createElement("script");
        script.src = "https://js.stripe.com/v3/";
        script.async = true;
        script.onload = () => initializeStripe();
        document.body.appendChild(script);
      } else {
        initializeStripe();
      }
    };

    // Initialize Stripe and Elements
    const initializeStripe = () => {
      // Replace with your actual publishable key
      const stripeInstance = window.Stripe(STRIPE_PK);
      setStripe(stripeInstance);

      const elementsInstance = stripeInstance.elements();
      setElements(elementsInstance);

      // Create card elements
      const style = {
        base: {
          color: "#fff",
          fontFamily: "Arial, sans-serif",
          fontSize: "16px",
          "::placeholder": {
            color: "#606060",
          },
        },
        invalid: {
          color: "#fa755a",
          iconColor: "#fa755a",
        },
        focus: {
          borderColor: "var(--primary-color)", // This will match your hover color
        },
      };

      // Create card number element
      const cardNumber = elementsInstance.create("cardNumber", {
        style,
        placeholder: "0000 0000 0000 0000",
      });
      cardNumber.mount("#card-number-element");

      // Create card expiry element
      const cardExpiry = elementsInstance.create("cardExpiry", {
        style,
        placeholder: "MM / YY",
      });
      cardExpiry.mount("#card-expiry-element");

      // Create card CVC element
      const cardCvc = elementsInstance.create("cardCvc", {
        style,
        placeholder: "CVV",
      });
      cardCvc.mount("#card-cvc-element");

      // Add listeners for validation changes
      [cardNumber, cardExpiry, cardCvc].forEach((element) => {
        element.addEventListener("change", (event) => {
          if (event.error) {
            setPaymentError(event.error.message);
          } else {
            setPaymentError(null);
          }
        });
      });
    };

    setEmail(user?.user?.email);

    loadStripe();

    // Cleanup
    return () => {
      // Clean up elements if needed
    };
  }, []);

  const validateEmail = (email) => {
    if (!email) {
      return "Email is required.";
    }
    if (!email.includes('@')) {
      return "Please include an '@' in the email address.";
    }
    return null;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePaymentConfirmation = async (clientSecret) => {
    try {
      const cardElement = elements.getElement("cardNumber");
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: email,
          },
        }
      });

      if (error) {
        console.error("[Payment Confirmation Error]", error);
        setPaymentError(error.message);
        return false;
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log("Payment confirmed successfully!", paymentIntent);
        
        // Dispatch processThreeDSecureSuccess action
        const threeDSecurePayload = {
          user_id: userForEdit?.user?.id,
          id: paymentIntent.id
        };

        const threeDSecureRes = await dispatch(processThreeDSecureSuccess(threeDSecurePayload));
        console.log('3D Secure success response:', threeDSecureRes);

        if (threeDSecureRes?.payload?.meta?.status === 200) {
          notification.success({
            message: "Success",
            description: threeDSecureRes?.payload?.meta?.message || "Payment completed successfully!",
            duration: 3,
          });

          // Handle the response same as addSubscription
          dispatch(editeUserData(threeDSecureRes?.payload?.data));
          setStorage('user', threeDSecureRes?.payload?.data);
          setCurrentStep(Number(threeDSecureRes?.payload?.data?.onboarding?.onboarding_step));
          setOnboardingProcess(Number(threeDSecureRes?.payload?.data?.onboarding?.onboarding_process));

          return true;
        } else {
          setPaymentError(threeDSecureRes?.payload?.meta?.message || "Failed to process payment confirmation");
          notification.error({
            message: "Error",
            description: threeDSecureRes?.payload?.meta?.message || "Failed to process payment confirmation",
            duration: 3,
          });
          return false;
        }
      }
    } catch (err) {
      console.error("Payment confirmation error:", err);
      setPaymentError("Payment confirmation failed. Please try again.");
      notification.error({
        message: "Error",
        description: "Payment confirmation failed. Please try again.",
        duration: 3,
      });
      return false;
    }
    return false;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate email before submission
    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);
    setEmailError(null);

    try {
      const cardElement = elements.getElement("cardNumber");
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          email: email,
        },
      });

      if (error) {
        console.error("[Error]", error);
        setPaymentError(error.message);
        setIsProcessing(false);
        return;
      }

      // Create subscription
      let payload = {
        user_id: user?.user?.id,
        plan_id: user?.onboarding?.onboarding_details?.plan[0]?.id,
        payment_id: paymentMethod?.id
      }

      const res = await dispatch(addSubscription(payload));
      console.log('payment api res', res);

      if (res?.payload?.meta?.status === 200) {
        // Check if payment requires additional verification
        if (res?.payload?.data?.requires_action && res?.payload?.data?.payment_intent?.client_secret) {
          console.log("Payment requires additional verification");
          
          // Handle 3D Secure or other authentication
          const confirmationSuccess = await handlePaymentConfirmation(
            res?.payload?.data?.payment_intent?.client_secret
          );

          // The success/error handling is now done inside handlePaymentConfirmation
          if (!confirmationSuccess) {
            // If confirmation failed, the error is already handled in handlePaymentConfirmation
            setIsProcessing(false);
            return;
          }
        } else {
          // Payment completed without additional verification
          notification.success({
            message: "Success",
            description: res?.payload?.meta?.message,
            duration: 3,
          });

          dispatch(editeUserData(res?.payload?.data))
          setStorage('user', res?.payload?.data);
          setCurrentStep(Number(res?.payload?.data?.onboarding?.onboarding_step));
          setOnboardingProcess(Number(res?.payload?.data?.onboarding?.onboarding_process));
        }
      } else {
        // Handle API error
        setPaymentError(res?.payload?.meta?.message || "Payment failed. Please try again.");
        notification.error({
          message: "Error",
          description: res?.payload?.meta?.message || "Payment failed. Please try again.",
          duration: 3,
        });
      }

    } catch (err) {
      console.error("Unexpected error:", err);
      setPaymentError("An unexpected error occurred.");
      notification.error({
        message: "Error",
        description: "An unexpected error occurred. Please try again.",
        duration: 3,
      });
    }

    setIsProcessing(false);
  };

  return (
    <div style={containerStyle}>
      <Title level={4}>Payment details</Title>

      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={formGroupStyle}>
          <Text type="secondary">Email</Text>

          <Input
            size="large"
            placeholder="Enter Email"
            autoComplete="off"
            id="email"
            type="email"
            value={user?.user?.email}
            disabled
          />
        </div>

        <div style={formGroupStyle}>
          <Text type="secondary">Card Number</Text>
          <div
            id="card-number-element"
            className="bg-darkGray hover:!border-1 hover:!border-primary focus:!border-1 focus:!border-primary"
            style={stripeElementContainerStyle}
          ></div>
        </div>

        <div style={formRowStyle}>
          <div style={halfWidthStyle}>
            <Text type="secondary">Expiry Date</Text>

            <div
              id="card-expiry-element"
              className="bg-darkGray hover:!border-1 hover:!border-primary"
              style={stripeElementContainerStyle}
            ></div>
          </div>

          <div style={halfWidthStyle}>
            <Text type="secondary">CVV</Text>

            <div
              id="card-cvc-element"
              className="bg-darkGray hover:!border-1 hover:!border-primary"
              style={stripeElementContainerStyle}
            ></div>
          </div>
        </div>

        <div style={totalAmountContainerStyle}>

          {
            user?.onboarding?.onboarding_details?.plan[0]?.coupon !== null ?
              <>
                <div className="flex justify-between items-center !mt-5">

                  <Text type="secondary" className="text-[20px]">
                    Amount
                  </Text>

                  <Title level={4} className="!m-0 ">${user?.onboarding?.onboarding_details?.plan[0]?.original_price}</Title>
                </div>

                <div className="flex justify-between items-center !mt-1">

                  <Text type="secondary" className="text-[20px]">
                    Discount {user?.onboarding?.onboarding_details?.plan[0]?.coupon?.discount_type !== "fixed_amount" ? `(${user?.onboarding?.onboarding_details?.plan[0]?.discount_percentage}%)` : null}
                  </Text>

                  <div className="flex ">
                    <Button color="default" variant="dashed" className="hover:!border-grayText text-grayText hover:!text-grayText cursor-default mr-5">
                      {user?.onboarding?.onboarding_details?.plan[0]?.coupon?.coupon_code}
                    </Button>
                    <Title level={4} className="!m-0">- ${user?.onboarding?.onboarding_details?.plan[0]?.discount_amount}</Title>
                  </div>
                </div>
              </>
              : null
          }

          <div className={`flex justify-between items-center ${user?.onboarding?.onboarding_details?.plan[0]?.coupon !== null ? '!mt-10' : '!mt-5'} `}>

            <Text type="secondary" className="text-[20px]">
              Total Amount
            </Text>

            <Title level={4} className="!m-0">${Math.max(0, Number(user?.onboarding?.onboarding_details?.plan[0]?.price) || 0)}</Title>
          </div>

        </div>

        {emailError && <div style={errorStyle}>{emailError}</div>}
        {paymentError && <div style={errorStyle}>{paymentError}</div>}

        <Button
          type="primary"
          size="large"
          className="mt-5"
          htmlType="submit"
          block
          loading={newSubscriptionLoading || isProcessing}
          disabled={isProcessing || !stripe}
        >
          {isProcessing ? "Processing..." : "Make Payment"}
        </Button>
      </form>
    </div>
  );
};

// Styles
const containerStyle = {
  color: "white",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const formGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const formRowStyle = {
  display: "flex",
  gap: "20px",
};

const halfWidthStyle = {
  flex: "1",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const stripeElementContainerStyle = {
  padding: "15.5px 16px",
  fontSize: "16px",
  lineHeight: "1.4444444444444444",
  borderRadius: "8px",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "#373737",
};

const totalAmountContainerStyle = {
  borderTop: "1px solid #3a3a3a",
  paddingTop: "20px",
  marginTop: "10px",
};

const errorStyle = {
  color: "#fa755a",
  backgroundColor: "rgba(250, 117, 90, 0.1)",
  padding: "10px",
  borderRadius: "4px",
  fontSize: "14px",
};

export default PaymentForm;