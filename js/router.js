import { renderContributors } from "./contributors.js";
import { renderContributorDetails } from "./contributordetails.js";
import { renderRepoDetails } from "./repodetails.js";

export function initRouter() {

  window.addEventListener("hashchange", handleRoute);

  handleRoute();
}

function handleRoute() {

  const hash = location.hash || "#/";

  if (hash === "#/") {
    renderContributors();
  }

  else if (hash.startsWith("#/user/")) {
    const username = hash.split("/")[2];
    renderContributorDetails(username);
  }

  else if (hash.startsWith("#/repo/")) {
    const repo = hash.split("/")[2];
    renderRepoDetails(repo);
  }
}