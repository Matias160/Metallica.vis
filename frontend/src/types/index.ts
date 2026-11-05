// Definiciones de tipos e interfaces del dominio de metallica.vis

export type UserRole = 'collector' | 'curator' | 'press' | 'archivista' | 'artist' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  isActive: boolean;
  roles: UserRole[];
  createdAt: string;
  ownedCopiesCount?: number;
}

export interface Artist {
  id: number;
  name: string;
  biography?: string | null;
  verified: boolean;
  ownerUserId: number;
  createdAt: string;
}

export interface Track {
  id: number;
  artistId: number;
  artistName?: string;
  title: string;
  description?: string | null;
  audioUrl: string;
  coverUrl?: string | null;
  durationSeconds?: number | null;
  licenseType: string;
  isFeatured: boolean;
  createdAt: string;
}

export type CopyStatus = 'available' | 'owned' | 'transferred' | 'archived' | 'restored';

export interface Copy {
  id: number;
  pressingId: number;
  currentOwnerId?: number | null;
  parentCopyId?: number | null;
  copyNumber: number;
  totalCopies?: number;
  generation: number;
  conditionValue: number;
  playbackCount: number;
  status: CopyStatus;
  createdAt: string;
  updatedAt?: string;
  // Campos derivados por JOIN con tracks/pressings
  trackTitle?: string;
  artistName?: string;
  coverUrl?: string | null;
  audioUrl?: string;
}

export interface LineageEvent {
  id: number;
  parentCopyId: number;
  childCopyId: number;
  fromUserId: number;
  toUserId: number;
  fromUsername?: string;
  toUsername?: string;
  generation: number;
  transferredAt: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  provider?: 'google' | 'spotify' | 'github' | 'email';
}

export interface SystemStats {
  totalUsers: number;
  totalArtists: number;
  totalTracks: number;
  totalPressings: number;
  totalCopiesCirculating: number;
  totalPlays: number;
  totalTransfers: number;
}

export interface OfflineTrackItem {
  id: number;
  title: string;
  artist: string;
  localAudioUri: string;
  remoteAudioUri: string;
  downloadedAt: number;
  fileSize?: number;
}
