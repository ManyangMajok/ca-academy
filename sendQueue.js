import { sendRawEmail } from './email.js';

// Simple send queue with concurrency and retry
const concurrency = 5;
const delayMs = 150; // delay between individual sends to be gentle
let active = 0;
const queue = [];

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function worker() {
  if (active >= concurrency || queue.length === 0) return;
  active++;
  const task = queue.shift();
  try {
    const { to, subject, html, from, retries = 0 } = task;
    const res = await sendRawEmail({ to, subject, html, from });
    if (!res.success && retries < 2) {
      // retry with backoff
      queue.push({ to, subject, html, from, retries: retries + 1 });
    }
  } catch (err) {
    if (task.retries < 2) queue.push({ ...task, retries: (task.retries || 0) + 1 });
  } finally {
    active--;
    // schedule next worker
    if (queue.length > 0) setTimeout(worker, delayMs);
  }
}

export function enqueueEmails(addresses, subject, html, from) {
  addresses.forEach(a => queue.push({ to: a, subject, html, from }));
  // kick off workers up to concurrency
  for (let i = 0; i < concurrency; i++) setTimeout(worker, i * 10);
  return queue.length;
}

export function getQueueLength() { return queue.length + active; }
