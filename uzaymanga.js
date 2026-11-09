"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

var cheerio = require("cheerio");
var fetch_1 = require("@libs/fetch");
var novelStatus_1 = require("@libs/novelStatus");

class UzayManga {
    constructor() {
        this.id = "uzaymanga";
        this.name = "Uzay Manga";
        this.icon = "icon.png";
        this.site = "https://uzaymanga.com/";
        this.version = "1.0.0";
    }

    async getCheerio(url) {
        const res = await (0, fetch_1.fetchApi)(url);
        if (!res.ok) throw new Error("Could not reach site (" + res.status + ")");
        const text = await res.text();
        return cheerio.load(text);
    }

    async popularNovels(page) {
        const pageNum = page || 1;
        const url = `${this.site}manga?page=${pageNum}`;
        const $ = await this.getCheerio(url);
        const novels = [];
        const seen = new Set();
        
        $('a[href^="/manga/"]').each((_, el) => {
            const href = $(el).attr("href");
            if (href && !href.includes("-bolum-oku") && !seen.has(href)) {
                seen.add(href);
                const title = $(el).find("h3").first().text().trim();
                const img = $(el).find("img").first();
                const cover = img.attr("src") || img.attr("data-src") || "";
                if (title) {
                    novels.push({
                        name: title,
                        path: href.replace(/^\//, ""),
                        cover: cover
                    });
                }
            }
        });
        return novels;
    }

    async parseNovel(novelPath) {
        const url = this.site + novelPath.replace(/^\//, "");
        const $ = await this.getCheerio(url);
        
        const name = $("h1").first().text().trim();
        const cover = $('img[src*="/thumbnails/"], img[src*="/cover/"]').first().attr("src") || $('meta[property="og:image"]').attr("content") || "";
        const summary = $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || "";
        
        const chapters = [];
        const seen = new Set();
        $('a[href*="-bolum-oku"]').each((_, el) => {
            const href = $(el).attr("href");
            if (href && !seen.has(href)) {
                seen.add(href);
                const chapterText = $(el).text().trim().replace(/^(İlk|En Son) Bölüm/i, "").trim();
                chapters.push({
                    name: chapterText || "Bölüm",
                    path: href.replace(/^\//, "")
                });
            }
        });

        return {
            path: novelPath,
            name,
            cover,
            summary,
            status: novelStatus_1.NovelStatus ? novelStatus_1.NovelStatus.Ongoing : "Ongoing",
            chapters: chapters.reverse()
        };
    }

    async parseChapter(chapterPath) {
        const url = this.site + chapterPath.replace(/^\//, "");
        const $ = await this.getCheerio(url);
        const images = [];
        
        $('div[class*="ep-item"] img').each((_, el) => {
            const src = $(el).attr("src") || $(el).attr("data-src");
            if (src && !src.startsWith("data:")) {
                images.push(`<img src="${src.trim()}" />`);
            }
        });
        return images.join("\n");
    }

    async searchNovels(term, page) {
        const url = `${this.site}manga?search=${encodeURIComponent(term)}`;
        const $ = await this.getCheerio(url);
        const novels = [];
        const seen = new Set();
        
        $('a[href^="/manga/"]').each((_, el) => {
            const href = $(el).attr("href");
            if (href && !href.includes("-bolum-oku") && !seen.has(href)) {
                seen.add(href);
                const title = $(el).find("h3").first().text().trim();
                const img = $(el).find("img").first();
                const cover = img.attr("src") || img.attr("data-src") || "";
                if (title) {
                    novels.push({
                        name: title,
                        path: href.replace(/^\//, ""),
                        cover: cover
                    });
                }
            }
        });
        return novels;
    }
}

exports.default = new UzayManga();
