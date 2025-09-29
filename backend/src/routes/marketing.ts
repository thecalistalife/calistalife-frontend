import { Router } from 'express';
import { body } from 'express-validator';
import { handleValidationErrors } from '@/middleware';
import { subscribeNewsletter, setContactDates } from '@/services/marketing';

const router = Router();

router.post('/newsletter/subscribe',
  body('email').isEmail().withMessage('Valid email required'),
  body('firstName').optional().isString(),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, firstName } = req.body as any;
      await subscribeNewsletter(email, firstName);
      res.status(200).json({ success: true, message: 'Subscribed' });
    } catch (e) { next(e); }
  }
);

router.post('/contact/dates',
  body('email').isEmail(),
  body('birthdate').optional().isISO8601(),
  body('anniversary').optional().isISO8601(),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, birthdate, anniversary } = req.body as any;
      await setContactDates(email, birthdate, anniversary);
      res.status(200).json({ success: true, message: 'Updated' });
    } catch (e) { next(e); }
  }
);

// Brevo webhook receiver for engagement events (deliveries, opens, clicks, unsubscribes)
router.post('/webhook/brevo', async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    for (const ev of events) {
      // Minimal log; extend to update user attributes or analytics if desired
      console.log('[brevo webhook]', ev.event || ev.type, ev.email, ev.date || ev.ts || ev.timestamp);
    }
    res.status(204).end();
  } catch {
    res.status(204).end();
  }
});

export default router;
