import { useJobsStore } from '../store/jobsStore';

export function JobsList() {
  const jobs = useJobsStore((state) => state.jobs);
  const activeJobId = useJobsStore((state) => state.activeJobId);
  const isLoadingJobs = useJobsStore((state) => state.isLoadingJobs);
  const selectJob = useJobsStore((state) => state.selectJob);

  return (
    <div className="jobs-list">
      <div className="section-heading">
        <h2>Jobs</h2>
        {isLoadingJobs && <span className="muted">Loading...</span>}
      </div>

      {jobs.length === 0 ? (
        <p className="muted">No jobs yet.</p>
      ) : (
        jobs.map((job) => (
          <button
            className={`job-row ${job.id === activeJobId ? 'active' : ''}`}
            key={job.id}
            onClick={() => selectJob(job.id)}
            type="button"
          >
            <span>
              <strong>{job.status}</strong>
              <small>{new Date(job.createdAt).toLocaleString()}</small>
              <small>{job.id}</small>
            </span>
            <span className="job-stats">
              {job.stats.success}/{job.stats.error}/{job.totalUrls}
            </span>
          </button>
        ))
      )}
    </div>
  );
}
