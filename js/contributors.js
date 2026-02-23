import { getAngularRepos, getRepoContributors, getUser } from "./api.js";
import { state } from "./state.js";

export async function renderContributors() {
  const app = document.getElementById("app");
  app.innerHTML = "<h2>Loading contributors...</h2>";

  // Fetch repos once
  let repos = state.repos;
  if (!repos.length) {
    repos = await getAngularRepos();
    state.repos = repos;
  }

  // Fetch all repo contributors in parallel with caching
  const allContributorsArray = await Promise.all(
    repos.map(async (repo) => {
      if (state.repoContributorsMap[repo.name]) return state.repoContributorsMap[repo.name];
      const contributors = await getRepoContributors(repo.name);
      state.repoContributorsMap[repo.name] = Array.isArray(contributors) ? contributors : [];
      return state.repoContributorsMap[repo.name];
    })
  );

  // Aggregate contributors
  const contributorMap = {};
  allContributorsArray.forEach(repoContributors => {
    repoContributors.forEach(c => {
      if (!contributorMap[c.login]) {
        contributorMap[c.login] = {
          login: c.login,
          avatar: c.avatar_url,
          contributions: 0,
        };
      }
      contributorMap[c.login].contributions += c.contributions;
    });
  });

  state.contributorsMap = contributorMap;
  state.contributors = Object.values(contributorMap);

  // Pre-fetch followers/public repos for top 20 contributors (optional, speeds up sorting)
  const topContributors = state.contributors
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, 20);

  await Promise.all(topContributors.map(async (c) => {
    const details = await getUser(c.login);
    if (details) {
      c.followers = details.followers;
      c.public_repos = details.public_repos;
      c.public_gists = details.public_gists;
    }
  }));

  renderList();
}

function renderList() {
  const app = document.getElementById("app");

  // Default sort: contributions
  const sorted = state.contributors.sort((a, b) => (b.contributions || 0) - (a.contributions || 0));

  app.innerHTML = `
    <h2>Angular Contributors Ranking</h2>
    <div>
      Sort by: 
      <button onclick="sortBy('contributions')">Contributions</button>
      <button onclick="sortBy('followers')">Followers</button>
      <button onclick="sortBy('public_repos')">Public Repos</button>
      <button onclick="sortBy('public_gists')">Gists</button>
    </div>
    <div id="contributors-list">
      ${sorted.map(c => `
        <div class="card">
          <img src="${c.avatar}" width="40"/>
          <a href="#/user/${c.login}">${c.login}</a>
          — Contributions: ${c.contributions || 0}
          ${c.followers !== undefined ? `| Followers: ${c.followers}` : ""}
        </div>
      `).join("")}
    </div>
  `;
}

// Sorting function
window.sortBy = function(field) {
  const app = document.getElementById("contributors-list");
  const sorted = state.contributors.sort((a, b) => (b[field] || 0) - (a[field] || 0));
  app.innerHTML = sorted.map(c => `
    <div class="card">
      <img src="${c.avatar}" width="40"/>
      <a href="#/user/${c.login}">${c.login}</a>
      — Contributions: ${c.contributions || 0}
      ${c.followers !== undefined ? `| Followers: ${c.followers}` : ""}
    </div>
  `).join("");
};