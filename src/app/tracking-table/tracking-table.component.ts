import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TrackingService, TrackingRecord } from '../services/tracking.service';
import { getVisitorInfo, VisitorInfo } from '../services/visitor-info';

@Component({
  selector: 'app-tracking-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tracking-table.component.html',
  styleUrls: ['./tracking-table.component.scss']
})
export class TrackingTableComponent implements OnInit {
  visitor: VisitorInfo | null = null;
  records: TrackingRecord[] = [];
  loading = true;


  constructor(private trackingService: TrackingService) { }

  ngOnInit() {
    getVisitorInfo().then(info => {
      this.visitor = info;
      // Guardar en la base de datos
      this.trackingService.addTrackingRecord({
        link_id: '',
        ip: info.ip,
        user_agent: info.browser,
        browser: info.browser,
        os: info.os,
        device: info.device,
        referer: info.referer,
        country: info.country,
        city: info.city,
        region: info.region,
        timestamp: new Date().toISOString(),
        destination_url: info.destination_url,
        isp: info.org,
        org: info.org,
        asn: info.asn
      }).subscribe({
        next: () => {
          // Después de guardar, obtener todos los registros
          this.trackingService.getTrackingRecords().subscribe(data => {
            this.records = data.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
            this.loading = false;
          });
        },
        error: () => {
          // Si hay error igual mostrar la tabla
          this.trackingService.getTrackingRecords().subscribe(data => {
            this.records = data.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
            this.loading = false;
          });
        }
      });
    });
  }
}
