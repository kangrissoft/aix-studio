import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography,
  Progress,
  Alert,
  List,
  Divider
} from 'antd';
import { 
  BuildOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const Builder = () => {
  const [building, setBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildResult, setBuildResult] = useState(null);

  const startBuild = () => {
    setBuilding(true);
    setBuildProgress(0);
    setBuildResult(null);
    
    // Simulate build process
    const interval = setInterval(() => {
      setBuildProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setBuilding(false);
          setBuildResult({
            success: true,
            message: 'Build completed successfully!',
            outputPath: 'dist/my-extension.aix',
            fileSize: '2.4 MB'
          });
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const cleanBuild = () => {
    setBuildResult({
      success: true,
      message: 'Build directory cleaned successfully!',
      outputPath: null
    });
  };

  return (
    <div>
      <Title level={2}>Builder</Title>
      
      <Card title="Build Configuration">
        <Space>
          <Button 
            type="primary" 
            icon={<BuildOutlined />}
            onClick={startBuild}
            loading={building}
            disabled={building}
          >
            Build Extension
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={cleanBuild}
          >
            Clean Build
          </Button>
        </Space>
        
        {building && (
          <div style={{ marginTop: '24px' }}>
            <Progress 
              percent={buildProgress} 
              status="active" 
              format={(percent) => `${percent}% Building`}
            />
            <Text type="secondary">Compiling sources and packaging extension...</Text>
          </div>
        )}
        
        {buildResult && (
          <Alert
            message={buildResult.success ? "Success" : "Error"}
            description={buildResult.message}
            type={buildResult.success ? "success" : "error"}
            showIcon
            style={{ marginTop: '24px' }}
          />
        )}
      </Card>
      
      <Divider />
      
      <Card title="Build History">
        <List
          dataSource={[
            { id: 1, date: '2024-01-20 14:30', status: 'success', output: 'dist/my-extension.aix' },
            { id: 2, date: '2024-01-20 10:15', status: 'success', output: 'dist/my-extension.aix' },
            { id: 3, date: '2024-01-19 16:45', status: 'failed', output: null }
          ]}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space>
                    {item.status === 'success' ? 
                      <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
                      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                    }
                    <Text>{item.date}</Text>
                  </Space>
                }
                description={item.output || 'Build failed'}
              />
              {item.output && (
                <Button size="small">Download</Button>
              )}
            </List.Item>
          )}
        />
      </Card>
      
      <Card title="Build Settings" style={{ marginTop: '24px' }}>
        <div>
          <Text strong>Java Version:</Text> 11
        </div>
        <div>
          <Text strong>Target SDK:</Text> Android API 28
        </div>
        <div>
          <Text strong>Optimization:</Text> Enabled
        </div>
        <div>
          <Text strong>Debug Mode:</Text> Disabled
        </div>
      </Card>
    </div>
  );
};

export default Builder;