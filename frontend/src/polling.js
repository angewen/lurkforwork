import * as api from "./api.js";
import { createJobCard, updateJobCard } from "./components/jobCard.js";
import { showErrorToast, showNotificationToast } from "./components/toast.js";
import { isVisible } from "./helpers.js";
import { seenJobs } from "./pages/feed.js";
import { updateNavProfileImage, updateUserInfo } from "./pages/profile.js";

/**
 * Update all content on the website (jobs, users)
 * Should be called every second and also whenever a change is made by user
 */
export const poll = () => {
  // Don't poll if not logged in or browser offline
  if (!localStorage.getItem("token") || !navigator.onLine) return
  
  // Clear the user cache
  api.clearUserCache();
  
  // Update navbar pfp
  updateNavProfileImage();

  // Update all job cards
  for (const jobCard of document.querySelectorAll(".job-card")) {
    // Ignore the template
    if (jobCard.hasAttribute("template")) continue;

    // Extract the ids from element id
    const [, creatorId, jobId] = jobCard.id.split("-");
    api.getJob(creatorId, jobId).then(job => {
      if (!job) {
        // If the job has been deleted then remove this card
        jobCard.remove();
      } else {
        // Otherwise update content
        updateJobCard(jobCard, job);
      }
    }).catch(showErrorToast);
  }

  // If the profile is shown then update it
  if (isVisible("profile-page")) {
    updateUserInfo();
  }
  
  // For any unseen job, make notif and add to feed if visible
  const feedJobs = document.getElementById("page-column-jobs");
  api.jobFeed(0).then(jobs => {
    const unseenJobs = jobs.filter(job => !seenJobs.has(job.id));
    unseenJobs.reverse();
    for (const unseenJob of unseenJobs) {
      // Don't show notifs if it's not actually new
      if (new Date() - new Date(unseenJob.createdAt) <= 60 * 1000) {
        showNotificationToast(unseenJob);
      }
      if (isVisible("feed-page")) {
        feedJobs.prepend(createJobCard(unseenJob));
      }
      seenJobs.add(unseenJob.id);
    }
  });
}