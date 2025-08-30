"use client";
import React from "react";

type Locale = "ar" | "en";

type Dictionary = Record<string, { ar: string; en: string }>;

const dict: Dictionary = {
  home: { ar: "الرئيسية", en: "Home" },
  categories: { ar: "التصنيفات", en: "Categories" },
  search: { ar: "البحث", en: "Search" },
  account: { ar: "حسابي", en: "Account" },
  cart: { ar: "سلة التسوق", en: "Cart" },
  wishlist: { ar: "المفضلة", en: "Wishlist" },
  checkout: { ar: "الدفع", en: "Checkout" },
  notFound: { ar: "الصفحة غير موجودة", en: "Page not found" },
  backHome: { ar: "العودة للرئيسية", en: "Back to home" },
  description: { ar: "الوصف", en: "Description" },
  specs: { ar: "المواصفات", en: "Specifications" },
  reviews: { ar: "التقييمات", en: "Reviews" },
  shipping: { ar: "الشحن", en: "Shipping" },
  returns: { ar: "الإرجاع", en: "Returns" },
  apply: { ar: "تطبيق", en: "Apply" },
  coupon: { ar: "كوبون", en: "Coupon" },
  size: { ar: "المقاس", en: "Size" },
  addToCart: { ar: "أضف إلى السلة", en: "Add to cart" },
};

interface I18nContextValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  setLocale: (l: Locale) => void;
  t: (key: keyof typeof dict) => string;
}

const I18nContext = React.createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [locale, setLocaleState] = React.useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      const l = (q.get("lang") as Locale) || (localStorage.getItem("locale") as Locale) || "ar";
      return l === "en" ? "en" : "ar";
    }
    return "ar";
  });

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", l);
    }
  }, []);

  const value: I18nContextValue = React.useMemo(() => ({
    locale,
    dir: locale === "ar" ? "rtl" : "ltr",
    setLocale,
    t: (key) => dict[key]?.[locale] ?? key,
  }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function HtmlLangDir(): JSX.Element | null {
  const { locale, dir } = useI18n();
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = dir;
    }
  }, [locale, dir]);
  return null;
}

