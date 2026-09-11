import axios from 'axios';

const API_BASE = (import.meta.env.VITE_URLBASE || 'https://unicocontato.tech').replace(
  /\/+$/,
  '',
);
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 120000);

export { API_BASE };

export const api = axios.create({
  baseURL: API_BASE,
  timeout: API_TIMEOUT_MS,
});
