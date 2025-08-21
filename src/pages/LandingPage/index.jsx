import { useState, useEffect, useRef } from "react";
import {
  Row,
  Button,
  Drawer,
  Col,
  Card,
  Typography,
  Collapse,
  Input,
  Divider,
} from "antd";
import { MenuOutlined } from "@ant-design/icons";
import "./landing.scss";
import Paragraph from "antd/es/skeleton/Paragraph";
import Panel from "antd/es/splitter/Panel";
import ReviewCard from "./ReviewCard";
import { useNavigate } from "react-router-dom";
import { clearStorage, getStorage } from "../../utils/commonfunction";
import BrainImage from '../../assets/Broker_AIQ_Brain.webp'
import Website_Logo from '../../assets/Website_Logo.png'
import Old_Website_Logo from '../../assets/Old_Website_Logo.png'
import Community_HUB from '../../assets/Community_HUB.webp'
import Pricing_Engine from '../../assets/Pricing_Engine.webp'
import AI_Product_Genie from '../../assets/AI_Product_Genie.webp'
import Daily_Live_Trainings from '../../assets/Daily_Live_Trainings.webp'
import Live_Toll_Free_Support from '../../assets/Live_Toll_Free_Support.webp'
import Genie_Video from '../../assets/Genie_Video.mp4'
import Collaboration from '../../assets/Collaboration.webp'
import CalendarImg from '../../assets/Calendar.webp'
import Phone_Support from '../../assets/Phone_Support.webp'
import Centralized_Folder from '../../assets/Centralized_Folder.webp'
import Locker from '../../assets/Locker.webp'
import avtar from '../../assets/avtar.jpg'
import avtar2 from '../../assets/avtar2.jpg'
import avtar3 from '../../assets/avtar3.jpg'
import mainImg from "../../assets/Main_image.png";
import Earth_Imgage from "../../assets/Earth_Imgage.png";
import Sparkle from "../../assets/Sparkle.png";
import Ray_Animation from "../../assets/Ray_Animation.mp4";
// /src/assets/Ray_Animation.mp4
// /src/assets/Earth_Imgage.png
// /src/assets/Sparkle.png
// import BrainImage from '../../assets/Broker_AIQ_Brain.png'
// import BrainImage from '../../assets/Broker_AIQ_Brain.png'
// import BrainImage from '../../assets/Broker_AIQ_Brain.png'
// import BrainImage from '../../assets/Broker_AIQ_Brain.png'
// import BrainImage from '../../assets/Broker_AIQ_Brain.png'

