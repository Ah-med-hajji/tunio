import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PublicNavbarComponent } from '../../shared/public-navbar/public-navbar.component';
import { environment } from 'src/environments/environment';

interface Category {
  id: number;
  name: string;
  description: string;
}

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  'hotels':                   { icon: '🏨', color: '#3b82f6' },
  'restaurants':               { icon: '🍽️', color: '#ef4444' },
  'cafés':                    { icon: '☕', color: '#f59e0b' },
  'cafes':                    { icon: '☕', color: '#f59e0b' },
  'hôpitaux':                  { icon: '🏥', color: '#10b981' },
  'hopitaux':                  { icon: '🏥', color: '#10b981' },
  'musées':                    { icon: '🏛️', color: '#8b5cf6' },
  'musees':                    { icon: '🏛️', color: '#8b5cf6' },
  'facultés':                  { icon: '🎓', color: '#6366f1' },
  'facultes':                  { icon: '🎓', color: '#6366f1' },
  'location de voitures':      { icon: '🚗', color: '#f97316' },
  'aéroports en tunisie':      { icon: '✈️', color: '#0ea5e9' },
  'aeroports en tunisie':      { icon: '✈️', color: '#0ea5e9' },
};

function getMeta(name: string): { icon: string; color: string } {
  const key = name.trim().toLowerCase();
  return CATEGORY_META[key] ?? { icon: '📍', color: '#86B817' };
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, PublicNavbarComponent],
  templateUrl: './services.component.html',
  styleUrls: ['../style-user.css', './services.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ServicesComponent implements OnInit {
  categories: (Category & { icon: string; color: string })[] = [];
  isLoading = true;

  private http   = inject(HttpClient);
  private router = inject(Router);
  private API    = environment.apiUrl;

  ngOnInit(): void {
    this.http.get<Category[]>(`${this.API}/api/categories`).subscribe({
      next: (data) => {
        this.categories = data.map(c => ({ ...c, ...getMeta(c.name) }));
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  browse(categoryName: string): void {
    this.router.navigate(['/results'], { queryParams: { category: categoryName.trim() } });
  }
}
