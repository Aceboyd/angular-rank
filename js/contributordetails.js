import { getUser } from "./api.js";
import { state } from "./state.js";

export async function renderContributorDetails(username) {
  const app = document.getElementById("app");
  app.innerHTML = "<h2>Loading user...</h2>";

  const user = await getUser(username);
  if (!user) {
    app.innerHTML = "<h2>User not found or API error</h2>";
    return;
  }

  const repos = Object.entries(state.repoContributorsMap)
    .filter(([, contributors]) => contributors.some((c) => c.login === username))
    .map(([repoName]) => repoName);

  render(user, repos);
}

function render(user, repos) {
  const app = document.getElementById("app");

  app.innerHTML = `
    <button onclick="history.back()">Back</button>

    <div class="card">
      <img src="${user.avatar_url}" alt="${user.login} avatar" width="90" height="90"/>
      <h2>${user.name || user.login}</h2>
      <p>${user.bio || "No bio available."}</p>
      <p>Followers: ${user.followers || 0}</p>
      <p>Public Repos: ${user.public_repos || 0}</p>
      <p>Public Gists: ${user.public_gists || 0}</p>
    </div>

    <h3>Angular Repositories Contributed To</h3>

    ${repos.length ? repos.map((r) => `
      <div class="card">
        <a href="#/repo/${r}">${r}</a>
      </div>
    `).join("") : "<p>No cached repositories found for this user yet.</p>"}
  `;
}
