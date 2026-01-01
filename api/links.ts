import type { VercelRequest, VercelResponse } from '@vercel/node';

// Configuración de Supabase
const SUPABASE_URL = process.env['SUPABASE_URL'] || '';
const SUPABASE_ANON_KEY = process.env['SUPABASE_ANON_KEY'] || '';

interface TrackingRecord {
  id: number;
  link_id: string;
  ip: string;
  user_agent: string;
  country: string;
  city: string;
  timestamp: string;
}

interface LinkStats {
  link_id: string;
  total_clicks: number;
  unique_ips: number;
  countries: string[];
  last_click: string;
}

async function getTrackingData(): Promise<TrackingRecord[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return [];
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/link_tracking?select=*&order=timestamp.desc&limit=100`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.error('Error fetching from Supabase:', await response.text());
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
    return [];
  }
}

function calculateStats(records: TrackingRecord[]): LinkStats[] {
  const statsMap = new Map<string, {
    clicks: number;
    ips: Set<string>;
    countries: Set<string>;
    lastClick: string;
  }>();

  for (const record of records) {
    const existing = statsMap.get(record.link_id) || {
      clicks: 0,
      ips: new Set<string>(),
      countries: new Set<string>(),
      lastClick: record.timestamp
    };

    existing.clicks++;
    if (record.ip) existing.ips.add(record.ip);
    if (record.country) existing.countries.add(record.country);
    if (record.timestamp > existing.lastClick) {
      existing.lastClick = record.timestamp;
    }

    statsMap.set(record.link_id, existing);
  }

  return Array.from(statsMap.entries()).map(([link_id, data]) => ({
    link_id,
    total_clicks: data.clicks,
    unique_ips: data.ips.size,
    countries: Array.from(data.countries),
    last_click: data.lastClick
  }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type } = req.query;

  const records = await getTrackingData();

  if (type === 'stats') {
    const stats = calculateStats(records);
    return res.status(200).json({ stats });
  }

  // Por defecto, retorna los últimos registros
  return res.status(200).json({
    records,
    total: records.length
  });
}
