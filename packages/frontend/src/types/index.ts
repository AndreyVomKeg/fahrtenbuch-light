export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'BENUTZER';
  lang: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Fahrzeug {
  id: string;
  userId: string;
  kennzeichen: string;
  marke: string;
  modell: string;
  vin: string | null;
  kraftstoff: 'BENZIN' | 'DIESEL' | 'ELEKTRO' | 'HYBRID';
  tuvDatum: string | null;
  kmInitial: number;
  kmCurrent: number;
  createdAt: string;
}

export interface CreateFahrzeugInput {
  kennzeichen: string;
  marke: string;
  modell: string;
  vin?: string;
  kraftstoff?: string;
  tuvDatum?: string;
  kmInitial: number;
}

export interface UpdateFahrzeugInput {
  marke?: string;
  modell?: string;
  vin?: string;
  kraftstoff?: string;
  tuvDatum?: string;
}

export interface OdometerReading {
  id: string;
  fahrzeugId: string;
  userId: string;
  datum: string;
  kmStand: number;
  quelle: string;
  createdAt: string;
}

export type Lang = 'de' | 'en' | 'ru';
