import { useMemo } from 'react';
import api from '../services/api';

const useAxios = () => {
  return useMemo(() => api, []);
};

export default useAxios;
