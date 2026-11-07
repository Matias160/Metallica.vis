// Adaptador unificado de iconos vectoriales para alta fidelidad en Web, Android e iOS
import React from 'react';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { TextStyle, StyleProp } from 'react-native';

export interface IconProps {
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export const Search: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="search" size={size} color={color} style={style as any} />
);

export const X: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="x" size={size} color={color} style={style as any} />
);

export const Maximize2: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="maximize" size={size} color={color} style={style as any} />
);

export const Sun: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="sun" size={size} color={color} style={style as any} />
);

export const Moon: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="moon" size={size} color={color} style={style as any} />
);

export const Clock: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="clock" size={size} color={color} style={style as any} />
);

export const ArrowDownAZ: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <MaterialCommunityIcons name="sort-alphabetical-ascending" size={size + 2} color={color} style={style as any} />
);

export const ArrowUpZA: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <MaterialCommunityIcons name="sort-alphabetical-descending" size={size + 2} color={color} style={style as any} />
);

export const Calendar: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="calendar" size={size} color={color} style={style as any} />
);

export const Sparkles: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <MaterialCommunityIcons name="star-four-points" size={size + 2} color={color} style={style as any} />
);

export const Archive: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="archive" size={size} color={color} style={style as any} />
);

export const Disc3: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="disc" size={size} color={color} style={style as any} />
);

export const Disc: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="disc" size={size} color={color} style={style as any} />
);

export const ArrowUp: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="arrow-up" size={size} color={color} style={style as any} />
);

export const Radio: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="radio" size={size} color={color} style={style as any} />
);

export const SlidersHorizontal: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="sliders" size={size} color={color} style={style as any} />
);

export const Sliders: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="sliders" size={size} color={color} style={style as any} />
);

export const Shield: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="shield" size={size} color={color} style={style as any} />
);

export const ShieldCheck: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <MaterialCommunityIcons name="shield-check" size={size + 2} color={color} style={style as any} />
);

export const User: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="user" size={size} color={color} style={style as any} />
);

export const Users: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="users" size={size} color={color} style={style as any} />
);

export const Music: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="music" size={size} color={color} style={style as any} />
);

export const Layers: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="layers" size={size} color={color} style={style as any} />
);

export const Share2: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="share-2" size={size} color={color} style={style as any} />
);

export const Eye: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="eye" size={size} color={color} style={style as any} />
);

export const CheckCircle2: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="check-circle" size={size} color={color} style={style as any} />
);

export const Check: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="check" size={size} color={color} style={style as any} />
);

export const Slash: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="slash" size={size} color={color} style={style as any} />
);

export const Award: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="award" size={size} color={color} style={style as any} />
);

export const Star: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="star" size={size} color={color} style={style as any} />
);

export const Trash2: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="trash-2" size={size} color={color} style={style as any} />
);

export const AlertTriangle: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="alert-triangle" size={size} color={color} style={style as any} />
);

export const Headphones: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="headphones" size={size} color={color} style={style as any} />
);

export const PlusCircle: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="plus-circle" size={size} color={color} style={style as any} />
);

export const Copy: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="copy" size={size} color={color} style={style as any} />
);

export const Edit3: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="edit-3" size={size} color={color} style={style as any} />
);

export const LogOut: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="log-out" size={size} color={color} style={style as any} />
);

export const Activity: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', style }) => (
  <Feather name="activity" size={size} color={color} style={style as any} />
);
