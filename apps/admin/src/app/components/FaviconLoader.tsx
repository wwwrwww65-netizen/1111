"use client";
import React, { useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { resolveApiBase } from '../lib/apiBase';

export default function FaviconLoader() {
    useEffect(() => {
        apiFetch<any>('/api/admin/settings/list')
            .then(data => {
                const settings = data.settings || [];
                const logo = settings.find((s: any) => s.key === 'site_logo');
                if (logo?.value?.value) {
                    processFavicon(logo.value.value);
                }
            })
            .catch(() => { });
    }, []);

    function processFavicon(url: string) {
        const base = resolveApiBase();
        const img = new Image();
        // Use proxy to avoid CORS
        img.src = `${base}/api/seo/media/proxy?url=${encodeURIComponent(url)}`;
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const size = 64; // Standard favicon size
                canvas.width = size;
                canvas.height = size;

                // Circular clipping
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.clip();

                ctx.drawImage(img, 0, 0, size, size);

                const dataUrl = canvas.toDataURL('image/png');

                let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.head.appendChild(link);
                }
                link.href = dataUrl;
            } catch (e) {
                // Fallback to original square if canvas fails (CORS, etc)
                // console.error(e);
            }
        };
    }

    return null;
}
