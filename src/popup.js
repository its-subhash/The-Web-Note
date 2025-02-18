const newNote = document.getElementById("new-note");
const addButton = document.getElementById("add-note-button");
const dashboardButton = document.getElementById("dashboard-button");
const imageInput = document.getElementById("image-input");
const imagePreview = document.getElementById("image-preview");
const deleteButton = document.getElementsByClassName("dlt-bttn")
const priorityList = ["#VIMP", "#KIMP", "#NIMP"];

Array.from(deleteButton).forEach(button => {
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
    logAllNotes();
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
    let status = "pending"

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
            data.notes.push({ note: note, priority: priority, image: image, status: status });
        } else {
            data = { url: url, notes: [{ note: note, priority: priority, image: image, status: status }] };
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

    const request = objectStore.get(url);
    request.onsuccess = (event) => {
        const notesForUrl = event.target.result;
        console.log(`Notes for ${url}:`, notesForUrl ? notesForUrl.notes : "No notes found");
    };

    request.onerror = (event) => {
        console.error("Unable to retrieve data:", event.target.errorCode);
    };
};

dashboardButton.addEventListener("click", function () {
    chrome.tabs.create({ url: "src/dashboard.html" });
});