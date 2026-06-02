import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categorie } from '../../core/model/categorie.model';
import { CategoriesService } from '../../core/services/categories.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
  providers: [MessageService]
})
export class CategoriesComponent implements OnInit {

  categories: Categorie[] = [];
  filteredCategories: Categorie[] = [];

  formData: Categorie = { name: '', description: '' };

  // Recherche
  searchQuery = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 3;

  // Modal
  showFormModal = false;
  isEditMode = false;
  editingId: number | null = null;

  constructor(
    private categoriesService: CategoriesService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  // ─── Chargement ─────────────────────────────────────────────
  loadCategories() {
    this.categoriesService.getAll().subscribe(data => {
      this.categories = data;
      this.onSearch(); // ✅ synchronise filteredCategories après chaque chargement
    });
  }

  // ─── Recherche ───────────────────────────────────────────────
  onSearch() {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredCategories = !q
      ? [...this.categories]
      : this.categories.filter(c =>
          c.name.toLowerCase().includes(q) ||
          (c.description ?? '').toLowerCase().includes(q)
        );
    this.currentPage = 1;
  }

  // ─── Pagination ──────────────────────────────────────────────
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCategories.length / this.itemsPerPage));
  }

  get currentItems(): Categorie[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredCategories.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // ─── CRUD ────────────────────────────────────────────────────

  addCategorie() {
    this.categoriesService.create(this.formData).subscribe({
      next: () => {
        this.loadCategories();
        this.resetForm();
        this.showFormModal = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Ajout réussi',
          detail: 'Catégorie ajoutée avec succès',
          life: 3000
        });
      },
      error: (err) => {
        console.error("Erreur lors de l'ajout:", err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: "Impossible d'ajouter la catégorie",
          life: 3000
        });
      }
    });
  }

  // ✅ Nouvelle méthode : modifier une catégorie
  updateCategorie() {
    if (this.editingId === null) return;

    const updated: Categorie = { ...this.formData, id: this.editingId };

    this.categoriesService.update(this.editingId, updated).subscribe({
      next: () => {
        this.loadCategories();
        this.resetForm();
        this.showFormModal = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Modification réussie',
          detail: 'Catégorie modifiée avec succès',
          life: 3000
        });
      },
      error: (err) => {
        console.error('Erreur lors de la modification:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de modifier la catégorie',
          life: 3000
        });
      }
    });
  }

  deleteCategorie(id: number) {
    this.categoriesService.delete(id).subscribe({
      next: () => {
        this.loadCategories();
        this.messageService.add({
          severity: 'warn',
          summary: 'Suppression',
          detail: 'Catégorie supprimée',
          life: 3000
        });
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
      }
    });
  }

  // ─── Modal ───────────────────────────────────────────────────
  openAddModal() {
    this.isEditMode = false;
    this.editingId = null;
    this.resetForm();
    this.showFormModal = true;
    this.closeAllDropdowns();
  }

  handleEdit(item: Categorie) {
    this.isEditMode = true;
    this.editingId = item?.id ?? null;
    this.formData = { name: item.name, description: item.description };
    this.showFormModal = true;
    this.closeAllDropdowns();
  }

  closeFormModal() {
    this.showFormModal = false;
    this.resetForm();
  }

  // ─── Helpers ─────────────────────────────────────────────────
  resetForm() {
    this.formData = { name: '', description: '' };
    this.isEditMode = false;
    this.editingId = null;
  }

  closeAllDropdowns() {
    this.categories.forEach(cat => cat.showDropdown = false);
  }

  getBadgeColor(isActive: boolean) {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }
}