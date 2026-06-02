import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { KeycloakService } from '../../core/services/keycloak.service';
import {
  UpdateProfileRequest,
  UserProfile,
  UsersService,
} from '../../core/services/users.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  providers: [MessageService],
})
export class ProfileComponent implements OnInit {
  private usersService = inject(UsersService);
  private keycloak = inject(KeycloakService);
  private toast = inject(MessageService);

  loading = true;
  saving = false;
  profile: UserProfile | null = null;
  form: UpdateProfileRequest = {};

  ngOnInit(): void {
    this.usersService.me().subscribe({
      next: (p) => {
        this.profile = p;
        this.form = {
          firstName: p.firstName,
          lastName: p.lastName,
          phone: p.phone ?? '',
          avatarUrl: p.avatarUrl ?? '',
        };
        this.loading = false;
      },
      error: (err) => {
        console.error('profile load failed', err);
        this.toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger votre profil.',
        });
        this.loading = false;
      },
    });
  }

  initials(): string {
    if (!this.profile) return '?';
    const f = (this.profile.firstName || '').trim().charAt(0);
    const l = (this.profile.lastName || '').trim().charAt(0);
    return ((f + l) || this.profile.email.charAt(0)).toUpperCase();
  }

  save(form: NgForm): void {
    if (form.invalid || this.saving) return;
    this.saving = true;
    this.usersService.updateMe(this.form).subscribe({
      next: (p) => {
        this.profile = p;
        this.saving = false;
        this.toast.add({
          severity: 'success',
          summary: 'Profil mis à jour',
          detail: 'Vos modifications ont été enregistrées.',
        });
      },
      error: (err) => {
        console.error('profile update failed', err);
        this.saving = false;
        this.toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'La mise à jour a échoué.',
        });
      },
    });
  }

  changePassword(): void {
    this.keycloak.resetPassword().catch((e) => {
      console.error('reset password failed', e);
      this.toast.add({
        severity: 'error',
        summary: 'Keycloak indisponible',
        detail: "Impossible de démarrer la procédure de changement de mot de passe.",
      });
    });
  }

  openAccountConsole(): void {
    this.keycloak.accountManagement().catch((e) => {
      console.error('account management failed', e);
    });
  }

  logout(): void {
    this.keycloak.logout();
  }
}
