// app/sitemap.ts

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
                return [
                                {
                                                url: "https://starmoon.app",
                                                lastModified: new Date(),
                                                changeFrequency: "weekly",
                                                priority: 1,
                                },
                                {
                                                url: "https://starmoon.app/products",
                                                lastModified: new Date(),
                                                changeFrequency: "weekly",
                                                priority: 0.9,
                                },
                                {
                                                url: "https://starmoon.app/healthcare",
                                                lastModified: new Date(),
                                                changeFrequency: "monthly",
                                                priority: 0.8,
                                },
                ];
}
