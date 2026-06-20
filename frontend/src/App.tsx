import { useEffect } from 'react';
import { jobsApi } from './api/jobsApi';
import { CreateJobForm } from './components/CreateJobForm';
import { JobDetailsPanel } from './components/JobDetailsPanel';
import { JobsList } from './components/JobsList';
import { useJobsStore } from './store/jobsStore';

export function App() {
  const loadJobs = useJobsStore((state) => state.loadJobs);
  const stopPolling = useJobsStore((state) => state.stopPolling);

  useEffect(() => {
    void loadJobs();

    return () => stopPolling();
  }, [loadJobs, stopPolling]);

  return (
    <main className="app">
      <section className="workspace">
        <header className="header">
          <div>
            <p className="eyebrow">Async URL checker</p>
            <h1>URL Jobs</h1>
          </div>
          <span className="api-url">{jobsApi.apiUrl}</span>
        </header>

        <CreateJobForm />

        <section className="content-grid">
          <JobsList />
          <JobDetailsPanel />
        </section>
      </section>
    </main>
  );
}
