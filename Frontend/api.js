const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

const api = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,  // ← Auto-adds header
      ...options.headers,
    },
    ...options,
  });

  // Handle response...

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

export const getStudents = () => api('/students');
export const createStudent = (student) => api('/students', { method: 'POST', body: JSON.stringify(student) });
export const updateStudent = (id, student) => api(`/students/${id}`, { method: 'PUT', body: JSON.stringify(student) });
export const deleteStudent = (id) => api(`/students/${id}`, { method: 'DELETE' });