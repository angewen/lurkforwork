import * as api from "../api.js";
import {
  addButtonListeners,
  fileToDataUrl,
  getFormattedDate,
  getUserImage,
  hideAllPagesAndGoToPage
} from "../helpers.js";
import { initialiseNavProfileButton, showProfilePage } from "../pages/profile.js";
import { poll } from "../polling.js";
import { createAlert } from "./alert.js";

const modalElem = document.getElementById("modal");
const bsModal = bootstrap.Modal.getOrCreateInstance(modalElem);

/**
 * Make the global modal appear
 *
 * @param title title of modal
 * @param bodyElems list of elements to put in body of modal
 * @param footerElems list of elements to put in footer of modal
 * @param compact boolean if this model should be compact (no padding, narrow)
 */
const showModal = (title, bodyElems, footerElems, compact) => {
  modalElem.querySelector("#modal-title").textContent = title;
  const body = modalElem.querySelector(".modal-body");
  if (compact) {
    modalElem.querySelector(".modal-dialog").classList.add("modal-sm");
    body.classList.add("p-0");
  } else {
    modalElem.querySelector(".modal-dialog").classList.remove("modal-sm");
    body.classList.remove("p-0");
  }
  body.replaceChildren(...bodyElems);
  modalElem.querySelector(".modal-footer").replaceChildren(...footerElems);
  bsModal.show();
}

/////////////////////////////////////////////////////////////////////////////
// Add watching modal
export const showAddWatchForm = () => {
  const form = document.createElement("form");
  form.name = "add-watch";
  form.id = "add-watch";
  form.append(createFormRow(form.name, "Email", "text"));

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.setAttribute("form", form.id);
  submit.classList.add("btn", "btn-primary");
  submit.textContent = "Watch";
  submit.addEventListener("click", e => handleAddWatch(e));

  showModal("Watch", [form], [submit], false);
}

const handleAddWatch = (event) => {
  event.preventDefault();
  const form = document.forms['add-watch'];
  const toWatch = form.email.value;
  api.watch(toWatch, true)
  .then(() => {
    poll();
    form.reset();
    return createAlert("add-watch-alert", "success", "Successfully watched user!");
  })
  .catch(err => createAlert("add-watch-alert", "danger", err))
  .then(alert => form.prepend(alert));
}

/////////////////////////////////////////////////////////////////////////////
// User list modal

/**
 * Show a model displaying a list of users
 */
export const showUserList = (title, userIds) => {
  api.getUsers(userIds).then(users => {
    const list = document.createElement("div");
    list.classList.add("list-group", "list-group-flush");
    list.append(...users.map(makeUserListItem));
    showModal(title, [list], [], true);
  });
}

/**
 * Create one item of a user list - image and name
 */
const makeUserListItem = (user) => {
  const li = document.createElement("a");
  li.classList.add("list-group-item", "list-group-item-action", "d-flex", "flex-row", "align-items-center", "gap-2");
  li.tabIndex = 0;
  addButtonListeners(li, () => {
    bsModal.hide();
    hideAllPagesAndGoToPage(() => showProfilePage(user.id));
  });

  const userImg = document.createElement("img");
  userImg.alt = `Profile picture of ${user.name}`;
  userImg.classList.add("profile-pic");
  userImg.src = getUserImage(user);

  const userName = document.createElement("p");
  userName.classList.add("h6", "m-0");
  userName.textContent = user.name;

  li.append(userImg, userName);
  return li;
}

/////////////////////////////////////////////////////////////////////////////
// Profile edit modal


/**
 * Show modal for editing a user's profile
 */
export const showEditProfileModal = (user) => {
  const form = document.createElement("form");
  form.name = "edit-profile";
  form.id = "edit-profile";

  form.append(
    createFormRow(form.name, "Email", "text", user.email),
    createFormRow(form.name, "Password", "password"),
    createFormRow(form.name, "Name", "text", user.name),
    createFormRow(form.name, "Image", "file")
  );

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.setAttribute("form", form.id);
  submit.classList.add("btn", "btn-primary");
  submit.textContent = "Save";
  submit.addEventListener("click", e => handleEditProfile(e, user));

  showModal("Edit Profile", [form], [submit], false);
}

const handleEditProfile = (event, user) => {
  event.preventDefault();

  // Update things
  const form = document.forms['edit-profile'];
  getUpdatedInfo(form, user)
    .then(updatedInfo => api.updateProfile(updatedInfo))
    .then(() => {
      poll();
      initialiseNavProfileButton();
      return createAlert("edit-profile-alert", "success", "Successfully updated profile!")
    })
    .catch(err => createAlert("edit-profile-alert", "danger", err))
    .then(alert => form.prepend(alert));
}

