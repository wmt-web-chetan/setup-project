// HtmlMessage.jsx
import React from "react";
import "./HtmlMessage.scss"; // Import the dedicated CSS file

const HtmlMessage = ({ content, from = "Genie" }) => {
  // Function to handle inline markdown (bold text, etc.)
  const parseInlineMarkdown = (text) => {
    if (!text) return "";

    // Handle bold text (**text**)
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts?.map((part, index) => {
      if (part?.startsWith("**") && part?.endsWith("**")) {
        const boldText = part.slice(2, -2);
        return <strong key={index}>{boldText}</strong>;
      }
      return part;
    });
  };

  // Function to parse markdown content and convert to JSX
  const parseMarkdown = (text) => {
    if (!text) return null;

    // Split content into lines for processing
    const lines = text.split("\n");
    const elements = [];
    let currentKey = 0;

    for (let i = 0; i < lines?.length; i++) {
      const line = lines[i];
      const trimmedLine = line?.trim();

      // Skip empty lines
      if (!trimmedLine) {
        elements.push(<br key={currentKey++} />);
        continue;
      }

      // Handle main headers (# Header)
      if (trimmedLine?.startsWith("# ")) {
        const headerText = trimmedLine.substring(2);
        elements.push(
          <h1 key={currentKey++} className="markdown-main-header">
            {parseInlineMarkdown(headerText)}
          </h1>
        );
      }
      // Handle sub headers (## Header)
      else if (trimmedLine?.startsWith("## ")) {
        const headerText = trimmedLine.substring(3);
        elements.push(
          <h2 key={currentKey++} className="markdown-sub-header">
            {parseInlineMarkdown(headerText)}
          </h2>
        );
      }
      // Handle headers (### Header)
      else if (trimmedLine?.startsWith("### ")) {
        const headerText = trimmedLine.substring(4);
        elements.push(
          <h3 key={currentKey++} className="markdown-header">
            {parseInlineMarkdown(headerText)}
          </h3>
        );
      }
      // Handle h4 headers (#### Header)
      else if (trimmedLine?.startsWith("#### ")) {
        const headerText = trimmedLine.substring(5);
        elements.push(
          <h4 key={currentKey++} className="markdown-h4-header">
            {parseInlineMarkdown(headerText)}
          </h4>
        );
      }
      // Handle bullet points (* Item) - including indented ones
      else if (trimmedLine?.startsWith("* ")) {
        const bulletText = trimmedLine.substring(2);
        const indentLevel =
          (line?.length || 0) - (line?.trimStart()?.length || 0);
        const listItemClass =
          indentLevel > 0
            ? "markdown-bullet markdown-bullet-indented"
            : "markdown-bullet";

        elements.push(
          <li
            key={currentKey++}
            className={listItemClass}
            style={{ marginLeft: `${indentLevel * 10}px` }}
          >
            {parseInlineMarkdown(bulletText)}
          </li>
        );
      }
      // Handle regular paragraphs
      else {
        elements.push(
          <p key={currentKey++} className="markdown-paragraph">
            {parseInlineMarkdown(trimmedLine)}
          </p>
        );
      }
    }

    return elements;
  };

  // This is a dedicated component to handle HTML content rendering
  const parsedContent = parseMarkdown(content);
  return (
    <div>
      {from === "Genie" ? (
        <div className="html-message markdown-content">{parsedContent}</div>
      ) : (
        <div
          className="html-message"
          dangerouslySetInnerHTML={{ __html: content || "" }}
        />
      )}
    </div>
  );
};

export default HtmlMessage;
