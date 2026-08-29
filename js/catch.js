fetch("/api/catches")
    .then(response => response.json())
    .then(articles => {

        const catchList = document.querySelector("#catch-list");

        articles.forEach(article => {

            const card = document.createElement("div");

            card.className = "catch-card fade-in";

            card.innerHTML = `
                <img src="${article.imageUrl}" alt="${article.title}">

                <div class="catch-content">
                    <h3>${article.title}</h3>

                    <p>${formatDate(article.pubDate)}</p>
                    <a href="${article.link}" target="_blank">
                        ブログを見る
                    </a>
                </div>
            `;

            catchList.appendChild(card);

            // 追加したカードを少し遅れて表示
            setTimeout(() => {
                card.classList.add("show");
            }, 100);
        });

    })
    .catch(error => {

        console.error("釣果取得エラー:", error);

        const catchList = document.querySelector("#catch-list");

        catchList.innerHTML = `
            <p>現在、釣果を取得できません。</p>
        `;
    });

function formatDate(dateString) {

    const date = new Date(dateString);

    return date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

}