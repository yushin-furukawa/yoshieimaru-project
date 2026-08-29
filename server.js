const http = require("http");
const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");

const RSS_URL =
    "https://rssblog.ameba.jp/yobukoyoshieimaru/rss20.xml";

const SCHEDULE_URL =
    "https://ameblo.jp/yobukoyoshieimaru/theme-10121643297.html";


// =========================
// 全角数字 → 数字
// =========================

function toNumber(text) {

    return Number(
        text.replace(/[０-９]/g, char =>
            String.fromCharCode(char.charCodeAt(0) - 0xfee0)
        )
    );

}


// =========================
// 釣果取得
// =========================

async function getCatches() {

    const response = await fetch(RSS_URL);

    const data = await response.text();

    const parser = new XMLParser();

    const result = parser.parse(data);

    const items = result.rss.channel.item.slice(0, 3);

    const articles = items.map(item => {

        const title = item.title;

        const link = item.link;

        const pubDate = item.pubDate;

        const description = item.description || "";

        const imageMatch =
            description.match(/<img[^>]+src="([^"]+)"/);

        const imageUrl =
            imageMatch ? imageMatch[1] : "";

        return {
            title,
            link,
            pubDate,
            imageUrl
        };

    });

    return articles;

}


// =========================
// 出船予定取得
// =========================

async function getSchedules() {

    console.log("日程表を取得しています...");

    const response =
        await fetch(SCHEDULE_URL);

    const data =
        await response.text();

    const links = [
        ...data.matchAll(
            /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
        )
    ];


    const schedules = [];


    // 日程記事を取得
    for (const link of links) {

        const url = link[1];

        const text = link[2]
            .replace(/<[^>]+>/g, "")
            .trim();


        if (
            !url.includes("/entry-") ||
            !text.includes("日程")
        ) {
            continue;
        }


        const articleUrl =
            "https://ameblo.jp" + url;


        console.log("日程記事：");
        console.log(text);
        console.log(articleUrl);


        try {

            const response =
                await fetch(articleUrl);

            const articleData =
                await response.text();


            const descriptionMatch =
                articleData.match(
                    /<meta[^>]+property="og:description"[^>]+content="([^"]*)"/i
                );


            if (!descriptionMatch) {

                console.log("日程情報が見つかりません");

                continue;

            }


            const description =
                descriptionMatch[1];


            // =========================
            // 月
            // =========================

            const monthMatch =
                text.match(
                    /([０-９0-9]+)月の日程/
                );


            const month =
                monthMatch
                    ? toNumber(monthMatch[1])
                    : null;


            // =========================
            // 定員
            // =========================

            const capacityMap = {};


            const capacityPattern =
                /(夜焚きイカ|落とし込み)\s*定員\s*([０-９0-9]+)名/g;


            let capacityMatch;


            while (
                (capacityMatch =
                    capacityPattern.exec(description)) !== null
            ) {

                const fishingType =
                    capacityMatch[1];

                const capacity =
                    toNumber(capacityMatch[2]);


                capacityMap[fishingType] =
                    capacity;

            }


            // =========================
            // 釣り物変更
            // =========================

            const changeMatch =
                description.match(
                    /([０-９0-9]+)日から\s*(夜焚きイカ|落とし込み)で出船/
                );


            let changeDay = null;

            let changeFishingType = null;


            if (changeMatch) {

                changeDay =
                    toNumber(changeMatch[1]);

                changeFishingType =
                    changeMatch[2];

            }


            // =========================
            // 日程
            // =========================

            const schedulePattern =
                /([０-９0-9]+)日（([月火水木金土日])）\s*([０-９0-9]+)名予約中(?:\s*（([^）]+)）)?/g;


            let scheduleMatch;


            while (
                (scheduleMatch =
                    schedulePattern.exec(description)) !== null
            ) {

                const day =
                    toNumber(scheduleMatch[1]);


                const weekday =
                    scheduleMatch[2];


                const reserved =
                    toNumber(scheduleMatch[3]);


                let fishingType =
                    scheduleMatch[4] || null;


                // 釣り物が記事に書かれていない場合
                if (
                    !fishingType &&
                    changeDay !== null
                ) {

                    if (day >= changeDay) {

                        fishingType =
                            changeFishingType;

                    } else {

                        fishingType =
                            "夜焚きイカ";

                    }

                }


                // 分からない場合
                if (!fishingType) {

                    fishingType = "不明";

                }


                const capacity =
                    capacityMap[fishingType] || null;


                const remaining =
                    capacity !== null
                        ? capacity - reserved
                        : null;


                schedules.push({

                    month,

                    day,

                    weekday,

                    fishingType,

                    reserved,

                    capacity,

                    remaining,

                    source: articleUrl

                });

            }


        } catch (error) {

            console.error(
                "日程記事取得エラー:",
                error
            );

        }

    }


    return schedules;

}


