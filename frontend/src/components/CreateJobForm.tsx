import { SubmitEventHandler, useMemo, useState } from 'react';
import { useJobsStore } from '../store/jobsStore';

const initialUrls = ['https://example.com', 'https://github.com'].join('\n');

export function CreateJobForm() {
  const [urlsText, setUrlsText] = useState(initialUrls);
  const createJob = useJobsStore((state) => state.createJob);
  const isCreating = useJobsStore((state) => state.isCreating);
  const error = useJobsStore((state) => state.error);

  const parsedUrls = useMemo(
    () =>
      urlsText
        .split('\n')
        .map((url) => url.trim())
        .filter(Boolean),
    [urlsText],
  );

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    await createJob(parsedUrls);
  };

  return (
    <form className="create-panel" onSubmit={handleSubmit}>
      <label htmlFor="urls">URLs</label>
      <textarea
        id="urls"
        value={urlsText}
        onChange={(event) => setUrlsText(event.target.value)}
        rows={5}
      />
      <div className="actions">
        <span>{parsedUrls.length} URL ready</span>
        <button disabled={isCreating} type="submit">
          {isCreating ? 'Запуск...' : 'Запустить проверку'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
