/// <reference path="../types/sib.d.ts" />
import SibApiV3Sdk from 'sib-api-v3-sdk';

const defaultClient = SibApiV3Sdk.ApiClient.instance as any;
const apiKey = defaultClient.authentications['api-key'];
// Fallback to SMTP_API_KEY for Brevo if BREVO_API_KEY is not provided
apiKey.apiKey = process.env.BREVO_API_KEY || process.env.SMTP_API_KEY || '';

export const brevo = {
  contacts: new SibApiV3Sdk.ContactsApi(),
  email: new SibApiV3Sdk.TransactionalEmailsApi(),
};