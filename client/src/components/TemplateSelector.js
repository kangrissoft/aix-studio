import React, { useState } from 'react';
import { 
  AppstoreOutlined, 
  PlusOutlined,
  CloudDownloadOutlined,
  StarOutlined
} from '@ant-design/icons';
import { 
  Card, 
  Button, 
  Space, 
  Input,
  List,
  Tag,
  Modal,
  Form,
  Select,
  message
} from 'antd';

const { Option } = Select;

const TemplateSelector = ({ 
  onUseTemplate,
  onInstallTemplate,
  initialTemplates = []
}) => {
  const [templates, setTemplates] = useState(initialTemplates);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [form] = Form.useForm();

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    if (template.requiresSetup) {
      setModalVisible(true);
    } else {
      onUseTemplate(template);
      message.success(`Using template: ${template.name}`);
    }
  };

  const handleInstallTemplate = () => {
    const newTemplate = {
      id: Date.now(),
      name: 'Custom Template',
      description: 'A custom template created by user',
      language: 'java',
      category: 'Custom',
      author: 'You',
      version: '1.0.0',
      downloads: 0,
      featured: false
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    onInstallTemplate(newTemplate);
    message.success('Template installed successfully');
  };

  const setupTemplate = (values) => {
    if (selectedTemplate) {
      onUseTemplate({
        ...selectedTemplate,
        setup: values
      });
      setModalVisible(false);
      message.success(`Template ${selectedTemplate.name} configured successfully`);
    }
  };

  const categories = ['All', 'Component', 'Sensor', 'UI', 'Utility', 'Custom'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Input.Search
              placeholder="Search templates..."
              style={{ width: 300 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<AppstoreOutlined />}
            />
            
            <Button 
              icon={<PlusOutlined />} 
              type="primary"
              onClick={handleInstallTemplate}
            >
              Install Template
            </Button>
            
            <Button 
              icon={<CloudDownloadOutlined />} 
            >
              Browse More
            </Button>
          </Space>
          
          <Space>
            {categories.map(category => (
              <Tag.CheckableTag key={category} checked={category === 'All'}>
                {category}
              </Tag.CheckableTag>
            ))}
          </Space>
        </Space>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={filteredTemplates}
          renderItem={item => (
            <List.Item>
              <Card 
                title={
                  <Space>
                    {item.name}
                    {item.featured && <StarOutlined style={{ color: '#ffd700' }} />}
                  </Space>
                }
                extra={<Tag color={item.language === 'Java' ? 'blue' : 'purple'}>{item.language}</Tag>}
                actions={[
                  <Button 
                    type="primary" 
                    icon={<AppstoreOutlined />}
                    size="small"
                    onClick={() => handleUseTemplate(item)}
                  >
                    Use Template
                  </Button>
                ]}
              >
                <p style={{ color: '#666' }}>{item.description}</p>
                
                <div style={{ marginTop: '16px' }}>
                  <Space>
                    <Tag color="green">Category: {item.category}</Tag>
                    <Tag>Version: {item.version}</Tag>
                    <Tag>Downloads: {item.downloads}</Tag>
                  </Space>
                </div>
                
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    Author: {item.author}
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </div>
      
      <Modal
        title={`Configure ${selectedTemplate?.name}`}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={setupTemplate}
        >
          <Form.Item
            name="projectName"
            label="Project Name"
            rules={[{ required: true, message: 'Please input project name!' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="packageName"
            label="Package Name"
            rules={[{ required: true, message: 'Please input package name!' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="className"
            label="Class Name"
            rules={[{ required: true, message: 'Please input class name!' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Project
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TemplateSelector;