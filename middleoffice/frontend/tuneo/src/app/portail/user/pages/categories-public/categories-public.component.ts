import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PublicNavbarComponent } from '../../shared/public-navbar/public-navbar.component';
import { environment } from 'src/environments/environment';

interface Category { id: number; name: string; description: string; }

const ICONS: Record<string, string> = {
  'hotels': '🏨', 'restaurants': '🍽️', 'cafés': '☕', 'cafes': '☕',
  'hôpitaux': '🏥', 'hopitaux': '🏥', 'musées': '🏛️', 'musees': '🏛️',
  'facultés': '🎓', 'facultes': '🎓', 'location de voitures': '🚗',
  'aéroports en tunisie': '✈️', 'aeroports en tunisie': '✈️',
};

@Component({
  selector: 'app-categories-public',
  standalone: true,
  imports: [CommonModule, PublicNavbarComponent, RouterLink],
  templateUrl: './categories-public.component.html',
  styleUrls: ['../style-user.css', './categories-public.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CategoriesPublicComponent implements OnInit {
  categories: (Category & { icon: string })[] = [];
  isLoading = true;

  private http   = inject(HttpClient);
  private router = inject(Router);
  private API    = environment.apiUrl;

  ngOnInit(): void {
    this.http.get<Category[]>(`${this.API}/api/categories`).subscribe({
      next: (data) => {
        this.categories = data.map(c => ({
          ...c,
          icon: ICONS[c.name.trim().toLowerCase()] ?? '📍',
        }));
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  browse(name: string): void {
    this.router.navigate(['/results'], { queryParams: { category: name.trim() } });
  }
}
