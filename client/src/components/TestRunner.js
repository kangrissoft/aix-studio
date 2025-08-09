import React, { useState } from 'react';
import { 
  PlayCircleOutlined, 
  BugOutlined,
  FileSearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { 
  Button, 
  Space, 
  Switch,
  Progress,
  Table,
  Tag,
  Alert,
  Collapse,
  message
} from 'antd';

const { Panel } = Collapse;

const TestRunner = ({ 
  onRunTests,
  onDebugTest,
  initialTests = []
}) => {
  const [tests, setTests] = useState(initialTests);
  const [isRunning, setIsRunning] = useState(false);
  const [coverageEnabled, setCoverageEnabled] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [coverage, setCoverage] = useState(null);

  const runTests = async () => {
    setIsRunning(true);
    
    try {
      // Simulate test run
      const mockResults = {
        passed: 8,
        failed: 1,
        total: 9,
        duration: 2450
      };
      
      const mockTests = [
        { id: 1, name: 'MyExtensionTest.greetTest', status: 'passed', time: '0.005s' },
        { id: 2, name: 'MyExtensionTest.calculateTest', status: 'passed', time: '0.012s' },
        { id: 3, name: 'MyExtensionTest.errorTest', status: 'failed', time: '0.008s' }
      ];
      
      const mockCoverage = {
        lineCoverage: 85,
        branchCoverage: 78,
        methodCoverage: 92
      };
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setTestResults(mockResults);
      setTests(mockTests);
      setCoverage(mockCoverage);
      setIsRunning(false);
      
      onRunTests(mockResults);
      
      message.success(`Tests completed: ${mockResults.passed} passed, ${mockResults.failed} failed`);
    } catch (error) {
      setIsRunning(false);
      message.error('Test run failed');
    }
  };

  const debugTest = (testId) => {
    onDebugTest(testId);
    message.info('Debugging test...');
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
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<BugOutlined />} 
            size="small"
            onClick={() => debugTest(record.id)}
          >
            Debug
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
            icon={<PlayCircleOutlined />} 
            type="primary" 
            onClick={runTests}
            loading={isRunning}
            disabled={isRunning}
          >
            Run Tests
          </Button>
          
          <Button 
            icon={<ReloadOutlined />} 
            onClick={runTests}
          >
            Re-run
          </Button>
          
          <Switch
            checkedChildren="Coverage ON"
            unCheckedChildren="Coverage OFF"
            checked={coverageEnabled}
            onChange={setCoverageEnabled}
          />
          
          {testResults && (
            <Space>
              <Tag color="success">Passed: {testResults.passed}</Tag>
              <Tag color="error">Failed: {testResults.failed}</Tag>
              <Tag color="processing">Duration: {(testResults.duration / 1000).toFixed(2)}s</Tag>
            </Space>
          )}
        </Space>
      </div>
      
      {testResults && (
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Alert
            message={`${testResults.passed} tests passed, ${testResults.failed} failed`}
            type={testResults.failed > 0 ? 'error' : 'success'}
            showIcon
          />
          
          {coverage && coverageEnabled && (
            <div style={{ marginTop: '16px' }}>
              <Collapse bordered={false} defaultActiveKey={['1']}>
                <Panel header="Coverage Report" key="1">
                  <div style={{ marginBottom: '16px' }}>
                    <span>Line Coverage: </span>
                    <Progress percent={coverage.lineCoverage} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <span>Branch Coverage: </span>
                    <Progress percent={coverage.branchCoverage} />
                  </div>
                  <div>
                    <span>Method Coverage: </span>
                    <Progress percent={coverage.methodCoverage} />
                  </div>
                </Panel>
              </Collapse>
            </div>
          )}
        </div>
      )}
      
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Table 
          dataSource={tests} 
          columns={columns} 
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </div>
      
      <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
        <Space>
          <Button 
            icon={<FileSearchOutlined />} 
            disabled={!testResults}
          >
            View Report
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default TestRunner;