import { useEffect, useState } from 'react';
import {
  loadMobileSubmissionQueue,
  subscribeMobileSubmissionQueue,
  type QueuedMobileSubmission,
} from './draftStore';

export function useMobileSubmissionQueue(): QueuedMobileSubmission[] {
  const [queue, setQueue] = useState<QueuedMobileSubmission[]>(() => loadMobileSubmissionQueue());

  useEffect(() => {
    const unsubscribe = subscribeMobileSubmissionQueue(setQueue);
    return unsubscribe;
  }, []);

  return queue;
}
