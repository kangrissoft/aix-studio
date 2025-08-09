import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography,
  Tabs,
  Tree,
  Input,
  Divider,
  Alert,
  Row,
  Col
} from 'antd';
import { 
  ReadOutlined, 
  FileSearchOutlined, 
  DownloadOutlined,
  EyeOutlined,
  SearchOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;

const Documentation = () => {
  const [docs, setDocs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [searchText, setSearchText] = useState('');

  const generateDocs = async () => {
    setLoading(true);
    try {
      // Mock docs data
      setDocs({
        classes: [
          {
            name: 'MyExtension',
            package: 'com.example',
            methods: [
              { name: 'Greet', returnType: 'String', params: 'name: String' },
              { name: 'CalculateSum', returnType: 'int', params: 'a: int, b: int' }
            ],
            properties: [
              { name: 'SampleProperty', type: 'String' }
            ]
          }
        ]
      });
    } catch (error) {
      console.error('Docs generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const previewDocs = async () => {
    try {
      setPreviewUrl('/docs/preview');
      window.open('/docs/preview', '_blank');
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  const downloadDocs = async () => {
    try {
      console.log('Downloading documentation...');
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const treeData = [
    {
      title: 'Documentation',
      key: '0-0',
      children: [
        {
          title: 'API Reference',
          key: '0-0-0',
          children: [
            { title: 'MyExtension.html', key: '0-0-0-0' },
            { title: 'Utils.html', key: '0-0-0-1' }
          ]
        },
        {
          title: 'Guides',
          key: '0-0-1',
          children: [
            { title: 'getting-started.html', key: '0-0-1-0' },
            { title: 'best-practices.html', key: '0-0-1-1' }
          ]
        }
      ]
    }
  ];

  return (
    <div>
      <Title level={2}>Documentation</Title>
      
      <Row gutter={16}>
        <Col span={18}>
          <Card 
            title="API Documentation Generator"
            extra={
              <Space>
                <Button 
                  type="primary" 
                  icon={<ReadOutlined />}
                  onClick={generateDocs}
                  loading={loading}
                >
                  Generate Docs
                </Button>
                <Button 
                  icon={<EyeOutlined />}
                  onClick={previewDocs}
                  disabled={!docs}
                >
                  Preview
                </Button>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={downloadDocs}
                  disabled={!docs}
                >
                  Download
                </Button>
              </Space>
            }
          >
            {docs ? (
              <Tabs defaultActiveKey="1">
                <TabPane tab="Classes" key="1">
                  {docs.classes.map((cls, index) => (
                    <Card 
                      title={`${cls.name} (${cls.package})`} 
                      size="small" 
                      key={index}
                      style={{ marginBottom: '16px' }}
                    >
                      <Text strong>Methods:</Text>
                      <ul>
                        {cls.methods.map((method, i) => (
                          <li key={i}>
                            <code>{method.returnType} {method.name}({method.params})</code>
                          </li>
                        ))}
                      </ul>
                      
                      <Text strong>Properties:</Text>
                      <ul>
                        {cls.properties.map((prop, i) => (
                          <li key={i}>
                            <code>{prop.type} {prop.name}</code>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}
                </TabPane>
                
                <TabPane tab="Search" key="2">
                  <Search
                    placeholder="Search documentation..."
                    enterButton={<SearchOutlined />}
                    size="large"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onSearch={(value) => console.log('Search:', value)}
                    style={{ marginBottom: '16px' }}
                  />
                  
                  <Alert
                    message="Search results will appear here"
                    description="Enter a method name, class name, or keyword to search documentation"
                    type="info"
                  />
                </TabPane>
              </Tabs>
            ) : (
              <Alert
                message="No documentation generated yet"
                description="Click 'Generate Docs' to create API documentation for your extension"
                type="info"
                showIcon
              />
            )}
          </Card>
        </Col>
        
        <Col span={6}>
          <Card title="Documentation Files">
            <Tree
              treeData={treeData}
              defaultExpandedKeys={['0-0', '0-0-0', '0-0-1']}
              onSelect={(selectedKeys) => console.log('Selected:', selectedKeys)}
            />
          </Card>
          
          <Card title="Export Options" style={{ marginTop: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block icon={<FileSearchOutlined />}>
                HTML Format
              </Button>
              <Button block icon={<FileSearchOutlined />}>
                Markdown
              </Button>
              <Button block icon={<FileSearchOutlined />}>
                PDF
              </Button>
              <Button block icon={<FileSearchOutlined />}>
                JSON
              </Button>
            </Space>
          </Card>
          
          <Card title="Statistics" style={{ marginTop: '16px' }}>
            <div>
              <Text strong>Classes:</Text> 1
            </div>
            <div>
              <Text strong>Methods:</Text> 5
            </div>
            <div>
              <Text strong>Properties:</Text> 2
            </div>
            <div>
              <Text strong>Events:</Text> 1
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Documentation;