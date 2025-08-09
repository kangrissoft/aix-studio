import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
  Card,
  Typography
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      // Mock data for now
      const mockProjects = [
        {
          id: 1,
          name: 'My Sensor Extension',
          language: 'Java',
          template: 'Sensor Extension',
          createdAt: '2024-01-15',
          lastModified: '2024-01-20'
        },
        {
          id: 2,
          name: 'Utility Helper',
          language: 'Kotlin',
          template: 'Component Extension',
          createdAt: '2024-01-10',
          lastModified: '2024-01-18'
        }
      ];
      setProjects(mockProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleCreateProject = async (values) => {
    try {
      // Call API to create project
      console.log('Creating project:', values);
      setIsModalVisible(false);
      form.resetFields();
      fetchProjects(); // Refresh list
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Language',
      dataIndex: 'language',
      key: 'language',
    },
    {
      title: 'Template',
      dataIndex: 'template',
      key: 'template',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Last Modified',
      dataIndex: 'lastModified',
      key: 'lastModified',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} href={`/editor?project=${record.id}`}>
            Edit
          </Button>
          <Button icon={<DeleteOutlined />} danger>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Projects</Title>
      
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Create New Project
          </Button>
        </div>
        
        <Table 
          dataSource={projects} 
          columns={columns} 
          rowKey="id"
        />
      </Card>
      
      <Modal
        title="Create New Project"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateProject}
        >
          <Form.Item
            name="name"
            label="Project Name"
            rules={[{ required: true, message: 'Please input project name!' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="language"
            label="Language"
            rules={[{ required: true, message: 'Please select language!' }]}
          >
            <Select>
              <Option value="java">Java</Option>
              <Option value="kotlin">Kotlin</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="template"
            label="Template"
            rules={[{ required: true, message: 'Please select template!' }]}
          >
            <Select>
              <Option value="component">Component Extension</Option>
              <Option value="sensor">Sensor Extension</Option>
              <Option value="ui">UI Extension</Option>
              <Option value="util">Utility Extension</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Create Project
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects;