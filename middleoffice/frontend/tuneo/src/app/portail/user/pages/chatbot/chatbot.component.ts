import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  time: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Bouton flottant -->
    <div class="chat-trigger" (click)="toggleChat()" [class.hidden]="isOpen">
      <div class="chat-icon">💬</div>
      <span class="chat-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
      <span class="chat-badge" *ngIf="unreadCount === 0">AI</span>
    </div>

    <!-- Fenêtre de Chat -->
    <div class="chat-window" [class.open]="isOpen">

      <!-- Header -->
      <div class="chat-header">
        <div class="header-info">
          <div class="bot-avatar">🤖</div>
          <div>
            <h3>Assistant Tunéo</h3>
            <span class="status-dot"></span>
            <p>En ligne · IA Groq</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn" (click)="clearHistory()" title="Effacer l'historique">🗑️</button>
          <button class="close-btn" (click)="toggleChat()">✕</button>
        </div>
      </div>

      <!-- Messages -->
      <div class="chat-messages" #scrollContainer>
        <div *ngFor="let msg of messages" [class]="'message ' + msg.role">
          <div class="message-bubble">
            <div class="message-content">{{ msg.content }}</div>
            <div class="message-time">{{ msg.time }}</div>
          </div>
        </div>

        <!-- Loading dots -->
        <div *ngIf="isLoading" class="message bot">
          <div class="message-bubble">
            <div class="message-content loading">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Suggestions rapides -->
      <div class="quick-suggestions" *ngIf="messages.length <= 1 && !isLoading">
        <button *ngFor="let s of suggestions" (click)="sendQuick(s)" class="suggestion-chip">
          {{ s }}
        </button>
      </div>

      <!-- Input -->
      <div class="chat-input">
        <input
          type="text"
          [(ngModel)]="userInput"
          (keyup.enter)="sendMessage()"
          placeholder="Posez votre question..."
          [disabled]="isLoading"
          #inputRef>
        <button (click)="sendMessage()" [disabled]="!userInput.trim() || isLoading" class="send-btn">
          <span *ngIf="!isLoading">➔</span>
          <span *ngIf="isLoading" class="btn-spinner"></span>
        </button>
      </div>

    </div>
  `,
  styles: [`
    /* ── Bouton flottant ──────────────────────────────── */
    .chat-trigger {
      position: fixed; bottom: 30px; right: 30px;
      width: 62px; height: 62px;
      background: linear-gradient(135deg, #86B817, #5a8a0a);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(134,184,23,0.45);
      z-index: 9990;
      transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
    }
    .chat-trigger:hover { transform: scale(1.12) rotate(6deg); }
    .chat-trigger.hidden { transform: scale(0); opacity: 0; pointer-events: none; }
    .chat-icon { font-size: 28px; }
    .chat-badge {
      position: absolute; top: -4px; right: -4px;
      background: #ef4444; color: white;
      font-size: 10px; font-weight: 800;
      min-width: 20px; height: 20px;
      padding: 0 5px; border-radius: 10px;
      border: 2px solid white;
      display: flex; align-items: center; justify-content: center;
    }

    /* ── Fenêtre chat ─────────────────────────────────── */
    .chat-window {
      position: fixed; bottom: 30px; right: 30px;
      width: 390px; height: 580px;
      background: #ffffff;
      border-radius: 24px;
      display: flex; flex-direction: column;
      box-shadow: 0 24px 64px rgba(0,0,0,0.18);
      z-index: 9991; overflow: hidden;
      transform: translateY(120px) scale(0.85);
      opacity: 0; pointer-events: none;
      transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
    }
    .chat-window.open {
      transform: translateY(0) scale(1);
      opacity: 1; pointer-events: all;
    }

    /* ── Header ───────────────────────────────────────── */
    .chat-header {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      color: white; padding: 18px 20px;
      display: flex; justify-content: space-between; align-items: center;
      flex-shrink: 0;
    }
    .header-info { display: flex; align-items: center; gap: 12px; }
    .bot-avatar {
      width: 42px; height: 42px;
      background: rgba(134,184,23,0.2);
      border: 2px solid rgba(134,184,23,0.5);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
    }
    .header-info h3 { margin: 0 0 2px; font-size: 15px; font-weight: 700; }
    .header-info p { margin: 0; font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 5px; }
    .status-dot {
      display: inline-block; width: 7px; height: 7px;
      background: #86B817; border-radius: 50%;
      box-shadow: 0 0 6px #86B817;
    }
    .header-actions { display: flex; align-items: center; gap: 8px; }
    .action-btn, .close-btn {
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
      color: #94a3b8; width: 32px; height: 32px;
      border-radius: 50%; cursor: pointer; font-size: 14px;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .action-btn:hover, .close-btn:hover { background: rgba(255,255,255,0.15); color: white; }

    /* ── Messages ─────────────────────────────────────── */
    .chat-messages {
      flex: 1; padding: 16px;
      overflow-y: auto; display: flex; flex-direction: column; gap: 10px;
      background: #f8fafc;
      scroll-behavior: smooth;
    }
    .chat-messages::-webkit-scrollbar { width: 4px; }
    .chat-messages::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

    .message { display: flex; }
    .message.user { justify-content: flex-end; }
    .message.bot  { justify-content: flex-start; }

    .message-bubble { max-width: 80%; display: flex; flex-direction: column; gap: 3px; }
    .message.user .message-bubble { align-items: flex-end; }
    .message.bot  .message-bubble { align-items: flex-start; }

    .message-content {
      padding: 11px 15px; border-radius: 18px;
      font-size: 13.5px; line-height: 1.55; white-space: pre-wrap;
    }
    .user .message-content {
      background: linear-gradient(135deg, #86B817, #5a8a0a);
      color: white; border-bottom-right-radius: 4px;
    }
    .bot .message-content {
      background: white; color: #1e293b;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .message-time { font-size: 10px; color: #94a3b8; padding: 0 4px; }

    /* ── Loading dots ─────────────────────────────────── */
    .loading { display: flex; gap: 5px; align-items: center; min-width: 48px; }
    .loading span {
      display: inline-block; width: 7px; height: 7px;
      background: #86B817; border-radius: 50%;
      animation: bounce 0.7s infinite alternate;
    }
    .loading span:nth-child(2) { animation-delay: 0.2s; }
    .loading span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { to { transform: translateY(-5px); opacity: 0.5; } }

    /* ── Suggestions rapides ──────────────────────────── */
    .quick-suggestions {
      padding: 8px 14px; display: flex; flex-wrap: wrap; gap: 6px;
      border-top: 1px solid #f1f5f9; background: white;
    }
    .suggestion-chip {
      background: #f0fdf4; border: 1px solid #bbf7d0;
      color: #15803d; font-size: 11.5px; font-weight: 500;
      padding: 5px 11px; border-radius: 20px; cursor: pointer;
      transition: all 0.2s;
    }
    .suggestion-chip:hover { background: #86B817; color: white; border-color: #86B817; }

    /* ── Input ────────────────────────────────────────── */
    .chat-input {
      padding: 14px 16px; display: flex; gap: 10px;
      border-top: 1px solid #e2e8f0; background: white; flex-shrink: 0;
    }
    .chat-input input {
      flex: 1; border: 1.5px solid #e2e8f0;
      padding: 11px 15px; border-radius: 14px;
      outline: none; font-size: 13.5px; color: #1e293b;
      transition: border-color 0.2s;
    }
    .chat-input input:focus { border-color: #86B817; }
    .send-btn {
      background: linear-gradient(135deg, #86B817, #5a8a0a);
      color: white; border: none;
      width: 44px; height: 44px; border-radius: 14px;
      cursor: pointer; font-size: 18px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s; flex-shrink: 0;
    }
    .send-btn:hover:not(:disabled) { transform: scale(1.05); }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ChatbotComponent implements OnInit, AfterViewChecked {

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = false;
  userInput = '';
  isLoading = false;
  unreadCount = 0;

  private STORAGE_KEY = 'tuneo_chat_history';

  suggestions = [
    '🏨 Hôtels disponibles à Sousse',
    '🍽️ Restaurants à Tunis',
    '🚗 Location voiture à Sfax',
    '☕ Cafés à Hammamet'
  ];

  messages: ChatMessage[] = [];

  // Historique pour Groq (format role/content)
  private groqHistory: {role: string, content: string}[] = [];

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.loadHistory();
    if (this.messages.length === 0) {
      this.addBotMessage('Bonjour ! 👋 Je suis votre assistant Tunéo. Je connais tous les établissements disponibles sur notre site. Comment puis-je vous aider ?');
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.unreadCount = 0;
  }

  sendQuick(text: string) {
    this.userInput = text;
    this.sendMessage();
  }

  sendMessage() {
    const msg = this.userInput.trim();
    if (!msg || this.isLoading) return;

    const time = this.getTime();
    this.messages.push({ role: 'user', content: msg, time });
    this.groqHistory.push({ role: 'user', content: msg });
    this.userInput = '';
    this.isLoading = true;

    this.chatService.sendMessage(msg, this.groqHistory.slice(-10)).subscribe({
      next: (res) => {
        const botText = res?.choices?.[0]?.message?.content || 'Désolé, je n\'ai pas pu obtenir une réponse.';
        this.addBotMessage(botText);
        this.groqHistory.push({ role: 'assistant', content: botText });
        this.isLoading = false;
        this.saveHistory();
        if (!this.isOpen) this.unreadCount++;
      },
      error: () => {
        this.addBotMessage('❌ Une erreur s\'est produite. Vérifiez que le serveur est en ligne.');
        this.isLoading = false;
      }
    });
  }

  clearHistory() {
    this.messages = [];
    this.groqHistory = [];
    localStorage.removeItem(this.STORAGE_KEY);
    this.addBotMessage('Historique effacé. Comment puis-je vous aider ?');
  }

  private addBotMessage(content: string) {
    this.messages.push({ role: 'bot', content, time: this.getTime() });
  }

  private saveHistory() {
    const data = {
      messages: this.messages.slice(-30),  // Garder les 30 derniers
      groqHistory: this.groqHistory.slice(-20)
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private loadHistory() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.messages = data.messages || [];
        this.groqHistory = data.groqHistory || [];
      }
    } catch { this.messages = []; this.groqHistory = []; }
  }

  private scrollToBottom() {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch {}
  }

  private getTime(): string {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
