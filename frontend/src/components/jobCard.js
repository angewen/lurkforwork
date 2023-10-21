// Create and manage job cards
import * as api from "../api.js";
import {
    formatCount,
    getFormattedDate,
    getTimePostedStr,
    getUserImage,
    hideAllPagesAndGoToPage,
    addButtonListeners
} from "../helpers.js";
import { showProfilePage } from "../pages/profile.js";
import { poll } from "../polling.js";
import { showJobForm, showUserList } from "./modal.js";
import { showErrorToast } from "./toast.js";

/**
 * Creates and returns a job card element
 * @param job job object as in backend API
 */
export const createJobCard = (job) => {
    /**
     * JOBCARD GENERAL
     */
    // Create jobCard and unhide it
    const userId = parseInt(localStorage.getItem("userId"));
    const jobCard = document.getElementById("job-card").cloneNode(true);
    jobCard.removeAttribute("template");
    jobCard.id = `job-${job.creatorId}-${job.id}`;
    loadJobInfo(jobCard, job, userId);

    /**
     * THREE DOTS
     */
    const dots = jobCard.querySelector(".edit-actions");
    addButtonListeners(dots.querySelector(".text-danger"), () => {
        api.deleteJob(job.id).then(poll);
    });

    /**
     * COMMENT SECTION
     */

    // Add comments area hidden at first
    const comments = jobCard.querySelector(".comments");
    const commentButton = jobCard.querySelector(".btn-comment");
    const chatIcon = commentButton.querySelector(".chat-icon");

    // Event listener to unhide/ hide comment section using comment buttton
    commentButton.addEventListener("click", () => {
        showHideComments(comments, chatIcon)
    });

    // Event listener to show comment section using num-comments
    const numComments = jobCard.querySelector(".num-comments");
    numComments.addEventListener("click", (event) => {
        showHideComments(comments, chatIcon);
        event.preventDefault();
    });

    // Add all comments
    const commentSection = comments.querySelector(".comment-section");
    loadAllComments(commentSection, job);

    const commentInput = jobCard.querySelector(".comment-input");


    // Event listener on send button to add new comments
    const sendButton = jobCard.querySelector(".send-btn");
    sendButton.addEventListener("click", () => postComment(commentInput, job.id));
    commentInput.addEventListener("keypress", (event) => {
        if (event.keyCode === 13) {
            postComment(commentInput, job.id);
        }
    });

    /**
     * LIKES
     */
    // Checking if user has already liked the post (for the heart to be filled at first)
    if (job.likes.some(like => like.userId === userId)) {
        jobCard.querySelector(".heart-icon").src = "assets/heart-fill.svg";
    }

    // Event listener for liking the post
    const likeButton = jobCard.querySelector(".btn-like");
    likeButton.addEventListener("click", () => handleLike(jobCard, job));

    return jobCard;
}

export const updateJobCard = (jobCard, updatedJob) => {
    loadJobInfo(jobCard, updatedJob);

    // Update comments
    const newComments = updatedJob.comments;
    const commentCards = jobCard.querySelectorAll(".comment-card");
    for (let i = 0; i < newComments.length; i++) {
        let newComment = newComments[i];
        let commentCard = commentCards[i];
        if (i < commentCards.length) {
            // replace info
            loadComment(commentCard, newComment);
        } else {
            // add new comment
            const newCommentCard = createCommentCard(newComment);
            jobCard.querySelector(".comment-section").appendChild(newCommentCard);
        }
    }
}

/////////////////////////////////////////////////////////////////////////////
// Job info related helper functions

