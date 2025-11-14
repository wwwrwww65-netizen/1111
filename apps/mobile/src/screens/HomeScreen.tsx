import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { BannerSection } from '@/components/BannerSection';
import { CarouselSection } from '@/components/CarouselSection';
import { GridSection } from '@/components/GridSection';
import { HomeSectionData } from '@/types/home';
import { resolveLink } from '@/lib/nav';

interface HomeScreenProps {
  sections?: HomeSectionData[];
  onNavigate?: (screen: string, params: Record<string, string | number | boolean>) => void;
}

/**
 * HomeScreen displays dynamic sections loaded from remote configuration.
 * Sections can be banners, carousels, or grids, allowing flexible home layouts.
 * 
 * Example usage:
 * ```tsx
 * <HomeScreen 
 *   sections={remoteConfig.sections}
 *   onNavigate={(screen, params) => navigation.navigate(screen, params)}
 * />
 * ```
 */
export function HomeScreen({ sections = [], onNavigate }: HomeScreenProps) {
  const handleLinkPress = (link?: { screen: string; params?: Record<string, string | number | boolean> }) => {
    if (!link) return;
    const resolved = resolveLink(link);
    onNavigate?.(resolved.screen, resolved.params);
  };

  const renderSection = (section: HomeSectionData) => {
    switch (section.type) {
      case 'banner':
        return (
          <BannerSection
            key={section.id}
            data={section}
            onPress={handleLinkPress}
          />
        );
      
      case 'carousel':
        return (
          <CarouselSection
            key={section.id}
            data={section}
            onItemPress={handleLinkPress}
          />
        );
      
      case 'grid':
        return (
          <GridSection
            key={section.id}
            data={section}
            onItemPress={handleLinkPress}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {sections.map(renderSection)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingVertical: 16,
  },
});
