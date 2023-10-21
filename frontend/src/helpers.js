import { hideFeedPage } from "./pages/feed.js";
import { hideLoginPage } from "./pages/login.js";
import { hideProfilePage } from "./pages/profile.js";

/**
 * Given a js file object representing a jpg or png image, such as one taken
 * from a html file input element, return a promise which resolves to the file
 * data as a data url.
 * More info:
 *   https://developer.mozilla.org/en-US/docs/Web/API/File
 *   https://developer.mozilla.org/en-US/docs/Web/API/FileReader
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 *
 * Example Usage:
 *   const file = document.querySelector('input[type="file"]').files[0];
 *   console.log(fileToDataUrl(file));
 * @param {File} file The file to be read.
 * @return {Promise<string>} Promise which resolves to the file as a data url.
 */
export function fileToDataUrl(file) {
  const validFileTypes = ['image/jpeg', 'image/png', 'image/jpg']
  const valid = validFileTypes.find(type => type === file.type);
  // Bad data, let's walk away.
  if (!valid) {
    throw Error('provided file is not a png, jpg or jpeg image.');
  }

  const reader = new FileReader();
  const dataUrlPromise = new Promise((resolve, reject) => {
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result);
  });
  reader.readAsDataURL(file);
  return dataUrlPromise;
}


// Given a Date object, format it in a format containing DD MM and YYYY
export function getFormattedDate(date, format) {
  function padZeroes(num, zeroes) {
    return num.toString().padStart(zeroes, '0');
  }
  
  return format
    .replace("DD", padZeroes(date.getDate(), 2))
    .replace("MM", padZeroes(date.getMonth() + 1, 2))
    .replace("YYYY", padZeroes(date.getFullYear(), 4));
}

// Get the time posted string
// If < 24hrs ago, in terms of hours and minutes
// If > 24hrs ago, a formatted date
export function getTimePostedStr(created) {
  const currTime = new Date();

  const difference = currTime - created;
  if (difference < (24 * 60 * 60 * 1000)) {
      let minutes = Math.floor(difference / 60000);
      let hours = Math.floor(minutes / 60);
      minutes = minutes % 60;
      
      switch (hours) {
        case 0:
          hours = ""
          break;
        case 1:
          hours = `${hours} hour`
          break;
        default:
          hours = `${hours} hours`
          break;
      }

      switch (minutes) {
        case 0:
          minutes = ""
          break;
        case 1:
          minutes = `${minutes} minute`
          break;
        default:
          minutes = `${minutes} minutes`
          break;
      }

      const res = (hours === "" && minutes === "") ? "" : hours + " " + minutes + " ago";
      return res ? res : "0 minutes ago";
  } else {
      return "Posted " +  getFormattedDate(created, "DD/MM/YYYY");
  }
}

// Format a number and label into a bold element and text
export const formatCount = (count, label) => {
  const countElem = document.createElement("b");
  countElem.textContent = count.toString();
  return [
    countElem,
    document.createTextNode(" " + label + (count !== 1 ? "s" : ""))
  ];
}

// Get a users image or default if none
export const getUserImage = (user) => user.image === undefined
                                      ? "assets/person-circle.svg"
                                      : user.image;

export const hideAllPagesAndGoToPage = (callback) => {
  hideProfilePage();
  hideFeedPage();
  hideLoginPage();
  window.scroll({
    top: 0,
    left: 0,
    behavior: "smooth"
  })
  callback();
}

/**
 * Make an element interactive like a button through click or Enter/Space
 */
export const addButtonListeners = (element, callback) => {
  element.addEventListener("click", callback);
  element.addEventListener("keypress", event => {
    if (event.keyCode === 13 || event.keyCode === 32) {
      callback(event);
    }
  });
}

/**
 * Determine if an element with the given ID is currently shown
 */
export const isVisible = (id) => {
  const el = document.getElementById(id);
  return el && getComputedStyle(el).display !== "none";
}