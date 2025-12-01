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
    if (!weekId) {
        titleEl.textContent = "Error: No week specified";
        return;
    }

    try {
        const res = await fetch(`${WEEK_API}&week_id=${weekId}`);
        const json = await res.json();

        if (!json.success) {
            titleEl.textContent = "Week not found";
            return;
        }

        const w = json.data;

        titleEl.textContent = w.title;
        dateEl.textContent = "Starts on: " + w.start_date;
        descEl.textContent = w.description;

        linksEl.innerHTML = "";
        if (w.links && w.links.length > 0) {
            w.links.forEach(link => {
                const li = document.createElement("li");
                li.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
                linksEl.appendChild(li);
            });
        } else {
            linksEl.innerHTML = "<li>No resources available</li>";
        }
    } catch (err) {
        console.error("Failed to load week:", err);
        titleEl.textContent = "Error loading week";
    }
}

async function loadComments() {
    if (!weekId) return;

    try {
        const res = await fetch(`${COMMENT_API}&week_id=${weekId}`);
        const json = await res.json();

        commentList.innerHTML = "";

        if (!json.success || !json.data || json.data.length === 0) {
            commentList.innerHTML = "<p>No comments yet. Be the first to comment!</p>";
            return;
        }

        json.data.forEach(c => {
            const article = document.createElement("article");
            article.className = "comment";
            article.innerHTML = `
                <p class="comment-text">${c.text}</p>
                <footer class="comment-author">Posted by: ${c.author} (${c.created_at})</footer>
            `;
            commentList.appendChild(article);
        });
    } catch (err) {
        console.error("Failed to load comments:", err);
    }
}

commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const author = document.querySelector("#comment-author").value.trim();
    const text = document.querySelector("#comment-text").value.trim();

    if (!author || !text) return;

    try {
        const res = await fetch(COMMENT_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                week_id: weekId,
                author,
                text
            })
        });

        const json = await res.json();
        if (json.success) {
            commentForm.reset();
            loadComments();
        } else {
            console.error("Failed to post comment:", json.error);
        }
    } catch (err) {
        console.error("Error posting comment:", err);
    }
});

loadWeek();
loadComments();
