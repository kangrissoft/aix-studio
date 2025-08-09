import axios from 'axios';

const API_BASE = '/api';

class DependencyService {
  async listDependencies() {
    try {
      const response = await axios.get(`${API_BASE}/dependencies`);
      return response.data.dependencies;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to list dependencies');
    }
  }
  
  async addDependency(name, version = 'latest') {
    try {
      const response = await axios.post(`${API_BASE}/dependencies/add`, {
        name,
        version
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add dependency');
    }
  }
  
  async removeDependency(id) {
    try {
      const response = await axios.delete(`${API_BASE}/dependencies/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove dependency');
    }
  }
  
  async searchMavenCentral(query) {
    try {
      const response = await axios.get(`${API_BASE}/dependencies/search?q=${query}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to search Maven Central');
    }
  }
  
  async updateDependency(id, version) {
    try {
      const response = await axios.put(`${API_BASE}/dependencies/${id}`, {
        version
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update dependency');
    }
  }
  
  async checkForUpdates() {
    try {
      const response = await axios.get(`${API_BASE}/dependencies/updates`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to check for updates');
    }
  }
}

export default new DependencyService();