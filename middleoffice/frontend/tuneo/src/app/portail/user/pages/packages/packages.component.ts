import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PublicNavbarComponent } from '../../shared/public-navbar/public-navbar.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { PlacesService } from 'src/app/portail/admin/core/services/places.service';
import { Place } from 'src/app/portail/admin/core/model/place.model';

@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicNavbarComponent, TranslatePipe],
  templateUrl: './packages.component.html',
  styleUrls: ['../style-user.css', './packages.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class PackagesComponent implements OnInit {
  places: Place[] = [];
  isLoading = true;
  selectedCategory = 'Tous';
  categories: string[] = ['Tous'];

  private placesService = inject(PlacesService);
  private router        = inject(Router);

  ngOnInit(): void {
    this.placesService.getAll().subscribe({
      next: (data) => {
        this.places = data;
        const cats = new Set(data.map(p => p.categorie?.name?.trim()).filter(Boolean) as string[]);
        this.categories = ['Tous', ...Array.from(cats)];
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  get filtered(): Place[] {
    if (this.selectedCategory === 'Tous') return this.places;
    return this.places.filter(p => p.categorie?.name?.trim() === this.selectedCategory);
  }

  reserve(place: Place): void {
    this.router.navigate(['/reservation', place.id]);
  }

  setCategory(cat: string): void {
    this.selectedCategory = cat;
  }
}
