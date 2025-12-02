import React from 'react';
import {
  Home,
  Grid as GridIcon,
  Heart,
  User,
  ShoppingBag,
  Search,
  Settings,
  MapPin,
  Edit,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Bell,
  Star,
  Filter,
  Sliders,
  ShoppingCart,
  Tag,
} from 'lucide-react-native';

const iconMap: Record<string, React.ComponentType<any>> = {
  home: Home,
  grid: GridIcon,
  heart: Heart,
  user: User,
  'shopping-bag': ShoppingBag,
  search: Search,
  settings: Settings,
  'map-pin': MapPin,
  edit: Edit,
  check: Check,
  x: X,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  bell: Bell,
  star: Star,
  filter: Filter,
  sliders: Sliders,
  'shopping-cart': ShoppingCart,
  tag: Tag,
};

export function getIcon(name?: string): React.ComponentType<any> | null {
  if (!name) return null;
  const key = name.toLowerCase();
  return iconMap[key] || Home;
}
