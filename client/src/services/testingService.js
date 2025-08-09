import axios from 'axios';

const API_BASE = '/api';

class TestingService {
  async runTests(coverage = false) {
    try {
      const response = await axios.post(`${API_BASE}/testing/run`, {
        coverage
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to run tests');
    }
  }
  
  async getTestResults() {
    try {
      const response = await axios.get(`${API_BASE}/testing/results`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get test results');
    }
  }
  
  async generateCoverageReport() {
    try {
      const response = await axios.post(`${API_BASE}/testing/coverage`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate coverage report');
    }
  }
}

export default new TestingService();