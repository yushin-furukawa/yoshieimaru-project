const blogList = document.querySelector("#blog-list");

const article = document.createElement("div");

article.innerHTML = `
    <h3>8月20日の釣果</h3>
    <p>最新の釣果情報です。</p>
    <a href="#">記事を見る</a>
`;

blogList.appendChild(article);

fetch("https://rssblog.ameba.jp/yobukoyoshieimaru/rss20.xml")
    .then(response => response.text())
    .then(data => {
        console.log(data);
    });