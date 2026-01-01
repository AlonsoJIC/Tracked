import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TrackingService, TrackingRecord } from '../../services/tracking.service';

@Component({
  selector: 'app-tracking-table',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './tracking-table.component.html',
  styleUrls: ['./tracking-table.component.scss']
})
export class TrackingTableComponent implements OnInit {
  records: TrackingRecord[] = [];
  loading = true;

  constructor(private trackingService: TrackingService) { }

  ngOnInit() {
    this.trackingService.getTrackingRecords().subscribe(data => {
      this.records = data.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      this.loading = false;
    });
  }
}
