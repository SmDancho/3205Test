import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { JobsService } from './jobs.service';

type UrlCheckJobData = {
  jobId: string;
};

@Processor('url-check-jobs', {
  concurrency: 5,
})
export class JobsProcessor extends WorkerHost {
  constructor(private readonly jobsService: JobsService) {
    super();
  }

  async process(job: Job<UrlCheckJobData>) {
    await this.jobsService.processJob(job.data.jobId);
  }
}