const LandingPage = () => {
  const { Text, Title } = Typography;
  const { Panel } = Collapse;
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [openFAQ, setOpenFAQ] = useState(null);
  const navigate = useNavigate()

  // Counter animation states
  const [counters, setCounters] = useState({
    realEstateAgents: 0,
    contractProcessors: 0,
    lenders: 0,
    accountExecutives: 0,
    lenderGuidelines: 0
  });
  const [hasAnimated, setHasAnimated] = useState(false);
  const statsRef = useRef(null);

  const user = getStorage('user', true);
  const userLoginRole = getStorage('userLoginRole', true);
  const isLoggedIn = (user?.user?.is_active && userLoginRole?.name !== undefined && user?.token !== undefined) || false;

  // Counter animation targets
  const counterTargets = {
    realEstateAgents: 500,
    contractProcessors: 200,
    lenders: 120,
    accountExecutives: 150,
    lenderGuidelines: 10000
  };

  // Intersection Observer for stats section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animateCounters();
        }
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, [hasAnimated]);

  const animateCounters = () => {
    const duration = 2000; // 2 seconds
    const frameDuration = 1000 / 60; // 60 FPS
    const totalFrames = Math.round(duration / frameDuration);

    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    let frame = 0;
    const timer = setInterval(() => {
      const progress = easeOutQuart(frame / totalFrames);

      setCounters({
        realEstateAgents: Math.round(counterTargets.realEstateAgents * progress),
        contractProcessors: Math.round(counterTargets.contractProcessors * progress),
        lenders: Math.round(counterTargets.lenders * progress),
        accountExecutives: Math.round(counterTargets.accountExecutives * progress),
        lenderGuidelines: Math.round(counterTargets.lenderGuidelines * progress)
      });

      if (frame === totalFrames) {
        clearInterval(timer);
        setCounters(counterTargets);
      }
      frame++;
    }, frameDuration);
  };

  const formatNumber = (num, suffix = '+') => {
    if (num >= 10000) {
      return Math.floor(num / 1000) + 'K' + suffix;
    }
    return num + suffix;
  };

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const onDashboard = () => {
    navigate('/dashboard')
  };

  const onLogout = () => {
    console.log('Logout')
    clearStorage();
    window.location.replace("/signin");
  };

  const reviews = [
    {
      id: 1,
      text: "Finally, a platform that truly supports new loan officers. At my previous companies, I often felt like I was on my own. But with Client Direct and the Broker AIQ platform, there's real camaraderie and community support. From the pricing engine to the scenario desk and live support—everything I need is right there. Even though I work remotely, I feel fully connected and backed by the team.",
      name: "Ryan C.",
      title: "Loan Officer at Client Direct Mortgage",
      avatar: avtar,
      date: "March 15, 2023",
    },
    {
      id: 2,
      text: "As a contract processor, I think this platform is phenomenal. It's always been tough to get in front of loan officers and grow my business, but being featured in the Broker AIQ processor directory has changed that. Now, loan officers can easily find me, I can host weekend training sessions, and even engage through the community section by answering questions and sharing insights. It's opened up real opportunities to connect and build relationships with the Client Direct loan officers. Huge thanks to Ramon for creating something that truly helps us get more visibility—and more deals.",
      name: "Jasmine T.",
      title: "Contract Processor",
      avatar: avtar2,
      date: "March 15, 2023",
    },
    {
      id: 3,
      text: "At first, I didn't fully understand what the Broker AIQ platform was all about—but now, as a Realtor, I see how incredibly valuable it is. It's clear the loan officers using this platform are well-trained and engaged. The calendar is packed with daily trainings and resources, which says a lot about the quality of the community. But the standout feature for me is the Product AI Genie. I've used it myself to look up info on programs like down payment assistance—things my clients ask about all the time. Instead of waiting on a loan officer to get back to me, I can now find answers instantly. It's a game changer.",
      name: "Samantha G.",
      title: "Realtor",
      avatar: avtar2,
      date: "March 15, 2023",
    },
    {
      id: 4,
      text: "Finally, a platform that truly supports new loan officers. At my previous companies, I often felt like I was on my own. But with Client Direct and the Broker AIQ platform, there's real camaraderie and community support. From the pricing engine to the scenario desk and live support—everything I need is right there. Even though I work remotely, I feel fully connected and backed by the team.",
      name: "Andres I.",
      title: "Loan Officer at Client Direct Mortgage",
      avatar: avtar3,
      date: "March 15, 2023",
    },
    {
      id: 5,
      text: "The #1 feature of the Broker AIQ platform, without question, is the live phone support. I've called in for scenario guidance, file updates, and general questions—and every time, I've gotten real help. If the team doesn't have an immediate answer, they'll open a ticket and follow up quickly with a solution. That kind of support is rare. Huge thanks to the Client Direct Mortgage team for always being responsive and dependable. It makes a big difference.",
      name: "Drummond T.",
      title: "Loan Officer at Client Direct Mortgage",
      avatar: avtar2,
      date: "November 2, 2023",
    },
    {
      id: 6,
      text: "It's about time someone built a true ecosystem that supports the entire mortgage community. As an account executive, I'm genuinely excited to work with the loan officers on the Broker AIQ platform. I'll be hosting classes, sharing updates, and staying front and center with brokers who are actively building their business. The loan officer list is always current, which helps me stay connected and relevant. There's honestly nothing else like this in the industry—Client Direct has created something truly unique with Broker AIQ, and we appreciate everything the team is doing.",
      name: "Prince R.",
      title: "Account Executive",
      avatar: avtar,
      date: "March 15, 2023",
    },
  ];

  // Split reviews for each column (adjust as needed)
  const column1Reviews = reviews.slice(0, 4); // First column
  const column2Reviews = reviews.slice(2, 6); // Second column
  const column3Reviews = reviews; // Third column (all reviews for example)
  const professionals = [
    {
      icon: (
        <i className="icon-loan-officer !text-white !text-[60px] xl:!text-[80px]" />
      ),
      title: "Loan Officer",
      description:
        "With Broker AIQ, everything is at your fingertips—AI-powered search, training, collaboration tools, contract processors, vendor access, password management, and real-time support. We've reimagined what's possible for loan officers in the broker channel.",
    },
    {
      icon: <i className="icon-account-executive !text-white !text-[60px] xl:!text-[80px]" />,
      title: "Account Executive",
      description:
        "Connect directly with loan officers through our portal—hosting live trainings, showcasing on-demand content, and keeping guidelines up to date. They also gain full visibility into active rosters to better support growth and engagement.",
    },
    {
      icon: <i className="icon-contract-processor !text-white !text-[60px] xl:!text-[80px]" />,
      title: "Contract Processor",
      description:
        "Can showcase their services, host trainings, and hold live group sessions to answer questions in real time—building trust and staying top of mind. As an active part of the Broker AIQ ecosystem, they're not just support—they're the engine that drives files to closing and helps LOs deliver a seamless client experience.",
    },
    {
      icon: (
        <i className="icon-real-estate-agent-resources !text-white !text-[60px] xl:!text-[80px]" />
      ),
      title: "Real Estate Agent",
      description:
        "Join our platform to work closely with the loan officers and account executives powering their deals. With direct access to experts, instant answers via our Product Genie, and the opportunity to join our LEAD program after completing training, agents gain the tools and relationships to better serve clients—and scale their business.",
    },
  ];

  const features = [
    {
      title: "AI-Powered Scenario Matching",
      icon: <i className="icon-target-audience" />,
      description:
        "Instantly match client scenarios with the best-fitting products across 50+ lenders using AI-driven recommendations—no guesswork, no manual digging.",
    },
    {
      title: "Real-Time Collaboration Hub",
      icon: <i className="icon-community" />,

      description:
        "Chat, share files, and coordinate with Account Executives, Processors, and Agents—all in one platform designed for live, role-based collaboration.",
    },
    {
      title: "Accelerated Loan Processing",
      icon: <i className="icon-time-fast" />,

      description:
        "Reduce processing time with real-time file guidance, integrated contract processors, and instant access to lender conditions and guidelines.",
    },
    {
      title: "Built-In Training & Daily Coaching",
      icon: <i className="icon-training-professional-development" />,
      description:
        "Access daily training, on-demand classNamees, and vendor-led sessions that keep you ahead of new products, guidelines, and closing strategies.",
    },
    {
      title: "Centralized Vendor Access",
      icon: <i className=" icon-comment" />,

      description:
        "Browse and connect with top-tier vendors—from compliance to marketing—all reviewed and aligned with broker workflows inside our secure directory.",
    },
    {
      title: "Purpose-Built for Loan Officers",
      icon: <i className="icon-loan-officer" />,

      description:
        "From secure file sharing to product search, every feature is tailored to simplify the daily work of modern loan officers—no bloat, no distractions.",
    },
  ];

  const sections = [
    {
      title: "Community Collaboration",
      description:
        "A built-in collaboration hub where loan officers, agents, processors, and AEs connect in real time—share updates, run trainings, and support each other across dynamic role-based groups.",
      image: Collaboration,
    },
    {
      title: "Dynamic Education Calendar",
      description:
        "Access a comprehensive calendar to schedule and manage educational events, trainings, and workshops for continuous learning and growth.",
      image: CalendarImg,
    },
    {
      title: "Real-time Phone Support",
      description:
        "Get instant assistance with our real-time phone support, ensuring you have help when you need it most for seamless operations.",
      image: Phone_Support,
    },
    {
      title: "Centralized Documentation",
      description:
        "Store and manage all your documents in one secure, centralized location for easy access and organization.",
      image: Centralized_Folder,
    },
    {
      title: "Encrypted Password Locker",
      description:
        "Keep your passwords safe with our encrypted locker, ensuring secure access to all your accounts and data.",
      image: Locker,
    },
  ];

  const faqData = [
    // {
    //   key: "1",
    //   label:
    //     "What makes BrokerAIQ different from a traditional mortgage brokerage or net branch?",
    //   content:
    //     "BrokerAIQ isn't just a brokerage—it's a fully integrated ecosystem. We offer a flat-fee model ($495 per file + $149/month), access to the ARIVE LOS, and built-in tools like a scenario desk, pricing engine, compliance support, and live help. Unlike traditional setups, we're designed to empower independent loan officers while creating a connected, scalable environment that promotes growth and freedom without sacrificing structure.",
    // },
    {
      key: "2",
      label: "How does the Product Genie work, and who is it for?",
      content:
        "The Product Genie is an AI-powered tool that scans over 10,000 pages of guidelines across 120 approved lenders to deliver instant loan program matches based on your scenario inputs. It's perfect for any loan type—conventional, government, jumbo, or non-QM. Loan officers use it to save time and identify lender fit fast, but Realtors and processors also use it to answer client questions immediately without waiting on someone to respond. It's one of the platform's most powerful tools.",
    },
    {
      key: "3",
      label: "What kind of live support can I expect as a loan officer?",
      content:
        "BrokerAIQ offers real-time phone and chat support for scenario structuring, processing questions, pricing issues, and file guidance. If your request needs escalation, our support team opens a ticket and follows up with a clear answer—typically within hours. You're never left guessing or on your own. It's like having an expert team on standby, every day.",
    },
    {
      key: "4",
      label:
        "Can I build a team or recruit other LOs under me on this platform?",
      content:
        "Yes. BrokerAIQ is designed to support leadership and scale. Our structure supports team organization, transparent payouts, lead distribution, and centralized resources—making it easier to grow without traditional management headaches.",
    },
    {
      key: "5",
      label:
        "I'm a contract processor. How can I benefit from joining the BrokerAIQ platform?",
      content:
        "BrokerAIQ gives contract processors real visibility and opportunity. You'll be listed in our Processor Directory, where loan officers can discover and connect with you directly. You can host classes, answer questions in the community forum, and build strong working relationships with motivated LOs across the platform. It's a rare opportunity to grow your business without the usual networking barriers.",
    },
    {
      key: "6",
      label:
        "What kind of training and professional development does BrokerAIQ offer?",
      content:
        "Our daily training calendar offers live sessions covering loan products, structuring, compliance, technology, sales, and marketing. Sessions are led by top-performing loan officers, industry experts, and account executives, and all trainings are recorded for later viewing. Whether you're new or experienced, there's always something relevant and actionable to help you sharpen your edge and stay ahead of the curve.",
    },
  ];

  const toggleFAQ = (key) => {
    setOpenFAQ(openFAQ === key ? null : key);
  };

  const onClickLogin = () => {
    navigate('/signin')
  }

  const onClickRegister = () => {
    navigate('/signup')
  }

  const onClickGetStarted = () => {
    if (isLoggedIn) {
      navigate('/dashboard')
    } else {
      navigate('/signup')
    }
  }

  return (
    <>
      {/* Hero Section */}
      <div className="bgHeader flex  justify-center !flex-col h-screen relative">
        {/* Video Overlay for entire hero section */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-10 opacity-70"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={Ray_Animation} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Optional dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20 z-20"></div>
        <div className="header fixed z-50 top-6 w-full px-4 md:px-10 lg:px-20 xl:px-24 2xl:px-36 3xl:px-40">
          <div className="flex justify-between items-center bg-gray rounded-xl px-4 py-4  border !border-liteGray">
            <div className="logo md:!ml-[-11px] ml-0 md:pl-5">
              <img
                src={Website_Logo}
                alt="Broker AIQ Logo"
                className="w-[160px] h-[34px] md:w-[160px] md:h-[34px] xl:w-[180px] xl:h-[40px] 3xl:w-[190px] 3xl:h-[42px]"
              />
            </div>

            {
              isLoggedIn ?
                <div className="hidden md:flex gap-2.5 mr-3">
                  <Button
                    className="bg-transparent text-primary border-primary px-5 py-5 rounded-md "
                    size="medium"
                    onClick={onDashboard}
                  >
                    Dashboard
                  </Button>
                  <Button
                    type="primary"
                    size="medium"
                    className="px-5 py-5 rounded-md"
                    onClick={onLogout}
                    icon={<i
                      className="icon-log-out flex items-center justify-center before:!m-0"
                      style={{ fontSize: "22px", }}
                    />}
                    iconPosition="end"
                  >
                    Logout
                  </Button>
                </div>
                :
                <div className="hidden md:flex gap-2.5 mr-3">
                  <Button
                    className="bg-transparent text-primary border-primary px-7 py-5 rounded-md w-[90px]"
                    size="medium"
                    onClick={onClickLogin}
                  >
                    Login
                  </Button>
                  <Button
                    type="primary"
                    size="medium"
                    className="px-7 py-5 rounded-md"
                    onClick={onClickRegister}
                  >
                    Register
                  </Button>
                </div>
            }



            <div className="block md:hidden">
              <Button
                type="text"
                icon={<MenuOutlined className="text-white text-lg" />}
                onClick={showDrawer}
                className="!border-0 !bg-transparent"
              />
            </div>
          </div>
        </div>

        <Drawer
          title={null}
          placement="right"
          onClose={onClose}
          open={open}
          className="!bg-gray-800"
          width={280}
          styles={{
            body: { padding: 0 },
            header: { display: "none" },
          }}
        >
          <div className="flex flex-col h-full bg-gray-800">
            <div className="p-4 border-b border-Gray">
              <div className="logo flex justify-between items-center">
                <img
                  src={Website_Logo}
                  alt="Broker AIQ Logo"
                  className="w-[160px] h-[34px] md:w-[160px] md:h-[34px] xl:w-[180px] xl:h-[40px] 3xl:w-[190px] 3xl:h-[42px]"
                />
                <i className="icon-close cursor-pointer" onClick={onClose} />
              </div>
            </div>

            {
              isLoggedIn ?
                <div className="flex-1 p-4">
                  <div className="space-y-4">
                    <Button
                      className="bg-transparent text-primary border-primary px-5 py-5 rounded-md "
                      size="medium"
                      onClick={onDashboard}
                      block
                    >
                      Dashboard
                    </Button>
                    <Button
                      type="primary"
                      size="medium"
                      className="px-5 py-5 rounded-md"
                      onClick={onLogout}
                      icon={<i
                        className="icon-log-out flex items-center justify-center before:!m-0"
                        style={{ fontSize: "22px", }}
                      />}
                      iconPosition="end"
                      block
                    >
                      Logout
                    </Button>
                  </div>
                </div>
                :
                <div className="flex-1 p-4">
                  <div className="space-y-4">
                    <Button
                      className="bg-transparent text-primary border-primary px-7 py-5 rounded-md w-[90px]"
                      size="medium"
                      onClick={onClickLogin}
                      block
                    >
                      Login
                    </Button>
                    <Button
                      type="primary"
                      size="medium"
                      className="px-7 py-5 rounded-md"
                      onClick={onClickRegister}
                      block
                    >
                      Register
                    </Button>
                  </div>
                </div>
            }

          </div>
        </Drawer>

        {/* Brain Image Section */}
        <div className="absolute inset-0 bg-black/20 z-25"></div>
        <img
          src={Sparkle}
          alt="Sparkle Background"
          className="absolute top-[22%] left-[52%] transform -translate-x-1/2 -translate-y-1/2 w-[60%] h-[70%] object-contain opacity-80 z-[30]"
        />
        {/* Brain Image Section */}
        <div className="flex justify-center items-center mt-16 md:mt-20 lg:mt-24 relative z-30">
          <div className="relative overflow-hidden">
            <div
              // className="absolute inset-[-65px] blur-[50px] sm:inset-[-190px] rounded-full bg-primary sm:blur-[96px] opacity-20 z-0 mt-10"
              className="absolute  rounded-full opacity-20 z-0 mt-10"
            ></div>

            {/* Sparkle Background Image */}


            {/* Main Brain Image */}
            <img
              src={mainImg}
              alt="Brain Image"
              className="bqmain  relative !z-0 !h-[180px] !w-[300px] md:!h-[320px] md:!w-[560px] lg:!h-[320px] lg:!w-[560px] xl:!h-[360px] xl:!w-[640px] 2xl:!h-[18rem] 2xl:!w-[34rem] 3xl:!h-[380px] 3xl:!w-[680px]"
            />

            {/* Sub-Images Positioned Around the Brain */}
            {/* Top Sub-Image (Community Hub) */}
            {/* <img
              src={Community_HUB}
              alt="Community Hub"
              className="absolute h-[50px] xs:h-[60px] sm:h-[70px] md:h-[80px] lg:h-[85px] opacity-100 drop-shadow-md 
         top-5 xs:top-10 sm:top-12 md:top-14 lg:top-14 left-[68%] transform -translate-x-1/2 
         -translate-y-[60px] xs:-translate-y-[80px] sm:-translate-y-[100px] md:-translate-y-[110px] lg:-translate-y-[115px]"
            /> */}

            {/* Top-Right Sub-Image (Pricing Engine) */}
            {/* <img
              src={Pricing_Engine}
              alt="Pricing Engine"
              className="absolute hero_icon2 h-[50px] xs:h-[60px] sm:h-[70px] md:h-[80px] lg:h-[85px] opacity-100 drop-shadow-md 
         top-0 xs:top-0 sm:top-1 md:top-1 lg:top-1 !left-[30%] md:!left-[32%] transform 
         translate-x-[98px] sm:translate-x-[110px] md:translate-x-[170px] lg:translate-x-[174px]"
            /> */}

            {/* Bottom-Right Sub-Image (AI Product Genie) */}
            {/* <img
              src={AI_Product_Genie}
              alt="AI Product Genie"
              className="absolute h-[50px] xs:h-[60px] sm:h-[70px] md:h-[80px] lg:h-[85px] opacity-100 drop-shadow-md 
         bottom-3 right-[-13px] xs:bottom-6 sm:bottom-1 md:bottom-0 lg:bottom-[-10px] md:right-[28px] transform 
         translate-x-[80px] xs:translate-x-[50px] sm:translate-x-[110px] md:translate-x-[148px] lg:translate-x-[135px]"
            /> */}

            {/* Left Sub-Image (Daily Live Trainings) */}
            {/* <img
              src={Daily_Live_Trainings}
              alt="Daily Live Trainings"
              className="absolute h-[50px] xs:h-[60px] sm:h-[70px] md:h-[80px] lg:h-[85px] opacity-100 drop-shadow-md 
         top-[-12px] xs:top-[-12px] sm:top-[-12px] md:top-[-12px] lg:top-[-12px] md:!left-[-24px] left-[-4px] transform 
         -translate-x-[70px] xs:-translate-x-[124px] sm:-translate-x-[114px] md:-translate-x-[124px] lg:-translate-x-[110px]"
            /> */}

            {/* Bottom-Left Sub-Image (Live Toll-Free Support) */}
            {/* <img
              src={Live_Toll_Free_Support}
              alt="Live Toll-Free Support"
              className="absolute h-[50px] xs:h-[60px] sm:h-[70px] md:h-[80px] lg:h-[85px] opacity-100 Algorithms drop-shadow-md 
         bottom-0 xs:bottom-1 sm:bottom-1 md:bottom-1 lg:bottom-1 left-[-5px] md:left-[-15px] transform 
         -translate-x-[80px] xs:-translate-x-[122px] sm:-translate-x-[110px] md:-translate-x-[122px] lg:-translate-x-[122px]"
            /> */}
          </div>
        </div>

        {/* Text Content Section */}
        <div className="flex flex-col font-dm items-center mt-3 text-center z-30 text-white px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col justify-center items-center">
            <h2 className="theader1 text-primary !mt-0 text-sm sm:text-base md:text-[18px] lg:text-[15px] xl:text-[26px]  font-semibold mb-4 tracking-wide">
              AI-Powered Lending Revolution
            </h2>

            <h1 className="text-2xl sm:text-3xl md:text-[40px] lg:text-[40px] xl:text-[44px] !2xl:text-[44px] !3xl:text-[44px]  font-bold mb-3 leading-tight sm:leading-snug md:leading-[3rem]">
              The AI-Powered Platform Built for <br /> Mortgage Excellence
            </h1>

            <p className=" text-grayText text-xs sm:text-sm md:text-[11px] lg:text-[16px] max-w-[90%] sm:max-w-[70%] lg:max-w-[44%] xl:max-w-[44%] 2xl:max-w-[44%] 3xl:max-w-[44%] mb-3 md:mb-8 text-white opacity-60 !leading-[1.25rem]">
              {`Broker AIQ is the mortgage industry's first unified ecosystem —
              bringing together loan officers, account executives, processors,
              and lenders with AI-driven support, seamless collaboration, and
              continuous training.`}
            </p>

            <Button
              type="primary"
              size="large"
              className="herobutton px-4 sm:px-6 h-9 sm:h-12 rounded-md transition-all relative !z-[999999]"
              onClick={onClickGetStarted}
            >
              Get Started {" "}
              <i className="icon-front-arrow text-lg sm:text-2xl !mx-[-7.8px]" />
            </Button>
          </div>
        </div>

        {/* Earth Image at Bottom */}
        <div className="absolute -bottom-[20vh] md:-bottom-[20vh] lg:-bottom-[20vh] xl:-bottom-[44vh] 2xl:-bottom-[18rem] 3xl:-bottom-[30vh]  left-0 right-0 w-full px-0 md:px-0 lg:px-16 xl:px-20 2xl:px-32 3xl:px-3 z-20">
          <img
            src={Earth_Imgage}
            alt="Earth Image"
            className="w-full h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px] xl:h-[562px] 2xl:h-[450px] object-cover opacity-90"
          />
        </div>
      </div>

      {/* Section - 2 */}
      <Row ref={statsRef} className="bg-primary py-10 md:py-12 lg:py-14 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 !font-dm section1 px-4 md:px-10 lg:px-20 xl:px-24 2xl:px-36 3xl:px-40">
        <Col className="flex-col text-center font-dm">
          <div className="text-[40px] lg:text-[48px] font-bold text-white">{formatNumber(counters.realEstateAgents)}</div>
          <div className="md:text-[18px] text-white opacity-50 mt-0 font-dm">
            Real-Estate Agents
          </div>
        </Col>
        <Col className="flex-col text-center">
          <div className="text-[40px] lg:text-[48px] font-bold text-white font-dm">{formatNumber(counters.contractProcessors)}</div>
          <div className="md:text-[18px] text-white opacity-50 font-dm">
            Contract Processors
          </div>
        </Col>
        <Col className="flex-col text-center">
          <div className="text-[40px] lg:text-[48px] font-bold text-white font-dm">{formatNumber(counters.lenders)}</div>
          <div className="md:text-[18px] text-white opacity-50 font-dm">
            Lenders
          </div>
        </Col>
        <Col className="flex-col text-center">
          <div className="text-[40px] lg:text-[48px] font-bold text-white font-dm">{formatNumber(counters.accountExecutives)}</div>
          <div className="md:text-[18px] text-white opacity-50 font-dm">
            Account Executives
          </div>
        </Col>
        <Col className="flex-col text-center">
          <div className="text-[40px] lg:text-[48px] font-bold text-white font-dm">{formatNumber(counters.lenderGuidelines)}</div>
          <div className="md:text-[18px] text-white opacity-50 font-dm">
            Lender Guidelines
          </div>
        </Col>
      </Row>

      {/* Section - 3 */}
      <div className="bg-gray-900 sm:px-6  flex flex-col justify-center px-4 md:px-10 lg:px-20 xl:px-24 2xl:px-36 3xl:px-40 py-20 md:py-24 xl:py-24 3xl:py-30 3xl:pt-32">
        <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-12 font-dm">
          <h2 className="text-orange-500 text-sm sm:text-base md:text-[20px] lg:text-[15px] xl:text-[18px] font-semibold mb-2 tracking-wide">
            Human-Driven. AI-Enabled. Fully Connected
          </h2>

          <h1 className="text-white text-2xl sm:text-[35px] md:text-[34px] xl:text-[40px] 2xl:text-[40px] leading-tight sm:leading-[1.3] font-bold mt-2 font-dm">
            Empowered Together: The Professionals <br /> Behind the Broker AIQ
            Ecosystem
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2  lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-5 max-w-full ">
          {professionals.map((professional, index) => (
            <Card
              key={index}
              className="bg-gray border-1 border-liteGray !rounded-2xl text-left h-full relative overflow-hidden"
              bodyStyle={{ padding: "0" }}
            >
              <div className="relative bg-[#171717] !rounded-t-2xl h-28 xl:h-36 flex justify-center items-center">
                <div className="absolute inset-0 flex justify-between overflow-hidden">
                  <svg
                    width="90"
                    height="100"
                    viewBox="0 0 210 151"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute top-0 left-0 sm:w-[150px] sm:h-[150px]"
                  >
                    <g filter="url(#filter0_f_4572_2398)">
                      <circle cy="0.845459" r="70" fill="#FF6D00" />
                    </g>
                    <defs>
                      <filter
                        id="filter0_f_4572_2398"
                        x="-210"
                        y="-209.155"
                        width="420"
                        height="420"
                        filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                      >
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend
                          mode="normal"
                          in="SourceGraphic"
                          in2="BackgroundImageFix"
                          result="shape"
                        />
                        <feGaussianBlur
                          stdDeviation="75"
                          result="effect1_foregroundBlur_4572_2398"
                        />
                      </filter>
                    </defs>
                  </svg>

                  <svg
                    width="90"
                    height="100"
                    viewBox="0 0 210 151"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute bottom-0 right-0 sm:w-[150px] sm:h-[150px]"
                  >
                    <g filter="url(#filter0_f_4572_2397)">
                      <circle cx="210" cy="150.845" r="70" fill="#FF6D00" />
                    </g>
                    <defs>
                      <filter
                        id="filter0_f_4572_2397"
                        x="0"
                        y="-59.1545"
                        width="420"
                        height="420"
                        filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                      >
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend
                          mode="normal"
                          in="SourceGraphic"
                          in2="BackgroundImageFix"
                          result="shape"
                        />
                        <feGaussianBlur
                          stdDeviation="75"
                          result="effect1_foregroundBlur_4572_2397"
                        />
                      </filter>
                    </defs>
                  </svg>
                </div>

                <div className="relative z-10 text-3xl sm:text-4xl flex justify-center items-center">
                  {professional.icon}
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-white text-xl font-semibold mb-3 font-dm">
                  {professional.title}
                </h3>
                <p className="text-grayText font-dm">
                  {professional.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Section -4 */}

      <div className="bg-darkGray px-4 md:px-10 lg:px-20 xl:px-24 2xl:px-36 3xl:px-40 py-20 md:py-24 xl:py-24 3xl:py-30">
        {/* Header Section */}

        <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-12 font-dm">
          <h2 className="text-orange-500 text-sm sm:text-base md:text-[20px] lg:text-[15px] xl:text-[18px] font-semibold mb-2 tracking-wide">
            Features & Capabilities
          </h2>

          <h1 className="text-white text-2xl sm:text-[35px] md:text-[34px] xl:text-[40px] 2xl:text-[40px] leading-tight sm:leading-[1.3] font-bold mt-2 font-dm">
            Explore the Powerful Tools That Drive <br /> Lending Efficiency
          </h1>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 font-dm gap-6">
          {/* Left Column: Sections */}
          <div className="flex flex-col ">
            {sections.map((section, index) => (
              <div
                key={index}
                onClick={() => setActiveSection(index)}
                className="cursor-pointer"
              >
                {/* Section Title and Description */}
                <div className="py-[24px]">
                  <div
                    className={`text-base sm:text-lg items-center font-bold font-dm   ${activeSection === index ? "text-primary" : "text-grayText"
                      }`}
                  >
                    {section.title}
                  </div>
                  {activeSection === index && (
                    <p className="text-white w-auto py-2 leading-relaxed">
                      {section.description}
                    </p>
                  )}
                </div>
                {/* Divider */}
                <div
                  className={`w-[90%] sm:w-[85%] h-[1px] bg-gradient-to-r  ${activeSection === index
                    ? "from-white to-transparent"
                    : "from-grayText to-transparent"
                    } ${index === 2 ? "sm:w-[80%] sm:h-[1px]" : ""}`}
                ></div>
              </div>
            ))}
          </div>

          {/* Right Column: Image */}
          <div className="h-full flex items-center justify-center pt-4">
            <img
              src={sections[activeSection].image}
              alt={sections[activeSection].title}
              className="w-full h-auto max-h-[400px] sm:max-h-[500px] object-contain"
            />
          </div>
        </div>
      </div>

      {/* Section -5 */}

      <div className="flex text-center flex-col !justify-center px-4 md:px-10 lg:px-20 xl:px-24 2xl:px-36 3xl:px-40 py-20 md:py-24 xl:py-24 3xl:py-30">

        <div className="text-center mb-8 sm:mb-10 md:mb-8 lg:mb-8 font-dm">
          {/* <h2 className="text-orange-500 text-sm sm:text-base md:text-[20px] lg:text-[15px] xl:text-[22px] font-semibold mb-2 tracking-wide">
            AI Product Genie
          </h2> */}
          <Text className="text-white text-sm sm:text-base md:text-[20px] lg:text-[15px] xl:text-[18px] font-semibold mb-2" style={{
            background: 'linear-gradient(175deg, #FF6D00 0%, #FF47CC 50%, rgb(91, 58, 236) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>AI Product Genie</Text>
          <h1 className="text-white text-2xl sm:text-[35px] md:text-[34px] xl:text-[40px] 2xl:text-[40px] leading-tight sm:leading-[1.3] font-bold mt-2 font-dm">
            Find the Right Loan Product Instantly with <br /> AI Product Genie
          </h1>
        </div>

        <video
          src={Genie_Video}
          autoPlay
          loop
          muted
          playsInline
          className=""
        />
      </div>

      {/* Section -6  */}

      <div className="px-4 md:px-10 lg:px-20 xl:px-24 2xl:px-36 3xl:px-40 py-20 md:py-24 xl:py-24 3xl:py-30">

        <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-12 font-dm">
          <h2 className="text-orange-500 text-sm sm:text-base md:text-[20px] lg:text-[15px] xl:text-[18px] font-semibold mb-2 tracking-wide">
            Benefits Overview
          </h2>

          <h1 className="text-white text-2xl sm:text-[35px] md:text-[34px] xl:text-[40px] 2xl:text-[40px] leading-tight sm:leading-[1.3] font-bold mt-2 font-dm">
            Why Top Loan Officers Use Broker AIQ
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray flex-col p-6 border border-liteGray rounded-2xl font-dm"
            >
              <div className="relative bg-liteGrayV1 overflow-hidden rounded-lg h-[50px] w-[50px]">
                <div className="absolute  w-full h-full  flex justify-center items-center">
                  <div className="elipceBot absolute p-[60px] top-[-120%] left-[-96%]"></div>
                  <div className="text-center text-white text-3xl">
                    {feature.icon}
                  </div>
                  <div className="elipceBot absolute p-[50px] top-[-3%] left-[-8%]"></div>
                </div>
              </div>
              <div className="text-white text-lg md:text-xl   py-1.5 font-bold">
                {feature.title}
              </div>
              <div className=" text-grayText text-base">{feature.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section - 7 - Scroll Animations */}
      <div className="flex-col font-dm text-center bg-gray px-4 md:px-10 lg:px-20 xl:px-24 2xl:px-36 3xl:px-40 py-20 md:py-24 xl:py-24 3xl:py-30">


        <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-12 font-dm">
          <h2 className="text-orange-500 text-sm sm:text-base md:text-[20px] lg:text-[15px] xl:text-[18px] font-semibold mb-2 tracking-wide">
            Testimonials
          </h2>

          <h1 className="text-white text-2xl sm:text-[35px] md:text-[34px] xl:text-[40px] 2xl:text-[40px] leading-tight sm:leading-[1.3] font-bold mt-2 font-dm">
            They’re already using Broker AIQ and here’s <br /> why they trust us
          </h1>
        </div>

        <section className=" relative review-section">
          <div className="">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Column 1 */}
              <div className="review-column flex-col h-[550px] sm:h-[450px] xl:h-[450px]">
                <div className="animate-scroll-up">
                  {column1Reviews.map((review) => (
                    <ReviewCard key={review.id} {...review} />
                  ))}
                </div>
              </div>

              {/* Column 2 */}
              <div className="review-column hidden sm:block sm:flex-col h-[550px] sm:h-[450px]">
                <div className="animate-scroll-down">
                  {column2Reviews.map((review) => (
                    <ReviewCard key={review.id} {...review} />
                  ))}
                </div>
              </div>

              {/* Column 3 */}
              <div className="review-column hidden lg:block lg:flex-col h-[550px] sm:h-[450px]">
                <div className="animate-scroll-up">
                  {column3Reviews.map((review) => (
                    <ReviewCard key={review.id} {...review} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-[-5px] md:bottom-[-5px] lg:bottom-[-5px] xl:bottom-[-10px] left-0 right-0 h-[100px] bg-gradient-to-b from-transparent to-[#1E1E1E]"></div>
        </section>
      </div>
      {/* Section - 8 - FAQ Section */}
      <div className=" text-white py-20 px-5 sm:px-8 md:px-[120px] xl:px-[310px] bg-darkGray font-dm mb-8">
        <div className="max-w-5xl mx-auto mt-8">
          {/* Header */}


          <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-12 font-dm">
            <h2 className="text-orange-500 text-sm sm:text-base md:text-[20px] lg:text-[15px] xl:text-[18px] font-semibold mb-2 tracking-wide">
              FAQ
            </h2>

            <h1 className="text-white text-2xl sm:text-[35px] md:text-[34px] xl:text-[40px] 2xl:text-[40px] leading-tight sm:leading-[1.3] font-bold mt-2 font-dm">
              Frequently Asked Questions
            </h1>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqData.map((item) => (
              <div
                key={item.key}
                className="bg-gray border border-liteGray rounded-2xl hover:bg-opacity-8 pt-0 hover:border-primary hover:border-opacity-30 transition-all duration-300"
              >
                <div
                  className="px-4 py-3 cursor-pointer flex justify-between items-center"
                  onClick={() => toggleFAQ(item.key)}
                >
                  <span className="text-base sm:text-lg md:text-xl  font-bold text-white hover:text-primary transition-colors duration-300 pr-4 sm:pr-5">
                    {item.label}
                  </span>
                  <div
                    className={`w-6 h-6 bg-primary rounded-full pt-0.5 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 transition-transform duration-300 ${openFAQ === item.key ? "rotate-180" : ""
                      }`}
                  >
                    <i className="icon-down-arrow" />
                  </div>
                </div>
                <div
                  className={`px-6 sm:px-4   overflow-hidden transition-all duration-400 ${openFAQ === item.key ? "max-h-96 pt-0 pb-4" : "max-h-0"
                    }`}
                >
                  <p className="text-grayText ">{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="FOOTER_CTA flex-col  py-[60px] px-4 md:px-[86px] justify-center md:justify-start">
        <div className=" text-[26px] md:text-[40px] xl:text-[46px] 2xl:text-[52px] 3xl:text-[56px] font-bold leading-[32px] md:leading-[52px] xl:leading-[60px] 2xl:leading-[64px] 3xl:leading-[74px] text-center md:text-start text-white font-dm">
          The wholesale revolution starts here—bridging <br /> Main Street with
          cutting-edge technology.
        </div>
        <div className="flex justify-center md:justify-start w-full">
          <Button
            type="primary"
            size="large"
            className=" mt-7  px-9  bg-darkGray border-none  hover:!bg-darkGray"
            onClick={onClickGetStarted}
          >
            Get Started <i className="icon-front-arrow text-2xl !mx-[-9.8px]" />
          </Button>
        </div>
      </div>

      {/* footer */}

      <footer className="bg-gray  text-white py-10 px-4 md:px-10 lg:px-20 xl:px-24 2xl:px-36 3xl:px-40 font-dm">
        <div className="container flex flex-col md:flex-row justify-between mb-7 sm:mb-14 ">
          {/* Left Section: Logo and Social Icons */}
          <div className="flex flex-col items-center md:items-start mb-4 md:mb-0  ">
            <div className="flex flex-col md:flex-row items-center mb-2">
              {/* <img src={Website_Logo} alt="" className="h-8" /> */}

              <img
                src={Website_Logo}
                alt="Broker AIQ Logo"
                className="w-[160px] h-[34px] md:w-[160px] md:h-[34px] xl:w-[180px] xl:h-[40px] 3xl:w-[190px] 3xl:h-[42px]"
              />
              <Divider type="vertical" className="!h-full mx-4" />
              <img
                src={Old_Website_Logo}
                alt="Broker AIQ Logo"
                className="w-[160px] !h-[34px] md:w-[160px] md:h-[34px] xl:w-[180px] xl:h-[40px] 3xl:w-[190px] 3xl:h-[42px] mt-4 md:mt-0"
              />
            </div>
            <p className="text-grayText my-1 mb-4 text-center md:text-left w-full md:w-full lg:w-[60%] ">
              Experience the most advanced and uniquely innovative platform in the mortgage and real estate industry.
            </p>
            {/* <div className="flex space-x-2 items-center text-lg">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="icon-facebook" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="icon-instagram" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="icon-linkedin-filled" />
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer">
                <i className="icon-twitter" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="icon-youtube-filled" />
              </a>
            </div> */}
          </div>
          <div className="flex space-x-2 items-start justify-center text-lg">
            <a
              href="#"
              // target="_blank"
              rel="noopener noreferrer"
            >
              <i className="icon-facebook" />
            </a>
            <a
              href="#"
              // target="_blank"
              rel="noopener noreferrer"
            >
              <i className="icon-instagram" />
            </a>
            <a
              href="#"
              // target="_blank"
              rel="noopener noreferrer"
            >
              <i className="icon-linkedin-filled" />
            </a>
            <a href="#"
              //  target="_blank"
              rel="noopener noreferrer">
              <i className="icon-twitter" />
            </a>
            <a
              href="#"
              // target="_blank"
              rel="noopener noreferrer"
            >
              <i className="icon-youtube-filled" />
            </a>
          </div>

          {/* Right Section: Newsletter Subscription */}
          {/* <div className="w-full md:ml-14 md:w-auto text-center md:text-left flex flex-col justify-center md:justify-start">
            <h3 className="text-white font-bold text-xs mb-2 text-center md:text-left">
              Subscribe to our newsletter
            </h3>
            <p className="text-grayText text-[10px] mb-5 text-center md:text-left">
              The latest news, updates, and resources will be sent to your inbox
              weekly.
            </p>
            <div className="flex w-full justify-center md:justify-start">
              <div className="flex  space-x-2 font-dm p-1 bg-darkGray rounded-md w-[360px] border border-liteGray">
                <Input
                  placeholder="Your email address"
                  className="!text-white border-none text-[11.5px] px-2 py-1 placeholder-grayText focus:ring-0 h-7 flex-grow"
                />
                <Button
                  type="primary"
                  className="bg-primary border-none text-white  h-7 px-6 text-[11.5px] rounded-md"
                >
                  Subscribe
                </Button>
              </div>
            </div>
          </div> */}
        </div>

        {/* Bottom Section */}
        <div className="border-t-[2px] border-liteGray mt-2 pt-4">
          <div className=" !w-full flex flex-col md:flex-row justify-between  items-center text-gray-400  ">
            <p className="text-grayText">
              © 2025 Broker AIQ. All Rights Reserved
            </p>
            <div className="flex mt-2 md:mt-0 ">
              <a
                href="#"
                className="hover:text-white border-r border-liteGray px-2.5 text-sm"
              >
                Security
              </a>
              <a
                href="#"
                className="hover:text-white border-r border-liteGray px-2.5 text-sm"
              >
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white ml-2.5 text-sm">
                Terms & Conditions
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;