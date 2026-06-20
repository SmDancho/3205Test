import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { JobsService } from './jobs.service';

type CreateJobDto = {
  urls: string[];
};

@Controller('api/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  createJob(@Body() body: CreateJobDto) {
    return this.jobsService.createJob(body.urls);
  }

  @Get()
  listJobs() {
    return this.jobsService.listJobs();
  }

  @Get(':id')
  getJob(@Param('id') id: string) {
    return this.jobsService.getJob(id);
  }

  @Delete(':id')
  cancelJob(@Param('id') id: string) {
    return this.jobsService.cancelJob(id);
  }
}
