import { Suspense, useEffect, useState } from "react";
import "./App.scss";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { PrivateRoutes, PublicRoutes, CommonRoutes } from "./routes";
import AuthLayout from "./components/AuthLayout";
import Loading from "./components/AuthLayout/Loading";
import Header from "./components/AuthLayout/Header";
import { Footer } from "antd/es/layout/layout";
import { fetchCompanyDetails } from "./services/Store/Company/actions";
import { useDispatch, useSelector } from "react-redux";
import { getStorage } from "./utils/commonfunction";
import { initEcho } from "./utils/echoService";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const App = () => {
  // console.log("check2")
  const user = getStorage('user', true);
  const userLoginRole = getStorage('userLoginRole', true);
  const isLoggedIn = (user?.user?.is_active && userLoginRole?.name !== undefined && user?.token !== undefined) || false;
  const SERVER = import.meta.env.VITE_SERVER;

  console.log('SERVER', SERVER)

  const { userForEdit } = useSelector((state) => state?.usersmanagement);

  const dispatch = useDispatch();

  // Google Analytics initialization
  useEffect(() => {
    // Create and append the first script tag for gtag/js

    if (SERVER === "PRODUCTION") {

    
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-DVPKG9E5GT';
      document.head.appendChild(script1);


      // Create and append the second script tag for gtag configuration
      const script2 = document.createElement('script');
      script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-DVPKG9E5GT');
    `;
      document.head.appendChild(script2);

      // Cleanup function to remove scripts when component unmounts
      return () => {
        document.head.removeChild(script1);
        document.head.removeChild(script2);
      };
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", "#FF6D00");
    document.documentElement.style.setProperty("--primaryOpacity", "#ff6d0026");
    document.documentElement.style.setProperty("--secondary", "#392DF280");
    document.documentElement.style.setProperty("--darkGray", "#171717");
    document.documentElement.style.setProperty("--gray", "#1E1E1E");
    document.documentElement.style.setProperty("--liteGrayV1", "#242424");
    document.documentElement.style.setProperty("--liteGray", "#373737");
    document.documentElement.style.setProperty("--grayText", "#6D6D6D");
    document.documentElement.style.setProperty("--success", "#22C55E");
    document.documentElement.style.setProperty("--error", "#EF4444");
    document.documentElement.style.setProperty("--erroOpacityr", "#EF44441a");

  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      // Initialize Echo service
      const echo = initEcho();

      // console.log('Socket echo', echo)

      if (!echo) {
        console.error("Failed to initialize Socket Echo");
      }
    }
  }, [isLoggedIn]);

  return (
    <Suspense fallback={<Loading className="h-[100vh] bg-darkGray"></Loading>}>
      <Routes>
        {/* Common Routes - accessible both when logged in and logged out */}
        {CommonRoutes.map(({ path, exact, component: Component }) => (
          <Route
            key={`common-public-${path}`}
            path={path}
            exact={exact}
            element={
              <Suspense
                fallback={
                  <Loading className="h-[100vh] bg-darkGray"></Loading>
                }
              >
                {isLoggedIn ? (
                  // <AuthLayout>
                  <Component />
                  // </AuthLayout>
                ) : (
                  <div className="min-h-[100vh] bg-darkGray">
                    <Component />
                  </div>
                )}
              </Suspense>
            }
          />
        ))}

        {/* Public Routes */}
        {PublicRoutes.map(({ path, exact, component: Component, common }) => {
          // Only handle non-404 public routes here
          if (path !== "*") {
            return isLoggedIn ? (
              <Route
                key={path}
                path={path}
                exact={exact}
                element={<Navigate to="/dashboard" />}
              />
            ) : (
              <Route
                key={path}
                path={path}
                exact={exact}
                element={
                  <Suspense
                    fallback={
                      <Loading className="h-[100vh] bg-darkGray"></Loading>
                    }
                  >
                    <div className="min-h-[100vh] bg-darkGray">
                      <Component />
                    </div>
                  </Suspense>
                }
              />
            );
          }
          return null;
        })}

        {/* Private Routes with AuthLayout */}
        <Route path="/" element={<AuthLayout />}>
          {PrivateRoutes.map(({ path, exact, component: Component }) => {
            // For the 404 route in private routes
            if (path === "*") {
              return (
                <Route
                  key={path}
                  path={path}
                  exact={exact}
                  element={
                    isLoggedIn ? <Component /> : <Navigate to="/signin" />
                  }
                />
              );
            }

            // For other private routes
            return isLoggedIn ? (
              <Route
                key={path}
                path={path}
                exact={exact}
                element={<Component />}
              />
            ) : (
              <Route
                key={path}
                path={path}
                exact={exact}
                element={<Navigate to="/signin" />}
              />
            );
          })}
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;