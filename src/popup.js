document.getElementById("dashboard-button").addEventListener("click", function () {
    chrome.tabs.create({ url: "src/dashboard.html" });
});