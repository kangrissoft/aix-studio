import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography,
  Table,
  Input,
  Select,
  Modal,
  Form,
  Alert,
  Tag,
  Divider,
  Row,
  Col
} from 'antd';
import { 
  DeploymentUnitOutlined, 
  PlusOutlined, 
  DeleteOutlined,
  SearchOutlined,
  DownloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const Dependencies = () => {
  const [dependencies, setDependencies] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDependencies();
  }, []);

  const loadDependencies = async () => {
    try {
      // Mock data
      setDependencies([
        { 
          id: 1, 
          name: 'appinventor-components', 
          version: '1.0.0', 
          group: 'com.google.appinventor', 
          status: 'installed',
          size: '2.4 MB'
        },
        { 
          id: 2, 
          name: 'gson', 
          version: '2.10.1', 
          group: 'com.google.code.gson', 
          status: 'installed',
          size: '450 KB'
        },
        { 
          id: 3, 
          name: 'commons-lang3', 
          version: '3.12.0', 
          group: 'org.apache.commons', 
          status: 'installed',
          size: '578 KB'
        }
      ]);
    } catch (error) {
      console.error('Failed to load dependencies:', error);
    }
  };

  const addDependency = async (values) => {
    setLoading(true);
    try {
      setIsModalVisible(false);
      form.resetFields();
      loadDependencies();
    } catch (error) {
      console.error('Failed to add dependency:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeDependency = async (depId) => {
    try {
      loadDependencies();
    } catch (error) {
      console.error('Failed to remove dependency:', error);
    }
  };

  const searchDependencies = async (searchTerm) => {
    setSearchText(searchTerm);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.group}
          </Text>
        </div>
      )
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'installed' ? 'success' : 'warning'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<DeleteOutlined />} 
            danger 
            size="small"
            onClick={() => removeDependency(record.id)}
          >
            Remove
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Dependencies</Title>
      
      <Row gutter={16}>
        <Col span={18}>
          <Card 
            title="Installed Dependencies"
            extra={
              <Space>
                <Search
                  placeholder="Search dependencies..."
                  onSearch={searchDependencies}
                  style={{ width: 200 }}
                  allowClear
                />
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setIsModalVisible(true)}
                >
                  Add Dependency
                </Button>
              </Space>
            }
          >
            <Table 
              dataSource={dependencies} 
              columns={columns} 
              rowKey="id"
              pagination={{
                pageSize: 10
              }}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card title="Maven Central">
            <Input 
              placeholder="Search Maven Central..."
              prefix={<SearchOutlined />}
              style={{ marginBottom: '16px' }}
            />
            
            <Alert
              message="Popular Libraries"
              description={
                <div>
                  <Tag color="blue" style={{ marginBottom: '4px' }}>gson</Tag>
                  <Tag color="blue" style={{ marginBottom: '4px' }}>retrofit</Tag>
                  <Tag color="blue" style={{ marginBottom: '4px' }}>commons-lang3</Tag>
                  <Tag color="blue" style={{ marginBottom: '4px' }}>okhttp</Tag>
                </div>
              }
              type="info"
              style={{ marginBottom: '16px' }}
            />
            
            <Button 
              icon={<DownloadOutlined />} 
              block
            >
              Download Selected
            </Button>
          </Card>
          
          <Card title="Statistics" style={{ marginTop: '16px' }}>
            <div>
              <Text strong>Total Dependencies:</Text> {dependencies.length}
            </div>
            <div>
              <Text strong>Total Size:</Text> 3.4 MB
            </div>
            <div>
              <Text strong>Updates Available:</Text> 1
            </div>
          </Card>
          
          <Card title="Actions" style={{ marginTop: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block>Update All</Button>
              <Button block>Check for Updates</Button>
              <Button block>Export Dependencies</Button>
              <Button block>Import Dependencies</Button>
            </Space>
          </Card>
        </Col>
      </Row>
      
      <Divider />
      
      <Card title="Dependency Management">
        <Alert
          message="Dependency Management"
          description="Add, remove, and manage your project dependencies from Maven Central and other repositories."
          type="info"
          showIcon
        />
      </Card>
      
      <Modal
        title="Add Dependency"
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={addDependency}
        >
          <Form.Item
            name="name"
            label="Dependency Name"
            rules={[{ required: true, message: 'Please input dependency name!' }]}
          >
            <Input placeholder="e.g., gson, retrofit, commons-lang3" />
          </Form.Item>
          
          <Form.Item
            name="version"
            label="Version"
            rules={[{ required: true, message: 'Please input version!' }]}
          >
            <Input placeholder="e.g., 2.10.1, latest" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Add Dependency
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Dependencies;