import { useState, useEffect } from 'react';
import { getPriorities } from '../../../lib/api';
import { Priority } from '../types';

export const usePriorities = () => {
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPriorities = async () => {
      try {
        setLoading(true);
        const prioritiesData = await getPriorities();
        setPriorities(prioritiesData);
        setError(null);
      } catch (error) {
        console.error("Error fetching priorities:", error);
        setError("Failed to fetch priorities");
      } finally {
        setLoading(false);
      }
    };

    fetchPriorities();
  }, []);

  return { priorities, loading, error };
};