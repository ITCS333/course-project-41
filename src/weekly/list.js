/* list.js – LOAD WEEKS LIST */

const API = "./api/index.php?resource=weeks";

const weekListSection = document.querySelector("#week-list-section");

function createWeekCard(week) {
    const article = document.createElement("article");
    article.classList.add("week-card");

    article.innerHTML = `
        <h2>${week.title}</h2>
        <p>Starts on: ${week.start_date}</p>
        <p>${week.description}</p>
        <a href="details.html?week_id=${week.week_id}">View Details & Discussion</a>
    `;

    return article;
}

async function loadWeeks() {
    try {
        const res = await fetch(API);
        const json = await res.json();

        if (!json.success) throw new Error(json.error);

        weekListSection.innerHTML = "";
        json.data.forEach(week => {
            weekListSection.appendChild(createWeekCard(week));
        });
    } catch (err) {
        console.error("Failed to load weeks:", err);
    }
}

loadWeeks();
