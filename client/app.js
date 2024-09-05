const hostLocation = "http://localhost";

async function handleFormSubmit(event, formId, endpoint) {
  event.preventDefault();
  console.log(`${formId} submitted`);
  // get form information
  const form = document.getElementById(formId);
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  console.log(data);
  // fetch post request to add new entry to endpoint
  const response = await fetch(hostLocation + `:8080/${endpoint}`, {
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
  // add new guest to the screen
  getGuestbook();
}

document.getElementById("guestbook").addEventListener("submit", (event) => {
  handleFormSubmit(event, "guestbook", "guestbook");
});

const guestbookContainer = document.getElementById("guestbookContainer");

async function getGuestbook() {
  const response = await fetch("http://localhost:8080/guestbook");
  const data = await response.json();
  console.log(data);
  // clear page
  guestbookContainer.innerHTML = "";
  // loop through guestbook and add to page
  data.forEach(function (guest) {
    const p = document.createElement("p");
    p.textContent = `Guest: ${guest.username} | Message: ${guest.message}`;
    guestbookContainer.appendChild(p);
  });
}

getGuestbook();

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function autoFetchData() {
  await delay(30_000);
  getGuestbook();
}
