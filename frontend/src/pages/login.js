// State and functions for login page

import * as api from "../api.js";
import { closeAlert, createAlert } from "../components/alert.js";
import { showFeedPage } from "./feed.js";
import { initialiseNavProfileButton } from "./profile.js";

/////////////////////////////////////////////////////////////////////////////
// Exported functions to show/hide

const loginPage = document.getElementById("login-page");
const nav = document.querySelector("nav");

export const showLoginPage = () => {
  loginPage.classList.remove("hidden");
  nav.classList.add("hidden");
}

export const hideLoginPage = () => {
  loginPage.classList.add("hidden");
  nav.classList.remove("hidden");
}

/////////////////////////////////////////////////////////////////////////////
// Event listeners and handlers for the login page

const loginForm = document.forms['login-form'];
const loginHeading = loginForm.querySelector("h1 b");
const loginFooter = loginForm.querySelector("small");

/**
 * Set the form on the login page to login
 */
const showLoginForm = () => {
  closeAlert("login-alert");

  loginHeading.innerText = "Sign In";
  loginForm.name.classList.add("hidden");
  loginForm.confirm.classList.add("hidden");
  loginForm.submit.innerText = "Login";

  const link = document.createElement("a");
  link.classList.add("link-primary");
  link.innerText = "Register here";
  link.href = "#";
  link.addEventListener("click", showRegisterForm);
  loginFooter.replaceChildren(
    document.createTextNode("Don't have an account? "),
    link
  );
}

/**
 * Set the form on the login page to register
 */
const showRegisterForm = () => {
  closeAlert("login-alert");

  loginHeading.innerText = "Register";
  loginForm.name.classList.remove("hidden");
  loginForm.confirm.classList.remove("hidden");
  loginForm.submit.innerText = "Register";

  const link = document.createElement("a");
  link.classList.add("link-primary");
  link.innerText = "Login here";
  link.href = "#";
  link.addEventListener("click", showLoginForm);
  loginFooter.replaceChildren(
    document.createTextNode("Already have an account? "),
    link
  );
}

/**
 * Display any errors in a dismissible alert
 */
const handleError = (error) => {
  const alert = createAlert("login-alert", "danger", error);
  loginForm.insertBefore(alert, loginHeading.parentElement.nextSibling);
  loginForm.reset();
}

loginFooter.querySelector("a").addEventListener("click", showRegisterForm);
loginForm.submit.addEventListener("click", event => {
  event.preventDefault();

  // Request register/login
  const fd = new FormData(loginForm);
  let loginPromise;
  if (loginHeading.innerText === "Sign In") {
    loginPromise = api.login(fd.get("email"), fd.get("password"));
  } else {
    if (fd.get("password") !== fd.get("confirm"))
      return handleError("Passwords must match");
    loginPromise = api.register(fd.get("email"), fd.get("password"), fd.get("name"));
  }

  loginPromise
    .then(response => {
      // On success, save token
      localStorage.setItem("token", response.token);
      localStorage.setItem("userId", response.userId);

      // Navigate to feed
      closeAlert("login-alert");
      hideLoginPage();
      initialiseNavProfileButton();
      showFeedPage();
    })
    .catch(handleError)
});