/* details.js – WEEK DETAILS + COMMENTS */

const WEEK_API = "./api/index.php?resource=weeks";
const COMMENT_API = "./api/index.php?resource=comments";

const params = new URLSearchParams(window.location.search);
const weekId = params.get("week_id");

const titleEl = document.querySelector("#week-title");
const dateEl = document.querySelector("#week-date");
const descEl = document.querySelector("#week-description");
const linksEl = document.querySelector("#week-links-list");
const commentList = document.querySelector("#comment-list");
const commentForm = document.querySelector("#comment-form");

async function loadWeek() {
    const res = await fetch(`${WEEK_API}&week_id=${weekId}`);
    const json = await res.json();

    if (!json.success) return;

    const w = json.data;

    titleEl.textContent = w.title;
    dateEl.textContent = w.start_date;
    descEl.textContent = w.description;

    linksEl.innerHTML = "";
    w.links.forEach(link => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
        linksEl.appendChild(li);
    });
}

async function loadComments() {
    const res = await fetch(`${COMMENT_API}&week_id=${weekId}`);
    const json = await res.json();

    commentList.innerHTML = "";

    json.data.forEach(c => {
        const article = document.createElement("article");
        article.innerHTML = `
            <p>${c.text}</p>
            <footer>Posted by: ${c.author} (${c.created_at})</footer>
        `;
        commentList.appendChild(article);
    });
}

commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const author = document.querySelector("#comment-author").value;
    const text = document.querySelector("#comment-text").value;

    await fetch(COMMENT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            week_id: weekId,
            author,
            text
        })
    });

    commentForm.reset();
    loadComments();
});

loadWeek();
loadComments();
