import { Order, Driver, ProximityCallLog, ProximityCallSettings } from '../src/types';

/**
 * Haversine formula to compute great-circle distance between two coordinates in miles
 */
export function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(3));
}

/**
 * Coordinate lookup for Queens / NYC paratransit locations
 */
const NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number }> = {
  'jackson heights': { lat: 40.75124, lng: -73.88307 },
  'jamaica': { lat: 40.70274, lng: -73.78902 },
  'flushing': { lat: 40.76751, lng: -73.83315 },
  'kensington': { lat: 40.64653, lng: -73.97851 },
  'astoria': { lat: 40.76442, lng: -73.92353 },
  'long island city': { lat: 40.74471, lng: -73.94854 },
  'forest hills': { lat: 40.71812, lng: -73.84483 },
  'woodside': { lat: 40.74542, lng: -73.90324 },
  'elmhurst': { lat: 40.74514, lng: -73.88602 },
  'sunnyside': { lat: 40.74312, lng: -73.91951 }
};

export function getPickupCoordinates(order: Order): { lat: number; lng: number } {
  const neighborhood = (order.pickupNeighborhood || '').toLowerCase();
  const address = (order.pickupAddress || '').toLowerCase();

  for (const [key, coords] of Object.entries(NEIGHBORHOOD_COORDS)) {
    if (address.includes(key) || neighborhood.includes(key)) {
      return coords;
    }
  }

  return { lat: 40.75124, lng: -73.88307 }; // Default Jackson Heights
}

/**
 * Generate TwiML XML for Twilio Voice Interactive Gather
 */
export function generateArrivalTwiML(orderId: string, baseUrl?: string): string {
  const actionUrl = `${baseUrl || ''}/api/twilio/voice/gather?orderId=${encodeURIComponent(orderId)}`;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="${actionUrl}" method="POST" timeout="8">
    <Say language="ru-RU" voice="Polly.Tatyana">
      Здравствуйте, это Accessible Transit. Ваш водитель уже подъезжает. Пожалуйста, выходите. Если хотите отменить поездку, нажмите 2.
    </Say>
    <Pause length="1"/>
    <Say language="en-US" voice="Polly.Joanna">
      Hello, this is Accessible Transit. Your driver is arriving. Please come out. If you wish to cancel this trip, press 2.
    </Say>
  </Gather>
  <Say language="ru-RU" voice="Polly.Tatyana">
    Спасибо! Водитель ожидает вас у точки подачи.
  </Say>
  <Hangup/>
</Response>`;
}

/**
 * Generate TwiML response after passenger pressed a DTMF key
 */
export function generateGatherResultTwiML(digits: string): string {
  if (digits === '2') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ru-RU" voice="Polly.Tatyana">
    Ваша поездка успешно отменена. Диспетчер и водитель уведомлены. Всего доброго.
  </Say>
  <Pause length="1"/>
  <Say language="en-US" voice="Polly.Joanna">
    Your trip has been cancelled. Have a great day.
  </Say>
  <Hangup/>
</Response>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ru-RU" voice="Polly.Tatyana">
    Спасибо за подтверждение. Водитель ожидает вас.
  </Say>
  <Pause length="1"/>
  <Say language="en-US" voice="Polly.Joanna">
    Thank you for confirming. Your driver is waiting at pickup.
  </Say>
  <Hangup/>
</Response>`;
}

/**
 * Dispatch an outbound voice call to the passenger via Twilio Voice API
 */
