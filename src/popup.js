const newNote = document.getElementById("new-note");
const addButton = document.getElementById("add-note-button");
const dashboardButton = document.getElementById("dashboard-button");
const imageInput = document.getElementById("image-input");
const imagePreview = document.getElementById("image-preview");
const deleteButton = document.getElementsByClassName("dlt-bttn");
const priorityList = ["#VIMP", "#KIMP", "#NIMP"];

Array.from(deleteButton).forEach((button) => {
  button.addEventListener("click", () => {
    location.reload();
  });
});

// Open (or create) the database
let db;
const request = indexedDB.open("NotesDatabase", 1);

request.onupgradeneeded = (event) => {
  db = event.target.result;
  const objectStore = db.createObjectStore("notes", { keyPath: "url" });
  objectStore.createIndex("url", "url", { unique: true });
};

request.onsuccess = (event) => {
  db = event.target.result;
//   logAllNotes();
  logNotesForActiveUrl();
};

request.onerror = (event) => {
  console.error("Database error:", event.target.errorCode);
};

// Get active tab URL and slice it up to only get the domain
let activeTabUrl = "";

const getActiveTabUrl = (callback) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    const activeTabUrl = activeTab.url;
    callback(activeTabUrl);
  });
};

getActiveTabUrl((url) => {
  activeTabUrl = url;
});

const urlExtract = (url) => {
  const urlArray = url.split("/");
  return urlArray[2];
};

// Handle image input and preview
imageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      imagePreview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.src = "";
    imagePreview.classList.add("hidden");
  }
});

// Add note
addButton.addEventListener("click", function () {
  // Values
  const url = urlExtract(activeTabUrl);
  const priority = newNote.value.slice(-5).toUpperCase();
  let note = "";
  let image = imagePreview.src || null; // Make image optional
  let status = "pending";

  if (priorityList.includes(priority)) {
    note = newNote.value.slice(0, -5);
  } else {
    note = newNote.value;
  }

  // Check if the note is empty
  if (note.trim() === "") {
    console.log("Note is empty. Not adding to the database.");
    return;
  }

  // Store the note in IndexedDB
  const transaction = db.transaction(["notes"], "readwrite");
  const objectStore = transaction.objectStore("notes");

  const getRequest = objectStore.get(url);
  getRequest.onsuccess = (event) => {
    let data = event.target.result;
    if (data) {
      if (!data.notes) {
        data.notes = [];
      }
      data.notes.push({
        note: note,
        priority: priority,
        image: image,
        status: status,
      });
    } else {
      data = {
        url: url,
        notes: [
          { note: note, priority: priority, image: image, status: status },
        ],
      };
    }

    const putRequest = objectStore.put(data);
    putRequest.onsuccess = () => {
      console.log("Note has been added to your database.");
    };

    putRequest.onerror = (event) => {
      console.error("Unable to add data:", event.target.errorCode);
    };
  };

  getRequest.onerror = (event) => {
    console.error("Unable to retrieve data:", event.target.errorCode);
  };
  location.reload();
});

// Function to log all notes from the database
const logAllNotes = () => {
  const transaction = db.transaction(["notes"], "readonly");
  const objectStore = transaction.objectStore("notes");

  const request = objectStore.getAll();
  request.onsuccess = (event) => {
    const allNotes = event.target.result;
    console.log("All notes in the database:", allNotes);
  };

  request.onerror = (event) => {
    console.error("Unable to retrieve data:", event.target.errorCode);
  };
};

