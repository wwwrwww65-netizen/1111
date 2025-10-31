import { z } from 'zod';

const StringOrEmpty = z
  .string({ required_error: 'string_required' })
  .trim()
  .optional()
  .transform((val) => (val === '' ? undefined : val));

export const CategoryMiniSchema = z.object({
  id: z.string().min(1, 'category_id_required').trim(),
  name: z.string().min(1, 'category_name_required').trim(),
  image: StringOrEmpty,
});

export const PromoBannerSchema = z
  .object({
    enabled: z.boolean().default(false),
    image: StringOrEmpty,
    title: StringOrEmpty,
    href: StringOrEmpty,
  })
  .partial()
  .transform((val) => ({
    enabled: Boolean(val?.enabled),
    image: val?.image,
    title: val?.title,
    href: val?.href,
  }));

const ExplicitGridSchema = z.object({
  mode: z.literal('explicit'),
  categories: z.array(CategoryMiniSchema).default([]),
});

const FilterGridSchema = z.object({
  mode: z.literal('filter'),
  categoryIds: z.array(z.string().min(1).trim()).optional(),
  limit: z.number().int().positive().max(200).optional(),
  sortBy: z.enum(['name_asc', 'name_desc', 'created_desc']).optional(),
});

export const GridSchema = z.union([ExplicitGridSchema, FilterGridSchema]);

export const SuggestionsSchema = z
  .object({
    enabled: z.boolean().default(true),
    title: StringOrEmpty,
    items: z.array(CategoryMiniSchema).optional(),
  })
  .partial()
  .transform((val) => ({
    enabled: val?.enabled !== false,
    title: val?.title,
    items: val?.items || [],
  }));

const SidebarItemSchema = z.object({
  label: z.string().min(1, 'sidebar_label_required').trim(),
  href: StringOrEmpty,
  icon: StringOrEmpty,
  tabKey: StringOrEmpty,
  tab: StringOrEmpty,
  promoBanner: PromoBannerSchema.optional(),
  featured: z.array(CategoryMiniSchema).optional(),
  grid: GridSchema.optional(),
  suggestions: SuggestionsSchema.optional(),
});

const TabSchema = z.object({
  key: z.string().min(1, 'tab_key_required').trim(),
  label: z.string().min(1, 'tab_label_required').trim(),
  promoBanner: PromoBannerSchema.optional(),
  featured: z.array(CategoryMiniSchema).optional(),
  grid: GridSchema.optional(),
  sidebarItems: z.array(SidebarItemSchema).default([]),
});

const GlobalSidebarItemSchema = z.object({
  label: z.string().min(1).trim(),
  icon: StringOrEmpty,
  tabKey: StringOrEmpty,
  tab: StringOrEmpty,
  href: StringOrEmpty,
});

export const CategoriesPageConfigSchema = z.object({
  layout: z
    .object({
      showHeader: z.boolean().optional(),
      showTabs: z.boolean().optional(),
      showSidebar: z.boolean().optional(),
      showPromoPopup: z.boolean().optional(),
    })
    .optional(),
  // Optional preferred default tab slug to open on /categories
  defaultTabSlug: StringOrEmpty,
  promoBanner: PromoBannerSchema.optional(),
  tabs: z.array(TabSchema).default([]),
  sidebar: z.array(GlobalSidebarItemSchema).optional(),
  suggestions: z
    .union([SuggestionsSchema, z.array(CategoryMiniSchema)])
    .optional(),
  badges: z
    .array(
      z.object({
        categoryId: z.string().min(1).trim(),
        text: z.string().min(1).trim(),
      })
    )
    .optional(),
  seo: z
    .object({
      title: StringOrEmpty,
      description: StringOrEmpty,
    })
    .optional(),
});

export type CategoriesPageConfig = z.infer<typeof CategoriesPageConfigSchema>;

export function normalizeCategoriesPageConfig(input: unknown): {
  config: CategoriesPageConfig | null;
  error?: string;
} {
  if (input == null) return { config: null };
  const parsed = CategoriesPageConfigSchema.safeParse(input);
  if (!parsed.success) {
    return {
      config: null,
      error: parsed.error.flatten().formErrors.join(', ') || 'invalid_config',
    };
  }
  const tabs = parsed.data.tabs.map((tab) => ({
    ...tab,
    sidebarItems: (tab.sidebarItems || []).map((item) => ({
      ...item,
      suggestions: item.suggestions
        ? { ...item.suggestions, items: item.suggestions.items || [] }
        : undefined,
    })),
  }));
  return {
    config: {
      ...parsed.data,
      tabs,
    },
  };
}

export function assertCategoriesPageConfig(input: unknown): CategoriesPageConfig {
  const parsed = normalizeCategoriesPageConfig(input);
  if (!parsed.config) {
    throw new Error(parsed.error || 'invalid_categories_page_config');
  }
  return parsed.config;
}
