import { ProximityCallLog, ProximityCallSettings, Order } from '../types';

export async function fetchProximitySettings(): Promise<ProximityCallSettings> {
  const res = await fetch('/api/proximity-calls/settings');
  if (!res.ok) throw new Error('Failed to fetch proximity settings');
  return res.json();
}

export async function updateProximitySettings(updates: Partial<ProximityCallSettings>): Promise<ProximityCallSettings> {
  const res = await fetch('/api/proximity-calls/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update proximity settings');
  return res.json();
}

export async function fetchProximityCallLogs(params?: { orderId?: string; result?: string }): Promise<ProximityCallLog[]> {
  const query = new URLSearchParams();
  if (params?.orderId) query.set('orderId', params.orderId);
  if (params?.result) query.set('result', params.result);
  
  const res = await fetch(`/api/proximity-calls/logs?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch proximity call logs');
  return res.json();
}

export async function triggerProximityCall(orderId: string, distanceMiles?: number, triggerReason?: string) {
  const res = await fetch('/api/proximity-calls/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, distanceMiles, triggerReason })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to trigger proximity call');
  }
  return res.json();
}

export async function simulateDtmfInput(orderId: string, digits: string, callSid?: string) {
  const res = await fetch('/api/proximity-calls/simulate-dtmf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, digits, callSid })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to simulate DTMF');
  }
  return res.json();
}

export async function testTelegramAlert() {
  const res = await fetch('/api/proximity-calls/test-telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to test Telegram alert');
  }
  return res.json();
}

export async function evaluateProximityForAllOrders() {
  const res = await fetch('/api/proximity-calls/evaluate-proximity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to evaluate proximity');
  return res.json();
}
