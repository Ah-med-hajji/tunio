import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { Place } from '../../core/model/place.model';
import { Categorie } from '../../core/model/categorie.model';
import { PlacesService } from '../../core/services/places.service';
import { CategoriesService } from '../../core/services/categories.service';

declare const L: any;

@Component({
  selector: 'app-places',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  templateUrl: './places.component.html',
  styleUrls: ['./places.component.css'],
  providers: [MessageService]
})
export class PlacesComponent implements OnInit, OnDestroy, AfterViewChecked {

  places: Place[] = [];
  categories: Categorie[] = [];
  selectedCategory: string = 'Tous';

  newPlace: Place = this.resetPlace();
  editId: number | null = null;
  selectedPlace: Place | null = null;
  showDetail: boolean = false;

  showPickerMap: boolean = false;
  private pickerMap: any = null;
  private pickerMarker: any = null;
  private detailMap: any = null;
  private detailMapInitialized: boolean = false;

  @ViewChild('pickerMapContainer') pickerMapContainer!: ElementRef;

  constructor(
    private placesService: PlacesService,
    private categoriesService: CategoriesService,
    private messageService: MessageService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadPlaces();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroyPickerMap();
    this.destroyDetailMap();
  }

  ngAfterViewChecked(): void {
    if (this.showDetail && !this.detailMapInitialized) {
      const container = document.querySelector('[data-detail-map]') as HTMLElement;
      if (container) {
        this.detailMapInitialized = true;
        const lat = this.selectedPlace?.latitude ?? 36.8;
        const lng = this.selectedPlace?.longitude ?? 10.18;
        const zoom = this.selectedPlace?.latitude ? 15 : 12;
        setTimeout(() => {
          this.detailMap = L.map(container).setView([lat, lng], zoom);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.detailMap);
          if (this.selectedPlace?.latitude) {
            L.marker([lat, lng])
              .addTo(this.detailMap)
              .bindPopup(this.selectedPlace!.name)
              .openPopup();
          }
        }, 200);
      }
    }
  }

  loadPlaces() {
    this.placesService.getAll().subscribe({
      next: data => this.places = data,
      error: err => console.error('Erreur loadPlaces:', err)
    });
  }

  loadCategories() {
    this.categoriesService.getAll().subscribe({
      next: data => this.categories = data,
      error: err => console.error('Erreur loadCategories:', err)
    });
  }

  resetPlace(): Place {
    return {
      name: '', description: '', address: '', phone: '',
      email: '', openingHours: '', imageUrl: '', website: '',
      stars: undefined, roomsSingle: undefined, roomsDouble: undefined,
      priceSingle: undefined, priceDouble: undefined,
      fullBoard: false, halfBoard: false,
      departments: '', studentCount: undefined
    };
  }

  private getNormalizedCatName(): string {
    return this.newPlace.categorie?.name?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
  }

  private getNormalizedSelectedCatName(): string {
    return this.selectedPlace?.categorie?.name?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
  }

  get isSelectedHotel(): boolean { return this.getNormalizedSelectedCatName().includes('hotel'); }
  get isSelectedFaculte(): boolean { const n = this.getNormalizedSelectedCatName(); return n.includes('fac') || n.includes('universit') || n.includes('ecole'); }
  get isSelectedMusee(): boolean { return this.getNormalizedSelectedCatName().includes('muse'); }
  get isSelectedLocationVoiture(): boolean { return this.getNormalizedSelectedCatName().includes('location'); }
  get isSelectedRestaurant(): boolean { return this.getNormalizedSelectedCatName().includes('restaurant'); }
  get isSelectedHopital(): boolean { const n = this.getNormalizedSelectedCatName(); return n.includes('hopital') || n.includes('hopitaux'); }
  get isSelectedCafe(): boolean { return this.getNormalizedSelectedCatName().includes('cafe'); }
  get isSelectedAeroport(): boolean { return this.getNormalizedSelectedCatName().includes('aeroport'); }

  get isHotel(): boolean { return this.getNormalizedCatName().includes('hotel'); }
  get isFaculte(): boolean { const n = this.getNormalizedCatName(); return n.includes('fac') || n.includes('universit') || n.includes('ecole'); }
  get isMusee(): boolean { return this.getNormalizedCatName().includes('muse'); }
  get isLocationVoiture(): boolean { return this.getNormalizedCatName().includes('location'); }
  get isRestaurant(): boolean { return this.getNormalizedCatName().includes('restaurant'); }
  get isHopital(): boolean { const n = this.getNormalizedCatName(); return n.includes('hopital') || n.includes('hopitaux'); }
  get isCafe(): boolean { return this.getNormalizedCatName().includes('cafe'); }
  get isAeroport(): boolean { return this.getNormalizedCatName().includes('aeroport'); }

  onCategorieChange(categorie: Categorie): void { this.newPlace.categorie = categorie; }

  compareCat(a: Categorie, b: Categorie): boolean { return a && b ? a.id === b.id : a === b; }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = () => this.newPlace.imageUrl = reader.result as string;
      reader.readAsDataURL(input.files[0]);
    }
  }

  addPlace() {
    if (!this.newPlace.name || !this.newPlace.categorie) {
      this.messageService.add({ severity: 'warn', summary: 'Erreur', detail: 'Nom et catégorie requis' });
      return;
    }
    this.placesService.create(this.newPlace).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Lieu ajouté' }); this.loadPlaces(); this.cancelForm(); },
      error: err => console.error(err)
    });
  }

  editPlace(place: Place) {
    this.editId = place.id!;
    this.newPlace = JSON.parse(JSON.stringify(place));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updatePlace() {
    if (!this.editId) return;
    this.placesService.update(this.editId, this.newPlace).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Modifié' }); this.loadPlaces(); this.cancelForm(); },
      error: err => console.error(err)
    });
  }

  deletePlace(id: number) {
    if (confirm('Supprimer ce lieu ?')) {
      this.placesService.delete(id).subscribe({
        next: () => { this.loadPlaces(); this.messageService.add({ severity: 'warn', summary: 'Supprimé', detail: 'Lieu supprimé' }); },
        error: err => console.error(err)
      });
    }
  }

  cancelForm() {
    this.newPlace = this.resetPlace();
    this.editId = null;
    this.showPickerMap = false;
    this.destroyPickerMap();
  }

  togglePickerMap() {
    this.showPickerMap = !this.showPickerMap;
    if (this.showPickerMap) setTimeout(() => this.initPickerMap(), 100);
    else this.destroyPickerMap();
  }

  private initPickerMap() {
    this.pickerMap = L.map(this.pickerMapContainer.nativeElement).setView([36.8, 10.18], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.pickerMap);
    this.pickerMap.on('click', (e: any) => {
      this.ngZone.run(() => {
        this.newPlace.latitude = e.latlng.lat;
        this.newPlace.longitude = e.latlng.lng;
        if (this.pickerMarker) this.pickerMarker.setLatLng(e.latlng);
        else this.pickerMarker = L.marker(e.latlng).addTo(this.pickerMap);
      });
    });
  }

  private destroyPickerMap() {
    if (this.pickerMap) { this.pickerMap.remove(); this.pickerMap = null; }
  }

  private destroyDetailMap() {
    if (this.detailMap) { this.detailMap.remove(); this.detailMap = null; }
    this.detailMapInitialized = false;
  }

  viewDetails(place: Place) {
    this.destroyDetailMap();
    this.selectedPlace = place;
    this.showDetail = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeDetails() {
    this.destroyDetailMap();
    this.selectedPlace = null;
    this.showDetail = false;
  }

  get filteredPlaces(): Place[] {
    return this.selectedCategory === 'Tous'
      ? this.places
      : this.places.filter(p => p.categorie?.name === this.selectedCategory);
  }
  readonly regions: string[] = [
  'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès',
  'Gafsa', 'Jendouba', 'Kairouan', 'Kasserine', 'Kébili',
  'Kef', 'Mahdia', 'Manouba', 'Médenine', 'Monastir',
  'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse',
  'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'
];
}