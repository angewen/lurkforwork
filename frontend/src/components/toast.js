import * as api from "../api.js";

/**
 * Add a toast to the toast container
 * @param content text context of toast
 * @param classes list of classes to add to the toast (if any)
 */
const showToast = (content, classes=[]) => {
  const toast = document.getElementById("toast");
  const myToast = toast.cloneNode(true);
  myToast.removeAttribute("id");
  myToast.removeAttribute("template");

  myToast.querySelector(".toast-body").textContent = content;
  myToast.classList.add(...classes);
  document.querySelector(".toast-container").appendChild(myToast);

  const bsToast = bootstrap.Toast.getOrCreateInstance(myToast);
  bsToast.show();
}

/**
 * Show a toast displaying an error
 */
export const showErrorToast = (err) => {
  showToast(err.toString(), ["text-danger", "border-danger"])
}

/**
 * Show a toast notifying of a new job
 */
export const showNotificationToast = (job) => {
  api.getUser(job.creatorId).then(user => showToast(
    `${user.name} posted a new job: ${job.title}`
  ));
}