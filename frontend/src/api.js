// Functions to communicate to backend API

import { BACKEND_URL } from './config.js';

/////////////////////////////////////////////////////////////////////////////
// Helpers

/**
 * Wrapper around the Fetch API that also rejects if backend returns error
 *
 * @param url request URL
 * @param method HTTP method
 * @param params object containing URL/request params
 * @param headers headers such as auth bearer (if any)
 * @returns {Promise<Object>} JSON object
 */
function myFetch(url, method, params, headers = {}) {
  // Initialise fetch options
  const options = {
    method: method,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  };

  if (method === 'GET') {
    // If GET, params go in URL
    url += '?' + new URLSearchParams(params);
  } else {
    // Otherwise, params passed in body
    options.body = JSON.stringify(params);
  }

  return new Promise((resolve, reject) => {
    fetch(url, options)
      .then(response => response.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        resolve(json);
      })
      .catch(err => reject(err));
  });
}

// myFetch but pass the token
function authFetch(url, method, params, headers = {}) {
  return myFetch(url, method, params, {...headers, "Authorization": localStorage.getItem("token")});
}

/////////////////////////////////////////////////////////////////////////////
// Caching

let userCache = {};

export const clearUserCache = () => userCache = {};

/////////////////////////////////////////////////////////////////////////////
// Routes
// See Backend API for a description of these routes

export const register = (email, password, name) => {
  return myFetch(BACKEND_URL + "/auth/register", "POST", {email, password, name});
}

export const login = (email, password) => {
  return myFetch(BACKEND_URL + "/auth/login", "POST", {email, password});
}

export const jobFeed = (start) => {
  return authFetch(BACKEND_URL + "/job/feed", "GET", {start});
}

export const getUser = (userId) => {
  // Return cached promise if exists or add to cache
  if (!(userId in userCache)) {
    userCache[userId] = authFetch(BACKEND_URL + "/user", "GET", {userId});
  }
  return userCache[userId];
}

export const getUsers = (userIds) => {
  return Promise.all(userIds.map(getUser));
}

export const comment = (id, comment) => {
  return authFetch(BACKEND_URL + "/job/comment", "POST", {id, comment});
}

export const like = (id, turnon) => {
  return authFetch(BACKEND_URL + "/job/like", "PUT", {id, turnon});
}

export const watch = (email, turnon) => {
  return authFetch(BACKEND_URL + "/user/watch", "PUT", {email, turnon});
}

export const updateProfile = (updatedInfo) => {
  return authFetch(BACKEND_URL + "/user", "PUT", updatedInfo);
}

export const getJob = (creatorId, jobId) => {
  return getUser(creatorId).then(creator => creator.jobs.find(job => job.id === jobId));
}

export const createJob = (title, image, start, description) => {
  return authFetch(BACKEND_URL + "/job", "POST", {title, image, start, description})
}

export const updateJob = (id, title, image, start, description) => {
  return authFetch(BACKEND_URL + "/job", "PUT", {id, title, image, start, description})
}

export const deleteJob = (id) => {
  return authFetch(BACKEND_URL + "/job", "DELETE", {id});
}
