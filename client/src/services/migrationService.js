import axios from 'axios';

const API_BASE = '/api';

class MigrationService {
  async analyzeProject() {
    try {
      const response = await axios.get(`${API_BASE}/migration/analyze`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to analyze project');
    }
  }
  
  async migrateProject(options = {}) {
    try {
      const response = await axios.post(`${API_BASE}/migration/migrate`, options);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to migrate project');
    }
  }
  
  async backupProject() {
    try {
      const response = await axios.post(`${API_BASE}/migration/backup`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create backup');
    }
  }
  
  async convertToKotlin() {
    try {
      const response = await axios.post(`${API_BASE}/migration/kotlin`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to convert to Kotlin');
    }
  }
  
  async updateDependencies() {
    try {
      const response = await axios.post(`${API_BASE}/migration/dependencies`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update dependencies');
    }
  }
}

export default new MigrationService();