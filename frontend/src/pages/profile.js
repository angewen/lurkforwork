// Profile page
import * as api from "../api.js";
import { createJobCard } from "../components/jobCard.js";
import { showEditProfileModal, showUserList } from "../components/modal.js";
import { showErrorToast } from "../components/toast.js";
import { addButtonListeners, formatCount, getUserImage, hideAllPagesAndGoToPage } from "../helpers.js";
import { poll } from "../polling.js";

const profilePage = document.getElementById("profile-page");
const profileCard = document.querySelector("#profile-card");
const jobList = document.querySelector("#profile-jobs");

/////////////////////////////////////////////////////////////////////////////
// Exported functions to show/hide/update

let currUserId;

export const showProfilePage = (userId) => {
  profilePage.classList.remove("hidden");
  currUserId = userId;
  updateUserInfo();
}

export const hideProfilePage = () => {
  profilePage.classList.add("hidden");
  jobList.replaceChildren();
}

// Get updated info from backend and load into profile
export const updateUserInfo = () => {
  api.getUser(currUserId).then(loadUserInfo).catch(showErrorToast);
}

/////////////////////////////////////////////////////////////////////////////
// Functions for managing the profile button

const navProfileButton = document.querySelector("nav .dropdown");

export const initialiseNavProfileButton = () => {
  api.getUser(parseInt(localStorage.getItem("userId")))
    .then(user => {
      navProfileButton.querySelector("img").src = getUserImage(user);
      addButtonListeners(navProfileButton.querySelector(".dropdown-item"), () => {
        hideAllPagesAndGoToPage(() => showProfilePage(user.id));
      });
    }).catch(showErrorToast);
}

export const updateNavProfileImage = () => {
  api.getUser(parseInt(localStorage.getItem("userId")))
    .then(user => {
      navProfileButton.querySelector("img").src = getUserImage(user);
    }).catch(showErrorToast);
}

/////////////////////////////////////////////////////////////////////////////
// Event handlers and setup

/**
 * Load everything in the user info card
 */
const loadUserInfo = (user) => {
  // Set name, email, image
  profileCard.querySelector("h2").textContent = user.name;
  profileCard.querySelector(".profile-card-details p").textContent = user.email;
  const pfp = profileCard.querySelector(".profile-pic-lg");
  pfp.alt = "Profile picture of " + user.name;
  pfp.src = getUserImage(user);

  // Set job number
  profileCard.querySelector(".counter-group p").replaceChildren(
    ...formatCount(user.jobs.length, "Job")
  );

  // Set watch count
  const oldWatchCount = profileCard.querySelector(".counter-group a");
  const newWatchCount = oldWatchCount.cloneNode();
  newWatchCount.replaceChildren(...formatCount(user.watcheeUserIds.length, "Watcher"));
  addButtonListeners(newWatchCount, () => showUserList("Watchers", user.watcheeUserIds));
  oldWatchCount.replaceWith(newWatchCount);

  // Set the interaction button to the correct thing
  setInteractionButton(user);
  
  // Load jobs into list
  loadJobs(user.jobs);
}

const setInteractionButton = (user) => {
  const loggedInUser = parseInt(localStorage.getItem("userId"));
  const button = profileCard.querySelector("button");

  const newButton = button.cloneNode(true);
  const icon = newButton.querySelector("img");
  const text = newButton.querySelector("span");

  if (loggedInUser === user.id) {
    // If logged-in user's profile, show an edit button
    icon.alt = text.textContent = "Edit";
    icon.src = "assets/pencil-square.svg";
    newButton.addEventListener('click', () => showEditProfileModal(user));
  } else if (user.watcheeUserIds.includes(loggedInUser)) {
    // If watched by logged-in user, show watch button
    icon.alt = text.textContent = "Unwatch";
    icon.src = "assets/eye-slash.svg";
    newButton.addEventListener('click', () => {
      api.watch(user.email, false).then(poll);
    });
  } else {
    // Otherwise show unwatch button
    icon.alt = text.textContent = "Watch";
    icon.src = "assets/eye.svg";
    newButton.addEventListener('click', () => {
      api.watch(user.email, true).then(poll);
    });
  }

  button.replaceWith(newButton);
}

const loadJobs = (jobs) => {
  // Sort jobs in descending order of created time
  jobs = jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Create cards for any new jobs
  const numNewJobs = jobs.length - jobList.children.length;
  jobList.prepend(...jobs.slice(0, numNewJobs).map(createJobCard));
}
