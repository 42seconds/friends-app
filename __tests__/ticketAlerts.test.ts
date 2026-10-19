import { alertFor } from '../src/lib/ticketAlerts';
import { PurchasedTicket } from '../src/types';

const t = (status: string, extra: Partial<PurchasedTicket> = {}) => ({ id: 'TKT-1', eventTitle: 'Braam After Dark', status, ...extra }) as PurchasedTicket;

describe('ticket alerts', () => {
  it('announces an approval and opens the ticket', () => {
    const a = alertFor(t('confirmed'), 'pending_verification');
    expect(a?.title).toMatch(/tickets are ready/);
    expect(a?.body).toContain('Braam After Dark');
    expect(a?.url).toBe('/ticket/TKT-1');
  });

  it('announces a rejected proof with the reason', () => {
    const a = alertFor(t('rejected', { rejection: { reason: 'Reference missing', message: '', keepHeld: true, at: '' } }), 'pending_verification');
    expect(a?.body).toContain('Reference missing');
    expect(a?.url).toBe('/purchase/rejected?ticketId=TKT-1');
  });

  it('stays quiet when nothing worth telling changed', () => {
    expect(alertFor(t('confirmed'), 'confirmed')).toBeNull();
    expect(alertFor(t('pending_verification'), 'pending_payment')).toBeNull();
  });
});
