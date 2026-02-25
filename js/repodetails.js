import { getRepoContributors } from "./api.js";

export async function renderRepoDetails(repoName) {
  const app = document.getElementById("app");
  app.innerHTML = "<h2>Loading repository...</h2>";

  const contributors = await getRepoContributors(repoName);

  app.innerHTML = `
    <button onclick="history.back()">Back</button>

    <h2>${repoName}</h2>

    <h3>Contributors</h3>

    ${contributors
      .map(
        (c) => `
      <div class="card contributor-card">
        <img src="${c.avatar_url}" alt="${c.login} avatar" width="40" height="40"/>
        <div class="contributor-main">
          <a href="#/user/${c.login}">${c.login}</a>
          <p class="contributor-meta">Contributions: <strong>${c.contributions}</strong></p>
        </div>
      </div>
    `
      )
      .join("")}
  `;
}
