import { showAddWatchForm } from "./components/modal.js";
import { showErrorToast } from "./components/toast.js";
import { addButtonListeners, hideAllPagesAndGoToPage } from "./helpers.js";
import { onScroll, showFeedPage } from "./pages/feed.js";
import { showLoginPage } from "./pages/login.js";
import { initialiseNavProfileButton, showProfilePage } from "./pages/profile.js";
import { poll } from "./polling.js";
import * as api from "./api.js"

// If already logged in (token saved) skip login
if (localStorage.getItem("token")) {
  initialiseNavProfileButton();
  showFeedPage();
} else {
  showLoginPage();
}

// Add handler for sign out button
addButtonListeners(document.querySelector("nav .text-danger"), () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  hideAllPagesAndGoToPage(showLoginPage);
});

// Make brand logo go to feed page
document.querySelector(".navbar-brand").addEventListener("click", () => {
  hideAllPagesAndGoToPage(showFeedPage)
});


// make watch button show the modal
document.querySelector(".add-watch-btn").addEventListener("click", () => {
  showAddWatchForm()
})

// Handle infinite scroll
window.addEventListener("scroll", onScroll);

// Handle fragment based routing
window.addEventListener("hashchange", e => {
  e.preventDefault();
  const hash = window.location.hash.substring(1);
  if (hash === "feed") {
    hideAllPagesAndGoToPage(showFeedPage)
  } else if (hash.startsWith("profile=")) {
    const userId = hash.split("=")[1];
    api.getUser(userId)
      .then(() =>
        hideAllPagesAndGoToPage(() => showProfilePage(userId))
      )
      .catch(showErrorToast);

  } else if (hash) {
    showErrorToast(new Error("Invalid URL hash"));
  }
});

// Poll interval
setInterval(poll, 3000);

