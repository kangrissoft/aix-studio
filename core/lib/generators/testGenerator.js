const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');

/**
 * Test Generator for App Inventor Extensions
 * Creates unit tests for extension classes
 */
class TestGenerator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.verbose = options.verbose || false;
  }

  /**
   * Generate test class for extension
   * @param {string} extensionPath - Extension source file path
   * @param {string} testDir - Test directory path
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generation result
   */
  async generate(extensionPath, testDir, options = {}) {
    try {
      this.emit('start', { extensionPath, testDir });
      
      // Validate inputs
      if (!await fs.pathExists(extensionPath)) {
        throw new Error(`Extension file not found: ${extensionPath}`);
      }
      
      // Ensure test directory exists
      await fs.ensureDir(testDir);
      
      // Extract extension information
      const extensionInfo = await this.extractExtensionInfo(extensionPath);
      
      // Determine language
      const isKotlin = extensionPath.endsWith('.kt');
      
      // Generate test code
      const testCode = this.generateTestCode(extensionInfo, isKotlin, options);
      
      // Determine test file path
      const testFileName = isKotlin 
        ? `${extensionInfo.className}Test.kt` 
        : `${extensionInfo.className}Test.java`;
      const testFilePath = path.join(testDir, extensionInfo.packagePath, testFileName);
      
      // Ensure test package directory exists
      await fs.ensureDir(path.dirname(testFilePath));
      
      // Write test file
      await fs.writeFile(testFilePath, testCode, 'utf8');
      
      this.emit('complete', { extensionPath, testFilePath });
      
      return {
        success: true,
        extensionPath,
        testFilePath,
        extensionInfo,
        message: 'Test class generated successfully'
      };
    } catch (error) {
      this.emit('error', { extensionPath, testDir, error: error.message });
      throw new Error(`Failed to generate test: ${error.message}`);
    }
  }

  /**
   * Extract extension information from source file
   * @param {string} extensionPath - Extension source file path
   * @returns {Promise<Object>} - Extension information
   */
  async extractExtensionInfo(extensionPath) {
    const content = await fs.readFile(extensionPath, 'utf8');
    
    // Extract package name
    const packageMatch = content.match(/package\s+([^\s;]+)/);
    if (!packageMatch) {
      throw new Error('Package declaration not found in extension file');
    }
    
    const packageName = packageMatch[1];
    const packagePath = packageName.replace(/\./g, path.sep);
    
    // Extract class name
    const classMatch = content.match(/(?:^|\n)\s*(?:public\s+)?(?:class|object)\s+(\w+)/);
    if (!classMatch) {
      throw new Error('Class declaration not found in extension file');
    }
    
    const className = classMatch[1];
    
    // Extract methods, properties, and events
    const methods = this.extractMethods(content);
    const properties = this.extractProperties(content);
    const events = this.extractEvents(content);
    
    return {
      packageName,
      packagePath,
      className,
      methods,
      properties,
      events
    };
  }

  /**
   * Extract methods from source content
   * @param {string} content - Source content
   * @returns {Array} - Extracted methods
   */
  extractMethods(content) {
    const methods = [];
    const methodRegex = /@SimpleFunction(?:\([^)]*\))?\s+(?:public\s+)?(?:fun\s+)?(\w+)\s*\([^)]*\)(?:\s*:\s*\w+)?/g;
    let match;
    
    while ((match = methodRegex.exec(content)) !== null) {
      methods.push({
        name: match[1],
        position: match.index
      });
    }
    
    return methods;
  }

  /**
   * Extract properties from source content
   * @param {string} content - Source content
   * @returns {Array} - Extracted properties
   */
  extractProperties(content) {
    const properties = [];
    const propertyRegex = /@SimpleProperty(?:\([^)]*\))?\s+(?:public\s+)?(?:var\s+)?(\w+)/g;
    let match;
    
    while ((match = propertyRegex.exec(content)) !== null) {
      properties.push({
        name: match[1],
        position: match.index
      });
    }
    
    return properties;
  }

  /**
   * Extract events from source content
   * @param {string} content - Source content
   * @returns {Array} - Extracted events
   */
  extractEvents(content) {
    const events = [];
    const eventRegex = /@SimpleEvent(?:\([^)]*\))?\s+(?:public\s+)?(?:fun\s+)?(\w+)\s*\([^)]*\)/g;
    let match;
    
    while ((match = eventRegex.exec(content)) !== null) {
      events.push({
        name: match[1],
        position: match.index
      });
    }
    
    return events;
  }

  /**
   * Generate test code
   * @param {Object} extensionInfo - Extension information
   * @param {boolean} isKotlin - Whether to generate Kotlin code
   * @param {Object} options - Generation options
   * @returns {string} - Generated test code
   */
  generateTestCode(extensionInfo, isKotlin, options = {}) {
    if (isKotlin) {
      return this.generateKotlinTest(extensionInfo, options);
    } else {
      return this.generateJavaTest(extensionInfo, options);
    }
  }

  /**
   * Generate Java test class
   * @param {Object} extensionInfo - Extension information
   * @param {Object} options - Generation options
   * @returns {string} - Generated Java test code
   */
  generateJavaTest(extensionInfo, options = {}) {
    const { packageName, className, methods, properties, events } = extensionInfo;
    
    let testCode = `package ${packageName};

import static org.junit.Assert.*;
import org.junit.Test;
import org.junit.Before;
import org.junit.After;
`;

    // Add imports for extension class
    testCode += `import ${packageName}.${className};\n\n`;
    
    testCode += `/**
 * Unit tests for ${className} class.
 */\n`;
    testCode += `public class ${className}Test {\n\n`;
    
    testCode += `    private ${className} extension;\n\n`;
    
    testCode += `    @Before\n`;
    testCode += `    public void setUp() {\n`;
    testCode += `        // Note: In real tests, you would mock ComponentContainer\n`;
    testCode += `        extension = new ${className}(null);\n`;
    testCode += `    }\n\n`;
    
    testCode += `    @After\n`;
    testCode += `    public void tearDown() {\n`;
    testCode += `        extension = null;\n`;
    testCode += `    }\n\n`;
    
    testCode += `    @Test\n`;
    testCode += `    public void testInitialization() {\n`;
    testCode += `        assertNotNull("Extension should be created", extension);\n`;
    testCode += `    }\n\n`;
    
    // Generate tests for methods
    methods.forEach(method => {
      testCode += `    @Test\n`;
      testCode += `    public void test${method.name}() {\n`;
      testCode += `        // TODO: Add test for ${method.name}\n`;
      testCode += `        // Example:\n`;
      testCode += `        // Object result = extension.${method.name}();\n`;
      testCode += `        // assertNotNull(result);\n`;
      testCode += `    }\n\n`;
    });
    
    // Generate tests for properties
    properties.forEach(property => {
      testCode += `    @Test\n`;
      testCode += `    public void test${property.name}Property() {\n`;
      testCode += `        // TODO: Add test for ${property.name} property\n`;
      testCode += `        // Example:\n`;
      testCode += `        // Object value = extension.${property.name}();\n`;
      testCode += `        // assertNotNull(value);\n`;
      testCode += `    }\n\n`;
    });
    
    // Generate tests for events
    events.forEach(event => {
      testCode += `    @Test\n`;
      testCode += `    public void test${event.name}Event() {\n`;
      testCode += `        // TODO: Add test for ${event.name} event\n`;
      testCode += `        // This might require mocking EventDispatcher\n`;
      testCode += `    }\n\n`;
    });
    
    testCode += `}\n`;
    
    return testCode;
  }

  /**
   * Generate Kotlin test class
   * @param {Object} extensionInfo - Extension information
   * @param {Object} options - Generation options
   * @returns {string} - Generated Kotlin test code
   */
  generateKotlinTest(extensionInfo, options = {}) {
    const { packageName, className, methods, properties, events } = extensionInfo;
    
    let testCode = `package ${packageName}

import kotlin.test.*
`;

    // Add imports for extension class
    testCode += `import ${packageName}.${className}\n\n`;
    
    testCode += `/**
 * Unit tests for ${className} class.
 */\n`;
    testCode += `class ${className}Test {\n\n`;
    
    testCode += `    private lateinit var extension: ${className}\n\n`;
    
    testCode += `    @BeforeTest\n`;
    testCode += `    fun setUp() {\n`;
    testCode += `        // Note: In real tests, you would mock ComponentContainer\n`;
    testCode += `        extension = ${className}(null)\n`;
    testCode += `    }\n\n`;
    
    testCode += `    @AfterTest\n`;
    testCode += `    fun tearDown() {\n`;
    testCode += `        // Cleanup if needed\n`;
    testCode += `    }\n\n`;
    
    testCode += `    @Test\n`;
    testCode += `    fun testInitialization() {\n`;
    testCode += `        assertNotNull("Extension should be created", extension)\n`;
    testCode += `    }\n\n`;
    
    // Generate tests for methods
    methods.forEach(method => {
      testCode += `    @Test\n`;
      testCode += `    fun test${method.name}() {\n`;
      testCode += `        // TODO: Add test for ${method.name}\n`;
      testCode += `        // Example:\n`;
      testCode += `        // val result = extension.${method.name}()\n`;
      testCode += `        // assertNotNull(result)\n`;
      testCode += `    }\n\n`;
    });
    
    // Generate tests for properties
    properties.forEach(property => {
      testCode += `    @Test\n`;
      testCode += `    fun test${property.name}Property() {\n`;
      testCode += `        // TODO: Add test for ${property.name} property\n`;
      testCode += `        // Example:\n`;
      testCode += `        // val value = extension.${property.name}()\n`;
      testCode += `        // assertNotNull(value)\n`;
      testCode += `    }\n\n`;
    });
    
    // Generate tests for events
    events.forEach(event => {
      testCode += `    @Test\n`;
      testCode += `    fun test${event.name}Event() {\n`;
      testCode += `        // TODO: Add test for ${event.name} event\n`;
      testCode += `        // This might require mocking EventDispatcher\n`;
      testCode += `    }\n\n`;
    });
    
    testCode += `}\n`;
    
    return testCode;
  }

  /**
   * Generate specific test method
   * @param {string} extensionPath - Extension source file path
   * @param {string} testPath - Test file path
   * @param {string} methodName - Method name to test
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generation result
   */
  async generateTestMethod(extensionPath, testPath, methodName, options = {}) {
    try {
      this.emit('method-start', { extensionPath, testPath, methodName });
      
      // Validate inputs
      if (!await fs.pathExists(extensionPath)) {
        throw new Error(`Extension file not found: ${extensionPath}`);
      }
      
      if (!await fs.pathExists(testPath)) {
        throw new Error(`Test file not found: ${testPath}`);
      }
      
      // Extract method information
      const methodInfo = await this.extractMethodInfo(extensionPath, methodName);
      
      // Generate test method code
      const isKotlin = testPath.endsWith('.kt');
      const testMethodCode = this.generateTestMethodCode(methodInfo, isKotlin, options);
      
      // Insert test method into test file
      await this.insertTestMethod(testPath, testMethodCode);
      
      this.emit('method-complete', { extensionPath, testPath, methodName });
      
      return {
        success: true,
        extensionPath,
        testPath,
        methodName,
        methodInfo,
        message: 'Test method generated successfully'
      };
    } catch (error) {
      this.emit('method-error', { extensionPath, testPath, methodName, error: error.message });
      throw new Error(`Failed to generate test method: ${error.message}`);
    }
  }

  /**
   * Extract method information
   * @param {string} extensionPath - Extension source file path
   * @param {string} methodName - Method name
   * @returns {Promise<Object>} - Method information
   */
  async extractMethodInfo(extensionPath, methodName) {
    const content = await fs.readFile(extensionPath, 'utf8');
    
    // Find method declaration
    const methodPattern = new RegExp(
      `@SimpleFunction[^}]*${methodName}\\s*\\(([^)]*)\\)`, 
      's'
    );
    
    const match = content.match(methodPattern);
    if (!match) {
      throw new Error(`Method '${methodName}' not found in extension file`);
    }
    
    // Extract parameters
    const paramsString = match[1];
    const parameters = paramsString ? paramsString.split(',').map(param => {
      const [type, name] = param.trim().split(/\s+/).reverse();
      return { name, type };
    }) : [];
    
    return {
      name: methodName,
      parameters
    };
  }

  /**
   * Generate test method code
   * @param {Object} methodInfo - Method information
   * @param {boolean} isKotlin - Whether to generate Kotlin code
   * @param {Object} options - Generation options
   * @returns {string} - Generated test method code
   */
  generateTestMethodCode(methodInfo, isKotlin, options = {}) {
    const { name, parameters } = methodInfo;
    
    if (isKotlin) {
      return this.generateKotlinTestMethod(name, parameters, options);
    } else {
      return this.generateJavaTestMethod(name, parameters, options);
    }
  }

  /**
   * Generate Java test method
   * @param {string} methodName - Method name
   * @param {Array} parameters - Method parameters
   * @param {Object} options - Generation options
   * @returns {string} - Generated Java test method
   */
  generateJavaTestMethod(methodName, parameters, options = {}) {
    let testMethod = `    @Test\n`;
    testMethod += `    public void test${methodName}() {\n`;
    
    if (parameters.length > 0) {
      testMethod += `        // Setup test data\n`;
      parameters.forEach(param => {
        const defaultValue = this.getDefaultValue(param.type);
        testMethod += `        ${param.type} ${param.name} = ${defaultValue};\n`;
      });
      testMethod += `\n`;
    }
    
    testMethod += `        // Execute method\n`;
    if (parameters.length > 0) {
      const paramNames = parameters.map(p => p.name).join(', ');
      testMethod += `        Object result = extension.${methodName}(${paramNames});\n`;
    } else {
      testMethod += `        Object result = extension.${methodName}();\n`;
    }
    
    testMethod += `\n`;
    testMethod += `        // Verify result\n`;
    testMethod += `        // TODO: Add assertions based on expected behavior\n`;
    testMethod += `        // assertNotNull("Result should not be null", result);\n`;
    testMethod += `    }\n`;
    
    return testMethod;
  }

  /**
   * Generate Kotlin test method
   * @param {string} methodName - Method name
   * @param {Array} parameters - Method parameters
   * @param {Object} options - Generation options
   * @returns {string} - Generated Kotlin test method
   */
  generateKotlinTestMethod(methodName, parameters, options = {}) {
    let testMethod = `    @Test\n`;
    testMethod += `    fun test${methodName}() {\n`;
    
    if (parameters.length > 0) {
      testMethod += `        // Setup test data\n`;
      parameters.forEach(param => {
        const defaultValue = this.getDefaultValue(param.type);
        testMethod += `        val ${param.name}: ${param.type} = ${defaultValue}\n`;
      });
      testMethod += `\n`;
    }
    
    testMethod += `        // Execute method\n`;
    if (parameters.length > 0) {
      const paramNames = parameters.map(p => p.name).join(', ');
      testMethod += `        val result = extension.${methodName}(${paramNames})\n`;
    } else {
      testMethod += `        val result = extension.${methodName}()\n`;
    }
    
    testMethod += `\n`;
    testMethod += `        // Verify result\n`;
    testMethod += `        // TODO: Add assertions based on expected behavior\n`;
    testMethod += `        // assertNotNull("Result should not be null", result)\n`;
    testMethod += `    }\n`;
    
    return testMethod;
  }

  /**
   * Insert test method into test file
   * @param {string} testPath - Test file path
   * @param {string} testMethodCode - Test method code
   * @returns {Promise<void>}
   */
  async insertTestMethod(testPath, testMethodCode) {
    let content = await fs.readFile(testPath, 'utf8');
    
    // Find insertion point (before last closing brace)
    const lastBraceIndex = content.lastIndexOf('}');
    const insertPosition = lastBraceIndex > 0 ? lastBraceIndex : content.length;
    
    // Insert test method code
    const newContent = content.slice(0, insertPosition) + 
                      '\n' + testMethodCode + '\n' + 
                      content.slice(insertPosition);
    
    // Write updated content
    await fs.writeFile(testPath, newContent, 'utf8');
  }

  /**
   * Get default value for type
   * @param {string} type - Parameter type
   * @returns {string} - Default value
   */
  getDefaultValue(type) {
    switch (type.toLowerCase()) {
      case 'string':
        return '""';
      case 'int':
      case 'integer':
        return '0';
      case 'boolean':
        return 'false';
      case 'double':
      case 'float':
        return '0.0';
      case 'long':
        return '0L';
      default:
        return 'null';
    }
  }

  /**
   * Generate test suite for multiple extensions
   * @param {Array} extensionPaths - Array of extension file paths
   * @param {string} testDir - Test directory path
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generation result
   */
  async generateTestSuite(extensionPaths, testDir, options = {}) {
    try {
      this.emit('suite-start', { count: extensionPaths.length, testDir });
      
      const results = [];
      
      for (const extensionPath of extensionPaths) {
        try {
          const result = await this.generate(extensionPath, testDir, options);
          results.push({ ...result, success: true });
        } catch (error) {
          results.push({ 
            extensionPath, 
            success: false, 
            error: error.message 
          });
        }
      }
      
      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;
      
      this.emit('suite-complete', { successful, failed, testDir });
      
      return {
        success: true,
        results,
        successful,
        failed,
        total: results.length,
        message: `Generated tests for ${successful} of ${results.length} extensions`
      };
    } catch (error) {
      this.emit('suite-error', { error: error.message });
      throw new Error(`Failed to generate test suite: ${error.message}`);
    }
  }

  /**
   * List common test templates
   * @returns {Array} - Common test templates
   */
  listCommonTemplates() {
    return [
      {
        name: 'BasicTest',
        description: 'Basic initialization test',
        code: `    @Test
    public void testInitialization() {
        assertNotNull("Extension should be created", extension);
    }`
      },
      {
        name: 'MethodTest',
        description: 'Generic method test template',
        code: `    @Test
    public void testMethod() {
        // TODO: Add test implementation
        Object result = extension.method();
        assertNotNull(result);
    }`
      },
      {
        name: 'PropertyTest',
        description: 'Generic property test template',
        code: `    @Test
    public void testProperty() {
        // TODO: Add test implementation
        Object value = extension.property();
        assertNotNull(value);
    }`
      },
      {
        name: 'EventTest',
        description: 'Generic event test template',
        code: `    @Test
    public void testEvent() {
        // TODO: Add event testing implementation
        // This might require mocking
    }`
      }
    ];
  }

  /**
   * Generate test with custom template
   * @param {Object} template - Test template
   * @param {string} testPath - Test file path
   * @param {Object} variables - Template variables
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generation result
   */
  async generateFromTemplate(template, testPath, variables = {}, options = {}) {
    try {
      // Process template with variables
      let testCode = template.code;
      for (const [key, value] of Object.entries(variables)) {
        testCode = testCode.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
      
      // Insert test code into test file
      await this.insertTestMethod(testPath, testCode);
      
      return {
        success: true,
        template: template.name,
        testPath,
        message: 'Test generated from template successfully'
      };
    } catch (error) {
      throw new Error(`Failed to generate test from template: ${error.message}`);
    }
  }

  /**
   * Validate test file structure
   * @param {string} testPath - Test file path
   * @returns {Promise<Object>} - Validation result
   */
  async validateTest(testPath) {
    if (!await fs.pathExists(testPath)) {
      throw new Error(`Test file not found: ${testPath}`);
    }
    
    const content = await fs.readFile(testPath, 'utf8');
    
    const requiredElements = {
      imports: /import\s+.*junit/i.test(content),
      testClass: /class\s+\w+Test/i.test(content),
      setUpMethod: /@Before/i.test(content),
      tearDownMethod: /@After/i.test(content),
      testMethods: /@Test/i.test(content)
    };
    
    const missingElements = Object.entries(requiredElements)
      .filter(([key, present]) => !present)
      .map(([key]) => key);
    
    return {
      valid: missingElements.length === 0,
      missingElements,
      path: testPath
    };
  }

  /**
   * Create test configuration file
   * @param {string} projectPath - Project directory path
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} - Creation result
   */
  async createTestConfig(projectPath, options = {}) {
    const config = {
      testDir: 'test',
      buildDir: 'build/test',
      reportsDir: 'test-reports',
      coverage: {
        enabled: true,
        dir: 'coverage'
      },
      junit: {
        version: '4.13.2'
      },
      dependencies: [
        'junit:junit:4.13.2',
        'org.hamcrest:hamcrest:2.2'
      ],
      ...options
    };
    
    const configPath = path.join(projectPath, 'aix.test.json');
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    return {
      success: true,
      path: configPath,
      config,
      message: 'Test configuration created successfully'
    };
  }
}

module.exports = TestGenerator;