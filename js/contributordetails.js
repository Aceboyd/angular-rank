import { getUser } from "./api.js";
import { state } from "./state.js";

export async function renderContributorDetails(username) {
  const app = document.getElementById("app");
  app.innerHTML = "<h2>Loading user...</h2>";

  // Fetch user details
  const user = await getUser(username);
  if (!user) {
    app.innerHTML = "<h2>User not found or API error</h2>";
    return;
  }

  // Find repos user contributed to (using cached repoContributorsMap)
  const repos = Object.entries(state.repoContributorsMap)
    .filter(([repoName, contributors]) =>
      contributors.some(c => c.login === username)
    )
    .map(([repoName]) => repoName);

  render(user, repos);
}

function render(user, repos) {
  const app = document.getElementById("app");

  app.innerHTML = `
    <button onclick="history.back()">← Back</button>

    <div class="card">
      <img src="${user.avatar_url}" width="80"/>
      <h2>${user.name || user.login}</h2>
      <p>${user.bio || ""}</p>

      <p>Followers: ${user.followers || 0}</p>
      <p>Public Repos: ${user.public_repos || 0}</p>
      <p>Public Gists: ${user.public_gists || 0}</p>
    </div>

    <h3>Angular Repositories Contributed To</h3>

    ${repos.map(r => `
      <div class="card">
        <a href="#/repo/${r}">${r}</a>
      </div>
    `).join("")}
  `;
}