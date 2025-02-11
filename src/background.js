chrome.commands.onCommand.addListener((command) => {
    if (command === "open_extension") {

        console.log("We are working on it. Please wait for the next update.");
        
        // to open extention using shortcut key (future development)
        // chrome.windows.create({
        //     url: chrome.runtime.getURL("src/popup.html"),
        //     type: "popup",
        //     width: 300,
        //     height: 400
        // });
    }
});