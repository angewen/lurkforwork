// Create and destroy bootstrap alerts

/**
 * Creates an alert element
 * @param id id to use to reference this alert
 * @param type usually "success" or "danger" for error
 * @param content text for the alert
 */
export const createAlert = (id, type, content) => {
  let alert = document.getElementById(id);
  if (alert !== null) {
    // If alert already exists just replace its content
    alert.firstChild.textContent = content;
    alert.className = `alert alert-${type} alert-dismissible`;
  } else {
    alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible`;
    alert.role = "alert";
    alert.id = id;
    alert.appendChild(document.createTextNode(content));

    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "btn-close";
    dismiss.setAttribute("data-bs-dismiss", "alert");
    dismiss.setAttribute("aria-label", "Close");
    alert.appendChild(dismiss);
  }

  return alert;
}

/**
 * Close the alert with given id (if it exists)
 */
export const closeAlert = (id) => {
  const alert = document.getElementById(id);
  if (alert) bootstrap.Alert.getOrCreateInstance(alert).close();
}