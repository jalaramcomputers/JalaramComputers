import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUBSCRIBERS_FILE = path.join(__dirname, '..', 'data', 'newsletter-subscribers.json');

export type SubscriberRecord = {
  email: string;
  subscribedAt: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(normalizeEmail(email));
}

function readSubscribers(): SubscriberRecord[] {
  try {
    if (!fs.existsSync(SUBSCRIBERS_FILE)) return [];
    const raw = fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSubscribers(list: SubscriberRecord[]): void {
  fs.mkdirSync(path.dirname(SUBSCRIBERS_FILE), { recursive: true });
  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

export function addSubscriber(email: string): { isNew: boolean; record: SubscriberRecord } {
  const normalized = normalizeEmail(email);
  const list = readSubscribers();
  const existing = list.find((s) => s.email === normalized);
  if (existing) {
    return { isNew: false, record: existing };
  }

  const record: SubscriberRecord = {
    email: normalized,
    subscribedAt: new Date().toISOString(),
  };
  list.push(record);
  writeSubscribers(list);
  return { isNew: true, record };
}
