"use client";
import React, { useEffect } from 'react';

export function ClientFaviconLoader() {
    useEffect(() => {
        // Determine API URL based on environment or default
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        fetch(`${apiUrl}/api/seo/meta?slug=/`)
            .then(res => res.json())
            .then(data => {
                if (data && data.siteLogo) {
                    processFavicon(data.siteLogo);
                }
            })
            .catch(() => { });
    }, []);

    function processFavicon(url: string) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const size = 64;
                canvas.width = size;
                canvas.height = size;

                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.clip();

                ctx.drawImage(img, 0, 0, size, size);

                // Update favicon
                const dataUrl = canvas.toDataURL('image/png');
                let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.head.appendChild(link);
                }
                link.href = dataUrl;
            } catch (e) {
                // If canvas fails (CORS), fallback to normal square
                let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.head.appendChild(link);
                }
                link.href = url;
            }
        };
    }

    return null;
}
