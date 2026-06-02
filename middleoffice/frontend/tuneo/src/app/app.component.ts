import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ChatbotComponent } from './portail/user/pages/chatbot/chatbot.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
      ChatbotComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'Angular Ecommerce Dashboard | TailAdmin';
}
