const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Test Builder for App Inventor Extensions
 * Handles unit testing and coverage analysis
 */
class TestBuilder {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.coverageEnabled = options.coverage || false;
  }

  /**
   * Run tests for extension
   * @param {string} projectPath - Path to project directory
   * @param {Object} options - Test options
   * @returns {Promise<Object>} - Test result
   */
  async runTests(projectPath, options = {}) {
    try {
      // Validate test environment
      await this.validateTestEnvironment(projectPath);
      
      // Initialize test directories
      await this.initializeTestDirs(projectPath);
      
      // Compile test sources
      await this.compileTests(projectPath);
      
      // Run tests
      const testResult = await this.executeTests(projectPath, options);
      
      // Generate coverage report if enabled
      let coverageResult = null;
      if (this.coverageEnabled || options.coverage) {
        coverageResult = await this.generateCoverageReport(projectPath);
      }
      
      return {
        success: testResult.success,
        tests: testResult,
        coverage: coverageResult,
        message: testResult.success ? 'Tests completed successfully' : 'Tests failed'
      };
    } catch (error) {
      throw new Error(`Test execution failed: ${error.message}`);
    }
  }

  /**
   * Validate test environment
   * @param {string} projectPath - Path to project
   * @returns {Promise<boolean>} - True if valid
   */
  async validateTestEnvironment(projectPath) {
    const testDir = path.join(projectPath, 'test');
    if (!await fs.pathExists(testDir)) {
      throw new Error('Test directory (test/) not found');
    }
    
    const buildFile = path.join(projectPath, 'build.xml');
    if (!await fs.pathExists(buildFile)) {
      throw new Error('Build file (build.xml) not found');
    }
    
    // Check for test dependencies
    const libsDir = path.join(projectPath, 'libs');
    if (await fs.pathExists(libsDir)) {
      const libFiles = await fs.readdir(libsDir);
      const hasJUnit = libFiles.some(file => file.includes('junit'));
      const hasHamcrest = libFiles.some(file => file.includes('hamcrest'));
      
      if (!hasJUnit) {
        console.warn('Warning: JUnit library not found in libs/ directory');
      }
      if (!hasHamcrest) {
        console.warn('Warning: Hamcrest library not found in libs/ directory');
      }
    }
    
    return true;
  }

  /**
   * Initialize test directories
   * @param {string} projectPath - Path to project
   * @returns {Promise<void>}
   */
  async initializeTestDirs(projectPath) {
    const testBuildDir = path.join(projectPath, 'build', 'test');
    const reportsDir = path.join(projectPath, 'test-reports');
    const coverageDir = path.join(projectPath, 'coverage');
    
    await fs.ensureDir(testBuildDir);
    await fs.ensureDir(reportsDir);
    await fs.ensureDir(coverageDir);
  }

  /**
   * Compile test sources
   * @param {string} projectPath - Path to project
   * @returns {Promise<Object>} - Compilation result
   */
  async compileTests(projectPath) {
    return new Promise((resolve, reject) => {
      const ant = spawn('ant', ['compile-tests'], {
        cwd: projectPath,
        shell: true,
        env: process.env
      });
      
      let output = '';
      let error = '';
      
      ant.stdout.on('data', (data) => {
        output += data.toString();
        if (this.verbose) {
          console.log(data.toString());
        }
      });
      
      ant.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      ant.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: output,
            time: new Date().toISOString()
          });
        } else {
          reject(new Error(`Test compilation failed with exit code ${code}: ${error}`));
        }
      });
    });
  }

  /**
   * Execute tests
   * @param {string} projectPath - Path to project
   * @param {Object} options - Test options
   * @returns {Promise<Object>} - Test execution result
   */
  async executeTests(projectPath, options = {}) {
    const target = options.coverage ? 'test-coverage' : 'test';
    
    return new Promise((resolve, reject) => {
      const ant = spawn('ant', [target], {
        cwd: projectPath,
        shell: true,
        env: process.env
      });
      
      let output = '';
      let error = '';
      
      ant.stdout.on('data', (data) => {
        output += data.toString();
        if (this.verbose) {
          console.log(data.toString());
        }
      });
      
      ant.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      ant.on('close', (code) => {
        const success = code === 0;
        const testResults = this.parseTestOutput(output);
        
        if (success) {
          resolve({
            success: true,
            output: output,
            results: testResults,
            time: new Date().toISOString()
          });
        } else {
          resolve({
            success: false,
            output: output,
            error: error,
            results: testResults,
            time: new Date().toISOString()
          });
        }
      });
    });
  }

  /**
   * Parse test output to extract results
   * @param {string} output - Test output
   * @returns {Object} - Parsed test results
   */
  parseTestOutput(output) {
    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: 0,
      time: 0
    };
    
    // Extract test counts
    const totalMatch = output.match(/Tests run: (\d+)/);
    const failuresMatch = output.match(/Failures: (\d+)/);
    const errorsMatch = output.match(/Errors: (\d+)/);
    const timeMatch = output.match(/Time elapsed: ([\d.]+) s/);
    
    results.total = totalMatch ? parseInt(totalMatch[1]) : 0;
    results.failed = failuresMatch ? parseInt(failuresMatch[1]) : 0;
    results.errors = errorsMatch ? parseInt(errorsMatch[1]) : 0;
    results.passed = results.total - results.failed - results.errors;
    results.time = timeMatch ? parseFloat(timeMatch[1]) : 0;
    
    return results;
  }

  /**
   * Generate coverage report
   * @param {string} projectPath - Path to project
   * @returns {Promise<Object>} - Coverage result
   */
  async generateCoverageReport(projectPath) {
    return new Promise((resolve, reject) => {
      const ant = spawn('ant', ['coverage-report'], {
        cwd: projectPath,
        shell: true,
        env: process.env
      });
      
      let output = '';
      let error = '';
      
      ant.stdout.on('data', (data) => {
        output += data.toString();
        if (this.verbose) {
          console.log(data.toString());
        }
      });
      
      ant.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      ant.on('close', (code) => {
        if (code === 0) {
          // Parse coverage information
          const coverageInfo = this.parseCoverageOutput(output);
          
          resolve({
            success: true,
            output: output,
            coverage: coverageInfo,
            reportPath: path.join(projectPath, 'coverage', 'index.html'),
            time: new Date().toISOString()
          });
        } else {
          reject(new Error(`Coverage report generation failed: ${error}`));
        }
      });
    });
  }

  /**
   * Parse coverage output
   * @param {string} output - Coverage output
   * @returns {Object} - Coverage information
   */
  parseCoverageOutput(output) {
    const coverage = {
      lineCoverage: 0,
      branchCoverage: 0,
      methodCoverage: 0,
      complexity: 0
    };
    
    // Extract coverage percentages (simplified parsing)
    const lineMatch = output.match(/Line coverage: ([\d.]+)%/);
    const branchMatch = output.match(/Branch coverage: ([\d.]+)%/);
    const methodMatch = output.match(/Method coverage: ([\d.]+)%/);
    
    coverage.lineCoverage = lineMatch ? parseFloat(lineMatch[1]) : 0;
    coverage.branchCoverage = branchMatch ? parseFloat(branchMatch[1]) : 0;
    coverage.methodCoverage = methodMatch ? parseFloat(methodMatch[1]) : 0;
    
    return coverage;
  }

  /**
   * Get test reports
   * @param {string} projectPath - Path to project
   * @returns {Promise<Object>} - Test reports
   */
  async getTestReports(projectPath) {
    const reportsDir = path.join(projectPath, 'test-reports');
    if (!await fs.pathExists(reportsDir)) {
      return null;
    }
    
    const reports = {
      html: null,
      xml: null,
      summary: null
    };
    
    // Check for HTML reports
    const htmlDir = path.join(reportsDir, 'html');
    if (await fs.pathExists(htmlDir)) {
      reports.html = htmlDir;
    }
    
    // Check for XML reports
    const xmlFiles = (await fs.readdir(reportsDir))
      .filter(file => file.startsWith('TEST-') && file.endsWith('.xml'));
    if (xmlFiles.length > 0) {
      reports.xml = path.join(reportsDir, xmlFiles[0]);
    }
    
    // Generate summary
    reports.summary = await this.generateTestSummary(projectPath);
    
    return reports;
  }

  /**
   * Generate test summary
   * @param {string} projectPath - Path to project
   * @returns {Promise<Object>} - Test summary
   */
  async generateTestSummary(projectPath) {
    const reportsDir = path.join(projectPath, 'test-reports');
    if (!await fs.pathExists(reportsDir)) {
      return null;
    }
    
    // This would parse XML test reports to generate summary
    // For now, return basic structure
    return {
      generated: new Date().toISOString(),
      project: path.basename(projectPath)
    };
  }
}

module.exports = TestBuilder;