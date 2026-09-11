/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';

// CORREÇÃO: Alterado de 3000 para 4000 conforme seu log
const API_URL = `https://unicocontato.tech/api`; 

export const fetchLogs = async ({ page, limit, search, startDate, endDate }: any) => {
  try {
    const response = await axios.get(`${API_URL}/logs`, {
      params: {
        page,
        limit,
        search,
        startDate,
        endDate
      }
    });

    return response.data;
    
  } catch (error: any) {
    console.error("Erro na requisição de logs:", error);
    throw error.response?.data || error.message;
  }
};