"use client";
import { useI18n } from "../lib/i18n";

export default function NotFound(): JSX.Element {
  const { t } = useI18n();
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-3xl font-bold">{t('notFound')}</h1>
      <p className="text-gray-600 mt-2">{t('notFound')}</p>
      <a href="/" className="mt-4 px-4 py-2 bg-black text-white rounded">{t('backHome')}</a>
    </main>
  );
}

