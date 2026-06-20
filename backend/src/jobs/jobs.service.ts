import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { JobStatus, UrlStatus } from './jobs.enums';

type UrlResult = {
  url: string;
  status: UrlStatus;
  httpStatus?: number;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  artificialDelayMs?: number;
};

type Job = {
  id: string;
  createdAt: string;
  status: JobStatus;
  urls: UrlResult[];
  nextIndex: number;
  pendingResultSaves: Promise<void>[];
};

const concurrencyPerJob = 5;
const requestTimeoutMs = 15000;

@Injectable()
export class JobsService {
  private readonly jobs = new Map<string, Job>();

  constructor(
    @InjectQueue('url-check-jobs')
    private readonly queue: Queue<{ jobId: string }>,
  ) {}

  async createJob(urls: string[]) {
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new BadRequestException('urls must be a non-empty array');
    }

    for (const url of urls) {
      if (typeof url !== 'string') {
        throw new BadRequestException('each url must be a string');
      }
    }

    const job: Job = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      status: JobStatus.Pending,
      urls: urls.map((url) => ({
        url,
        status: UrlStatus.Pending,
      })),
      nextIndex: 0,
      pendingResultSaves: [],
    };

    this.jobs.set(job.id, job);
    await this.queue.add(
      'check-urls',
      { jobId: job.id },
      {
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return { jobId: job.id };
  }

  listJobs() {
    return Array.from(this.jobs.values()).map((job) => ({
      id: job.id,
      createdAt: job.createdAt,
      status: job.status,
      totalUrls: job.urls.length,
      stats: this.getStats(job),
    }));
  }

  getJob(id: string) {
    const job = this.jobs.get(id);

    if (!job) {
      throw new BadRequestException('job not found');
    }

    return {
      id: job.id,
      createdAt: job.createdAt,
      status: job.status,
      totalUrls: job.urls.length,
      stats: this.getStats(job),
      urls: job.urls,
    };
  }

  cancelJob(id: string) {
    const job = this.jobs.get(id);

    if (!job) {
      throw new NotFoundException('job not found');
    }

    job.status = JobStatus.Cancelled;
    for (const item of job.urls) {
      if (item.status === UrlStatus.Pending) {
        item.status = UrlStatus.Cancelled;
        item.finishedAt = new Date().toISOString();
      }
    }

    return this.getJob(id);
  }

  async processJob(jobId: string) {
    const job = this.jobs.get(jobId);

    if (!job || this.isCancelled(job)) {
      return;
    }

    job.status = JobStatus.InProgress;

    await Promise.all(
      Array.from({ length: concurrencyPerJob }, () => this.runWorker(job)),
    );
    await Promise.all(job.pendingResultSaves);

    if (this.isCancelled(job)) {
      return;
    }

    job.status = job.urls.some((item) => item.status === UrlStatus.Error)
      ? JobStatus.Failed
      : JobStatus.Completed;
  }

  private async runWorker(job: Job) {
    while (!this.isCancelled(job)) {
      const item = this.getNextPendingUrl(job);

      if (!item) {
        return;
      }

      await this.checkUrl(job, item);
    }
  }

  private getNextPendingUrl(job: Job) {
    while (job.nextIndex < job.urls.length) {
      const item = job.urls[job.nextIndex];
      job.nextIndex += 1;

      if (item.status === UrlStatus.Pending) {
        return item;
      }
    }

    return null;
  }

  private async checkUrl(job: Job, item: UrlResult) {
    const startedAt = Date.now();

    item.status = UrlStatus.InProgress;
    item.startedAt = new Date(startedAt).toISOString();

    try {
      const response = await fetch(item.url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
      const finishedAt = Date.now();

      this.scheduleResultSave(job, item, {
        status: response.ok ? UrlStatus.Success : UrlStatus.Error,
        httpStatus: response.status,
        error: response.ok ? undefined : `HTTP ${response.status}`,
        startedAt,
        finishedAt,
      });
    } catch (error) {
      const finishedAt = Date.now();

      this.scheduleResultSave(job, item, {
        status: UrlStatus.Error,
        error: error instanceof Error ? error.message : 'Unknown error',
        startedAt,
        finishedAt,
      });
    }
  }

  private scheduleResultSave(
    job: Job,
    item: UrlResult,
    result: {
      status: UrlStatus.Success | UrlStatus.Error;
      httpStatus?: number;
      error?: string;
      startedAt: number;
      finishedAt: number;
    },
  ) {
    const artificialDelayMs = this.randomDelayMs();
    const savePromise = this.delay(artificialDelayMs).then(() => {
      item.status = result.status;
      item.httpStatus = result.httpStatus;
      item.error = result.error;
      item.finishedAt = new Date(result.finishedAt).toISOString();
      item.durationMs = result.finishedAt - result.startedAt;
      item.artificialDelayMs = artificialDelayMs;
    });

    job.pendingResultSaves.push(savePromise);
  }

  private getStats(job: Job) {
    return job.urls.reduce(
      (stats, item) => {
        if (item.status === UrlStatus.Success) {
          stats.success += 1;
        }

        if (item.status === UrlStatus.Error) {
          stats.error += 1;
        }

        return stats;
      },
      { success: 0, error: 0 },
    );
  }

  private isCancelled(job: Job) {
    return job.status === JobStatus.Cancelled;
  }

  private randomDelayMs() {
    return Math.floor(Math.random() * 10001);
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
