/**
 * SMS Notification Service
 * Integrates with Twilio REST API using server-side secrets only.
 * If credentials are not present, explicitly flags status as PROVIDER_NOT_CONFIGURED.
 */

export interface SMSDispatchResult {
  status: 'SENT' | 'PROVIDER_NOT_CONFIGURED' | 'FAILED';
  note: string;
  recipientCount: number;
}

export async function sendEmergencySMS(
  phoneNumbers: string[],
  message: string
): Promise<SMSDispatchResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return {
      status: 'PROVIDER_NOT_CONFIGURED',
      note: 'SMS provider not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER missing in server environment)',
      recipientCount: 0,
    };
  }

  if (phoneNumbers.length === 0) {
    return {
      status: 'SENT',
      note: 'No citizens located inside current risk polygon. No SMS dispatched.',
      recipientCount: 0,
    };
  }

  let sentCount = 0;
  const errors: string[] = [];

  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  for (const phone of phoneNumbers) {
    try {
      const params = new URLSearchParams();
      params.append('To', phone);
      params.append('From', fromNumber);
      params.append('Body', message);

      const res = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (res.ok) {
        sentCount++;
      } else {
        const errText = await res.text();
        errors.push(`Failed for ${phone.slice(-4)}: ${errText.slice(0, 80)}`);
      }
    } catch (err: any) {
      errors.push(`Network error for ${phone.slice(-4)}: ${err?.message || 'Unknown error'}`);
    }
  }

  if (sentCount > 0) {
    return {
      status: 'SENT',
      note: `Dispatched SMS to ${sentCount}/${phoneNumbers.length} recipients. ${errors.length > 0 ? `Errors: ${errors.join('; ')}` : ''}`,
      recipientCount: sentCount,
    };
  }

  return {
    status: 'FAILED',
    note: `Twilio dispatch failed for all ${phoneNumbers.length} recipients. Details: ${errors.join('; ')}`,
    recipientCount: 0,
  };
}
