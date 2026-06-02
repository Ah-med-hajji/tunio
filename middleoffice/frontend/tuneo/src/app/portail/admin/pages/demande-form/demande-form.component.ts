import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Demande } from '../../core/model/demande.model';
import { Categorie } from '../../core/model/categorie.model';
import { DemandesService } from '../../core/services/demandes.service';
import { CategoriesService } from '../../core/services/categories.service';
import { KeycloakService } from '../../core/services/keycloak.service';

@Component({
  selector: 'app-demande-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demande-form.component.html',
  styleUrls: ['./demande-form.component.css']
})
export class DemandeFormComponent implements OnInit {

  categories: Categorie[] = [];
  submitted = false;
  successMessage = '';
  errorMessage = '';

  demande: Demande = this.resetDemande();

  constructor(
    private demandesService: DemandesService,
    private categoriesService: CategoriesService,
    private keycloak: KeycloakService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoriesService.getAll().subscribe({
      next: data => this.categories = data,
      error: err => console.error('Erreur categories:', err)
    });
  }

  resetDemande(): Demande {
    return {
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      imageUrl: '',
      categorie: {} as Categorie
    };
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = () => this.demande.imageUrl = reader.result as string;
      reader.readAsDataURL(input.files[0]);
    }
  }

  submit() {
    if (!this.demande.name || !this.demande.categorie?.id) {
      this.errorMessage = 'Le nom et la catégorie sont obligatoires.';
      return;
    }

    this.demande.clientUsername = this.keycloak.getUsername();

    this.demandesService.create(this.demande).subscribe({
      next: () => {
        this.successMessage = 'Votre demande a été envoyée avec succès !';
        this.errorMessage = '';
        this.demande = this.resetDemande();
        this.submitted = true;
      },
      error: err => {
        this.errorMessage = 'Erreur lors de l\'envoi de la demande.';
        console.error(err);
      }
    });
  }

  goToDemandes() {
    this.router.navigate(['/demandes']);
  }
}