import { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE } from '../config/api';

const SchoolContext = createContext(null);

export function SchoolProvider({ children }) {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch school config from backend on app startup
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/schools/config`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch school config');
        }

        setSchool(data.school);
      } catch (err) {
        console.warn('Failed to fetch school config:', err.message);
        // Use sensible defaults if fetch fails
        setSchool({
          name: 'School Portal',
          motto: '',
          address: '',
          region: '',
          district: '',
          phone: '',
          email: '',
          logo: null,
        });
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SchoolContext.Provider value={{ school, loading, error }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
}
