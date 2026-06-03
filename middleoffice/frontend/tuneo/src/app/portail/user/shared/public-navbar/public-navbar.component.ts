import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { KeycloakService } from 'src/app/portail/admin/core/services/keycloak.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './public-navbar.component.html',
  styleUrls: ['../../pages/style-user.css'],
  encapsulation: ViewEncapsulation.None,
})
export class PublicNavbarComponent implements OnInit {
  isLogin: string | null = null;
  private keycloakService = inject(KeycloakService);
  private router = inject(Router);
  readonly ts = inject(TranslationService);

  ngOnInit(): void {
    this.isLogin = localStorage.getItem('role');
  }

  logout(): void { this.keycloakService.logout(); }
  login(): void  { this.router.navigate(['/signin']); }
}