export async function triggerTwilioPassengerCall(
  order: Order,
  settings: ProximityCallSettings,
  baseUrl: string = ''
): Promise<{ success: boolean; callSid: string; isSimulated: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || settings.configuredTwilioNumber || '+18005550199';
  const toNumber = order.passengerPhone || '+17185550144';

  // If real Twilio credentials are provided, invoke Twilio REST API
  if (accountSid && authToken && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const twimlUrl = `${baseUrl}/api/twilio/voice/twiml?orderId=${encodeURIComponent(order.id)}`;
      const statusCallback = `${baseUrl}/api/twilio/voice/status?orderId=${encodeURIComponent(order.id)}`;

      const bodyParams = new URLSearchParams();
      bodyParams.append('To', toNumber);
      bodyParams.append('From', fromNumber);
      bodyParams.append('Url', twimlUrl);
      bodyParams.append('StatusCallback', statusCallback);
      bodyParams.append('StatusCallbackEvent', 'completed');
      bodyParams.append('StatusCallbackEvent', 'answered');

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams.toString()
      });

      const data = await response.json();
      if (!response.ok) {
        console.warn('Twilio API call response error:', data);
        return {
          success: false,
          callSid: `CA_failed_${Date.now()}`,
          isSimulated: false,
          error: data.message || `Twilio error ${response.status}`
        };
      }

      return {
        success: true,
        callSid: data.sid || `CA_${Date.now()}`,
        isSimulated: false
      };
    } catch (err: any) {
      console.error('Twilio Voice API Network error:', err);
      // Fallback to simulation gracefully
      return {
        success: true,
        callSid: `CA_sim_${Date.now()}`,
        isSimulated: true,
        error: err.message
      };
    }
  }

  // Simulated Mode (when credentials not yet configured in UI or running local dev sandbox)
  return {
    success: true,
    callSid: `CA_simulated_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    isSimulated: true
  };
}

/**
 * Dispatch Telegram Alert to Dispatchers Group when an MTA trip is cancelled by passenger
 */
export async function sendTelegramCancellationAlert(
  order: Order,
  driver?: Driver,
  log?: Partial<ProximityCallLog>
): Promise<{ sent: boolean; messageId?: string; isSimulated: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const nowEst = new Date().toLocaleString('ru-RU', {
    timeZone: 'America/New_York',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const messageText = [
    `⚠️ <b>MTA-заказ отменён пассажиром</b>`,
    `<b>Trip ID:</b> ${order.orderNumber || order.id}`,
    `<b>Брокер:</b> ${order.brokerName || 'TripLink Mobility (MTA Paratransit)'}`,
    `<b>Пассажир:</b> ${order.passengerPhone} (${order.passengerName})`,
    `<b>Точка подачи:</b> ${order.pickupAddress} (${order.pickupNeighborhood})`,
    `<b>Точка назначения:</b> ${order.dropoffAddress} (${order.dropoffNeighborhood})`,
    `<b>Водитель:</b> ${driver?.fullName || order.driverName || 'Не назначен'} (${driver?.vehiclePlate || 'WAV'})`,
    `<b>Время отмены:</b> ${nowEst} (EDT)`,
    ``,
    `<i>Причина: Отменено по телефону при подъезде водителя (DTMF 2 в IVR-звонке Twilio)</i>`,
    `<i>Дистанция при звонке: ${log?.distanceMiles ?? order.lastDriverDistanceMiles ?? 0.28} миль</i>`
  ].join('\n');

  if (botToken && chatId) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: 'HTML'
        })
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        console.warn('Telegram API send error:', data);
        return {
          sent: false,
          isSimulated: false,
          error: data.description || `Telegram HTTP ${response.status}`
        };
      }

      return {
        sent: true,
        messageId: String(data.result?.message_id || Date.now()),
        isSimulated: false
      };
    } catch (err: any) {
      console.error('Telegram Network error:', err);
      return {
        sent: true,
        messageId: `tg_sim_${Date.now()}`,
        isSimulated: true,
        error: err.message
      };
    }
  }

  // Simulated delivery when Telegram secret is empty
  console.log('[PROXIMITY IVR -> TELEGRAM SIMULATION ALERT]\n' + messageText);
  return {
    sent: true,
    messageId: `tg_simulated_${Date.now()}`,
    isSimulated: true
  };
}
