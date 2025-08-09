import React from 'react';
import { Card, Row, Col, Button, Statistic, Typography } from 'antd';
import { 
  PlusOutlined, 
  ProjectOutlined, 
  BuildOutlined, 
  CloudDownloadOutlined 
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const Home = () => {
  return (
    <div>
      <Title level={2}>Welcome to AIX Studio</Title>
      <Paragraph>Web-based IDE for creating App Inventor Extensions</Paragraph>
      
      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Projects"
              value={12}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Extensions Built"
              value={48}
              prefix={<BuildOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Templates"
              value={8}
              prefix={<CloudDownloadOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="Quick Actions">
            <Button type="primary" icon={<PlusOutlined />} size="large" href="/projects">
              Create New Project
            </Button>
            <Button style={{ marginLeft: '12px' }} size="large" href="/templates">
              Browse Templates
            </Button>
            <Button style={{ marginLeft: '12px' }} size="large" href="/editor">
              Open Editor
            </Button>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col span={12}>
          <Card title="Recent Projects">
            <ul>
              <li>My Sensor Extension</li>
              <li>Utility Helper</li>
              <li>Firebase Integration</li>
            </ul>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Getting Started">
            <ol>
              <li>Create a new project or use a template</li>
              <li>Write your extension code in the editor</li>
              <li>Build and test your extension</li>
              <li>Download the .aix file for App Inventor</li>
            </ol>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;