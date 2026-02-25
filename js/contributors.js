import { getAngularRepos, getRepoContributors, getUser } from "./api.js";
import { state } from "./state.js";

const PAGE_SIZE = 24;
let visibleCount = PAGE_SIZE;
let currentSortField = "contributions";
let activeList = [];
let listObserver = null;

export async function renderContributors() {
  const app = document.getElementById("app");
  app.innerHTML = "<h2>Loading contributors...</h2>";

  let repos = state.repos;
  if (!repos.length) {
    repos = await getAngularRepos();
    state.repos = repos;
  }

  const allContributorsArray = await Promise.all(
    repos.map(async (repo) => {
      if (state.repoContributorsMap[repo.name]) {
        return state.repoContributorsMap[repo.name];
      }

      const contributors = await getRepoContributors(repo.name);
      state.repoContributorsMap[repo.name] = Array.isArray(contributors) ? contributors : [];
      return state.repoContributorsMap[repo.name];
    })
  );

  const contributorMap = {};
  allContributorsArray.forEach((repoContributors) => {
    repoContributors.forEach((c) => {
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

  const topContributors = [...state.contributors]
    .sort((a, b) => (b.contributions || 0) - (a.contributions || 0))
    .slice(0, 20);

  await Promise.all(
    topContributors.map(async (c) => {
      const details = await getUser(c.login);
      if (details) {
        c.followers = details.followers;
        c.public_repos = details.public_repos;
        c.public_gists = details.public_gists;
      }
    })
  );

  activeList = sortContributors(currentSortField);
  renderList();
}

function renderList() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <section class="hero">
      <h2>Angular Contributors Ranking</h2>
      <p>Discover top contributors across Angular repositories.</p>
    </section>
    <div class="controls">
      <span class="controls-label">Sort by</span>
      <button class="sort-button active" data-sort="contributions">Contributions</button>
      <button class="sort-button" data-sort="followers">Followers</button>
      <button class="sort-button" data-sort="public_repos">Public Repos</button>
      <button class="sort-button" data-sort="public_gists">Gists</button>
    </div>
    <div id="contributors-list"></div>
    <div id="scroll-loader" class="scroll-state">Loading more contributors...</div>
    <div id="scroll-end" class="scroll-state">You reached the end.</div>
    <div id="scroll-sentinel" aria-hidden="true"></div>
  `;

  visibleCount = PAGE_SIZE;
  attachSortEvents();
  renderVisibleCards();
  setupInfiniteScroll();
}

function sortContributors(field) {
  return [...state.contributors].sort((a, b) => (b[field] || 0) - (a[field] || 0));
}

function attachSortEvents() {
  const buttons = document.querySelectorAll(".sort-button");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.dataset.sort;
      if (!field || field === currentSortField) return;

      currentSortField = field;
      activeList = sortContributors(field);
      visibleCount = PAGE_SIZE;

      buttons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");

      renderVisibleCards();
      setupInfiniteScroll();
    });
  });
}

function renderVisibleCards() {
  const listEl = document.getElementById("contributors-list");
  const loaderEl = document.getElementById("scroll-loader");
  const endEl = document.getElementById("scroll-end");
  if (!listEl || !loaderEl || !endEl) return;

  const visibleItems = activeList.slice(0, visibleCount);
  listEl.innerHTML = visibleItems
    .map(
      (c) => `
      <article class="card contributor-card">
        <img src="${c.avatar}" alt="${c.login} avatar" width="56" height="56" />
        <div class="contributor-main">
          <a href="#/user/${c.login}" class="contributor-name">${c.login}</a>
          <p class="contributor-meta">
            Contributions: <strong>${c.contributions || 0}</strong>
            ${c.followers !== undefined ? ` | Followers: <strong>${c.followers}</strong>` : ""}
          </p>
        </div>
      </article>
    `
    )
    .join("");

  const hasMore = visibleCount < activeList.length;
  loaderEl.style.display = hasMore ? "block" : "none";
  endEl.style.display = hasMore ? "none" : "block";
}

function setupInfiniteScroll() {
  const sentinel = document.getElementById("scroll-sentinel");
  if (!sentinel) return;

  if (listObserver) listObserver.disconnect();

  listObserver = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      if (visibleCount >= activeList.length) return;

      visibleCount += PAGE_SIZE;
      renderVisibleCards();
    },
    { rootMargin: "240px 0px" }
  );

  listObserver.observe(sentinel);
}
