import axios from "axios";

const api = axios.create({ baseURL: "/api", timeout: 30_000, withCredentials: true });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(err);
  }
);

export default api;

export async function login(email: string, password: string): Promise<void> {
  await api.post("/auth/login", { email, password });
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function checkAuth(): Promise<boolean> {
  try {
    await api.get("/auth/me");
    return true;
  } catch {
    return false;
  }
}

export async function uploadPDF(file: File): Promise<{ session_id: string }> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/branding/upload", form);
  return data;
}

export async function submitBrandForm(payload: {
  brand_name: string;
  product_type: string;
  target_audience: string;
  colors: string[];
  keywords: string[];
  trending_keywords: string[];
  style_descriptors: string[];
}): Promise<{ session_id: string }> {
  const { data } = await api.post("/branding/from-form", payload);
  return data;
}

export function streamProgress(
  path: string,
  onMessage: (e: { stage: string; message: string; status: string }) => void,
  onEnd: () => void
): () => void {
  const es = new EventSource(`/api${path}`, { withCredentials: true });
  es.onmessage = (e) => {
    const data = JSON.parse(e.data);
    onMessage(data);
    if (data.status === "complete" || data.status === "error") {
      es.close();
      onEnd();
    }
  };
  es.onerror = () => { es.close(); onEnd(); };
  return () => es.close();
}

export async function startScraping(sessionId: string) {
  await api.post(`/scraping/${sessionId}/search`);
}

export async function getVideos(sessionId: string) {
  const { data } = await api.get(`/scraping/${sessionId}/videos`);
  return data;
}

export async function startGeneration(sessionId: string, format: string, count: number) {
  await api.post(`/generation/${sessionId}/create`, { format, count });
}

export async function getImages(sessionId: string) {
  const { data } = await api.get(`/generation/${sessionId}/images`);
  return data;
}

export async function getHistory() {
  const { data } = await api.get("/history/");
  return data;
}

export async function getSessionDetail(sessionId: string) {
  const { data } = await api.get(`/history/${sessionId}`);
  return data;
}

export async function getCosts(sessionId: string) {
  const { data } = await api.get(`/history/${sessionId}/costs`);
  return data;
}

export function imageUrl(sessionId: string, imageId: string) {
  return `/api/generation/${sessionId}/download/${imageId}`;
}
