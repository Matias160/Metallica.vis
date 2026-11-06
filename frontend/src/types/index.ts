// Definiciones de tipos e interfaces del dominio de metallica.vis

export type UserRole = 'collector' | 'curator' | 'press' | 'archivista' | 'artist' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  display_name?: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  isActive?: boolean;
  is_active?: boolean;
  roles: UserRole[];
  createdAt?: string;
  created_at?: string;
  ownedCopiesCount?: number;
  owned_copies_count?: number;
  created_tracks_count?: number;
  dubs_count?: number;
  plays_count?: number;
  artist_verified?: boolean;
  artist_id?: number | null;
}

export interface Artist {
  id: number;
  name: string;
  biography?: string | null;
  verified: boolean;
  ownerUserId?: number;
  owner_user_id?: number;
  createdAt?: string;
  created_at?: string;
}

export interface Track {
  id: number;
  artistId?: number;
  artist_id?: number;
  artistName?: string;
  artist_name?: string;
  title: string;
  description?: string | null;
  audioUrl?: string;
  audio_url?: string;
  coverUrl?: string | null;
  cover_url?: string | null;
  durationSeconds?: number | null;
  duration_seconds?: number | null;
  licenseType?: string;
  license_type?: string;
  isFeatured?: boolean;
  is_featured?: boolean;
  verified?: boolean;
  createdAt?: string;
  created_at?: string;
}

export type CopyStatus = 'available' | 'owned' | 'transferred' | 'archived' | 'restored';

export interface Copy {
  id: number;
  pressingId?: number;
  pressing_id?: number;
  currentOwnerId?: number | null;
  current_owner_id?: number | null;
  parentCopyId?: number | null;
  parent_copy_id?: number | null;
  copyNumber?: number;
  copy_number?: number;
  totalCopies?: number;
  total_copies?: number;
  generation: number;
  conditionValue?: number;
  condition_value?: number;
  playbackCount?: number;
  playback_count?: number;
  status: CopyStatus;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  // Campos derivados por JOIN con tracks/pressings
  trackTitle?: string;
  track_title?: string;
  artistName?: string;
  artist_name?: string;
  coverUrl?: string | null;
  cover_url?: string | null;
  audioUrl?: string;
  audio_url?: string;
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
