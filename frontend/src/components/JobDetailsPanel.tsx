import { useJobsStore } from '../store/jobsStore';
import { getProcessedCount, isFinalJobStatus } from '../types/jobs';

export function JobDetailsPanel() {
  const activeJob = useJobsStore((state) => state.activeJob);
  const isLoadingDetails = useJobsStore((state) => state.isLoadingDetails);
  const isCancelling = useJobsStore((state) => state.isCancelling);
  const cancelActiveJob = useJobsStore((state) => state.cancelActiveJob);

  const canCancel = activeJob ? !isFinalJobStatus(activeJob.status) : false;
  const processedCount = activeJob ? getProcessedCount(activeJob) : 0;

  return (
    <div className="details">
      <div className="details-header">
        <h2>Details</h2>
        {canCancel && (
          <button
            className="secondary"
            disabled={isCancelling}
            onClick={cancelActiveJob}
            type="button"
          >
            {isCancelling ? 'Отмена...' : 'Отменить задание'}
          </button>
        )}
      </div>

      {isLoadingDetails && <p className="muted">Loading details...</p>}

      {!isLoadingDetails && !activeJob ? (
        <p className="muted">Select a job to inspect URL results.</p>
      ) : null}

      {activeJob ? (
        <>
          <div className="summary">
            <span>Status: {activeJob.status}</span>
            <span>
              Progress: {processedCount} из {activeJob.totalUrls} обработано
            </span>
            <span>Success: {activeJob.stats.success}</span>
            <span>Error: {activeJob.stats.error}</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Status</th>
                  <th>HTTP</th>
                  <th>Duration</th>
                  <th>Delay</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {activeJob.urls.map((item, index) => (
                  <tr key={`${item.url}-${index}`}>
                    <td className="url-cell">{item.url}</td>
                    <td>{item.status}</td>
                    <td>{item.httpStatus ?? '-'}</td>
                    <td>
                      {typeof item.durationMs === 'number'
                        ? `${item.durationMs} ms`
                        : '-'}
                    </td>
                    <td>
                      {typeof item.artificialDelayMs === 'number'
                        ? `${item.artificialDelayMs} ms`
                        : '-'}
                    </td>
                    <td>{item.error ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
