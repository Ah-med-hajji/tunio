import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { KeycloakService } from 'src/app/portail/admin/core/services/keycloak.service';

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './public-navbar.component.html',
  styleUrls: ['../../pages/style-user.css'],
  encapsulation: ViewEncapsulation.None,
})
export class PublicNavbarComponent implements OnInit {
  isLogin: string | null = null;
  private keycloakService = inject(KeycloakService);
  private router = inject(Router);

  ngOnInit(): void {
    this.isLogin = localStorage.getItem('role');
  }

  logout(): void {
    this.keycloakService.logout();
  }

  login(): void {
    this.router.navigate(['/signin']);
  }
}
