import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { KeycloakService } from 'src/app/portail/admin/core/services/keycloak.service';
import { DatePickerModule } from 'primeng/datepicker';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css', '../style-user.css'],
  encapsulation: ViewEncapsulation.None
})
export class HomepageComponent implements OnInit, OnDestroy {

  isLogin: any;

  private readonly keycloakService = inject(KeycloakService);
  private readonly router          = inject(Router);
  private readonly http            = inject(HttpClient);

  private readonly API = environment.apiUrl;

  // ── Régions de Tunisie ────────────────────────────────────────────────────
  readonly regions: string[] = [
    'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès',
    'Gafsa', 'Jendouba', 'Kairouan', 'Kasserine', 'Kébili',
    'Kef', 'Mahdia', 'Manouba', 'Médenine', 'Monastir',
    'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse',
    'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'
  ];

  // Régions filtrées selon ce que l'utilisateur tape
  filteredRegions: string[] = [];
  showRegionList: boolean = false;

  filterRegions(): void {
    const query = this.search.region.trim().toLowerCase();
    if (query.length === 0) {
      this.filteredRegions = [...this.regions];
    } else {
      this.filteredRegions = this.regions.filter(r =>
        r.toLowerCase().includes(query)
      );
    }
    this.showRegionList = true;
  }

  selectRegion(region: string): void {
    this.search.region = region;
    this.showRegionList = false;
  }

  // ── Tab actif ─────────────────────────────────────────────────────────────
  activeTab: string = 'hotels';
private readonly tabCategoryMap: Record<string, string> = {
  hotels:      'Hotels',
  restaurants: 'Restaurants',
  cafes:       'Cafés',
  hopitaux:    'Hôpitaux',
  voitures:    'Location de voitures',
};

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  getTabStyle(tab: string) {
    const isActive = this.activeTab === tab;
    return {
      background:   isActive ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.15)',
      color:        isActive ? '#1a1a1a'                : 'rgba(255,255,255,0.92)',
      borderColor:  isActive ? 'rgba(255,255,255,0.6)'  : 'rgba(255,255,255,0.35)',
      marginBottom: isActive ? '-2px'                   : '0',
    };
  }

  // ── Search model ──────────────────────────────────────────────────────────
  search = {
    region:      '',
    delegation:  '',
    checkIn:     '',
    checkOut:    '',
    rooms:       1,
    personnes:   2,
    children:    0
  };

 today: string = '';
minCheckOut: string = '';



// Format date → YYYY-MM-DD
formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// When user selects check-in
onCheckInChange() {
  if (!this.search.checkIn) return;

  const checkInDate = new Date(this.search.checkIn);

  // 👉 set min checkout = checkin + 1 day
  const nextDay = new Date(checkInDate);
  nextDay.setDate(nextDay.getDate() + 1);

  this.minCheckOut = this.formatDate(nextDay);

  // 👉 reset checkout if invalid
  if (this.search.checkOut && this.search.checkOut < this.minCheckOut) {
    this.search.checkOut = '';
  }

 }

  // ── Guests ────────────────────────────────────────────────────────────────
  showGuests: boolean = false;

  // ── Close on outside click ────────────────────────────────────────────────
  private clickListener = (event: Event) => {
    const target = event.target as HTMLElement;
    if (target.closest && target.closest('[data-region-list]')) return;
    this.showGuests     = false;
    this.showRegionList = false;
  };

  ngOnInit(): void {
    this.isLogin = localStorage.getItem('role');
    document.addEventListener('click', this.clickListener);

      const todayDate = new Date();
  this.today = this.formatDate(todayDate);
  this.minCheckOut = this.today; 
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.clickListener);
  }

  // ── Guests logic ──────────────────────────────────────────────────────────
  toggleGuests(): void {
  this.showGuests = !this.showGuests;
}

  change(type: 'rooms' | 'personnes' | 'children', value: number): void {
    const min  = type === 'children' ? 0 : 1;
    const next = this.search[type] + value;
    if (next >= min) this.search[type] = next;
  }

  // ── Search ────────────────────────────────────────────────────────────────
private formatDateForApi(date: any): string {
  if (!date) return '';
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString().split('T')[0];
  return '';
}

searchNow(): void {
  this.showGuests     = false;
  this.showRegionList = false;
  const category = this.tabCategoryMap[this.activeTab] ?? '';
  this.router.navigate(['/results'], {
    queryParams: {
      region:     this.search.region,
      delegation: this.search.delegation,
      checkIn:    this.formatDateForApi(this.search.checkIn),
      checkOut:   this.formatDateForApi(this.search.checkOut),
      personnes:  this.search.personnes,
      category:   category
    }
  });
}

  // ── Auth ──────────────────────────────────────────────────────────────────
  logout(): void {
    this.keycloakService.logout();
    window.location.reload();
  }

  login(): void {
    this.router.navigate(['/signin']);
  }
  getSearchFields(): string[] {
  const map: Record<string, string[]> = {
    hotels:      ['region', 'delegation', 'checkIn', 'checkOut', 'voyageurs'],
    restaurants: ['region', 'delegation', 'date', 'personnes'],
    cafes:       ['region', 'delegation', 'date', 'personnes'],
    hopitaux:    ['region', 'delegation', 'date'],
    voitures:    ['region', 'delegation', 'checkIn', 'checkOut'],
  };
  return map[this.activeTab] ?? [];
}

hasField(field: string): boolean {
  return this.getSearchFields().includes(field);
}
}