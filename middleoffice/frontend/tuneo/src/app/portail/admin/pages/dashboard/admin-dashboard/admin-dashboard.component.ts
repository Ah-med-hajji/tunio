import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { AdminStats, AdminStatsService } from '../../../core/services/admin-stats.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NgApexchartsModule, DecimalPipe, DatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  error: string | null = null;
  stats: AdminStats | null = null;

  monthlyReservationsOptions: ApexOptions = this.emptyBarOptions();
  revenueTrendOptions: ApexOptions = this.emptyLineOptions();
  statusBreakdownOptions: ApexOptions = this.emptyDonutOptions();

  constructor(private adminStats: AdminStatsService) {}

  ngOnInit(): void {
    this.adminStats.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.monthlyReservationsOptions = this.buildBar(data.monthlyReservations);
        this.revenueTrendOptions = this.buildLine(data.monthlyRevenue);
        this.statusBreakdownOptions = this.buildDonut(data.reservationStatusBreakdown);
        this.loading = false;
      },
      error: (err) => {
        console.error('admin stats failed', err);
        this.error = err?.status === 401
          ? 'Vous devez être administrateur pour consulter le tableau de bord.'
          : 'Impossible de charger les statistiques.';
        this.loading = false;
      },
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'PENDING':   return 'En attente';
      case 'CONFIRMED': return 'Confirmée';
      case 'CANCELLED': return 'Annulée';
      default:          return status;
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'PENDING':   return 'bg-amber-100 text-amber-800';
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-800';
      case 'CANCELLED': return 'bg-rose-100 text-rose-800';
      default:          return 'bg-gray-100 text-gray-800';
    }
  }

  private buildBar(points: { month: string; value: number }[]): ApexOptions {
    return {
      chart: { type: 'bar', height: 280, toolbar: { show: false } },
      series: [{ name: 'Réservations', data: points.map((p) => p.value) }],
      xaxis: { categories: points.map((p) => p.month) },
      dataLabels: { enabled: false },
      colors: ['#86B817'],
      plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
      grid: { borderColor: '#eef0f2' },
    };
  }

  private buildLine(points: { month: string; value: number }[]): ApexOptions {
    return {
      chart: { type: 'area', height: 280, toolbar: { show: false } },
      series: [{ name: 'Revenu (TND)', data: points.map((p) => Number(p.value) || 0) }],
      xaxis: { categories: points.map((p) => p.month) },
      colors: ['#2563eb'],
      stroke: { curve: 'smooth', width: 2 },
      dataLabels: { enabled: false },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } },
      grid: { borderColor: '#eef0f2' },
    };
  }

  private buildDonut(breakdown: Record<string, number>): ApexOptions {
    const labels = Object.keys(breakdown);
    return {
      chart: { type: 'donut', height: 280 },
      series: labels.map((k) => breakdown[k] || 0),
      labels: labels.map((l) => this.statusLabel(l)),
      colors: ['#f59e0b', '#10b981', '#ef4444'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: true },
    };
  }

  private emptyBarOptions(): ApexOptions {
    return { chart: { type: 'bar', height: 280 }, series: [{ name: '', data: [] }] };
  }
  private emptyLineOptions(): ApexOptions {
    return { chart: { type: 'area', height: 280 }, series: [{ name: '', data: [] }] };
  }
  private emptyDonutOptions(): ApexOptions {
    return { chart: { type: 'donut', height: 280 }, series: [] };
  }
}
