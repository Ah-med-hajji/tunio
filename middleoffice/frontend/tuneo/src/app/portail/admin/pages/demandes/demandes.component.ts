import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Demande } from '../../core/model/demande.model';
import { DemandesService } from '../../core/services/demandes.service';

@Component({
  selector: 'app-demandes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demandes.component.html',
  styleUrls: ['./demandes.component.css']
})
export class DemandesComponent implements OnInit {

  demandes: Demande[] = [];
  filter: 'ALL' | 'PENDING' | 'ACCEPTED' | 'REFUSED' = 'PENDING';

  constructor(private demandesService: DemandesService) {}

  ngOnInit(): void {
    this.loadDemandes();
  }

  loadDemandes() {
    this.demandesService.getAll().subscribe({
      next: data => this.demandes = data,
      error: err => console.error('Erreur loadDemandes:', err)
    });
  }

  accept(id: number) {
    this.demandesService.accept(id).subscribe({
      next: () => this.loadDemandes(),
      error: err => console.error('Erreur accept:', err)
    });
  }

  refuse(id: number) {
    this.demandesService.refuse(id).subscribe({
      next: () => this.loadDemandes(),
      error: err => console.error('Erreur refuse:', err)
    });
  }

  delete(id: number) {
    this.demandesService.delete(id).subscribe({
      next: () => this.loadDemandes(),
      error: err => console.error('Erreur delete:', err)
    });
  }

  get filteredDemandes(): Demande[] {
    if (this.filter === 'ALL') return this.demandes;
    return this.demandes.filter(d => d.statut === this.filter);
  }

  get pendingCount()  { return this.demandes.filter(d => d.statut === 'PENDING').length; }
  get acceptedCount() { return this.demandes.filter(d => d.statut === 'ACCEPTED').length; }
  get refusedCount()  { return this.demandes.filter(d => d.statut === 'REFUSED').length; }

  setFilter(f: 'ALL' | 'PENDING' | 'ACCEPTED' | 'REFUSED') {
    this.filter = f;
  }

  getBadgeClass(statut?: string): string {
    switch (statut) {
      case 'PENDING':  return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'REFUSED':  return 'bg-red-100 text-red-800';
      default:         return 'bg-gray-100 text-gray-800';
    }
  }
}