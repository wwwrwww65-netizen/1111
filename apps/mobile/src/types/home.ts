/**
 * Type definitions for home screen sections from remote config.
 * These interfaces define the structure of banner, carousel, and grid sections
 * that can be configured remotely to customize the home screen layout.
 */

export interface BannerSectionData {
  type: 'banner';
  id: string;
  title?: string;
  imageUrl: string;
  link?: {
    screen: string;
    params?: Record<string, string | number | boolean>;
  };
  backgroundColor?: string;
}

export interface CarouselSectionData {
  type: 'carousel';
  id: string;
  title: string;
  items: Array<{
    id: string;
    name: string;
    imageUrl: string;
    price?: number;
    link?: {
      screen: string;
      params?: Record<string, string | number | boolean>;
    };
  }>;
}

export interface GridSectionData {
  type: 'grid';
  id: string;
  title: string;
  columns?: number;
  items: Array<{
    id: string;
    name: string;
    imageUrl: string;
    subtitle?: string;
    link?: {
      screen: string;
      params?: Record<string, string | number | boolean>;
    };
  }>;
}

export type HomeSectionData = BannerSectionData | CarouselSectionData | GridSectionData;

export interface RemoteConfigHome {
  sections: HomeSectionData[];
}
