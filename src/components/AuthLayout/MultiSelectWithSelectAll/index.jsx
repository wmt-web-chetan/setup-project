import React, { useState, useEffect } from "react";
import { Select, Divider, Typography, Input, Tag, Tabs } from "antd";

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const MultiSelectWithCategoryTabs = () => {
  // Sample data for the dropdown with categories
  const categorizedOptions = [
    {
      category: "Fruits",
      options: [
        { value: "apple", label: "Apple" },
        { value: "banana", label: "Banana" },
        { value: "orange", label: "Orange" },
        { value: "grape", label: "Grape" },
        { value: "mango", label: "Mango" },
      ],
    },
    {
      category: "Vegetables",
      options: [
        { value: "carrot", label: "Carrot" },
        { value: "broccoli", label: "Broccoli" },
        { value: "spinach", label: "Spinach" },
        { value: "tomato", label: "Tomato" },
        { value: "cucumber", label: "Cucumber" },
      ],
    },
    {
      category: "Dairy",
      options: [
        { value: "milk", label: "Milk" },
        { value: "cheese", label: "Cheese" },
        { value: "yogurt", label: "Yogurt" },
        { value: "butter", label: "Butter" },
      ],
    },
  ];

  // Add an "All" category that includes all options
  const allCategory = {
    category: "All",
    options: categorizedOptions.flatMap((category) => category.options),
  };

  // Flatten all options for select-all functionality
  const allOptions = allCategory.options;

  // State to track selected values
  const [selectedValues, setSelectedValues] = useState([]);

  // State to track filter text
  const [filterText, setFilterText] = useState("");

  // State to track active category tab
  const [activeCategory, setActiveCategory] = useState("All");

  // Handle change in selections
  const handleChange = (values) => {
    setSelectedValues(values);
  };

  // Function to handle select all for the current category view
  const handleSelectAll = () => {
    const currentCategoryOptions =
      activeCategory === "All"
        ? allOptions
        : categorizedOptions.find((cat) => cat.category === activeCategory)
            ?.options || [];

    const currentCategoryValues = currentCategoryOptions.map(
      (option) => option.value
    );

    // Check if all visible options are selected
    const allVisibleSelected = currentCategoryValues.every((value) =>
      selectedValues.includes(value)
    );

    if (allVisibleSelected) {
      // Remove all visible options
      setSelectedValues(
        selectedValues.filter((value) => !currentCategoryValues.includes(value))
      );
    } else {
      // Add all visible options that aren't already selected
      const newValues = [...selectedValues];
      currentCategoryValues.forEach((value) => {
        if (!selectedValues.includes(value)) {
          newValues.push(value);
        }
      });
      setSelectedValues(newValues);
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilterText(e.target.value);
  };

  // Handle category tab change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  // Get current category options based on active tab
  const getCurrentOptions = () => {
    const options =
      activeCategory === "All"
        ? allOptions
        : categorizedOptions.find((cat) => cat.category === activeCategory)
            ?.options || [];

    // Apply text filter if any
    return options.filter((option) =>
      option.label.toLowerCase().includes(filterText.toLowerCase())
    );
  };

  // Check if all visible options are selected
  const areAllVisibleOptionsSelected = () => {
    const visibleOptions = getCurrentOptions();
    const visibleValues = visibleOptions.map((option) => option.value);

    return (
      visibleValues.length > 0 &&
      visibleValues.every((value) => selectedValues.includes(value))
    );
  };

  // Get options to display in dropdown
  const displayOptions = getCurrentOptions();

  return (
    <div style={{ margin: "20px", maxWidth: "500px" }}>
      <Title level={3}>Multi-Select with Category Tabs</Title>

      <Select
        mode="multiple"
        style={{ width: "100%" }}
        placeholder="Select Items"
        value={selectedValues}
        onChange={handleChange}
        maxTagCount={3}
        dropdownRender={(menu) => (
          <div>
            <div
              style={{ padding: "8px", cursor: "pointer" }}
              onClick={handleSelectAll}
            >
              {areAllVisibleOptionsSelected()
                ? `✓ Deselect All ${
                    activeCategory !== "All" ? activeCategory : "Items"
                  }`
                : `☐ Select All ${
                    activeCategory !== "All" ? activeCategory : "Items"
                  }`}
            </div>
            <Divider style={{ margin: "4px 0" }} />

            <Input
              placeholder="Search Items..."
              style={{ margin: "4px 8px", width: "calc(100% - 16px)" }}
              value={filterText}
              onChange={handleFilterChange}
            />

            <Divider style={{ margin: "4px 0" }} />

            <Tabs
              activeKey={activeCategory}
              onChange={handleCategoryChange}
              style={{ padding: "0 8px" }}
              size="small"
            >
              <TabPane tab="All" key="All" />
              {categorizedOptions.map((category) => (
                <TabPane tab={category.category} key={category.category} />
              ))}
            </Tabs>

            <Divider style={{ margin: "4px 0" }} />

            {displayOptions.length === 0 ? (
              <div
                style={{ padding: "8px", textAlign: "center", color: "#999" }}
              >
                No matching items
              </div>
            ) : (
              menu
            )}
          </div>
        )}
      >
        {displayOptions.map((option) => (
          <Option key={option.value} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>

      <div style={{ marginTop: "20px" }}>
        <div>
          <strong>Selected Values:</strong>
        </div>
        <div style={{ marginTop: "8px" }}>
          {selectedValues.length > 0
            ? selectedValues.map((value) => {
                const option = allOptions.find((opt) => opt.value === value);
                const category = categorizedOptions.find((cat) =>
                  cat.options.some((opt) => opt.value === value)
                );

                return (
                  <Tag key={value} color="blue" style={{ margin: "2px" }}>
                    {option?.label} ({category?.category})
                  </Tag>
                );
              })
            : "None"}
        </div>
      </div>
    </div>
  );
};

export default MultiSelectWithCategoryTabs;

// Usage in your app:
// import MultiSelectWithCategoryTabs from './MultiSelectWithCategoryTabs';
//
// function App() {
//   return (
//     <div className="App">
//       <MultiSelectWithCategoryTabs />
//     </div>
//   );
// }
