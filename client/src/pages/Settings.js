import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography,
  Form,
  Input,
  Select,
  Switch,
  Divider,
  Alert
} from 'antd';
import { 
  SaveOutlined, 
  SyncOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const Settings = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const onFinish = (values) => {
    setSaving(true);
    // Simulate save
    setTimeout(() => {
      setSaving(false);
      console.log('Settings saved:', values);
    }, 1000);
  };

  return (
    <div>
      <Title level={2}>Settings</Title>
      
      <Card title="General Settings">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            theme: 'light',
            language: 'en',
            autoSave: true,
            notifications: true
          }}
        >
          <Form.Item
            name="theme"
            label="Theme"
          >
            <Select>
              <Option value="light">Light</Option>
              <Option value="dark">Dark</Option>
              <Option value="auto">Auto</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="language"
            label="Language"
          >
            <Select>
              <Option value="en">English</Option>
              <Option value="id">Indonesian</Option>
              <Option value="es">Spanish</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="autoSave"
            label="Auto Save"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Form.Item
            name="notifications"
            label="Notifications"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={saving}
              >
                Save Settings
              </Button>
              <Button icon={<SyncOutlined />}>Reset to Defaults</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
      
      <Divider />
      
      <Card title="Development Environment">
        <div style={{ marginBottom: '16px' }}>
          <Text strong>Java Path:</Text>
          <Input defaultValue="/usr/lib/jvm/java-11-openjdk" />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <Text strong>Ant Path:</Text>
          <Input defaultValue="/usr/share/ant" />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <Text strong>Projects Directory:</Text>
          <Input defaultValue="./projects" />
        </div>
        
        <Button>Validate Environment</Button>
      </Card>
      
      <Divider />
      
      <Card title="Account">
        <Alert
          message="Account Information"
          description="You are currently using AIX Studio as a local installation. No account required."
          type="info"
          showIcon
        />
      </Card>
    </div>
  );
};

export default Settings;