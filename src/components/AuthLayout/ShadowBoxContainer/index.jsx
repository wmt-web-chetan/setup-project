import React from "react";

const ShadowBoxContainer = ({
  children,
  height,
  overflow,
  className,
  radius = "rounded-3xl",
  shadowVisible = true,
  ...props
}) => {
  return (
    <div className={`w-full ${className || ""}`} {...props}>
      <div
        className={`${radius} rounded-3xl border overflow-hidden bg-gray border-solid border-liteGray w-full relative`}
      >
        {/* Shadow effect at the bottom inside the container */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-12 ${
            shadowVisible
              ? "bg-gradient-to-t from-black/50 to-transparent "
              : ""
          } pointer-events-none z-10`}
        ></div>

        {/* Scrollable content area with proper padding */}
        <div
          className=" overflow-x-hidden py-4 px-4" // Added padding
          style={{
            height: height || "70vh",
            overflowY: overflow || "auto",
            scrollbarGutter: "stable both-edges", // Better scrollbar handling
          }}
        >
          <div className="pt-2 h-full">
            {" "}
            {/* Additional top padding for content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShadowBoxContainer;
