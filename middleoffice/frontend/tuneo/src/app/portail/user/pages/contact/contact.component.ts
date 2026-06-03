import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PublicNavbarComponent } from '../../shared/public-navbar/public-navbar.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PublicNavbarComponent, TranslatePipe],
  templateUrl: './contact.component.html',
  styleUrls: ['../style-user.css', './contact.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ContactComponent {
  form = { name: '', email: '', subject: '', message: '' };
  submitted = false;

  send(): void {
    if (this.form.name && this.form.email && this.form.message) {
      this.submitted = true;
      this.form = { name: '', email: '', subject: '', message: '' };
    }
  }
}
