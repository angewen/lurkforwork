import * as api from "../api.js";
import { createJobCard } from "../components/jobCard.js";
import { showJobForm } from "../components/modal.js";
import { showErrorToast } from "../components/toast.js";
import { addButtonListeners, getUserImage, hideAllPagesAndGoToPage, isVisible } from "../helpers.js";
import { showProfilePage } from "./profile.js";

/////////////////////////////////////////////////////////////////////////////

const feedPage = document.getElementById("feed-page");
const pageColumnJobs = document.getElementById("page-column-jobs");

export const showFeedPage = () => {
  start = 0;
  // Unhide feed page
  feedPage.classList.remove("hidden");

  // Pfp for add job button
  api.getUser(parseInt(localStorage.getItem("userId"))).then(user => {
    const addJobImg = feedPage.querySelector(".start-post .profile-pic");
    addJobImg.src = getUserImage(user);
    addButtonListeners(addJobImg, () => {
      hideAllPagesAndGoToPage(() => showProfilePage(user.id));
    });
  }).catch(showErrorToast);

  // Event listener to add jobs
  feedPage.querySelector(".add-job").addEventListener("click", () => {
    showJobForm();
  });
  
  addToFeed();
}

// Hide feed page
export const hideFeedPage = () => {
  feedPage.classList.add("hidden");
  document.getElementById("page-column-jobs").replaceChildren();
}

/////////////////////////////////////////////////////////////////////////////
// Feed notification logic

export const seenJobs = new Set();

/////////////////////////////////////////////////////////////////////////////
// Infinite scroll logic

let start = 0;

/**
 * Handler that triggers infinite scroll
 */
export const onScroll = () => {
  if (!isVisible("feed-page")) return;
  // on scroll, add to feed and increment start
  const {scrollTop, clientHeight, scrollHeight} = document.documentElement;
  if ((scrollTop + clientHeight) >= scrollHeight) {
    addToFeed();
  }
}

/**
 * Load new jobs into the feed starting from start and incr start
 */
const addToFeed = () => {
  // Get jobs user is watching
  const feedPromise = api.jobFeed(start);

  feedPromise.then(jobs => {
    // Create a jobCard for each job
    for (const job of jobs) {
      seenJobs.add(job.id);
      const jobCard = createJobCard(job);
      // Append jobCard to feed
      pageColumnJobs.appendChild(jobCard);
    }
    start += jobs.length;
  }).catch(showErrorToast);
}