export interface VisitorInfo {
  ip: string;
  country?: string;
  city?: string;
  region?: string;
  browser?: string;
  os?: string;
  device?: string;
  org?: string;
  asn?: string;
  referer?: string;
  destination_url?: string;
}

export function getVisitorInfo(): Promise<VisitorInfo> {
  return fetch('https://ipapi.co/json/')
    .then(res => res.json())
    .then(data => {
      const browser = navigator.userAgent;
      return {
        ip: data.ip,
        country: data.country_name,
        city: data.city,
        region: data.region,
        org: data.org,
        asn: data.asn,
        browser,
        os: navigator.platform,
        device: (navigator as any).userAgentData && (navigator as any).userAgentData.mobile ? 'Mobile' : 'Desktop',
        referer: document.referrer,
        destination_url: window.location.href
      };
    });
}