// Function to log notes for the active URL from the database
const logNotesForActiveUrl = () => {
  const url = urlExtract(activeTabUrl);
  const transaction = db.transaction(["notes"], "readonly");
  const objectStore = transaction.objectStore("notes");
  const noteContainer = document.getElementById("notes");

  const request = objectStore.getAll();
  request.onsuccess = (event) => {
    const allNotes = event.target.result;
    allNotes.forEach((note) => {
      if (note.url === url) {
        console.log(`Notes for ${url}:`, note.notes);
        note.notes.forEach((note) => {
          if (
            note.status === "pending" &&
            note.priority === "#VIMP" &&
            !(
              note.image ===
              "chrome-extension://mhlkcpclcigpfpmaaimlmmobmplmabpo/src/popup.html"
            )
          ) {
            noteContainer.innerHTML += `
                  <div
        class="flex justify-between p-2 text-base text-gray-50 border-b-2 bg-red-600/60 rounded-xl border-gray-50 hover:-translate-y-2 hover:shadow-xl hover:shadow-red-500/50 transition-all duration-200"
      >
        <img
          src="${note.image}"
          alt="Note Image"
          class="mx-1 my-1 w-[270px] h-[180px] rounded-xl object-contain"
        />
        <div class="flex justify-between p-2 text-base text-gray-900">
          <p>${note.note}</p>
          <button class="self-end">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e8eaed"
              class="hover:scale-[1.5] trnsition-all duration-200 dlt-bttn"
            >
              <path
                d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
              />
            </svg>
          </button>
        </div>
      </div>
            `;
          } else if (
            note.status === "pending" &&
            note.priority === "#VIMP" &&
            note.image ===
              "chrome-extension://mhlkcpclcigpfpmaaimlmmobmplmabpo/src/popup.html"
          ) {
            noteContainer.innerHTML += `
                  <div
        class="flex justify-between p-2 text-base text-gray-50 border-b-2 bg-red-600/60 rounded-xl border-gray-50 hover:-translate-y-2 hover:shadow-xl hover:shadow-red-500/50 transition-all duration-200"
      >
        <p>${note.note}</p>
        <button id="text1Done" class="self-end">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#e8eaed"
            class="hover:scale-[1.5] trnsition-all duration-200 dlt-bttn"
          >
            <path
              d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
            />
          </svg>
        </button>
            `;
          } 
        });
        note.notes.forEach((note) => {
          if (
            note.status === "pending" &&
            note.priority === "#KIMP" &&
            !(
              note.image ===
              "chrome-extension://mhlkcpclcigpfpmaaimlmmobmplmabpo/src/popup.html"
            )
          ) {
            noteContainer.innerHTML += `
                  <div
        class="flex justify-between p-2 text-base text-gray-50 border-b-2 bg-amber-500/60 rounded-xl border-gray-50 hover:-translate-y-2 hover:shadow-xl hover:shadow-amber-500/50 transition-all duration-200"
      >
        <img
          src="${note.image}"
          alt="Note Image"
          class="mx-1 my-1 w-[270px] h-[180px] rounded-xl object-contain"
        />
        <div class="flex justify-between p-2 text-base text-gray-900">
          <p>${note.note}</p>
          <button class="self-end">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e8eaed"
              class="hover:scale-[1.5] trnsition-all duration-200 dlt-bttn"
            >
              <path
                d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
              />
            </svg>
          </button>
        </div>
      </div>
            `;
          } else if (
            note.status === "pending" &&
            note.priority === "#KIMP" &&
            note.image ===
              "chrome-extension://mhlkcpclcigpfpmaaimlmmobmplmabpo/src/popup.html"
          ) {
            noteContainer.innerHTML += `
                  <div
        class="flex justify-between p-2 text-base text-gray-50 border-b-2 bg-amber-500/60 rounded-xl border-gray-50 hover:-translate-y-2 hover:shadow-xl hover:shadow-amber-500/50 transition-all duration-200"
      >
        <p>${note.note}</p>
        <button id="text1Done" class="self-end">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#e8eaed"
            class="hover:scale-[1.5] trnsition-all duration-200 dlt-bttn"
          >
            <path
              d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
            />
          </svg>
        </button>
            `;
          }
        });
        note.notes.forEach((note) => {
          if (
            note.status === "pending" &&
            note.priority === "#NIMP" &&
            !(
              note.image ===
              "chrome-extension://mhlkcpclcigpfpmaaimlmmobmplmabpo/src/popup.html"
            )
          ) {
            noteContainer.innerHTML += `
                  <div
        class="flex flex-col text-gray-50 border-b-2 bg-lime-400/60 rounded-xl border-gray-50 hover:-translate-y-2 hover:shadow-xl hover:shadow-lime-400/50 transition-all duration-200"
      >
        <img
          src="${note.image}"
          alt="Note Image"
          class="mx-1 my-1 w-[270px] h-[180px] rounded-xl object-contain"
        />
        <div class="flex justify-between p-2 text-base text-gray-900">
          <p>${note.note}</p>
          <button class="self-end">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e8eaed"
              class="hover:scale-[1.5] trnsition-all duration-200 dlt-bttn"
            >
              <path
                d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
              />
            </svg>
          </button>
        </div>
      </div>
            `;
          } else if (
            note.status === "pending" &&
            note.priority === "#NIMP" &&
            note.image ===
              "chrome-extension://mhlkcpclcigpfpmaaimlmmobmplmabpo/src/popup.html"
          ) {
            noteContainer.innerHTML += `
                  <div
        class="flex flex-col text-gray-50 border-b-2 bg-lime-400/60 rounded-xl border-gray-50 hover:-translate-y-2 hover:shadow-xl hover:shadow-lime-400/50 transition-all duration-200"
      >
        <p>${note.note}</p>
        <button class="self-end">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#e8eaed"
            class="hover:scale-[1.5] trnsition-all duration-200 dlt-bttn"
          >
            <path
              d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
            />
          </svg>
        </button>
            `;
          }
        });
        note.notes.forEach((note) => {
          if (
            note.status === "pending" &&
            !(note.priority in priorityList) &&
            !(
              note.image ===
              "chrome-extension://mhlkcpclcigpfpmaaimlmmobmplmabpo/src/popup.html"
            )
          ) {
            noteContainer.innerHTML += `
                  <div
        class="flex flex-col border-b-2 bg-gray-50/60 rounded-xl border-gray-50 hover:-translate-y-2 hover:shadow-xl hover:shadow-red-50/50 transition-all duration-200"
      >
        <img
          src="${note.image}"
          alt="Note Image"
          class="mx-1 my-1 w-[270px] h-[180px] rounded-xl object-contain"
        />
        <div class="flex justify-between p-2 text-base text-gray-900">
          <p>${note.note}</p>
          <button class="self-end">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e8eaed"
              class="hover:scale-[1.5] trnsition-all duration-200 dlt-bttn"
            >
              <path
                d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
              />
            </svg>
          </button>
        </div>
      </div>
            `;
          } else if (
            note.status === "pending" &&
            !(note.priority in priorityList) &&
            note.image ===
              "chrome-extension://mhlkcpclcigpfpmaaimlmmobmplmabpo/src/popup.html"
          ) {
            noteContainer.innerHTML += `
                  <div
        class="flex flex-col border-b-2 bg-gray-50/60 rounded-xl border-gray-50 hover:-translate-y-2 hover:shadow-xl hover:shadow-red-50/50 transition-all duration-200"
      >
        <p>${note.note}</p>
        <button id="text1Done" class="self-end">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#e8eaed"
            class="hover:scale-[1.5] trnsition-all duration-200 dlt-bttn"
          >
            <path
              d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
            />
          </svg>
        </button>
            `;
          }
        });
      }
    });

    request.onerror = (event) => {
      console.error("Unable to retrieve data:", event.target.errorCode);
    };
  };
};

dashboardButton.addEventListener("click", function () {
  chrome.tabs.create({ url: "src/dashboard.html" });
});
