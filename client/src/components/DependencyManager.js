import React, { useState } from 'react';
import { 
  CloudDownloadOutlined, 
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { 
  Button, 
  Space, 
  Input,
  Table,
  Tag,
  Modal,
  Form,
  Select,
  message
} from 'antd';

const { Option } = Select;

const DependencyManager = ({ 
  onAddDependency,
  onRemoveDependency,
  onSearchDependencies,
  initialDependencies = []
}) => {
  const [dependencies, setDependencies] = useState(initialDependencies);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [form] = Form.useForm();

  const handleSearch = async (searchTerm) => {
    try {
      // Simulate search
      const mockResults = [
        { id: 1, name: 'gson', version: '2.10.1', group: 'com.google.code.gson', description: 'JSON library' },
        { id: 2, name: 'retrofit', version: '2.9.0', group: 'com.squareup.retrofit2', description: 'HTTP client' },
        { id: 3, name: 'commons-lang3', version: '3.12.0', group: 'org.apache.commons', description: 'Utility library' }
      ];
      
      setSearchResults(mockResults);
      setSearchVisible(true);
      
      onSearchDependencies(searchTerm);
    } catch (error) {
      message.error('Search failed');
    }
  };

  const addDependency = async (values) => {
    try {
      const newDependency = {
        id: Date.now(),
        name: values.name,
        version: values.version,
        group: 'com.example',
        status: 'installed',
        size: '2.4 MB'
      };
      
      setDependencies(prev => [...prev, newDependency]);
      setSearchVisible(false);
      form.resetFields();
      
      onAddDependency(newDependency);
      message.success('Dependency added successfully');
    } catch (error) {
      message.error('Failed to add dependency');
    }
  };

  const removeDependency = (depId) => {
    setDependencies(prev => prev.filter(dep => dep.id !== depId));
    onRemoveDependency(depId);
    message.success('Dependency removed');
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div><strong>{text}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.group}</div>
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
      ),
    }
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
        <Space>
          <Button 
            icon={<PlusOutlined />} 
            type="primary"
            onClick={() => setSearchVisible(true)}
          >
            Add Dependency
          </Button>
          
          <Input.Search
            placeholder="Search Maven Central..."
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
            onSearch={handleSearch}
          />
          
          <Button 
            icon={<CloudDownloadOutlined />} 
          >
            Update All
          </Button>
        </Space>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Table 
          dataSource={dependencies} 
          columns={columns} 
          rowKey="id"
          pagination={{
            pageSize: 10
          }}
        />
      </div>
      
      <Modal
        title="Add Dependency"
        visible={searchVisible}
        onCancel={() => {
          setSearchVisible(false);
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
            <Button type="primary" htmlType="submit" block>
              Add Dependency
            </Button>
          </Form.Item>
        </Form>
        
        {searchResults.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h4>Search Results</h4>
            {searchResults.map(result => (
              <div 
                key={result.id}
                style={{ 
                  padding: '8px', 
                  border: '1px solid #f0f0f0', 
                  marginBottom: '8px',
                  borderRadius: '4px'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{result.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {result.group}:{result.version}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {result.description}
                </div>
                <Button 
                  size="small" 
                  style={{ marginTop: '8px' }}
                  onClick={() => {
                    form.setFieldsValue({
                      name: result.name,
                      version: result.version
                    });
                  }}
                >
                  Use This
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DependencyManager;