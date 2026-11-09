"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

var cheerio = require("cheerio");
var fetch_1 = require("@libs/fetch");
var novelStatus_1 = require("@libs/novelStatus");

class TortugaCeviri {
    constructor() {
        this.id = "tortugaceviri";
        this.name = "Tortuga Çeviri";
        this.icon = "icon.png";
        this.site = "https://tortugaceviri.com/";
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
        const url = `${this.site}manga/page/${pageNum}/?m_orderby=views`;
        const $ = await this.getCheerio(url);
        const novels = [];
        
        $(".page-item-detail").each((_, el) => {
            const a = $(el).find(".post-title a, h3 a, h4 a, .item-title a").first();
            const img = $(el).find("img").first();
            const href = a.attr("href");
            if (href) {
                const path = href.replace(this.site, "");
                const name = a.text().trim();
                const cover = img.attr("data-src") || img.attr("src") || "";
                novels.push({ name, path, cover });
            }
        });
        return novels;
    }

    async parseNovel(novelPath) {
        const url = this.site + novelPath;
        const $ = await this.getCheerio(url);
        
        const name = $("h1").first().text().trim();
        const cover = $('.summary_image img').attr("data-src") || $('.summary_image img').attr("src") || $('meta[property="og:image"]').attr("content") || "";
        const summary = $(".description-summary, .summary__content").text().trim();
        const genres = $(".genres-content a").map((_, el) => $(el).text().trim()).get().join(", ");
        
        const chapters = [];
        $(".wp-manga-chapter a").each((_, el) => {
            const href = $(el).attr("href");
            if (href) {
                chapters.push({
                    name: $(el).text().trim(),
                    path: href.replace(this.site, ""),
                    releaseTime: $(el).parent().find(".chapter-release-date").text().trim() || undefined
                });
            }
        });

        return {
            path: novelPath,
            name,
            cover,
            summary,
            genres,
            status: novelStatus_1.NovelStatus ? novelStatus_1.NovelStatus.Ongoing : "Ongoing",
            chapters: chapters.reverse()
        };
    }

    async parseChapter(chapterPath) {
        const url = this.site + chapterPath;
        const $ = await this.getCheerio(url);
        const images = [];
        $(".reading-content img, .page-break img").each((_, el) => {
            const src = $(el).attr("data-src") || $(el).attr("src");
            if (src) {
                images.push(`<img src="${src.trim()}" />`);
            }
        });
        return images.join("\n");
    }

    async searchNovels(term, page) {
        const pageNum = page || 1;
        const url = `${this.site}page/${pageNum}/?s=${encodeURIComponent(term)}&post_type=wp-manga`;
        const $ = await this.getCheerio(url);
        const novels = [];
        
        $(".c-tabs-item__content, .search-wrap, .row.c-tabs-item__content").each((_, el) => {
            const a = $(el).find(".post-title a, h3 a, h4 a, .item-title a").first();
            const img = $(el).find("img").first();
            const href = a.attr("href");
            if (href && href.includes("/manga/")) {
                const path = href.replace(this.site, "");
                const name = a.text().trim();
                const cover = img.attr("data-src") || img.attr("src") || "";
                novels.push({ name, path, cover });
            }
        });
        return novels;
    }
}

exports.default = new TortugaCeviri();
