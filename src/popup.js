document.getElementById("dashboard-button").addEventListener("click", function () {
    chrome.tabs.create({ url: "src/dashboard.html" });
});

document.getElementById("add-note-button").addEventListener("click", function () {
    console.log("add-note-button clicked");
});