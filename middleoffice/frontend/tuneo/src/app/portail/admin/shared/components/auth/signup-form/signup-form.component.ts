import { Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { Router, RouterModule } from '@angular/router';
import { AuthServiceService } from 'src/app/portail/user/core/services/auth-service.service';

@Component({
  selector: 'app-signup-form',
  standalone: true,
  imports: [
    LabelComponent,
    CheckboxComponent,
    InputFieldComponent,
    RouterModule
  ],
  templateUrl: './signup-form.component.html',
  styles: ``
})
export class SignupFormComponent {

  fname = '';
  lname = '';
  email = '';
  password = '';
  isChecked = false;
  showPassword = false;
  role: 'user' | 'partner' = 'user';

  constructor(
    private authService: AuthServiceService,
    private router: Router
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignUp() {
    if (!this.isChecked) {
      alert('Vous devez accepter les conditions d\'utilisation');
      return;
    }

    const payload = {
      usernameOrEmail: this.email,
      firstName: this.fname,
      lastName: this.lname,
      password: this.password,
      role: this.role
    };

    console.log('Données envoyées :', payload);

    this.authService.register(payload).subscribe({
      next: (res) => {
        console.log('Inscription réussie :', res);
        alert('Inscription réussie ! Vous pouvez vous connecter.');
        if (this.role === 'partner') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/user/homepage']);
        }
      },
      error: (err) => {
        console.error('Erreur inscription:', err);
        alert('Erreur : ' + (err.error?.message || err.error || err.message || 'Problème serveur'));
      }
    });
  }
}