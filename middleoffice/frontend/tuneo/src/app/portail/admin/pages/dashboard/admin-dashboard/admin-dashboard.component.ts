import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { AdminStats, AdminStatsService, MonthPoint, RecentReservation } from '../../../core/services/admin-stats.service';
import { environment } from 'src/environments/environment';

export interface PartnerStats {
  total: number;
  pending: number;
  accepted: number;
  refused: number;
  demandes: any[];
}

export interface PlaceReservation {
  id: number;
  place: { id: number; name: string };
  startDate: string;
  endDate: string;
  numberOfPeople: number;
  specialRequests: string;
  status: string;
  createdAt: string;
}

type StatsTab = 'Monthly' | 'Quarterly' | 'Annually';
type OrdersTab = 'all' | 'demanded' | 'accepted' | 'refused';

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

  // Partner view
  isPartner = localStorage.getItem('role') === 'role_partner';
  partnerStats: PartnerStats | null = null;
  partnerReservations: PlaceReservation[] = [];
  partnerTab: 'demandes' | 'reservations' = 'demandes';
  private API = environment.apiUrl;

  // Tab state
  statsTab: StatsTab = 'Monthly';
  ordersTab: OrdersTab = 'all';

  // Chart options
  monthlySalesOptions: ApexOptions = {};
  statisticsOptions: ApexOptions = {};
  targetGaugeOptions: ApexOptions = {};

  // Legacy options kept for partner section compatibility
  monthlyReservationsOptions: ApexOptions = {};
  revenueTrendOptions: ApexOptions = {};
  statusBreakdownOptions: ApexOptions = {};

  constructor(private adminStats: AdminStatsService, private http: HttpClient) {}

  ngOnInit(): void {
    if (this.isPartner) {
      this.http.get<PartnerStats>(`${this.API}/api/demandes/mine`).subscribe({
        next: (data) => { this.partnerStats = data; this.loading = false; },
        error: () => { this.error = 'Impossible de charger vos demandes.'; this.loading = false; },
      });
      this.http.get<PlaceReservation[]>(`${this.API}/api/reservations/partner-places`).subscribe({
        next: (data) => { this.partnerReservations = data; },
        error: () => {},
      });
    } else {
      this.adminStats.getStats().subscribe({
        next: (data) => {
          this.stats = data;
          this.monthlySalesOptions  = this.buildMonthlySales(data.monthlyReservations);
          this.statisticsOptions    = this.buildStatistics(data, 'Monthly');
          this.targetGaugeOptions   = this.buildTargetGauge(this.computeTargetPct(data));
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.status === 401
            ? 'Vous devez être administrateur pour consulter le tableau de bord.'
            : 'Impossible de charger les statistiques.';
          this.loading = false;
        },
      });
    }
  }

  // ── Tab handlers ──────────────────────────────────────────────────────────

  setStatsTab(tab: StatsTab): void {
    this.statsTab = tab;
    if (this.stats) {
      this.statisticsOptions = this.buildStatistics(this.stats, tab);
    }
  }

  setOrdersTab(tab: OrdersTab): void {
    this.ordersTab = tab;
  }

  // ── Computed: KPI change pills ────────────────────────────────────────────

  get ordersChangeInfo(): { pct: string; up: boolean } {
    return this.lastTwoMonthChange(this.stats?.monthlyReservations ?? []);
  }

  get customersChangeInfo(): { pct: string; up: boolean } {
    return this.lastTwoMonthChange(this.stats?.monthlyRevenue ?? []);
  }

  private lastTwoMonthChange(pts: MonthPoint[]): { pct: string; up: boolean } {
    if (pts.length < 2) return { pct: '0.00', up: true };
    const cur  = Number(pts[pts.length - 1].value);
    const prev = Number(pts[pts.length - 2].value);
    if (prev === 0) return { pct: '0.00', up: true };
    const diff = ((cur - prev) / prev) * 100;
    return { pct: Math.abs(diff).toFixed(2), up: diff >= 0 };
  }

  // ── Computed: target gauge ────────────────────────────────────────────────

  private computeTargetPct(data: AdminStats): number {
    const pts = data.monthlyReservations;
    if (pts.length === 0) return 0;
    const cur = Number(pts[pts.length - 1].value);
    const avg = pts.reduce((s, p) => s + Number(p.value), 0) / pts.length;
    const target = avg * 1.2 || 1;
    return Math.min(100, Math.round((cur / target) * 100));
  }

  get targetRevenue(): number  { return Number(this.stats?.revenueTnd ?? 0); }
  get targetGoal(): number     { return Math.round(this.targetRevenue * 1.2); }
  get targetToday(): number    {
    const pts = this.stats?.monthlyRevenue ?? [];
    return pts.length ? Number(pts[pts.length - 1].value) : 0;
  }

  // ── Computed: filtered orders table ──────────────────────────────────────

  get filteredOrders(): RecentReservation[] {
    const all = this.stats?.recentReservations ?? [];
    switch (this.ordersTab) {
      case 'demanded': return all.filter(r => r.status === 'PENDING');
      case 'accepted': return all.filter(r => r.status === 'CONFIRMED');
      case 'refused':  return all.filter(r => r.status === 'CANCELLED');
      default:         return all;
    }
  }

  orderStatusLabel(s: string): string {
    switch (s) {
      case 'PENDING':   return 'Demanded';
      case 'CONFIRMED': return 'Accepted';
      case 'CANCELLED': return 'Refused';
      default:          return s;
    }
  }

  orderStatusClass(s: string): string {
    switch (s) {
      case 'PENDING':   return 'status-demanded';
      case 'CONFIRMED': return 'status-accepted';
      case 'CANCELLED': return 'status-refused';
      default:          return '';
    }
  }

  // ── Computed: demographic data ────────────────────────────────────────────

  get demographicData(): { flag: string; name: string; count: number; pct: number }[] {
    const total = this.stats?.usersCount ?? 0;
    return [
      { flag: '🇹🇳', name: 'Tunisie',    count: Math.round(total * 0.57), pct: 57 },
      { flag: '🇫🇷', name: 'France',     count: Math.round(total * 0.26), pct: 26 },
      { flag: '🇩🇪', name: 'Allemagne',  count: Math.round(total * 0.17), pct: 17 },
    ];
  }

  // ── Partner helpers ───────────────────────────────────────────────────────

  get reservationStats() {
    const r = this.partnerReservations;
    return {
      total:     r.length,
      confirmed: r.filter(x => x.status === 'CONFIRMED').length,
      pending:   r.filter(x => x.status === 'PENDING').length,
      cancelled: r.filter(x => x.status === 'CANCELLED').length,
    };
  }

  resStatusLabel(s: string): string {
    switch (s) {
      case 'CONFIRMED': return 'Confirmée';
      case 'PENDING':   return 'En attente';
      case 'CANCELLED': return 'Annulée';
      default:          return s;
    }
  }

  resStatusClass(s: string): string {
    switch (s) {
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-800';
      case 'PENDING':   return 'bg-amber-100 text-amber-800';
      case 'CANCELLED': return 'bg-rose-100 text-rose-800';
      default:          return 'bg-gray-100 text-gray-800';
    }
  }

  // Keep for old partner section
  statusLabel(status: string): string { return this.resStatusLabel(status); }
  statusClass(status: string): string { return this.resStatusClass(status); }

  // ── Chart builders ────────────────────────────────────────────────────────

  private buildMonthlySales(pts: MonthPoint[]): ApexOptions {
    const months   = pts.map(p => this.shortMonth(p.month));
    const values   = pts.map(p => Number(p.value));
    return {
      chart: { type: 'bar', height: 220, toolbar: { show: false }, fontFamily: 'Outfit, Inter, sans-serif' },
      series: [{ name: 'Sales', data: values }],
      xaxis: {
        categories: months,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#667085', fontSize: '12px' } },
      },
      yaxis: { labels: { style: { colors: '#667085', fontSize: '12px' } } },
      plotOptions: { bar: { borderRadius: 6, columnWidth: '50%' } },
      colors: ['#465FFF'],
      dataLabels: { enabled: false },
      grid: { borderColor: '#F2F4F7', strokeDashArray: 4, yaxis: { lines: { show: true } } },
      tooltip: { theme: 'light' },
    };
  }

  private buildStatistics(data: AdminStats, tab: StatsTab): ApexOptions {
    const { salesPts, revPts, cats } = this.aggregateForTab(data, tab);
    return {
      chart: {
        type: 'area', height: 260, toolbar: { show: false },
        fontFamily: 'Outfit, Inter, sans-serif',
      },
      series: [
        { name: 'Sales',   data: salesPts },
        { name: 'Revenue', data: revPts   },
      ],
      xaxis: {
        categories: cats,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#667085', fontSize: '12px' } },
      },
      yaxis: { labels: { style: { colors: '#667085', fontSize: '12px' } } },
      colors: ['#465FFF', '#93AAFD'],
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0.02, stops: [0, 100] },
      },
      dataLabels: { enabled: false },
      grid: { borderColor: '#F2F4F7', strokeDashArray: 4 },
      tooltip: { shared: true, intersect: false, theme: 'light' },
      legend: { position: 'top', horizontalAlign: 'right', fontFamily: 'Outfit, Inter, sans-serif' },
    };
  }

  private aggregateForTab(data: AdminStats, tab: StatsTab) {
    const resPts = data.monthlyReservations;
    const revPts = data.monthlyRevenue;

    if (tab === 'Monthly') {
      return {
        salesPts: resPts.map(p => Number(p.value)),
        revPts:   revPts.map(p => Number(p.value)),
        cats:     resPts.map(p => this.shortMonth(p.month)),
      };
    }

    if (tab === 'Quarterly') {
      const qSales: number[] = [0, 0, 0, 0];
      const qRev:   number[] = [0, 0, 0, 0];
      resPts.forEach((p, i) => { qSales[Math.floor(i / 3)] += Number(p.value); });
      revPts.forEach((p, i) => { qRev[Math.floor(i / 3)]   += Number(p.value); });
      return { salesPts: qSales, revPts: qRev, cats: ['Q1', 'Q2', 'Q3', 'Q4'] };
    }

    // Annually
    const totalSales = resPts.reduce((s, p) => s + Number(p.value), 0);
    const totalRev   = revPts.reduce((s, p)  => s + Number(p.value), 0);
    const year       = resPts[0]?.month?.slice(0, 4) ?? new Date().getFullYear().toString();
    return { salesPts: [totalSales], revPts: [totalRev], cats: [year] };
  }

  private buildTargetGauge(pct: number): ApexOptions {
    return {
      chart: { type: 'radialBar', height: 200, fontFamily: 'Outfit, Inter, sans-serif', toolbar: { show: false } },
      series: [pct],
      plotOptions: {
        radialBar: {
          startAngle: -90,
          endAngle:    90,
          hollow: { size: '58%' },
          track: { background: '#E4E7EC', strokeWidth: '100%' },
          dataLabels: {
            name: { show: false },
            value: {
              offsetY: -10,
              fontSize: '26px',
              fontWeight: '700',
              color: '#101828',
              formatter: (v: number) => v + '%',
            },
          },
        },
      },
      fill: { colors: ['#465FFF'] },
      stroke: { lineCap: 'round' },
    };
  }

  private shortMonth(key: string): string {
    const months: Record<string, string> = {
      '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun',
      '07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec',
    };
    const m = key?.split('-')[1] ?? '';
    return months[m] ?? key;
  }
}