const loadJobInfo = (jobCard, job) => {
    const currUserId = parseInt(localStorage.getItem("userId"));

    // Add job information into jobCard
    jobCard.querySelector(".job-title").textContent = job.title;
    jobCard.querySelector(".job-description").textContent = job.description;
    jobCard.querySelector(".job-image").src = job.image;
    jobCard.querySelector(".num-likes").replaceChildren(...formatCount(
      job.likes.length,
      "Like"
    ));
    jobCard.querySelector(".num-comments").replaceChildren(...formatCount(
      job.comments.length,
      "Comment"
    ));
    jobCard.querySelector(".job-start-append").textContent = getFormattedDate(
      new Date(job.start), "DD/MM/YYYY");
    
    // Hide/show edit and delete
    if (job.creatorId === currUserId) {
        jobCard.querySelector(".edit-actions").classList.remove("hidden");
    } else {
        jobCard.querySelector(".edit-actions").classList.add("hidden");
    }
    addButtonListeners(jobCard.querySelector(".dropdown-item"), () => showJobForm(job));
    
    // Time posted and poster
    const timePosted = getTimePostedStr(new Date(job.createdAt));
    api.getUser(job.creatorId).then(creator => {
        jobCard.querySelector(".time-posted").textContent = timePosted;
        
        // replace Creator name
        const oldCreator = jobCard.querySelector(".creator");
        const newCreator = oldCreator.cloneNode();
        newCreator.textContent = creator.name;
        addButtonListeners(newCreator, () => {
            hideAllPagesAndGoToPage(() => showProfilePage(creator.id))
        });
        oldCreator.replaceWith(newCreator);

        // Disable or enable stuff that requires watching
        const tooltips = jobCard.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tt => {
            // Enable/disabled tooltip and make it focusable/unfocusable
            let disabled;
            if ([...creator.watcheeUserIds, creator.id].includes(currUserId)) {
                bootstrap.Tooltip.getOrCreateInstance(tt).disable();
                tt.tabIndex = "-1";
                disabled = false;
            } else {
                bootstrap.Tooltip.getOrCreateInstance(tt).enable();
                tt.tabIndex = "0";
                disabled = true;
            }
            
            // Make elements disabled/enabled
            for (const child of tt.children) {
                child.disabled = disabled;
            }
        });
    }).catch(showErrorToast);

    // Add event listener for clicking num likes to show user list of likes
    const oldNumLikes = jobCard.querySelector(".num-likes");
    const newNumLikes = oldNumLikes.cloneNode(true);
    newNumLikes.addEventListener("click", (event) => {
        event.preventDefault();
        showUserList("Likes", job.likes.map(item => item.userId));
    });
    oldNumLikes.replaceWith(newNumLikes);

    // add curr user profile in comment area
    api.getUser(currUserId).then(user => {
        const oldProfileImage = jobCard.querySelector(".user-pic");
        const newProfileImage = oldProfileImage.cloneNode();
        newProfileImage.src = getUserImage(user);
        addButtonListeners(newProfileImage, () => {
            // go to user page on click of image
            hideAllPagesAndGoToPage(() => showProfilePage(user.id))
        });
        oldProfileImage.replaceWith(newProfileImage);
    })
    .catch(showErrorToast);
}

/////////////////////////////////////////////////////////////////////////////
// Like related helpers

const handleLike = (jobCard, job) => {
    const heartIcon = jobCard.querySelector(".heart-icon");
    if (heartIcon.src.includes("assets/heart-fill.svg")) {
        // user has liked it already, unlike post
        api.like(job.id, false).catch((err) => {
            showErrorToast(err);
        });
        jobCard.querySelector(".heart-icon").src = "assets/heart.svg";
    } else {
        // user has not liked it yet, like post
        api.like(job.id, true).catch(showErrorToast);
        jobCard.querySelector(".heart-icon").src = "assets/heart-fill.svg";
    }

    // Update page to show new like count
    poll();
};

/////////////////////////////////////////////////////////////////////////////
// Comment related helper funcs

const createCommentCard = (commentObj) => {
    // Clone comment card and unhide
    const commentCard = document.getElementById("comment-card").cloneNode(true);
    commentCard.removeAttribute("template");
    commentCard.removeAttribute("id");

    // Add commenter profile pic (default pic if none) and name
    loadComment(commentCard, commentObj)
    return commentCard;
}

const showHideComments = (comments, chatIcon) => {
    if (comments.classList.contains("hidden")) {
        // unhide
        comments.querySelector(".comment-input").focus();
        comments.classList.remove("hidden");
        chatIcon.src = "assets/chat-fill.svg";

    } else {
        comments.classList.add("hidden");
        chatIcon.src = "assets/chat.svg";
    }
}

/**
 * Load all job comments into the comment section
 */
const loadAllComments = (commentSection, job) => {
    for (const comment of job.comments) {
        const commentCard = createCommentCard(comment);
        commentSection.appendChild(commentCard);
    }
}

/**
 * Reload all info in a single comment
 */
const loadComment = (commentCard, commentObj) => {
    const { userId, userName, comment } = commentObj;

    const commenterPromise = api.getUser(userId);
    commenterPromise.then(user => {
        const oldCommenterImage = commentCard.querySelector(".commenter-pic");
        const newCommenterImage = oldCommenterImage.cloneNode();
        newCommenterImage.src = getUserImage(user);
        newCommenterImage.alt = "Profile pic of " + userName;
        addButtonListeners(newCommenterImage, () => {
            // go to user page on click of image
            hideAllPagesAndGoToPage(() => showProfilePage(user.id))
        });
        oldCommenterImage.replaceWith(newCommenterImage);

        // Add commenter name
        const oldCommenterName = commentCard.querySelector(".commenter");
        const newCommenterName = oldCommenterName.cloneNode();
        newCommenterName.textContent = userName;
        addButtonListeners(newCommenterName, () => {
            // go to user page on click of image
            hideAllPagesAndGoToPage(() => showProfilePage(user.id))
        });
        oldCommenterName.replaceWith(newCommenterName);

        // Add comment text
        commentCard.querySelector(".comment-text").textContent = comment;
    }).catch(showErrorToast);

}

/**
 * Event listener to post a new comment
 * Must not be emptyy
 */
const postComment = (commentInput, jobId) => {
    const newComment = commentInput.value;
    // If comment is empty string do not add it
    if (newComment === "") return;

    // Add comment in database
    api.comment(jobId, newComment).catch(showErrorToast);

    // Clear input box
    commentInput.value = "";

    // Update number of comments
    poll();
}
