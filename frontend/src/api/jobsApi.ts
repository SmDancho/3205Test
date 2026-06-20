import type { JobDetails, JobSummary } from '../types/jobs';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, options);

  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    const message =
      typeof body?.message === 'string' ? body.message : 'Request failed';
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const jobsApi = {
  apiUrl,

  createJob(urls: string[]) {
    return request<{ jobId: string }>('/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls }),
    });
  },

  listJobs() {
    return request<JobSummary[]>('/api/jobs');
  },

  getJob(id: string) {
    return request<JobDetails>(`/api/jobs/${id}`);
  },

  cancelJob(id: string) {
    return request<JobDetails>(`/api/jobs/${id}`, {
      method: 'DELETE',
    });
  },
};
