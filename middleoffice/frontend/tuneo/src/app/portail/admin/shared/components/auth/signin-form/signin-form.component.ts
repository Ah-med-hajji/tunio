import { Component, inject } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthServiceService } from 'src/app/portail/user/core/services/auth-service.service';
import { KeycloakService } from 'src/app/portail/admin/core/services/keycloak.service';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-signin-form',
  standalone: true,
  imports: [
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule
  ],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent {

  private readonly authService = inject(AuthServiceService);
  private readonly keycloakService = inject(KeycloakService);
  private readonly router = inject(Router);

  showPassword = false;
  isChecked = false;
  email = '';
  password = '';

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    const data = {
      username: this.email,
      password: this.password
    };

    this.authService.login(data).subscribe({
      next: (res: any) => {
        console.log('SUCCESS:', res);
        const decoded: any = jwtDecode(res.access_token);
        console.log('SUCCESS:',decoded);
        const userId = decoded.sub;
        localStorage.setItem('userId', userId)
console.log("Keycloak User ID:", userId);
        const roles = decoded?.realm_access?.roles || [];
        console.log(roles);
        console.log(roles.includes('role_partner'))
            if (roles.includes('role_admin')) {
         localStorage.setItem('role', 'role_admin');
        } else if (roles.includes('role_partner')) {
          localStorage.setItem('role', 'role_partner');
        console.log('Roles:', roles);
        } else if (roles.includes('role_user')) {
          localStorage.setItem('role', 'role_user');
        console.log('Roles:', roles);
        }
        

        if (roles.includes('role_admin') || roles.includes('role_partner')) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/user/dashboard']);
        }
      },
      error: (err) => {
        console.error('ERROR:', err);
        alert('Login failed');
      }
    });
  }

  /** Kicks off Keycloak's UPDATE_PASSWORD flow (realm must have SMTP + "Forgot password" enabled). */
  resetPassword(): void {
    this.keycloakService.resetPassword().catch((e) => {
      console.error('reset password failed', e);
      alert("Impossible de démarrer la procédure de mot de passe oublié. Réessayez plus tard.");
    });
  }
}