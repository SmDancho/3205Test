export enum JobStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Failed = 'failed',
}

export enum UrlStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Success = 'success',
  Error = 'error',
  Cancelled = 'cancelled',
}

export type JobStats = {
  success: number;
  error: number;
};

export type JobSummary = {
  id: string;
  createdAt: string;
  status: JobStatus;
  totalUrls: number;
  stats: JobStats;
};

export type UrlResult = {
  url: string;
  status: UrlStatus;
  httpStatus?: number;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  artificialDelayMs?: number;
};

export type JobDetails = JobSummary & {
  urls: UrlResult[];
};

export function isFinalJobStatus(status: JobStatus) {
  return [
    JobStatus.Completed,
    JobStatus.Cancelled,
    JobStatus.Failed,
  ].includes(status);
}

export function getProcessedCount(job: JobDetails) {
  return job.urls.filter((item) =>
    [UrlStatus.Success, UrlStatus.Error, UrlStatus.Cancelled].includes(
      item.status,
    ),
  ).length;
}
