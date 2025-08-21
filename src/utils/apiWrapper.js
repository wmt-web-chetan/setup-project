import axios from "axios";
import { notification } from "antd";
import { API_URL, FLASK_API_URL } from "./constant";
import { getStorage } from "./commonfunction";

// Create two separate axios instances for different backends
const laravelApi = axios.create({
  baseURL: API_URL,
});

const flaskApi = axios.create({
  baseURL: FLASK_API_URL,
});

// Add request interceptor to both instances
const addRequestInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      const user = getStorage("user", true);
      const token = user?.token || undefined;

      if (token) {
        config.headers["Authorization"] = "Bearer " + token;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

// Add response interceptor to both instances
const addResponseInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.response.use(
    (response) => {
      if (response?.data?.meta?.code === 401) {
        localStorage.clear();
        // window.location.replace("/signin");
      } else {
        return response.data;
      }
    },
    (error) => {
      console.log("error wrapper", error);
      if (error?.code === "ERR_NETWORK") {
        notification.error({
          message: "Error",
          description: error?.message || "Unable to connect to server",
          duration: 2,
        });
      }
      if (error?.code === "ERR_BAD_REQUEST") {
        if (error?.response?.status === 401) {
          localStorage.clear();
          window.location.replace("/signin");
        }

        if (error?.response.data.data.is_joined === 0) {
          console.log("error", error?.response.data.data.is_joined);
          return;
        }
        notification.error({
          message: "Error",
          description:
            error?.response?.data?.meta?.message || "Invalid request",
          duration: 2,
        });
      }
      if (error?.code === "ERR_BAD_RESPONSE") {
        console.log("error", error);

        notification.error({
          message: "Error",
          description:
            error?.response?.data?.meta?.message ||
            "Server responded with an error",
          duration: 2,
        });
      }
      const isAuthorized = error?.response?.code === 401;
      if (isAuthorized) {
        localStorage.clear();
        // window.location.href = "/signin";
      }
      return error?.response?.data;
    }
  );
};

// Apply interceptors to both instances
addRequestInterceptor(laravelApi);
addRequestInterceptor(flaskApi);
addResponseInterceptor(laravelApi);
addResponseInterceptor(flaskApi);

// Generic request function that takes an axios instance
const makeRequest = (axiosInstance, method, url, config = {}) => {
  let requestConfig = {
    ...config,
    method,
    url,
  };
  return axiosInstance(requestConfig);
};

// Laravel API requests
export const laravelGet = (url, config = {}) =>
  makeRequest(laravelApi, "get", url, config);
export const laravelPost = (url, config = {}) =>
  makeRequest(laravelApi, "post", url, config);
export const laravelPatch = (url, config = {}) =>
  makeRequest(laravelApi, "patch", url, config);
export const laravelDel = (url, config = {}) =>
  makeRequest(laravelApi, "delete", url, config);

// Flask API requests
export const flaskGet = (url, config = {}) =>
  makeRequest(flaskApi, "get", url, config);
export const flaskPost = (url, config = {}) =>
  makeRequest(flaskApi, "post", url, config);
export const flaskPatch = (url, config = {}) =>
  makeRequest(flaskApi, "patch", url, config);
export const flaskDel = (url, config = {}) =>
  makeRequest(flaskApi, "delete", url, config);

// Default API (Laravel) for backward compatibility
export const get = laravelGet;
export const post = laravelPost;
export const patch = laravelPatch;
export const del = laravelDel;
