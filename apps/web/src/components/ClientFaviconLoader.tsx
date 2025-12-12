"use client";
import React, { useEffect } from 'react';

export function ClientFaviconLoader() {
    useEffect(() => {
        // Determine API URL based on environment or default
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
        try {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = url;
        } catch (e) {
            console.error('Failed to set favicon', e);
        }
    }

    return null;
}
