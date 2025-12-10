"use client";
import React, { useEffect } from 'react';
import { apiFetch } from '../lib/api';

export default function FaviconLoader() {
    useEffect(() => {
        apiFetch<any>('/api/admin/settings/list')
            .then(data => {
                const settings = data.settings || [];
                const logo = settings.find((s: any) => s.key === 'site_logo');
                if (logo?.value?.value) {
                    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
                    if (!link) {
                        link = document.createElement('link');
                        link.rel = 'icon';
                        document.head.appendChild(link);
                    }
                    link.href = logo.value.value;
                }
            })
            .catch(() => { });
    }, []);

    return null;
}
