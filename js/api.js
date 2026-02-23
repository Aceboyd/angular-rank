import { TOKEN } from "./config.js";

const BASE = "https://api.github.com";

const headers = {
  Authorization: `token ${TOKEN}`,
};

export async function getAngularRepos() {
  const res = await fetch(`${BASE}/orgs/angular/repos?per_page=100`, { headers });
  const data = await res.json();

  if (!Array.isArray(data)) {
    console.error("GitHub API Error (Repos):", data);
    return [];
  }

  return data;
}

export async function getRepoContributors(repo) {
  const res = await fetch(`${BASE}/repos/angular/${repo}/contributors?per_page=100`, { headers });
  const data = await res.json();

  if (!Array.isArray(data)) {
    console.error(`GitHub API Error (Contributors for ${repo}):`, data);
    return [];
  }

  return data;
}

export async function getUser(username) {
  const res = await fetch(`${BASE}/users/${username}`, { headers });
  const data = await res.json();

  if (data.message) {
    console.error(`GitHub API Error (User ${username}):`, data);
    return null;
  }

  return data;
}