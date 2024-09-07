// ------ Global Variables -------
const hostPrefix = import.meta.env.VITE_HOST_PREFIX;
const hostLocation = import.meta.env.VITE_HOST_LOCATION;
const wsProtocol = import.meta.env.VITE_WS_HOST;

const guestbookContainer = document.getElementById("guestbookContainer");

// -------- POST ----------

async function handleFormSubmit(event, formId, endpoint) {
  event.preventDefault();
  console.log(`${formId} submitted`);
  // get form information
  const form = document.getElementById(formId);
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  console.log(data);
  // fetch post request to add new entry to endpoint
  const response = await fetch(hostPrefix + hostLocation + "/" + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  //recieve response
  const responseData = await response.json();
  console.log(`From the server (${endpoint}): `, responseData);
  //reset the form
  form.reset();
  // updated items on screen
  getHandler(endpoint, guestbookContainer);
}

document.getElementById("guestbook").addEventListener("submit", (event) => {
  handleFormSubmit(event, "guestbook", "guestbook");
});

// --------- GET -----------

async function getHandler(endpoint, container) {
  const response = await fetch(hostPrefix + hostLocation + "/" + endpoint);
  const data = await response.json();
  console.log(data);
  // clear page
  container.innerHTML = "";
  // loop through and add to page
  data.forEach(function (dbData) {
    const p = document.createElement("p");
    const button = document.createElement("button");
    const likeButton = document.createElement("button");
    const div = document.createElement("div");

    div.className = "message-div";

    p.textContent = `"${dbData.message}" - ${dbData.username}`;
    p.className = "database-text";

    button.textContent = "Delete";
    button.className = "delete-button";
    button.setAttribute("aria-label", "Delete button");
    button.id = dbData.id;

    likeButton.textContent = "👍 " + dbData.likes;
    likeButton.className = "like-button";
    likebutton.setAttribute("aria-label", "Like button");
    likeButton.id = "like" + dbData.id;

    div.appendChild(p);
    div.appendChild(button);
    div.appendChild(likeButton);

    container.appendChild(div);
  });
}

getHandler("guestbook", guestbookContainer);

// --------- Delete & Like ----------

guestbookContainer.addEventListener("click", async function (event) {
  // delete button
  if (event.target.classList.contains("delete-button")) {
    const id = event.target.id;
    console.log("Delete button clicked for id: " + id);
    // send delete request
    const response = await fetch(
      hostPrefix + hostLocation + "/guestbook/" + id,
      {
        method: "DELETE",
      }
    );
    // recieve response
    const responseData = await response.json();
    console.log(`From the server (delete): `, responseData);
    // update items on screen
    getHandler("guestbook", guestbookContainer);
  }

  // like button
  if (event.target.classList.contains("like-button")) {
    const id = event.target.id.replace("like", ""); //grabbing just the id
    // local variable of db id
    const likedEntries = JSON.parse(localStorage.getItem("likedEntries")) || [];
    // liked already?
    const isLiked = likedEntries.includes(id);
    // like or unlike
    const action = isLiked ? "unlike" : "like";
    console.log("Like button pressed for id: " + id);
    // PUT request to increment likes count
    const response = await fetch(
      hostPrefix + hostLocation + "/guestbook/" + id + "/like",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }), // send like or unlike
      }
    );

    const responseData = await response.json();
    console.log(`From the server (${action}): `, responseData);
    // update local storage with either like or unlike
    if (action === "like") {
      likedEntries.push(id);
    } else {
      const index = likedEntries.indexOf(id);
      if (index > -1) {
        likedEntries.splice(index, 1); //remove liked entry
      }
    }
    localStorage.setItem("likedEntries", JSON.stringify(likedEntries));
    //update text element
    event.target.textContent = "👍 " + responseData.likes;
    // update items on screen
    getHandler("guestbook", guestbookContainer);
  }
});

// ----------- Update ------------

const socket = new WebSocket(wsProtocol + hostLocation + "/guestbook");

socket.addEventListener("message", function (event) {
  const update = JSON.parse(event.data);
  // which data are we recieving
  switch (update.type) {
    case "newPost":
      console.log("New post added: ", update.data);
      getHandler("guestbook", guestbookContainer);
      break;
    case "updateLikes":
      console.log("Likes updated: ", update.data);
      getHandler("guestbook", guestbookContainer);
      break;
    case "deletePost":
      console.log("Post deleted: ", update.data.id);
      getHandler("guestbook", guestbookContainer);
      break;
    default:
      console.error("Unknown update recieved: ", update.type);
  }
});