/**
 * Promise resolves to info on edit profile form
 */
const getUpdatedInfo = (form, user) => {
  const data = new FormData(form);
  const updatedInfo = {
    name: data.get("name")
  };

  const email = data.get("email");
  if (email && email !== user.email) {
    updatedInfo.email = email;
  }

  const password = data.get("password");
  if (password) {
    updatedInfo.password = password;
  }

  // Begin a promise that returns the updated info
  let infoPromise = Promise.resolve(updatedInfo);

  // If we need to convert image, chain that to the promise
  const image = data.get("image");
  if (image.name) {
    infoPromise = infoPromise
      .then(() => fileToDataUrl(image))
      .then((dataUrl) => {
        updatedInfo.image = dataUrl
        return updatedInfo;
      })
  }

  return infoPromise;
}

/////////////////////////////////////////////////////////////////////////////
// Job create and edit modal

/**
 * Show form to create a new job or edit an existing job
 * @param job job to edit. if no current job passed,
 *                   this form creates a new job
 */
export const showJobForm = (job) => {
  const form = document.createElement("form");
  form.name = "job-form";
  form.id = "job-form";

  form.append(
    createFormRow(form.name, "Title", "text", job?.title),
    createFormRow(form.name, "Image", "file"),
    createFormRow(form.name, "Start Date", "date",
      getFormattedDate(new Date(job?.start ?? ""), "YYYY-MM-DD")),
    createFormRow(form.name, "Description", "textarea", job?.description)
  );

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Save";
  submit.setAttribute("form", form.id);
  submit.classList.add("btn", "btn-primary");
  
  let title;
  if (job) {
    title = "Edit Job";
    submit.addEventListener("click", e => handleEditJob(e, job.id));
  } else {
    title = "Create Job";
    submit.addEventListener("click", handleCreateJob);
  }

  showModal(title, [form], [submit], false);
}

const handleCreateJob = (event) => {
  event.preventDefault();

  const form = document.forms['job-form'];
  const data = new FormData(form);
  
  // fileToDataUrl needs to be inside this promise chain so can catch its errors
  Promise.resolve(data.get("image"))
    .then(fileToDataUrl)
    .then(imgData => {
      const { title, description, "start-date": startDate } = Object.fromEntries(data.entries());
      return api.createJob(
        title,
        imgData,
        startDate && new Date(startDate).toISOString(),
        description
      );
    })
    .then(() => {
      form.reset();
      return createAlert("job-form-alert", "success", "Successfully created job!");
    })
    .catch(err => createAlert("job-form-alert", "danger", err))
    .then(alert => form.prepend(alert));
}

const handleEditJob = (event, jobId) => {
  event.preventDefault();

  const form = document.forms['job-form'];
  const data = new FormData(form);

  // Create promise that resolves to an image (or doesn't)
  let imagePromise = Promise.resolve()
  const image = data.get("image");
  if (image.name) {
    imagePromise = imagePromise.then(() => fileToDataUrl(image))
  }

  // When that resolves, send to backend display response in alert
  imagePromise
    .then(image => api.updateJob(
      jobId,
      data.get("title"),
      image,
      data.get("start-date"),
      data.get("description")
    ))
    .then(() => createAlert("job-form-alert", "success", "Successfully updated job!"))
    .catch(err => createAlert("job-form-alert", "danger", err))
    .then(alert => form.prepend(alert));
}


/////////////////////////////////////////////////////////////////////////////
// Helper

/**
 * Creates an input row to be used in a modal form
 * @param formName name of the form it is to be added to
 * @param label    label of the input
 * @param type     type of the input or "textarea"
 * @param initial  initial value to show in input
 */
const createFormRow = (formName, label, type, initial="") => {
  const kebabLabel = label.toLowerCase().split(" ").join("-")
  const id = `${formName}-${kebabLabel}`;

  const row = document.createElement("div");
  row.classList.add("mb-3");

  const labelElem = document.createElement("label");
  labelElem.for = id;
  labelElem.classList.add("form-label", "text-secondary");
  labelElem.textContent = label;

  let input;
  if (type !== "textarea") {
    input = document.createElement("input");
    input.type = type;
    input.value = initial;
  } else {
    input = document.createElement("textarea");
    input.rows = 3;
    input.textContent = initial;
  }
  input.id = id;
  input.name = kebabLabel;
  input.classList.add("form-control");

  row.append(labelElem, input);
  return row;
}