import { create } from 'zustand';
import { jobsApi } from '../api/jobsApi';
import type { JobDetails, JobSummary } from '../types/jobs';
import { isFinalJobStatus } from '../types/jobs';

type JobsState = {
  jobs: JobSummary[];
  activeJobId: string;
  activeJob: JobDetails | null;
  isCreating: boolean;
  isLoadingJobs: boolean;
  isLoadingDetails: boolean;
  isCancelling: boolean;
  error: string;
  pollingTimerId?: number;
  pollingToken: number;
  loadJobs: () => Promise<void>;
  createJob: (urls: string[]) => Promise<void>;
  selectJob: (id: string) => void;
  loadActiveJob: (id: string, token?: number) => Promise<void>;
  cancelActiveJob: () => Promise<void>;
  stopPolling: () => void;
};

const pollingIntervalMs = 2000;

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  activeJobId: '',
  activeJob: null,
  isCreating: false,
  isLoadingJobs: false,
  isLoadingDetails: false,
  isCancelling: false,
  error: '',
  pollingToken: 0,

  async loadJobs() {
    set({ isLoadingJobs: true, error: '' });

    try {
      const jobs = await jobsApi.listJobs();
      set({ jobs, isLoadingJobs: false });
    } catch (error) {
      set({
        error: getErrorMessage(error),
        isLoadingJobs: false,
      });
    }
  },

  async createJob(urls: string[]) {
    set({ isCreating: true, error: '' });

    try {
      const { jobId } = await jobsApi.createJob(urls);
      await get().loadJobs();
      get().selectJob(jobId);
      set({ isCreating: false });
    } catch (error) {
      set({
        error: getErrorMessage(error),
        isCreating: false,
      });
    }
  },

  selectJob(id: string) {
    get().stopPolling();

    const token = get().pollingToken + 1;
    set({
      activeJobId: id,
      activeJob: null,
      isLoadingDetails: true,
      error: '',
      pollingToken: token,
    });

    void get().loadActiveJob(id, token);
  },

  async loadActiveJob(id: string, token = get().pollingToken) {
    try {
      const job = await jobsApi.getJob(id);
      const state = get();

      if (state.activeJobId !== id || state.pollingToken !== token) {
        return;
      }

      set({
        activeJob: job,
        isLoadingDetails: false,
      });

      if (isFinalJobStatus(job.status)) {
        get().stopPolling();
        await get().loadJobs();
        return;
      }

      const timerId = window.setTimeout(() => {
        void get().loadActiveJob(id, token);
      }, pollingIntervalMs);

      set({ pollingTimerId: timerId });
    } catch (error) {
      const state = get();

      if (state.activeJobId !== id || state.pollingToken !== token) {
        return;
      }

      set({
        error: getErrorMessage(error),
        isLoadingDetails: false,
      });
    }
  },

  async cancelActiveJob() {
    const { activeJobId } = get();

    if (!activeJobId) {
      return;
    }

    set({ isCancelling: true, error: '' });

    try {
      const job = await jobsApi.cancelJob(activeJobId);

      if (get().activeJobId === activeJobId) {
        set({ activeJob: job });
      }

      await get().loadJobs();
    } catch (error) {
      set({ error: getErrorMessage(error) });
    } finally {
      set({ isCancelling: false });
    }
  },

  stopPolling() {
    const timerId = get().pollingTimerId;

    if (timerId) {
      window.clearTimeout(timerId);
    }

    set({ pollingTimerId: undefined });
  },
}));

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error';
}
