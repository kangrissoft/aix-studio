import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography,
  Progress,
  Table,
  Tag,
  Alert,
  Row,
  Col,
  Switch,
  Divider
} from 'antd';
import { 
  PlayCircleOutlined, 
  BugOutlined, 
  FileSearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const Testing = () => {
  const [tests, setTests] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [coverageEnabled, setCoverageEnabled] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setIsRunning(true);
    
    try {
      // Mock test data for demo
      setTestResults({
        passed: 8,
        failed: 1,
        total: 9
      });
      
      setTests([
        { id: 1, name: 'MyExtensionTest.greetTest', status: 'passed', time: '0.005s' },
        { id: 2, name: 'MyExtensionTest.calculateTest', status: 'passed', time: '0.012s' },
        { id: 3, name: 'MyExtensionTest.errorTest', status: 'failed', time: '0.008s' }
      ]);
    } catch (error) {
      console.error('Test run failed:', error);
    } finally {
      setLoading(false);
      setIsRunning(false);
    }
  };

  const columns = [
    {
      title: 'Test Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'passed' ? 'success' : 'error'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
    }
  ];

  return (
    <div>
      <Title level={2}>Testing</Title>
      
      <Row gutter={16}>
        <Col span={16}>
          <Card title="Test Runner">
            <Space style={{ marginBottom: '16px' }}>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={runTests}
                loading={loading}
                disabled={isRunning}
              >
                Run Tests
              </Button>
              <Button icon={<ReloadOutlined />} onClick={runTests}>
                Re-run
              </Button>
              <Switch
                checkedChildren="Coverage ON"
                unCheckedChildren="Coverage OFF"
                checked={coverageEnabled}
                onChange={setCoverageEnabled}
              />
            </Space>
            
            {testResults && (
              <Alert
                message={`${testResults.passed} tests passed, ${testResults.failed} failed`}
                type={testResults.failed > 0 ? 'error' : 'success'}
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}
            
            <Table 
              dataSource={tests} 
              columns={columns} 
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title="Test Configuration">
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Test Framework:</Text>
              <p>JUnit 4.13.2</p>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Coverage Tool:</Text>
              <p>JaCoCo</p>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Test Directory:</Text>
              <p>/test</p>
            </div>
            
            <Button 
              icon={<BugOutlined />} 
              block
            >
              Debug Test
            </Button>
          </Card>
          
          <Card title="Coverage Report" style={{ marginTop: '16px' }}>
            <Progress 
              type="circle" 
              percent={85} 
              format={(percent) => `${percent}% Line Coverage`} 
            />
            
            <div style={{ marginTop: '16px' }}>
              <Text strong>Branch Coverage:</Text>
              <Progress percent={78} />
            </div>
            
            <div style={{ marginTop: '8px' }}>
              <Text strong>Method Coverage:</Text>
              <Progress percent={92} />
            </div>
          </Card>
        </Col>
      </Row>
      
      <Divider />
      
      <Card title="Test Files">
        <Table 
          dataSource={[
            { id: 1, name: 'MyExtensionTest.java', path: 'test/com/example/MyExtensionTest.java', lastModified: '2024-01-20' },
            { id: 2, name: 'UtilsTest.java', path: 'test/com/example/UtilsTest.java', lastModified: '2024-01-19' }
          ]}
          columns={[
            { title: 'File', dataIndex: 'name', key: 'name' },
            { title: 'Path', dataIndex: 'path', key: 'path' },
            { title: 'Last Modified', dataIndex: 'lastModified', key: 'lastModified' }
          ]}
          rowKey="id"
          size="small"
        />
      </Card>
    </div>
  );
};

export default Testing;