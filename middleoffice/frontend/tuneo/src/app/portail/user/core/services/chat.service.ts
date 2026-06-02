import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/api/chat/ask`;

  constructor(private http: HttpClient) {}

  sendMessage(message: string, history: {role: string, content: string}[]): Observable<any> {
    return this.http.post<any>(this.apiUrl, { message, history });
  }
}
