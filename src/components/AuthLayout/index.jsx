import { Content } from "antd/es/layout/layout";
import React, { Suspense } from "react";
import Headers from "./Header";
import { Layout, Spin } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer";
import Loading from "./Loading";

import "./AuthLayout.scss";

const AuthLayout = () => {
  return (
    <Layout className="min-h-screen flex flex-col">
      <div className="topAnimated"></div>
      <Headers />
      <Content className="">
        {/* removed py-7 class from below div  */}
        {/* <div className="flex-1 flex"> */}
        <Suspense
          fallback={
            <div className="loadingClass">
              <Spin size="large" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
        {/* </div> */}
      </Content>
      {/* <Footer /> */}
    </Layout>
  );
};

export default AuthLayout;
