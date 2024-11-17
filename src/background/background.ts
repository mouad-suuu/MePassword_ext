import EncryptionService from "../services/EncryptionService";
import { KeyGenerationService } from "../services/Keys-managment/KeyGeneration";
import StoringService from "../services/StorageService";

chrome.action.onClicked.addListener((tab) => {
  console.log("Extension icon clicked!");
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "PASSWORD_DETECTED") {
    const { website, username, password } = message.data;

    // Create notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "assets/icon128.png",
      title: "Save Password?",
      message: `Would you like to save the password for ${username} on ${website}?`,
      buttons: [{ title: "Save Password" }, { title: "Ignore" }],
    });

    // Handle notification button clicks
    chrome.notifications.onButtonClicked.addListener(
      async (notificationId, buttonIndex) => {
        if (buttonIndex === 0) {
          // Save Password
          try {
            const response = await EncryptionService.API.SettingGet();
            const storedKeys = await response.json();
            if (!storedKeys.publicKey) {
              throw new Error("No encryption keys found");
            }

            const publicKey = await EncryptionService.Utils.importRSAPublicKey(
              storedKeys.publicKey
            );

            const encryptedData = await EncryptionService.Utils.encryptWithRSA(
              {
                website,
                user: username,
                password,
              },
              publicKey
            );

            await EncryptionService.API.PasswordPost({
              id: crypto.randomUUID(),
              website: encryptedData.website,
              user: encryptedData.user,
              password: encryptedData.password,
            });
          } catch (error) {
            console.error("Failed to save password:", error);
          }
        }

        chrome.notifications.clear(notificationId);
      }
    );
  }
});
