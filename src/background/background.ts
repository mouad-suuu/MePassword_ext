chrome.action.onClicked.addListener((tab) => {
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "PASSWORD_DETECTED") {
    const { website, user: username, password } = message.data;

    // Open the extension popup instead of a new window
    chrome.action.openPopup(() => {
      // After popup is opened, send the data
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: "OPEN_ADD_PASSWORD_DIALOG",
          data: { website, username, password },
        });
      }, 500); // Small delay to ensure popup is ready
    });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  // Reload all tabs when the extension is updated
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id) {
        chrome.tabs.reload(tab.id);
      }
    });
  });
});
