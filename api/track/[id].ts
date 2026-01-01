

// Configuración de Supabase

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */

const SUPABASE_URL = process.env['SUPABASE_URL'] || '';
const SUPABASE_ANON_KEY = process.env['SUPABASE_ANON_KEY'] || '';
const UAParser = require('ua-parser-js');

// Mapa de códigos a URLs destino
const REDIRECT_URLS: Record<string, string> = {
  portfolio: 'https://dev-alonso.vercel.app',
};


interface TrackingData {
  link_id: string;
  ip: string | null;
  user_agent: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  referer: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  timestamp: string;
  destination_url: string;
  isp: string | null;
  org: string | null;
  asn: string | null;
}

async function saveToSupabase(data: TrackingData): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('Supabase not configured, skipping save');
    return;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/link_tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.error('Error saving to Supabase:', await response.text());
    }
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
  }
}

module.exports = async (req, res) => {
  const { id } = req.query;
  const linkId = Array.isArray(id) ? id[0] : id;

  if (!linkId) {
    return res.status(400).json({ error: 'Link ID required' });
  }

  // Buscar URL destino
  const destinationUrl = REDIRECT_URLS[linkId.toLowerCase()];

  if (!destinationUrl) {
    return res.status(404).json({ error: 'Link not found' });
  }

  // Extraer información del visitante
  const userAgent = req.headers['user-agent'] || '';
  const ua = UAParser(userAgent);

  // Obtener IP pública (descarta IPs locales)
  let ip = (req.headers['x-forwarded-for']?.split(',')[0]) || req.headers['x-real-ip'] || req.socket?.remoteAddress || null;
  if (ip && (ip.startsWith('::ffff:'))) ip = ip.replace('::ffff:', '');
  if (ip && (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.'))) ip = null;

  // Consultar ipapi.co para ISP, ORG y ASN
  let isp = null, org = null, asn = null;
  if (ip) {
    try {
      const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
      if (geoRes.ok) {
        const geo = await geoRes.json();
        org = geo.org || null;
        isp = geo.org || null;
        asn = geo.asn || null;
      }
    } catch (err) {
      console.error('ipapi.co error:', err);
    }
  }

  const trackingData: TrackingData = {
    link_id: linkId,
    ip,
    user_agent: userAgent,
    browser: ua.browser?.name ? `${ua.browser.name} ${ua.browser.version || ''}` : null,
    os: ua.os?.name ? `${ua.os.name} ${ua.os.version || ''}` : null,
    device: ua.device?.type ? `${ua.device.type} ${ua.device.vendor || ''} ${ua.device.model || ''}` : 'Desktop',
    referer: req.headers['referer'] || null,
    country: req.headers['x-vercel-ip-country'] || null,
    city: req.headers['x-vercel-ip-city'] || null,
    region: req.headers['x-vercel-ip-country-region'] || null,
    timestamp: new Date().toISOString(),
    destination_url: destinationUrl,
    isp,
    org,
    asn
  };

  // Guardar en Supabase (async, no bloquea el redirect)
  await saveToSupabase(trackingData);

  // Log para debug (visible en Vercel logs)
  console.log('Track:', JSON.stringify(trackingData, null, 2));

  // Redirigir al destino
  res.redirect(302, destinationUrl);
}
