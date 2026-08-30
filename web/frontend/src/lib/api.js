import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;
export const API = `${BASE}/api`;

export const api = axios.create({ baseURL: API });

export const fmt = (n) => Number(n || 0).toLocaleString("en-US");
