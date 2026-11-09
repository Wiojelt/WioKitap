"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

var cheerio = require("cheerio");
var fetch_1 = require("@libs/fetch");
var novelStatus_1 = require("@libs/novelStatus");

class EpikNovel {
    constructor() {
        this.id = "epiknovel";
        this.name = "Epik Novel";
        this.icon = "icon.png";
        this.site = "https://www.epiknovel.com/";
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
        const url = `${this.site}seri-listesi?sayfa=${pageNum}`;
        const $ = await this.getCheerio(url);
        const novels = [];
        const seen = new Set();
        
        $(".item, .col-md-6, .media, tr").each((_, el) => {
            const a = $(el).find('a[href*="/seri/"]').first();
            const img = $(el).find("img").first();
            const href = a.attr("href");
            if (href && !href.endsWith("/seri-listesi")) {
                const path = href.replace(this.site, "");
                const name = a.text().trim() || img.attr("alt") || "";
                const cover = img.attr("data-src") || img.attr("src") || "";
                if (name && !seen.has(path)) {
                    seen.add(path);
                    novels.push({ name, path, cover });
                }
            }
        });
        return novels;
    }

    async parseNovel(novelPath) {
        const url = this.site + novelPath;
        const $ = await this.getCheerio(url);
        
        const name = $("h1").first().text().trim();
        const cover = $('.media-left img, .img-responsive, .cover img').first().attr("src") || $('meta[property="og:image"]').attr("content") || "";
        const summary = $("#ozet, .ozet, .description, p").first().text().trim();
        const genres = $('a[href*="/tur/"], a[href*="/kategori/"]').map((_, el) => $(el).text().trim()).get().join(", ");
        
        const chapters = [];
        $('a[href*="/bolum/"]').each((_, el) => {
            const href = $(el).attr("href");
            if (href) {
                chapters.push({
                    name: $(el).text().trim(),
                    path: href.replace(this.site, "")
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
            chapters: chapters
        };
    }

    async parseChapter(chapterPath) {
        const url = this.site + chapterPath;
        const $ = await this.getCheerio(url);
        const body = $("#icerik, .icerik, .entry-content, .text-content, #content").first();
        if (body.length) {
            body.find("script, style, ins, .ads, .reklam").remove();
            return body.html() || "";
        }
        return "";
    }

    async searchNovels(term, page) {
        const url = `${this.site}seri-listesi?q=${encodeURIComponent(term)}`;
        const $ = await this.getCheerio(url);
        const novels = [];
        const seen = new Set();
        
        $('a[href*="/seri/"]').each((_, el) => {
            const href = $(el).attr("href");
            const name = $(el).text().trim();
            if (href && name && !href.endsWith("/seri-listesi")) {
                const path = href.replace(this.site, "");
                if (!seen.has(path)) {
                    seen.add(path);
                    novels.push({ name, path, cover: "" });
                }
            }
        });
        return novels;
    }
}

exports.default = new EpikNovel();
