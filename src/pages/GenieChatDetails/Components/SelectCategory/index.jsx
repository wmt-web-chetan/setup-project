import { Button, Form, Input, Modal, Pagination, TreeSelect, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchLoanCategories } from '../../../../services/Store/LoanCategory/action';
import { StarFilled } from "@ant-design/icons";

const { Text } = Typography;
const { SHOW_PARENT } = TreeSelect;

const SelectCategory = ({ openCategoryModal, setOpenCategoryModal, onCategoriesSelected, selectedCategories: parentSelectedCategories = [] }) => {

    const [form] = Form.useForm();
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [treeData, setTreeData] = useState([]);

    const dispatch = useDispatch();

    // Get loan categories from Redux store
    const { loanCategories, loanCategoriesLoading } = useSelector(
        (state) => state?.loanCategories || {}
    );

    // Sync selected categories when modal opens or parent selected categories change
    useEffect(() => {
        if (openCategoryModal && parentSelectedCategories.length > 0) {
            const categoryIds = parentSelectedCategories.map(cat => cat.id);
            setSelectedCategories(categoryIds);
            form.setFieldsValue({ categories: categoryIds });
        } else if (openCategoryModal && parentSelectedCategories.length === 0) {
            setSelectedCategories([]);
            form.setFieldsValue({ categories: [] });
        }
    }, [openCategoryModal, parentSelectedCategories, form]);

    useEffect(() => {
        const params = {
            pagination: false,
            is_delete: false,
        };

        dispatch(fetchLoanCategories(params)).then((res) => {
            console.log('All category', res?.payload)
        }).catch((error) => {
            console.log('Error', error)
        });
    }, [])

    // Transform loan categories to tree data format
    useEffect(() => {
        if (loanCategories?.data?.loan_categories?.length > 0) {
            const categories = loanCategories.data.loan_categories;

            const formattedTreeData = categories.map((category) => {
                const categoryObj = {
                    title: category.name,
                    value: category.id,
                    key: category.id,
                    color: category.color || "#9e9e9e",
                };

                // Add children if subcategories exist
                if (category.sub_categories?.length > 0) {
                    categoryObj.children = category.sub_categories.map((subCategory) => ({
                        title: subCategory.name,
                        value: subCategory.id,
                        key: subCategory.id,
                        color: subCategory.color || "#9e9e9e",
                        parentColor: category.color || "#9e9e9e",
                        parentName: category.name,
                        isSubcategory: true,
                    }));
                }

                return categoryObj;
            });

            setTreeData(formattedTreeData);
        }
    }, [loanCategories]);

    // Custom TreeSelect title renderer
    const titleRender = (nodeData) => {
        const isSubcategory = nodeData.isSubcategory;
        const color = nodeData.color || "#9e9e9e";
        const parentColor = nodeData.parentColor || color;

        return (
            <div className="flex items-center">
                {isSubcategory ? (
                    <div
                        className="w-5 h-5 rounded-full flex items-center justify-center mr-2"
                        style={{ backgroundColor: parentColor }}
                    >
                        <StarFilled style={{ color: color }} className="text-xs" />
                    </div>
                ) : (
                    <StarFilled
                        style={{ color: color, fontSize: "16px", marginRight: "8px" }}
                    />
                )}
                <Text className="text-white">{nodeData.title}</Text>
            </div>
        );
    };

    // Helper function to get category data by ID
    const getCategoryDataById = (categoryId) => {
        if (!loanCategories?.data?.loan_categories) return null;

        // Search in main categories
        for (const category of loanCategories.data.loan_categories) {
            if (category.id === categoryId) {
                return {
                    id: category.id,
                    name: category.name,
                    color: category.color || "#9e9e9e",
                    isSubcategory: false
                };
            }

            // Search in subcategories
            if (category.sub_categories?.length > 0) {
                for (const subCategory of category.sub_categories) {
                    if (subCategory.id === categoryId) {
                        return {
                            id: subCategory.id,
                            name: subCategory.name,
                            color: subCategory.color || "#9e9e9e",
                            parentColor: category.color || "#9e9e9e",
                            parentName: category.name,
                            isSubcategory: true
                        };
                    }
                }
            }
        }

        return null;
    };

    const handleModalCancel = () => {
        setOpenCategoryModal(false);
        // Reset to parent selected categories when canceling
        if (parentSelectedCategories.length > 0) {
            const categoryIds = parentSelectedCategories.map(cat => cat.id);
            setSelectedCategories(categoryIds);
            form.setFieldsValue({ categories: categoryIds });
        } else {
            setSelectedCategories([]);
            form.resetFields();
        }
    }

    const handleModalSubmit = () => {
        form.validateFields().then((values) => {
            console.log('values', values);
            console.log('selectedCategories', selectedCategories);
            
            // Map selected category IDs to full category data
            const selectedCategoryData = selectedCategories.map(categoryId => {
                return getCategoryDataById(categoryId);
            }).filter(category => category !== null); // Filter out any null values

            console.log('selectedCategoryData', selectedCategoryData);

            // Pass selected categories to parent component
            if (onCategoriesSelected) {
                onCategoriesSelected(selectedCategoryData);
            }
            
            // Close modal after successful submission
            handleModalCancel();
        });
    };
    const innerWidth = window.innerWidth

    return (
        <Modal
            title={'Select Category'}
            open={openCategoryModal}
            onCancel={handleModalCancel}
            onOk={handleModalSubmit}
            okText={"Select"}
            okButtonProps={{ 
                className: "bg-primary hover:bg-primary-dark",
                disabled: selectedCategories.length === 0
            }}
            className="categorySelect"
            destroyOnClose={true}
            centered
            closeIcon={
                <Button
                    shape="circle"
                    icon={<i className="icon-close before:!m-0 text-sm" />}
                />
            }
            width={innerWidth < 640  ? '90%' : '40%'}
        >
            <Form
                form={form}
                layout="vertical"
                name="videoForm"
                requiredMark={false}
            >
                <Form.Item
                    name="categories"
                    label={<Text type="secondary">Select Category</Text>}
                    rules={[
                        {
                            required: true,
                            message: "Please select at least one category",
                        },
                    ]}
                >
                    {treeData?.length > 0 ? (
                        <TreeSelect
                            size="large"
                            className="w-full bg-darkGray custom-tree-select rounded-lg"
                            value={selectedCategories}
                            onChange={(value) => {
                                setSelectedCategories(value);
                                form.setFieldsValue({ categories: value });
                            }}
                            treeData={treeData}
                            treeCheckable={true}
                            showCheckedStrategy={SHOW_PARENT}
                            placeholder="Select Category"
                            treeDefaultExpandAll
                            multiple
                            maxTagCount={3}
                            showSearch={true}
                            filterTreeNode={(input, node) => {
                                const title = node.title?.toLowerCase() || "";
                                return title.includes(input.toLowerCase());
                            }}
                            maxTagPlaceholder={(omittedValues) =>
                                `+ ${omittedValues.length} more`
                            }
                            dropdownClassName="dark-dropdown"
                            treeIcon
                            treeNodeLabelProp="title"
                            titleRender={titleRender}
                            popupClassName="dark-select-dropdown"
                            listHeight={300}
                            loading={loanCategoriesLoading}
                        />
                    ) : (
                        <TreeSelect
                            size="large"
                            className="w-full bg-darkGray custom-tree-select rounded-lg"
                            disabled={true}
                            placeholder="No categories found. Create one to select."
                            treeDefaultExpandAll
                            multiple
                            maxTagCount={3}
                            showSearch={true}
                            dropdownClassName="dark-dropdown"
                            treeIcon
                            treeNodeLabelProp="title"
                            popupClassName="dark-select-dropdown"
                            listHeight={300}
                            loading={loanCategoriesLoading}
                            suffixIcon={false}
                        />
                    )}
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default SelectCategory