import type { Request, Response } from 'express';
import { addSubscriber, isValidEmail, normalizeEmail } from './newsletter.js';
import { isMailConfigured, sendNewsletterWelcomeEmail } from './mail.js';

export async function handleNewsletterSubscribe(req: Request, res: Response): Promise<void> {
  const email = typeof req.body?.email === 'string' ? req.body.email : '';

  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
    return;
  }

  if (!isMailConfigured()) {
    res.status(503).json({
      ok: false,
      error: 'Email is not configured yet. Add SMTP settings to the server environment.',
    });
    return;
  }

  const normalized = normalizeEmail(email);

  try {
    const { isNew } = addSubscriber(normalized);
    if (isNew) {
      await sendNewsletterWelcomeEmail(normalized);
      res.json({
        ok: true,
        message: 'Welcome to the family! Check your inbox for a confirmation email.',
      });
      return;
    }

    res.json({
      ok: true,
      alreadySubscribed: true,
      message: 'You are already subscribed to our newsletter.',
    });
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    res.status(500).json({
      ok: false,
      error: 'Could not send the welcome email. Please try again in a moment.',
    });
  }
}