// =========================
// サーバー起動
// =========================

async function startServer() {

    try {

        const articles =
            await getCatches();


        const schedules =
            await getSchedules();


        console.log("");
        console.log("========== 完了 ==========");
        console.log(
            "釣果:",
            articles.length,
            "件"
        );
        console.log(
            "出船予定:",
            schedules.length,
            "件"
        );
        console.log("==========================");


        const server =
            http.createServer(async (req, res) => {


                // =========================
                // 釣果API
                // =========================

                if (req.url === "/api/catches") {

                    try {

                        const articles = await getCatches();

                        res.writeHead(200, {

                            "Content-Type":
                                "application/json; charset=utf-8",

                            "Access-Control-Allow-Origin":
                                "*"

                        });

                        res.end(
                            JSON.stringify(articles)
                        );

                    } catch (error) {

                        console.error(
                            "釣果取得エラー:",
                            error
                        );

                        res.writeHead(500, {

                            "Content-Type":
                                "application/json; charset=utf-8",

                            "Access-Control-Allow-Origin":
                                "*"

                        });

                        res.end(
                            JSON.stringify({
                                error: "釣果を取得できませんでした"
                            })
                        );

                    }

                    return;

                }


                // =========================
                // 出船予定API
                // =========================

                if (req.url === "/api/schedules") {

                    res.writeHead(200, {

                        "Content-Type":
                            "application/json; charset=utf-8",

                        "Access-Control-Allow-Origin":
                            "*"

                    });

                    res.end(
                        JSON.stringify(
                            schedules
                        )
                    );

                    return;

                }


                // =========================
                // HTML
                // =========================

                if (
                    req.url === "/" ||
                    req.url === "/index.html"
                ) {

                    const html =
                        fs.readFileSync(
                            "./index.html",
                            "utf-8"
                        );


                    res.writeHead(200, {

                        "Content-Type":
                            "text/html; charset=utf-8"

                    });


                    res.end(html);

                    return;

                }


                // =========================
                // CSS
                // =========================

                if (req.url.startsWith("/css/")) {

                    const filePath = path.join(".", req.url);

                    if (fs.existsSync(filePath)) {

                        const css = fs.readFileSync(filePath, "utf-8");

                        res.writeHead(200, {
                            "Content-Type": "text/css; charset=utf-8"
                        });

                        res.end(css);

                        return;
                    }


                    const css =
                        fs.readFileSync(
                            "./css/style.css",
                            "utf-8"
                        );


                    res.writeHead(200, {

                        "Content-Type":
                            "text/css; charset=utf-8"

                    });


                    res.end(css);

                    return;

                }


                // =========================
                // JavaScript
                // =========================

                if (
                    req.url.startsWith("/js/")
                ) {

                    const filePath =
                        path.join(
                            ".",
                            req.url
                        );


                    if (
                        fs.existsSync(filePath)
                    ) {

                        const js =
                            fs.readFileSync(
                                filePath,
                                "utf-8"
                            );


                        res.writeHead(200, {

                            "Content-Type":
                                "application/javascript; charset=utf-8"

                        });


                        res.end(js);

                        return;

                    }

                }


                // =========================
                // pages
                // =========================

                if (
                    req.url.startsWith("/pages/")
                ) {

                    const filePath =
                        path.join(
                            ".",
                            req.url
                        );


                    if (
                        fs.existsSync(filePath)
                    ) {

                        const html =
                            fs.readFileSync(
                                filePath,
                                "utf-8"
                            );


                        res.writeHead(200, {

                            "Content-Type":
                                "text/html; charset=utf-8"

                        });


                        res.end(html);

                        return;

                    }

                }


                // =========================
                // images
                // =========================

                if (
                    req.url.startsWith("/images/")
                ) {

                    const filePath =
                        path.join(
                            ".",
                            req.url
                        );


                    if (
                        fs.existsSync(filePath)
                    ) {

                        const image =
                            fs.readFileSync(
                                filePath
                            );


                        res.writeHead(200, {

                            "Content-Type":
                                "image/jpeg"

                        });


                        res.end(image);

                        return;

                    }

                }


                // =========================
                // 404
                // =========================

                res.writeHead(404, {

                    "Content-Type":
                        "text/plain; charset=utf-8"

                });


                res.end(
                    "ページが見つかりません"
                );

            });


        server.listen(
            3000,
            () => {

                console.log("");
                console.log(
                    "http://localhost:3000"
                );

            }
        );


    } catch (error) {

        console.error(
            "サーバー起動エラー:",
            error
        );

    }

}


startServer();