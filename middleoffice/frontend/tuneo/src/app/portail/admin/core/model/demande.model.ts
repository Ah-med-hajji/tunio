import { Categorie } from './categorie.model';

export interface Demande {
  id?: number;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  categorie: Categorie;
  statut?: 'PENDING' | 'ACCEPTED' | 'REFUSED';
  clientUsername?: string;
  createdAt?: string;
}