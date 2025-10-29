import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
});


export const getCodePreview = async (schema) => {
  const response = await apiClient.post('/generate-preview', schema);
  return response.data;
};


export const downloadProject = async (schema) => {
  const response = await apiClient.post('/generate', schema, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'fastapi_project.zip');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const getSchemaFromText = async (text) => {
  const response = await apiClient.post('/parse-text-to-schema', { text });
  return response.data;
};