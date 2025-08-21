import { Col, Divider, Row, Typography } from 'antd';
import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom';
import Chat from './Components/Chat/Chat';
import Feed from './Components/Feed';

const Community = () => {
  const { Text, Title } = Typography;

  const param = useParams();

  const [feedMobileDrawer, setFeedMobileDrawer] = useState(true);

  // console.log('param', param.type)

  const navigate = useNavigate();

  const onClickCommunitySideBar = (type) => {
    navigate(`/community/${type}`)
    // console.log('type', type);
  }

  return (
    <Row
      className="bg-darkGray px-header-wrapper h-full w-full"
      gutter={[0, 24]}
    >

      <Col
        span={24}
        className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mt-6"
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
              to="/community/feed"
              className="text-primary hover:text-primary flex justify-center"
            >
              <Text className="text-grayText hover:text-primary cursor-pointer text-base sm:text-lg">
                Community
              </Text>
            </Link>
            <Text className="text-grayText mx-2">
              {" "}
              <i className="icon-right-arrow" />{" "}
            </Text>
            <Text className="text-white text-lg sm:text-2xl">
              {param.type === 'feed' ? 'Feed' : param.type === 'chat' ? 'Chat' : ''}
            </Text>
          </Title>
        </div>
      </Col>
      <Col span={24} className="h-full bg-gray">
        <div className={`w-full !bg-darkGray`} >
          <div className='md:flex gap-5'>
            <div className="rounded-3xl border overflow-hidden bg-gray border-solid border-liteGray relative mb-2 md:mb-0">
              <div
                className=" overflow-x-hidden lg:py-4 lg:px-4"
                style={{
                  height: window.innerWidth < 768 ? "" : "calc(100vh - 200px)",
                  overflowY: "auto",
                  scrollbarGutter: "stable both-edges",
                }}
              >
                <div className='py-2 flex md:flex-col items-center gap-7'>
                  <div>
                    <i className="icon-community before:!m-0 text-5xl md:text-6xl text-grayText" />
                  </div>
                  <Divider className='m-0' type={window.innerWidth < 768 ? 'vertical' : 'horizontal'} />
                  <div className='flex md:flex-col justify-center items-center cursor-pointer' onClick={() => onClickCommunitySideBar('feed')}>
                    <i className={`icon-feed before:!m-0 text-4xl md:text-5xl ${param.type === 'feed' ? 'text-primary' : 'text-grayText'} `} />
                    <Text className={`hidden md:block text-sm ${param.type === 'feed' ? '' : 'text-grayText'}`}>Feed</Text>
                  </div>
                  <div className='flex md:flex-col justify-center items-center cursor-pointer' onClick={() => onClickCommunitySideBar('chat')}>
                    <i className={`icon-chats before:!m-0 text-4xl md:text-5xl ${param.type === 'chat' ? 'text-primary' : 'text-grayText'}`} />
                    <Text className={`hidden md:block text-sm ${param.type === 'chat' ? '' : 'text-grayText'}`}>Chat</Text>
                  </div>
                  <div className='flex md:hidden md:flex-col justify-center items-center cursor-pointer' onClick={() => setFeedMobileDrawer(!feedMobileDrawer)}>
                    <i className={`icon-send before:!m-0 text-4xl md:text-5xl text-grayText`} />
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border overflow-hidden bg-gray border-solid border-liteGray relative flex-1">
              <div
                className="!p-0"
                style={{
                  height: window.innerWidth < 768 ? "calc(100vh - 212px)" : "calc(100vh - 200px)",
                  // overflowY: "auto",
                  // scrollbarGutter: "stable both-edges",
                }}
              >
                {
                  param.type === 'feed' ? <Feed feedMobileDrawer={feedMobileDrawer} setFeedMobileDrawer={setFeedMobileDrawer} /> : param.type === 'chat' ? <Chat /> : ''
                }
              </div>
            </div>
          </div>

        </div>
      </Col>
    </Row>
  )
}

export default Community
