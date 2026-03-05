import axios from "axios";
import type { Cached } from "../types/tender";

const apiClient = axios.create({
  baseURL: "https://govermentdata-backend.onrender.com",
  timeout: 300000,
});

export async function fetchTenders(): Promise<Cached> {
  const response = await apiClient.get<Cached>("/api/tenders");
  return response.data;
}

export async function fetchCached(): Promise<Cached> {
  const response = await apiClient.get<Cached>("/api/tenders/cached");
  return response.data;
}
