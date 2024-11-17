/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/services/EncryptionService.ts":
/*!*******************************************!*\
  !*** ./src/services/EncryptionService.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _Keys_managment_KeyGeneration__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Keys-managment/KeyGeneration */ "./src/services/Keys-managment/KeyGeneration.ts");
/* harmony import */ var _Keys_managment_CredentialCrypto__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Keys-managment/CredentialCrypto */ "./src/services/Keys-managment/CredentialCrypto.ts");
/* harmony import */ var _Keys_managment_ZeroKnowledgeProof__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Keys-managment/ZeroKnowledgeProof */ "./src/services/Keys-managment/ZeroKnowledgeProof.ts");
/* harmony import */ var _sessionManagment_SessionManager__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./sessionManagment/SessionManager */ "./src/services/sessionManagment/SessionManager.ts");
/* harmony import */ var _Keys_managment_APIService__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Keys-managment/APIService */ "./src/services/Keys-managment/APIService.ts");
/* harmony import */ var _Keys_managment_CryptoUtils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./Keys-managment/CryptoUtils */ "./src/services/Keys-managment/CryptoUtils.ts");






class EncryptionService {
}
EncryptionService.KeyGeneration = _Keys_managment_KeyGeneration__WEBPACK_IMPORTED_MODULE_0__.KeyGenerationService;
EncryptionService.CredentialCrypto = _Keys_managment_CredentialCrypto__WEBPACK_IMPORTED_MODULE_1__.CredentialCryptoService;
EncryptionService.ZeroKnowledgeProof = _Keys_managment_ZeroKnowledgeProof__WEBPACK_IMPORTED_MODULE_2__.ZeroKnowledgeProofService;
EncryptionService.Session = _sessionManagment_SessionManager__WEBPACK_IMPORTED_MODULE_3__.SessionManagementService;
EncryptionService.API = _Keys_managment_APIService__WEBPACK_IMPORTED_MODULE_4__.APIService;
EncryptionService.Utils = _Keys_managment_CryptoUtils__WEBPACK_IMPORTED_MODULE_5__.CryptoUtils;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (EncryptionService);


/***/ }),

/***/ "./src/services/Keys-managment/APIService.ts":
/*!***************************************************!*\
  !*** ./src/services/Keys-managment/APIService.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   APIService: () => (/* binding */ APIService)
/* harmony export */ });
/* harmony import */ var _CredentialCrypto__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./CredentialCrypto */ "./src/services/Keys-managment/CredentialCrypto.ts");
/* harmony import */ var _StorageService__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../StorageService */ "./src/services/StorageService.ts");
/* harmony import */ var uuid__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! uuid */ "./node_modules/uuid/dist/esm-browser/v4.js");



class APIService {
    static async handleApiError(error, endpoint) {
        if (error instanceof Response) {
            const errorBody = await error
                .text()
                .catch(() => "Unable to read error response");
            throw new Error(`API ${endpoint} failed with status ${error.status}: ${errorBody}`);
        }
        if (error instanceof Error) {
            throw new Error(`${endpoint} error: ${error.message}`);
        }
        throw new Error(`Unexpected ${endpoint} error: ${String(error)}`);
    }
    static async SettingsPost(publicKey) {
        try {
            const storedKeys = await _StorageService__WEBPACK_IMPORTED_MODULE_1__["default"].Keys.getKeysFromStorage();
            const decryptedCredentials = await _CredentialCrypto__WEBPACK_IMPORTED_MODULE_0__.CredentialCryptoService.decryptCredentials(storedKeys.Credentials, {
                key: storedKeys.AESKey,
                iv: storedKeys.IV,
                algorithm: "AES-GCM",
                length: 256,
            });
            const response = await fetch(`${decryptedCredentials.server}/api/settings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${decryptedCredentials.authToken}`,
                },
                body: JSON.stringify({
                    publicKey: publicKey,
                    password: decryptedCredentials.password,
                    deviceId: (0,uuid__WEBPACK_IMPORTED_MODULE_2__["default"])(),
                    timestamp: Date.now(),
                }),
            });
            if (!response.ok) {
                throw response;
            }
            return response;
        }
        catch (error) {
            return this.handleApiError(error, "SettingsPost");
        }
    }
    static async validatePassword(password) {
        try {
            console.log("Validating the password:", password);
            const storedKeys = await _StorageService__WEBPACK_IMPORTED_MODULE_1__["default"].Keys.getKeysFromStorage();
            const decryptedCredentials = await _CredentialCrypto__WEBPACK_IMPORTED_MODULE_0__.CredentialCryptoService.decryptCredentials(storedKeys.Credentials, {
                key: storedKeys.AESKey,
                iv: storedKeys.IV,
                algorithm: "AES-GCM",
                length: 256,
            });
            const response = await fetch(`${decryptedCredentials.server}/api/settings/validate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${decryptedCredentials.authToken}`,
                },
                body: JSON.stringify({
                    password: password,
                }),
            });
            if (!response.ok) {
                throw response;
            }
            const jsonResponse = await response.json();
            console.log("Password is valid:", jsonResponse.isValid);
            return jsonResponse.isValid;
        }
        catch (error) {
            return this.handleApiError(error, "SettingsPost");
        }
    }
    static async SettingGet() {
        try {
            const storedKeys = await _StorageService__WEBPACK_IMPORTED_MODULE_1__["default"].Keys.getKeysFromStorage();
            const decryptedCredentials = await _CredentialCrypto__WEBPACK_IMPORTED_MODULE_0__.CredentialCryptoService.decryptCredentials(storedKeys.Credentials, {
                key: storedKeys.AESKey,
                iv: storedKeys.IV,
                algorithm: "AES-GCM",
                length: 256,
            });
            const response = await fetch(`${decryptedCredentials.server}/api/settings`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${decryptedCredentials.authToken}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                throw response;
            }
            return response;
        }
        catch (error) {
            return this.handleApiError(error, "SettingGet");
        }
    }
    static async SettingsPut(settings) {
        const storedKeys = await _StorageService__WEBPACK_IMPORTED_MODULE_1__["default"].Keys.getKeysFromStorage();
        try {
            const decryptedCredentials = await _CredentialCrypto__WEBPACK_IMPORTED_MODULE_0__.CredentialCryptoService.decryptCredentials(storedKeys.Credentials, {
                key: storedKeys.AESKey,
                iv: storedKeys.IV,
                algorithm: "AES-GCM",
                length: 256,
            }).catch((error) => {
                throw new Error(`Credential decryption failed: ${error.message}`);
            });
            const response = await fetch(`${decryptedCredentials.server}/api/settings`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${decryptedCredentials.authToken}`,
                },
                body: JSON.stringify(settings),
            });
            if (!response.ok) {
                throw response;
            }
            return response;
        }
        catch (error) {
            return this.handleApiError(error, "SettingsPut");
        }
    }
    static async PasswordsGet() {
        const storedKeys = await _StorageService__WEBPACK_IMPORTED_MODULE_1__["default"].Keys.getKeysFromStorage();
        try {
            const decryptedCredentials = await _CredentialCrypto__WEBPACK_IMPORTED_MODULE_0__.CredentialCryptoService.decryptCredentials(storedKeys.Credentials, {
                key: storedKeys.AESKey,
                iv: storedKeys.IV,
                algorithm: "AES-GCM",
                length: 256,
            });
            const response = await fetch(`${decryptedCredentials.server}/api/passwords`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${decryptedCredentials.authToken}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                throw response;
            }
            return response;
        }
        catch (error) {
            return this.handleApiError(error, "PasswordsGet");
        }
    }
    static async PasswordPost(data) {
        const storedKeys = await _StorageService__WEBPACK_IMPORTED_MODULE_1__["default"].Keys.getKeysFromStorage();
        try {
            const decryptedCredentials = await _CredentialCrypto__WEBPACK_IMPORTED_MODULE_0__.CredentialCryptoService.decryptCredentials(storedKeys.Credentials, {
                key: storedKeys.AESKey,
                iv: storedKeys.IV,
                algorithm: "AES-GCM",
                length: 256,
            }).catch((error) => {
                throw new Error(`Credential decryption failed: ${error.message}`);
            });
            const response = await fetch(`${decryptedCredentials.server}/api/passwords`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${decryptedCredentials.authToken}`,
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw response;
            }
            return response;
        }
        catch (error) {
            return this.handleApiError(error, "PasswordPost");
        }
    }
    static async PasswordPut(data) {
        const storedKeys = await _StorageService__WEBPACK_IMPORTED_MODULE_1__["default"].Keys.getKeysFromStorage();
        try {
            const decryptedCredentials = await _CredentialCrypto__WEBPACK_IMPORTED_MODULE_0__.CredentialCryptoService.decryptCredentials(storedKeys.Credentials, {
                key: storedKeys.AESKey,
                iv: storedKeys.IV,
                algorithm: "AES-GCM",
                length: 256,
            }).catch((error) => {
                throw new Error(`Credential decryption failed: ${error.message}`);
            });
            const response = await fetch(`${decryptedCredentials.server}/api/passwords`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${decryptedCredentials.authToken}`,
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw response;
            }
            return response;
        }
        catch (error) {
            return this.handleApiError(error, "PasswordPut");
        }
    }
    static async KeysGet() {
        try {
            const storedKeys = await _StorageService__WEBPACK_IMPORTED_MODULE_1__["default"].Keys.getKeysFromStorage();
            const decryptedCredentials = await _CredentialCrypto__WEBPACK_IMPORTED_MODULE_0__.CredentialCryptoService.decryptCredentials(storedKeys.Credentials, {
                key: storedKeys.AESKey,
                iv: storedKeys.IV,
                algorithm: "AES-GCM",
                length: 256,
            });
            const response = await fetch(`${decryptedCredentials.server}/api/keys`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${decryptedCredentials.authToken}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                throw response;
            }
            return response;
        }
        catch (error) {
            return this.handleApiError(error, "KeysGet");
        }
    }
    static async KeysPost(data) {
        try {
            const storedKeys = await _StorageService__WEBPACK_IMPORTED_MODULE_1__["default"].Keys.getKeysFromStorage();
            const decryptedCredentials = await _CredentialCrypto__WEBPACK_IMPORTED_MODULE_0__.CredentialCryptoService.decryptCredentials(storedKeys.Credentials, {
                key: storedKeys.AESKey,
                iv: storedKeys.IV,
                algorithm: "AES-GCM",
                length: 256,
            });
            const response = await fetch(`${decryptedCredentials.server}/api/keys `, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${decryptedCredentials.authToken}`,
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw response;
            }
            return response;
        }
        catch (error) {
            return this.handleApiError(error, "KeysPost");
        }
    }
    static async KeysPut(data) {
        try {
            const storedKeys = await _StorageService__WEBPACK_IMPORTED_MODULE_1__["default"].Keys.getKeysFromStorage();
            const decryptedCredentials = await _CredentialCrypto__WEBPACK_IMPORTED_MODULE_0__.CredentialCryptoService.decryptCredentials(storedKeys.Credentials, {
                key: storedKeys.AESKey,
                iv: storedKeys.IV,
                algorithm: "AES-GCM",
                length: 256,
            });
            const response = await fetch(`${decryptedCredentials.server}/api/passwords`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${decryptedCredentials.authToken}`,
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw response;
            }
            return response;
        }
        catch (error) {
            return this.handleApiError(error, "KeysPut");
        }
    }
}


/***/ }),

/***/ "./src/services/Keys-managment/CredentialCrypto.ts":
/*!*********************************************************!*\
  !*** ./src/services/Keys-managment/CredentialCrypto.ts ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CredentialCryptoService: () => (/* binding */ CredentialCryptoService)
/* harmony export */ });
/* harmony import */ var _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./CryptoUtils */ "./src/services/Keys-managment/CryptoUtils.ts");
/* harmony import */ var _additionals__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./additionals */ "./src/services/Keys-managment/additionals.ts");
/* harmony import */ var uuid__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! uuid */ "./node_modules/uuid/dist/esm-browser/v4.js");


 // Importing UUID library
class CredentialCryptoService {
    static async encryptCredentials(credentials, aesKey) {
        const key = await _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.importAESKey(aesKey.key);
        const iv = _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.base64ToBuffer(aesKey.iv);
        const encryptedData = {
            server: await _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.encryptString(credentials.server, key, iv),
            authToken: await _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.encryptString(credentials.authToken, key, iv),
            password: credentials.password
                ? await _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.encryptString(credentials.password, key, iv)
                : undefined,
        };
        const formattedOutput = [
            "----------encrypted website----------------",
            encryptedData.server,
            "----------encrypted authkey----------------",
            encryptedData.authToken,
            credentials.password
                ? "----------encrypted password----------------\n" +
                    encryptedData.password
                : "",
        ].join("\n");
        return { encryptedData, formattedOutput };
    }
    static async decryptCredentials(encryptedData, aesKey) {
        try {
            const key = await _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.importAESKey(aesKey.key);
            const iv = _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.base64ToBuffer(aesKey.iv);
            return {
                server: await this.decryptString(encryptedData.server, key, iv),
                authToken: await this.decryptString(encryptedData.authToken, key, iv),
                password: encryptedData.password
                    ? await this.decryptString(encryptedData.password, key, iv)
                    : undefined,
            };
        }
        catch (error) {
            console.error("Decryption failed:", error);
            throw new Error("Failed to decrypt credentials.");
        }
    }
    static async encryptPassword(password, keySet) {
        const method = "encryptPassword";
        console.log("[DEBUG] Input password structure:", {
            website: (password === null || password === void 0 ? void 0 : password.website) ? "[PRESENT]" : "[MISSING]",
            user: (password === null || password === void 0 ? void 0 : password.user) ? "[PRESENT]" : "[MISSING]",
            password: (password === null || password === void 0 ? void 0 : password.password) ? "[PRESENT]" : "[MISSING]",
        });
        try {
            if (!(password === null || password === void 0 ? void 0 : password.website) || !(password === null || password === void 0 ? void 0 : password.user) || !(password === null || password === void 0 ? void 0 : password.password)) {
                throw new Error("Missing required password credentials");
            }
            const aesKey = await _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.importAESKey(keySet.AESKey);
            const iv = _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.base64ToBuffer(keySet.IV);
            const encryptedData = {
                id: (0,uuid__WEBPACK_IMPORTED_MODULE_2__["default"])(),
                website: await _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.encryptString(password.website, aesKey, iv),
                user: password.user,
                password: await _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.encryptString(password.password, aesKey, iv),
            };
            const metadata = {
                url: "test",
                title: "test",
                timestamp: "test",
            };
            console.log("[DEBUG] Encrypted data structure:", {
                metadata,
                encryptedDataKeys: Object.keys(encryptedData),
                ivLength: keySet.IV.length,
            });
            return Object.assign(Object.assign({}, encryptedData), { formData: metadata });
        }
        catch (error) {
            _additionals__WEBPACK_IMPORTED_MODULE_1__["default"].logError(method, error);
            throw new Error(`Failed to encrypt password: ${error.message}`);
        }
    }
    static formatKeyComponents(rsaKeys, aesKey) {
        return [
            "----------public key----------------",
            rsaKeys.publicKey.key,
            "----------private key----------------",
            rsaKeys.privateKey.key,
            "----------aes-key----------------",
            aesKey.key,
            "----------aes-iv----------------",
            aesKey.iv,
        ].join("\n");
    }
    static async decryptString(encryptedData, key, iv) {
        const decoder = new TextDecoder();
        const decryptedData = await window.crypto.subtle.decrypt({
            name: "AES-GCM",
            iv,
        }, key, _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.base64ToBuffer(encryptedData));
        return decoder.decode(decryptedData);
    }
}


/***/ }),

/***/ "./src/services/Keys-managment/CryptoUtils.ts":
/*!****************************************************!*\
  !*** ./src/services/Keys-managment/CryptoUtils.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CryptoUtils: () => (/* binding */ CryptoUtils)
/* harmony export */ });
/* harmony import */ var _KeyGeneration__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./KeyGeneration */ "./src/services/Keys-managment/KeyGeneration.ts");

class CryptoUtils {
    static async deriveKey(password) {
        const encoder = new TextEncoder();
        const salt = window.crypto.getRandomValues(new Uint8Array(_KeyGeneration__WEBPACK_IMPORTED_MODULE_0__.KeyGenerationService.SALT_LENGTH));
        const baseKey = await window.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits", "deriveKey"]);
        return window.crypto.subtle.deriveKey({
            name: "PBKDF2",
            salt,
            iterations: _KeyGeneration__WEBPACK_IMPORTED_MODULE_0__.KeyGenerationService.PBKDF2_ITERATIONS,
            hash: "SHA-256",
        }, baseKey, {
            name: "AES-GCM",
            length: 256,
        }, true, ["encrypt", "decrypt"]);
    }
    static validatePin(pin) {
        return /^\d{6}$/.test(pin);
    }
    static async encryptString(data, key, iv) {
        const encoder = new TextEncoder();
        const encryptedData = await window.crypto.subtle.encrypt({
            name: "AES-GCM",
            iv,
        }, key, encoder.encode(data));
        return this.bufferToBase64(encryptedData);
    }
    static async importRSAPublicKey(keyBase64) {
        const keyData = this.base64ToBuffer(keyBase64);
        return window.crypto.subtle.importKey("spki", keyData, {
            name: "RSA-OAEP",
            hash: "SHA-256",
        }, false, ["encrypt"]);
    }
    static async importAESKey(keyBase64) {
        const keyData = CryptoUtils.base64ToBuffer(keyBase64);
        return window.crypto.subtle.importKey("raw", keyData, {
            name: "AES-GCM",
            length: 256,
        }, false, ["encrypt", "decrypt"]);
    }
    static async encryptWithRSA(data, publicKey) {
        const encoder = new TextEncoder();
        // Encrypt each field separately
        const encryptedWebsite = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, encoder.encode(data.website));
        const encryptedUser = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, encoder.encode(data.user));
        const encryptedPassword = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, encoder.encode(data.password));
        return {
            website: this.bufferToBase64(encryptedWebsite),
            user: this.bufferToBase64(encryptedUser),
            password: this.bufferToBase64(encryptedPassword),
        };
    }
    static bufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), "");
        return btoa(binary);
    }
    static base64ToBuffer(base64) {
        try {
            const cleanBase64 = base64.trim().replace(/\s/g, "");
            const padded = (() => {
                const pad = cleanBase64.length % 4;
                return pad ? cleanBase64 + "=".repeat(4 - pad) : cleanBase64;
            })();
            if (!/^[A-Za-z0-9+/]*={0,2}$/.test(padded)) {
                throw new Error("Invalid base64 string format");
            }
            const binary = atob(padded);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        }
        catch (error) {
            console.error("Base64 decoding failed:", {
                error,
                inputLength: base64 === null || base64 === void 0 ? void 0 : base64.length,
                inputPreview: base64 === null || base64 === void 0 ? void 0 : base64.substring(0, 50),
            });
            throw new Error(`Base64 decoding failed: ${error}`);
        }
    }
    static async importRSAPrivateKey(keyBase64) {
        try {
            console.log("Importing RSA private key", {
                keyBase64Preview: keyBase64.substring(0, 50),
            });
            if (!keyBase64 || !keyBase64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
                throw new Error("Invalid base64-encoded RSA private key");
            }
            const keyData = this.base64ToBuffer(keyBase64);
            const privateKey = await window.crypto.subtle.importKey("pkcs8", keyData, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);
            console.log("RSA private key imported successfully");
            return privateKey;
        }
        catch (error) {
            console.error("RSA private key import failed:", error);
            throw error;
        }
    }
    static async decryptWithRSA(encryptedData, privateKey) {
        try {
            console.log("Starting RSA decryption process", {
                keyAlgorithm: privateKey.algorithm,
                keyUsages: privateKey.usages,
                dataLength: encryptedData === null || encryptedData === void 0 ? void 0 : encryptedData.length,
            });
            // Return empty array if no data is provided
            if (!encryptedData ||
                !Array.isArray(encryptedData) ||
                encryptedData.length === 0) {
                console.log("No encrypted data to decrypt, returning empty array");
                return [];
            }
            const decoder = new TextDecoder("utf-8");
            const decryptedData = await Promise.all(encryptedData.map(async (item, index) => {
                var _a, _b, _c, _d, _e, _f;
                try {
                    console.log(`Decrypting item ${index}`, {
                        websiteLength: (_a = item.website) === null || _a === void 0 ? void 0 : _a.length,
                        userLength: (_b = item.user) === null || _b === void 0 ? void 0 : _b.length,
                        passwordLength: (_c = item.password) === null || _c === void 0 ? void 0 : _c.length,
                        websitePreview: (_d = item.website) === null || _d === void 0 ? void 0 : _d.substring(0, 50),
                        userPreview: (_e = item.user) === null || _e === void 0 ? void 0 : _e.substring(0, 50),
                        passwordPreview: (_f = item.password) === null || _f === void 0 ? void 0 : _f.substring(0, 50),
                    });
                    const websiteBuffer = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, this.base64ToBuffer(item.website));
                    const userBuffer = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, this.base64ToBuffer(item.user));
                    const passwordBuffer = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, this.base64ToBuffer(item.password));
                    console.log(`Successfully decrypted item ${index}`);
                    console.log("RSA decryption process completed successfully", decoder.decode(websiteBuffer), decoder.decode(userBuffer), decoder.decode(passwordBuffer));
                    return {
                        website: decoder.decode(websiteBuffer),
                        user: decoder.decode(userBuffer),
                        password: decoder.decode(passwordBuffer),
                    };
                }
                catch (error) {
                    console.error(`Error decrypting item ${index}:`, error);
                    return null;
                }
            }));
            const validDecryptedData = decryptedData.filter((item) => item !== null);
            if (validDecryptedData.length === 0) {
                throw new Error("All decryption attempts failed");
            }
            return validDecryptedData;
        }
        catch (error) {
            console.error("RSA decryption error:", {
                name: error,
                message: error,
                stack: error,
            });
            throw error;
        }
    }
}


/***/ }),

/***/ "./src/services/Keys-managment/KeyGeneration.ts":
/*!******************************************************!*\
  !*** ./src/services/Keys-managment/KeyGeneration.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   KeyGenerationService: () => (/* binding */ KeyGenerationService)
/* harmony export */ });
/* harmony import */ var _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./CryptoUtils */ "./src/services/Keys-managment/CryptoUtils.ts");
/* harmony import */ var _CredentialCrypto__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./CredentialCrypto */ "./src/services/Keys-managment/CredentialCrypto.ts");
/* harmony import */ var _additionals__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./additionals */ "./src/services/Keys-managment/additionals.ts");



class KeyGenerationService {
    static async generateKeyComponents() {
        const rsaKeyPair = await this.generateRSAKeyPair();
        const aesKey = await this.generateAESKey();
        const formattedOutput = _CredentialCrypto__WEBPACK_IMPORTED_MODULE_1__.CredentialCryptoService.formatKeyComponents(rsaKeyPair, aesKey);
        return { rsaKeyPair, aesKey, formattedOutput };
    }
    static async generateKeySet(biometricType) {
        const encryption = await this.generateRSAKeyPair();
        const dataKey = await this.generateAESKey();
        return {
            RSAkeys: encryption,
            AESKey: dataKey,
        };
    }
    static async generateRSAKeyPair() {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error("WebCrypto API is not available");
        }
        const keyPair = await window.crypto.subtle.generateKey({
            name: "RSA-OAEP",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        }, true, ["encrypt", "decrypt"]);
        const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
        const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
        return {
            publicKey: {
                key: _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.bufferToBase64(publicKeyBuffer),
                algorithm: "RSA-OAEP",
                length: 4096,
                format: "spki",
            },
            privateKey: {
                key: _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.bufferToBase64(privateKeyBuffer),
                algorithm: "RSA-OAEP",
                length: 4096,
                format: "pkcs8",
                protected: true,
            },
        };
    }
    static async generateAESKey() {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error("WebCrypto API is not available");
        }
        const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
        const key = await window.crypto.subtle.generateKey({
            name: "AES-GCM",
            length: 256,
        }, true, ["encrypt", "decrypt"]);
        const keyBuffer = await window.crypto.subtle.exportKey("raw", key);
        return {
            key: _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.bufferToBase64(keyBuffer),
            algorithm: "AES-GCM",
            length: 256,
            iv: _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.bufferToBase64(iv),
        };
    }
    async generateRSAKeys() {
        const method = "generateRSAKeys";
        _additionals__WEBPACK_IMPORTED_MODULE_2__["default"].logDebug(method, "Starting RSA key generation...");
        try {
            // Validate WebCrypto API availability
            if (!window.crypto || !window.crypto.subtle) {
                throw new Error("WebCrypto API is not available in this environment");
            }
            const keyPair = await window.crypto.subtle.generateKey({
                name: "RSA-OAEP",
                modulusLength: 4096,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            }, true, ["encrypt", "decrypt"]);
            console.log("RSA key pair generated successfully");
            const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
            const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
            _additionals__WEBPACK_IMPORTED_MODULE_2__["default"].logDebug(method, "RSA keys generated successfully", {
                publicKeyLength: publicKeyBuffer.byteLength,
                privateKeyLength: privateKeyBuffer.byteLength,
            });
            return {
                publicKey: {
                    key: _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.bufferToBase64(publicKeyBuffer),
                    algorithm: "RSA-OAEP",
                    length: 4096,
                    format: "spki",
                },
                privateKey: {
                    key: _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.bufferToBase64(privateKeyBuffer),
                    algorithm: "RSA-OAEP",
                    length: 4096,
                    format: "pkcs8",
                    protected: true,
                },
            };
        }
        catch (error) {
            _additionals__WEBPACK_IMPORTED_MODULE_2__["default"].logError(method, error);
            throw new Error(`Failed to generate RSA keys: ${error.message}`);
        }
    }
}
KeyGenerationService.SALT_LENGTH = 16;
KeyGenerationService.IV_LENGTH = 12;
KeyGenerationService.KEY_LENGTH = 32;
KeyGenerationService.PBKDF2_ITERATIONS = 100000;


/***/ }),

/***/ "./src/services/Keys-managment/ZeroKnowledgeProof.ts":
/*!***********************************************************!*\
  !*** ./src/services/Keys-managment/ZeroKnowledgeProof.ts ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ZeroKnowledgeProofService: () => (/* binding */ ZeroKnowledgeProofService)
/* harmony export */ });
/* harmony import */ var _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./CryptoUtils */ "./src/services/Keys-managment/CryptoUtils.ts");

class ZeroKnowledgeProofService {
    static async generateZKP(message, privateKeyBase64) {
        const privateKey = await _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.importRSAPrivateKey(privateKeyBase64);
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const signature = await window.crypto.subtle.sign({
            name: "RSA-PSS",
            saltLength: 32,
        }, privateKey, data);
        return {
            proof: _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.bufferToBase64(signature),
            publicKey: privateKeyBase64, // In a real ZKP system, you'd derive a public key
        };
    }
    static async verifyZKP(message, proofBase64, publicKeyBase64) {
        try {
            const publicKey = await _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.importRSAPublicKey(publicKeyBase64);
            const proof = _CryptoUtils__WEBPACK_IMPORTED_MODULE_0__.CryptoUtils.base64ToBuffer(proofBase64);
            const encoder = new TextEncoder();
            const data = encoder.encode(message);
            return await window.crypto.subtle.verify({
                name: "RSA-PSS",
                saltLength: 32,
            }, publicKey, proof, data);
        }
        catch (error) {
            console.error("ZKP verification failed:", error);
            return false;
        }
    }
}


/***/ }),

/***/ "./src/services/Keys-managment/additionals.ts":
/*!****************************************************!*\
  !*** ./src/services/Keys-managment/additionals.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * TODO:
 * this file will manage the encryption and decryption of the data.
 * we start with the creation of the account geven the website and the auth key
 * then we create the keys and store them in the local storage and give them to the user
 * we send the asymmetric keys to the server to be stored in the database so the user have ones and the server have the other and bouth needed to decrypt the data, exept the keys that will be used to decrypte the website and the auth key (those will be stored in the database for the session time and by the user)
 * we need a function to decrypte the website and the auth key, then we get the data from the database and decrypt them with the symmetric keys
 * we will use the src/services/db.ts to manage the database and the local storage and use src\services\Keys-managment\SessionManager.ts to manage the session of the user
 *  * Encryption Service
 * TODO: Implement the following functionalities:
 * 1. Key Generation:
 *    - Generate RSA 4096-bit keypairs
 *    - Generate AES-256-GCM keys
 *    - Handle PBKDF2 key derivation
 *
 * 2. Encryption Operations:
 *    - Encrypt/decrypt passwords
 *    - Handle website data encryption
 *    - Manage authentication tokens
 *    - Implement zero-knowledge proofs
 *
 * 3. Key Exchange:
 *    - Secure key transmission
 *    - Key backup encryption
 *    - Organization key sharing
 *
 * 4. Security Measures:
 *    - Implement constant-time operations
 *    - Handle secure random generation
 *    - Protect against timing attacks
 */
class AdditionalMethods {
    static logDebug(method, message, data) {
        if (this.DEBUG) {
            console.log(`[EncryptionService:${method}] ${message}`, data || "");
        }
    }
    static formatTime(milliseconds) {
        const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
        const ms = milliseconds % 1000;
        const parts = [];
        if (days > 0)
            parts.push(`${days}d`);
        if (hours > 0)
            parts.push(`${hours}h`);
        if (minutes > 0)
            parts.push(`${minutes}m`);
        if (seconds > 0)
            parts.push(`${seconds}s`);
        if (ms > 0)
            parts.push(`${ms}ms`);
        return parts.join(" ") || "0ms";
    }
    /**
     * Logs debug message with execution time
     */
    static logTime(message, timeInMs) {
        if (this.DEBUG) {
            const formattedTime = this.formatTime(timeInMs);
            console.log(` ${message} (took ${formattedTime})`);
        }
    }
    // Add session storage property
    static logError(method, error) {
        console.error(`[EncryptionService:${method}] Error:`, {
            message: error.message,
            stack: error.stack,
            details: error,
        });
    }
}
AdditionalMethods.SALT_LENGTH = 16;
AdditionalMethods.IV_LENGTH = 12;
AdditionalMethods.KEY_LENGTH = 32;
AdditionalMethods.PBKDF2_ITERATIONS = 100000;
AdditionalMethods.DEBUG = true;
// Add session storage property
AdditionalMethods.sessionData = new Map();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (AdditionalMethods);


/***/ }),

/***/ "./src/services/StorageService.ts":
/*!****************************************!*\
  !*** ./src/services/StorageService.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _storage_KeyStorage__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./storage/KeyStorage */ "./src/services/storage/KeyStorage.ts");
/* harmony import */ var _storage_CredentialStorage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./storage/CredentialStorage */ "./src/services/storage/CredentialStorage.ts");
/* harmony import */ var _storage_WindowsHelloStorage__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./storage/WindowsHelloStorage */ "./src/services/storage/WindowsHelloStorage.ts");



class StorageService {
}
StorageService.Keys = _storage_KeyStorage__WEBPACK_IMPORTED_MODULE_0__.KeyStorage;
StorageService.Credentials = _storage_CredentialStorage__WEBPACK_IMPORTED_MODULE_1__.CredentialStorage;
StorageService.SecureStorage = _storage_WindowsHelloStorage__WEBPACK_IMPORTED_MODULE_2__.SecureStorageService;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (StorageService);


/***/ }),

/***/ "./src/services/auth/WebAuthnService.ts":
/*!**********************************************!*\
  !*** ./src/services/auth/WebAuthnService.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   WebAuthnService: () => (/* binding */ WebAuthnService)
/* harmony export */ });
/* harmony import */ var _sessionManagment_SessionManager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../sessionManagment/SessionManager */ "./src/services/sessionManagment/SessionManager.ts");
/* harmony import */ var _Keys_managment_additionals__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../Keys-managment/additionals */ "./src/services/Keys-managment/additionals.ts");


class WebAuthnService {
    static async isWebAuthnSupported() {
        const isSupported = window.PublicKeyCredential !== undefined;
        console.log("WebAuthn support check:", {
            isSupported,
            PublicKeyCredential: !!window.PublicKeyCredential,
            platform: navigator.platform,
            userAgent: navigator.userAgent,
        });
        return isSupported;
    }
    static async registerBiometric(username) {
        try {
            console.log("Starting biometric registration for user:", username);
            if (!(await this.isWebAuthnSupported())) {
                console.error("WebAuthn not supported in this browser");
                throw new Error("WebAuthn is not supported in this browser");
            }
            const challenge = crypto.getRandomValues(new Uint8Array(32));
            console.log("Generated challenge:", challenge);
            const createCredentialOptions = {
                challenge,
                rp: {
                    name: "MePassword Extension",
                    id: window.location.hostname,
                },
                user: {
                    id: Uint8Array.from(username, (c) => c.charCodeAt(0)),
                    name: username,
                    displayName: username,
                },
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 }, // ES256
                    { type: "public-key", alg: -257 }, // RS256
                ],
                timeout: this.AUTH_TIMEOUT,
                authenticatorSelection: {
                    authenticatorAttachment: "platform", // Use platform authenticator (Windows Hello, Touch ID, etc.)
                    userVerification: "required",
                    residentKey: "preferred",
                },
            };
            console.log("Credential options:", createCredentialOptions);
            console.log("Requesting credential creation...");
            const credential = await navigator.credentials.create({
                publicKey: createCredentialOptions,
            });
            console.log("Credential created:", credential);
            if (credential) {
                console.log("Updating session settings with biometric verification");
                const biometricType = this.detectBiometricType();
                console.log("Detected biometric type:", biometricType);
                await _sessionManagment_SessionManager__WEBPACK_IMPORTED_MODULE_0__.SessionManagementService.updateSessionSettings({
                    biometricVerification: true,
                    biometricType: biometricType,
                });
                return true;
            }
            console.log("Credential creation failed");
            return false;
        }
        catch (error) {
            console.error("Error in registerBiometric:", error);
            _Keys_managment_additionals__WEBPACK_IMPORTED_MODULE_1__["default"].logError("registerBiometric", error);
            throw error;
        }
    }
    static async verifyBiometric() {
        try {
            console.log("Starting biometric verification");
            if (!(await this.isWebAuthnSupported())) {
                console.log("WebAuthn not supported, aborting verification");
                return false;
            }
            const challenge = crypto.getRandomValues(new Uint8Array(32));
            console.log("Generated verification challenge:", challenge);
            const assertionOptions = {
                challenge,
                timeout: this.AUTH_TIMEOUT,
                userVerification: "required",
            };
            console.log("Assertion options:", assertionOptions);
            console.log("Requesting credential verification...");
            const assertion = await navigator.credentials.get({
                publicKey: assertionOptions,
            });
            console.log("Verification result:", assertion);
            return assertion !== null;
        }
        catch (error) {
            console.error("Error in verifyBiometric:", error);
            _Keys_managment_additionals__WEBPACK_IMPORTED_MODULE_1__["default"].logError("verifyBiometric", error);
            return false;
        }
    }
    static detectBiometricType() {
        const ua = navigator.userAgent.toLowerCase();
        console.log("Detecting biometric type for user agent:", ua);
        // Check for Windows Hello (Windows 10 and above)
        if (ua.includes("windows nt") &&
            parseFloat(ua.split("windows nt ")[1]) >= 10.0) {
            console.log("Detected Windows Hello (face recognition)");
            return "face";
        }
        // Check for MacOS Touch ID
        if (ua.includes("macintosh") || ua.includes("mac os x")) {
            console.log("Detected Touch ID");
            return "fingerprint";
        }
        // Check for Android fingerprint
        if (ua.includes("android")) {
            console.log("Detected Android fingerprint");
            return "fingerprint";
        }
        console.log("Defaulting to face recognition for Windows");
        return "face"; // Default to face for Windows
    }
}
WebAuthnService.AUTH_TIMEOUT = 60000; // 1 minute


/***/ }),

/***/ "./src/services/sessionManagment/SessionManager.ts":
/*!*********************************************************!*\
  !*** ./src/services/sessionManagment/SessionManager.ts ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SessionManagementService: () => (/* binding */ SessionManagementService)
/* harmony export */ });
/* harmony import */ var _EncryptionService__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../EncryptionService */ "./src/services/EncryptionService.ts");
/* harmony import */ var _storage_KeyStorage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../storage/KeyStorage */ "./src/services/storage/KeyStorage.ts");
/* harmony import */ var _Keys_managment_additionals__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../Keys-managment/additionals */ "./src/services/Keys-managment/additionals.ts");
/* harmony import */ var _auth_WebAuthnService__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../auth/WebAuthnService */ "./src/services/auth/WebAuthnService.ts");
/* harmony import */ var _StorageService__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../StorageService */ "./src/services/StorageService.ts");





class SessionManagementService {
    constructor(userSettings = {}) {
        this.settings = Object.assign({ autoLockTime: 0, sessionTime: 0, sessionStart: 0, pushNotifications: false, biometricVerification: false, biometricType: "fingerprint", autoLockStart: 0, sessionExpiry: 0, lastAccessTime: 0 }, userSettings);
    }
    static async initialize() {
        try {
            console.log("Static initialize called");
            const defaultSettings = {
                autoLockTime: 1000 * 60 * 5,
                sessionTime: 86400000 * 30,
                sessionStart: Date.now(),
                pushNotifications: false,
                biometricVerification: false,
                biometricType: "none",
                autoLockStart: Date.now(),
                sessionExpiry: Date.now() + 86400000 * 30,
                lastAccessTime: Date.now(),
            };
            await _StorageService__WEBPACK_IMPORTED_MODULE_4__["default"].SecureStorage.storeSettings(defaultSettings);
            await SessionManagementService.updateSessionSettings(defaultSettings);
            console.log("Session initialized with default settings:", defaultSettings);
        }
        catch (error) {
            console.error("Failed to initialize session:", error);
        }
    }
    static async getSessionSettings() {
        console.log("Getting session settings");
        if (!this.sessionSettings) {
            try {
                this.sessionSettings = await _storage_KeyStorage__WEBPACK_IMPORTED_MODULE_1__.KeyStorage.getSettingsFromStorage();
                console.log("Retrieved settings from storage:", this.sessionSettings);
            }
            catch (error) {
                console.error("Failed to get settings:", error);
                throw error;
            }
        }
        else {
            console.log("Using cached session settings:", this.sessionSettings);
        }
        return this.sessionSettings;
    }
    static async updateSessionSettings(newSettings) {
        this.sessionSettings = Object.assign(Object.assign({}, this.sessionSettings), newSettings);
        console.log("Updating session settings.");
        await _StorageService__WEBPACK_IMPORTED_MODULE_4__["default"].SecureStorage.storeSettings(this.sessionSettings);
        console.log("Session settings updated successfully.");
        const settingsType = {
            sessionSettings: this.sessionSettings,
        };
        await _EncryptionService__WEBPACK_IMPORTED_MODULE_0__["default"].API.SettingsPut(settingsType);
        console.log("Session settings updated in storage.");
    }
    static async getKeys() {
        if (!this.keys) {
            console.log("Keys not found in memory, retrieving from storage.");
            this.keys = await _storage_KeyStorage__WEBPACK_IMPORTED_MODULE_1__.KeyStorage.getKeysFromStorage();
            console.log("Keys retrieved from storage:", this.keys);
        }
        else {
            console.log("Using cached keys:", this.keys);
        }
        return this.keys;
    }
    static async updateKeys(newKeys) {
        this.keys = newKeys;
        console.log("Updating keys.");
        await _storage_KeyStorage__WEBPACK_IMPORTED_MODULE_1__.KeyStorage.storeKeys(newKeys);
        console.log("Keys updated successfully.");
    }
    static async clearSession() {
        console.log("Clearing session data.");
        await _StorageService__WEBPACK_IMPORTED_MODULE_4__["default"].SecureStorage.storeSettings({});
        await _storage_KeyStorage__WEBPACK_IMPORTED_MODULE_1__.KeyStorage.storeKeys({});
        this.sessionSettings = null;
        this.keys = null;
        console.log("Session data cleared.");
    }
    /**
     * Checks if the session has expired based on session time settings.
     * Ends the session if the time has exceeded.
     */
    async checkSessionExpiration() {
        try {
            const settings = await _storage_KeyStorage__WEBPACK_IMPORTED_MODULE_1__.KeyStorage.getSettingsFromStorage();
            // If no settings exist, we consider the session expired
            if (!settings || Object.keys(settings).length === 0) {
                console.log("No settings found, considering session expired");
                return true;
            }
            if (!settings.sessionStart || !settings.sessionTime) {
                console.log("Invalid session settings: missing required fields");
                return true;
            }
            const currentTime = Date.now();
            const sessionExpiry = settings.sessionStart + settings.sessionTime;
            const remainingTime = sessionExpiry - currentTime;
            _Keys_managment_additionals__WEBPACK_IMPORTED_MODULE_2__["default"].logTime("Time until session expiry", remainingTime);
            _Keys_managment_additionals__WEBPACK_IMPORTED_MODULE_2__["default"].logTime("Session duration", settings.sessionTime);
            return currentTime >= sessionExpiry;
        }
        catch (error) {
            console.log("Failed to check session expiration:", error);
            return true;
        }
    }
    /**
     * Starts a short-lock timer for quick reauthentication within a limited time.
     * Should be called upon successful password entry or biometric verification.
     */
    startShortLockTimer() {
        this.settings.autoLockStart = Date.now();
    }
    /**
     * Checks if the short-lock timer has expired based on auto-lock settings.
     * Returns true if the user needs to re-authenticate, false otherwise.
     */
    async checkShortLockExpiration() {
        const settings = await _storage_KeyStorage__WEBPACK_IMPORTED_MODULE_1__.KeyStorage.getSettingsFromStorage();
        const currentTime = Date.now();
        const shortLockExpiry = settings.autoLockStart + settings.autoLockTime;
        const remainingTime = shortLockExpiry - currentTime;
        _Keys_managment_additionals__WEBPACK_IMPORTED_MODULE_2__["default"].logTime("Time until short lock expiry", remainingTime);
        _Keys_managment_additionals__WEBPACK_IMPORTED_MODULE_2__["default"].logTime("Short lock duration", settings.autoLockTime);
        return currentTime <= shortLockExpiry;
    }
    /**
     * Manually triggers short-lock to end early, requiring re-authentication.
     */
    async endShortLock() {
        const settings = await _storage_KeyStorage__WEBPACK_IMPORTED_MODULE_1__.KeyStorage.getSettingsFromStorage();
        await _storage_KeyStorage__WEBPACK_IMPORTED_MODULE_1__.KeyStorage.updateSettings({
            autoLockStart: settings.autoLockStart + settings.autoLockTime,
        });
    }
    /**
     * Enable or disable biometric authentication based on settings.
     * Ensures that biometric setup is available on the device.
     */
    async configureBiometric(enable = true) {
        try {
            console.log("Configuring biometric:", enable);
            if (enable) {
                const isSupported = await _auth_WebAuthnService__WEBPACK_IMPORTED_MODULE_3__.WebAuthnService.isWebAuthnSupported();
                if (!isSupported) {
                    throw new Error("Biometric authentication is not supported on this device");
                }
                const username = "user"; // Get this from your user management system
                const registered = await _auth_WebAuthnService__WEBPACK_IMPORTED_MODULE_3__.WebAuthnService.registerBiometric(username);
                if (registered) {
                    const biometricType = _auth_WebAuthnService__WEBPACK_IMPORTED_MODULE_3__.WebAuthnService.detectBiometricType();
                    const settings = await SessionManagementService.getSessionSettings();
                    const updatedSettings = Object.assign(Object.assign({}, settings), { biometricVerification: true, biometricType: biometricType });
                    await SessionManagementService.updateSessionSettings(updatedSettings);
                    console.log("Biometric settings updated:", updatedSettings);
                }
                else {
                    throw new Error("Failed to register biometric");
                }
            }
            else {
                const settings = await SessionManagementService.getSessionSettings();
                const updatedSettings = Object.assign(Object.assign({}, settings), { biometricVerification: false, biometricType: "none" });
                await SessionManagementService.updateSessionSettings(updatedSettings);
                console.log("Biometric disabled:", updatedSettings);
            }
        }
        catch (error) {
            console.error("Error in configureBiometric:", error);
            throw error;
        }
    }
    async checkBiometricType() {
        return _auth_WebAuthnService__WEBPACK_IMPORTED_MODULE_3__.WebAuthnService.detectBiometricType();
    }
}
// Simplify static methods to focus on core functionality
SessionManagementService.sessionSettings = null;
SessionManagementService.keys = null;


/***/ }),

/***/ "./src/services/storage/CredentialStorage.ts":
/*!***************************************************!*\
  !*** ./src/services/storage/CredentialStorage.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CredentialStorage: () => (/* binding */ CredentialStorage)
/* harmony export */ });
/* harmony import */ var _StorageService__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../StorageService */ "./src/services/StorageService.ts");

class CredentialStorage {
    static async storeEncryptedCredentials(credentials) {
        try {
            _StorageService__WEBPACK_IMPORTED_MODULE_0__["default"].SecureStorage.storeKeys(credentials);
        }
        catch (error) {
            console.error(`Error storing Credentials`, error);
        }
    }
    static async deleteEncryptedPassword(id) {
        try {
            console.log(`Deleting encrypted password for ID: ${id}`);
            console.log(`Password deleted successfully for ID: ${id}`);
        }
        catch (error) {
            console.error(`Error deleting password for ID: ${id}`, error);
        }
    }
    static async getEncryptedCridentials_Keys() {
        try {
            console.log("Retrieving encrypted credentials");
            const credentialsJSON = await _StorageService__WEBPACK_IMPORTED_MODULE_0__["default"].SecureStorage.getKeysFromStorage();
            if (credentialsJSON) {
                const credentials = credentialsJSON;
                console.log("Retrieved credentials successfully");
                return credentials;
            }
            return null;
        }
        catch (error) {
            console.error("Error retrieving credentials:", error);
            return null;
        }
    }
}


/***/ }),

/***/ "./src/services/storage/KeyStorage.ts":
/*!********************************************!*\
  !*** ./src/services/storage/KeyStorage.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   KeyStorage: () => (/* binding */ KeyStorage)
/* harmony export */ });
/* harmony import */ var _WindowsHelloStorage__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./WindowsHelloStorage */ "./src/services/storage/WindowsHelloStorage.ts");

class KeyStorage {
    /**
     * function to get the cridintials from the browser storage
     * export interface KeySet {
    privateKey: string;
    AESKey: string;
    IV: string;
    Credentials: UserCredentials;
  }
    export interface UserCredentials {
    server: string;
    authToken: string;
    password?: string;
  }
     */
    static async getKeysFromStorage() {
        try {
            try {
                console.log("===========getting keysin windows storage=================");
                await _WindowsHelloStorage__WEBPACK_IMPORTED_MODULE_0__.SecureStorageService.getKeysFromStorage();
            }
            catch (error) {
                console.error("===============Error getting keys=====================");
            }
            const keysJSON = await _WindowsHelloStorage__WEBPACK_IMPORTED_MODULE_0__.SecureStorageService.getKeysFromStorage();
            const keys = keysJSON;
            return keys;
        }
        catch (error) {
            console.error("Error retrieving keys from storage:", error);
            return {};
        }
    }
    /**
     * function to post the cridintials from the browser storage
     */
    static async storeKeys(keys) {
        try {
            try {
                console.log("===========Storing keysin windows storage=================");
                await _WindowsHelloStorage__WEBPACK_IMPORTED_MODULE_0__.SecureStorageService.storeKeys(keys);
            }
            catch (error) {
                console.error("===============Error storing keys=====================");
            }
            console.log("Storing keys in storage.");
            await _WindowsHelloStorage__WEBPACK_IMPORTED_MODULE_0__.SecureStorageService.storeKeys(keys);
            console.log("Keys stored successfully.");
        }
        catch (error) {
            console.error("Error storing keys:", error);
        }
    }
    /**
     * function to get the session settings from the browser storage
     * export interface SessionSettings {
    pushNotifications: boolean; // Toggle notifications
    autoLockTime: number; // Time in ms or mins before auto-lock
    autoLockStart: number; // Timestamp of last auto-lock
    sessionStart: number; // Timestamp when session started
    sessionTime: number; // Total session time allowed before logout
    sessionExpiry?: number; // Timestamp for scheduled session expiration
    lastAccessTime?: number; // Timestamp of last session access (for inactivity checks)
    biometricVerification: boolean; // Use biometrics for verification
    biometricType: "face" | "fingerprint" | "none"; // Supported biometric types
    biometricPassword?: string; // Fallback password if biometrics fail
    lockOnLeave?: boolean; // Auto-lock on window blur/focus loss
  }
     */
    static async getSettingsFromStorage() {
        try {
            const settingsJSON = await _WindowsHelloStorage__WEBPACK_IMPORTED_MODULE_0__.SecureStorageService.getSettingsFromStorage();
            const settings = settingsJSON;
            return settings;
        }
        catch (error) {
            console.error("Error retrieving settings from storage:", error);
            return {};
        }
    }
    /**
     * function to post the session settings from the browser storage
     */
    static async storeSettings(settings) {
        try {
            console.log("Storing settings in storage.");
            await _WindowsHelloStorage__WEBPACK_IMPORTED_MODULE_0__.SecureStorageService.storeSettings(settings);
            console.log("Settings stored successfully.");
        }
        catch (error) {
            console.error("Error storing settings:", error);
        }
    }
    /**
     * function to update the session settings from the browser storage
     */
    static async updateSettings(newSettings) {
        try {
            const currentSettings = await this.getSettingsFromStorage();
            const updatedSettings = Object.assign(Object.assign({}, currentSettings), newSettings);
            await _WindowsHelloStorage__WEBPACK_IMPORTED_MODULE_0__.SecureStorageService.storeSettings(updatedSettings);
        }
        catch (error) {
            console.error("Error updating settings:", error);
        }
    }
}


/***/ }),

/***/ "./src/services/storage/WindowsHelloStorage.ts":
/*!*****************************************************!*\
  !*** ./src/services/storage/WindowsHelloStorage.ts ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SecureStorageService: () => (/* binding */ SecureStorageService)
/* harmony export */ });
class SecureStorageService {
    /**
     * Stores sensitive data (KeySet) using Windows Hello protection
     */
    // public static async storeProtectedData(data: KeySet): Promise<void> {
    //   try {
    //     // First, verify biometric authentication
    //     const isAuthenticated = await WebAuthnService.verifyBiometric();
    //     if (!isAuthenticated) {
    //       throw new Error(
    //         "Biometric authentication required for storing protected data"
    //       );
    //     }
    //     // Encrypt the sensitive data
    //     const encoder = new TextEncoder();
    //     const dataBuffer = encoder.encode(JSON.stringify(data));
    //     // Generate a new AES key for data encryption
    //     const aesKey = await crypto.subtle.generateKey(
    //       { name: "AES-GCM", length: 256 },
    //       true,
    //       ["encrypt", "decrypt"]
    //     );
    //     // Generate random IV
    //     const iv = crypto.getRandomValues(new Uint8Array(12));
    //     // Encrypt the data
    //     const encryptedData = await crypto.subtle.encrypt(
    //       { name: "AES-GCM", iv },
    //       aesKey,
    //       dataBuffer
    //     );
    //     // Export the AES key
    //     const exportedKey = await crypto.subtle.exportKey("raw", aesKey);
    //     // Store the encrypted data and IV
    //     const storageData = {
    //       encryptedData: Array.from(new Uint8Array(encryptedData)),
    //       iv: Array.from(iv),
    //       key: Array.from(new Uint8Array(exportedKey)),
    //     };
    //     await chrome.storage.local.set({
    //       [this.STORAGE_KEYS.PROTECTED_DATA]: storageData,
    //     });
    //   } catch (error) {
    //     console.error("Error storing protected data:", error);
    //     throw error;
    //   }
    // }
    // /**
    //  * Retrieves protected data using Windows Hello verification
    //  */
    // public static async getProtectedData(): Promise<KeySet | null> {
    //   try {
    //     // Verify biometric authentication
    //     const isAuthenticated = await WebAuthnService.verifyBiometric();
    //     if (!isAuthenticated) {
    //       throw new Error(
    //         "Biometric authentication required for accessing protected data"
    //       );
    //     }
    //     const result = await chrome.storage.local.get([
    //       this.STORAGE_KEYS.PROTECTED_DATA,
    //     ]);
    //     const storageData = result[this.STORAGE_KEYS.PROTECTED_DATA];
    //     if (!storageData) {
    //       return null;
    //     }
    //     // Import the AES key
    //     const keyBuffer = new Uint8Array(storageData.key);
    //     const aesKey = await crypto.subtle.importKey(
    //       "raw",
    //       keyBuffer,
    //       { name: "AES-GCM", length: 256 },
    //       false,
    //       ["decrypt"]
    //     );
    //     // Decrypt the data
    //     const decryptedBuffer = await crypto.subtle.decrypt(
    //       { name: "AES-GCM", iv: new Uint8Array(storageData.iv) },
    //       aesKey,
    //       new Uint8Array(storageData.encryptedData)
    //     );
    //     const decoder = new TextDecoder();
    //     const decryptedData = JSON.parse(decoder.decode(decryptedBuffer));
    //     return decryptedData as KeySet;
    //   } catch (error) {
    //     console.error("Error retrieving protected data:", error);
    //     throw error;
    //   }
    // }
    /**
     * Stores session data with automatic expiration
     */
    static async storeKeys(Keys) {
        console.log("###########################Storing keys:", Keys);
        try {
            await chrome.storage.local.set({
                [this.STORAGE_KEYS.PROTECTED_DATA]: Object.assign(Object.assign({}, Keys), { lastUpdated: Date.now() }),
            });
            console.log("###########################Keys stored successfully.");
        }
        catch (error) {
            console.error("Error storing session data:", error);
            throw error;
        }
    }
    /**
     * Retrieves session data if not expired
     */
    static async getKeysFromStorage() {
        console.log("###########################Retrieving keys from storage...");
        try {
            const result = await chrome.storage.local.get([
                this.STORAGE_KEYS.PROTECTED_DATA,
            ]);
            const Keys = result[this.STORAGE_KEYS.PROTECTED_DATA];
            if (!Keys) {
                console.log("###########################No Keys found.");
                return null;
            }
            console.log("###########################Keys retrieved:", Keys);
            return Keys;
        }
        catch (error) {
            console.error("Error retrieving session data:", error);
            throw error;
        }
    }
    static async storeSettings(settings) {
        console.log("###########################Storing settings:", settings);
        try {
            await chrome.storage.local.set({
                [this.STORAGE_KEYS.SESSION_DATA]: Object.assign(Object.assign({}, settings), { lastUpdated: Date.now() }),
            });
            console.log("###########################Settings stored successfully.");
        }
        catch (error) {
            console.error("Error storing session data:", error);
            throw error;
        }
    }
    /**
     * Retrieves session data if not expired
     */
    static async getSettingsFromStorage() {
        console.log("###########################Retrieving settings from storage...");
        try {
            const result = await chrome.storage.local.get([
                this.STORAGE_KEYS.SESSION_DATA,
            ]);
            const sessionData = result[this.STORAGE_KEYS.SESSION_DATA];
            if (!sessionData) {
                console.log("###########################No session settings found.");
                return null;
            }
            // Check if session has expired
            const currentTime = Date.now();
            if (currentTime > sessionData.sessionExpiry) {
                console.log("###########################Session has expired, clearing session data.");
                await this.clearSessionData();
                return null;
            }
            console.log("###########################Session settings retrieved:", sessionData);
            return sessionData;
        }
        catch (error) {
            console.error("Error retrieving session data:", error);
            throw error;
        }
    }
    /**
     * Clears all stored data
     */
    static async clearAllData() {
        console.log("###########################Clearing all stored data...");
        try {
            await chrome.storage.local.clear();
            console.log("###########################All data cleared successfully.");
        }
        catch (error) {
            console.error("Error clearing storage:", error);
            throw error;
        }
    }
    /**
     * Clears only session data
     */
    static async clearSessionData() {
        console.log("###########################Clearing session data...");
        try {
            await chrome.storage.local.remove([this.STORAGE_KEYS.SESSION_DATA]);
            console.log("###########################Session data cleared successfully.");
        }
        catch (error) {
            console.error("Error clearing session data:", error);
            throw error;
        }
    }
    /**
     * Updates the session settings
     */
    static async updateSettings(newSettings) {
        console.log("###########################Updating settings with:", newSettings);
        try {
            const currentSettings = await this.getSettingsFromStorage();
            const updatedSettings = Object.assign(Object.assign(Object.assign({}, currentSettings), newSettings), { lastUpdated: Date.now() });
            await this.storeSettings(updatedSettings);
            console.log("###########################Settings updated successfully.");
        }
        catch (error) {
            console.error("Error updating session settings:", error);
            throw error;
        }
    }
}
SecureStorageService.STORAGE_KEYS = {
    PROTECTED_DATA: "protectedData",
    SESSION_DATA: "sessionData",
    PUBLIC_DATA: "publicData",
};


/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/native.js":
/*!******************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/native.js ***!
  \******************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({ randomUUID });


/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/regex.js":
/*!*****************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/regex.js ***!
  \*****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i);


/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/rng.js":
/*!***************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/rng.js ***!
  \***************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ rng)
/* harmony export */ });
let getRandomValues;
const rnds8 = new Uint8Array(16);
function rng() {
    if (!getRandomValues) {
        if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
            throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
        }
        getRandomValues = crypto.getRandomValues.bind(crypto);
    }
    return getRandomValues(rnds8);
}


/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/stringify.js":
/*!*********************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/stringify.js ***!
  \*********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   unsafeStringify: () => (/* binding */ unsafeStringify)
/* harmony export */ });
/* harmony import */ var _validate_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./validate.js */ "./node_modules/uuid/dist/esm-browser/validate.js");

const byteToHex = [];
for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
    return (byteToHex[arr[offset + 0]] +
        byteToHex[arr[offset + 1]] +
        byteToHex[arr[offset + 2]] +
        byteToHex[arr[offset + 3]] +
        '-' +
        byteToHex[arr[offset + 4]] +
        byteToHex[arr[offset + 5]] +
        '-' +
        byteToHex[arr[offset + 6]] +
        byteToHex[arr[offset + 7]] +
        '-' +
        byteToHex[arr[offset + 8]] +
        byteToHex[arr[offset + 9]] +
        '-' +
        byteToHex[arr[offset + 10]] +
        byteToHex[arr[offset + 11]] +
        byteToHex[arr[offset + 12]] +
        byteToHex[arr[offset + 13]] +
        byteToHex[arr[offset + 14]] +
        byteToHex[arr[offset + 15]]).toLowerCase();
}
function stringify(arr, offset = 0) {
    const uuid = unsafeStringify(arr, offset);
    if (!(0,_validate_js__WEBPACK_IMPORTED_MODULE_0__["default"])(uuid)) {
        throw TypeError('Stringified UUID is invalid');
    }
    return uuid;
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (stringify);


/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/v4.js":
/*!**************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/v4.js ***!
  \**************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _native_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./native.js */ "./node_modules/uuid/dist/esm-browser/native.js");
/* harmony import */ var _rng_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./rng.js */ "./node_modules/uuid/dist/esm-browser/rng.js");
/* harmony import */ var _stringify_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./stringify.js */ "./node_modules/uuid/dist/esm-browser/stringify.js");



function v4(options, buf, offset) {
    if (_native_js__WEBPACK_IMPORTED_MODULE_0__["default"].randomUUID && !buf && !options) {
        return _native_js__WEBPACK_IMPORTED_MODULE_0__["default"].randomUUID();
    }
    options = options || {};
    const rnds = options.random || (options.rng || _rng_js__WEBPACK_IMPORTED_MODULE_1__["default"])();
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;
    if (buf) {
        offset = offset || 0;
        for (let i = 0; i < 16; ++i) {
            buf[offset + i] = rnds[i];
        }
        return buf;
    }
    return (0,_stringify_js__WEBPACK_IMPORTED_MODULE_2__.unsafeStringify)(rnds);
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (v4);


/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/validate.js":
/*!********************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/validate.js ***!
  \********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _regex_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./regex.js */ "./node_modules/uuid/dist/esm-browser/regex.js");

function validate(uuid) {
    return typeof uuid === 'string' && _regex_js__WEBPACK_IMPORTED_MODULE_0__["default"].test(uuid);
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (validate);


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**************************************!*\
  !*** ./src/background/background.ts ***!
  \**************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _services_EncryptionService__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../services/EncryptionService */ "./src/services/EncryptionService.ts");

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
        chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
            if (buttonIndex === 0) {
                // Save Password
                try {
                    const response = await _services_EncryptionService__WEBPACK_IMPORTED_MODULE_0__["default"].API.SettingGet();
                    const storedKeys = await response.json();
                    if (!storedKeys.publicKey) {
                        throw new Error("No encryption keys found");
                    }
                    const publicKey = await _services_EncryptionService__WEBPACK_IMPORTED_MODULE_0__["default"].Utils.importRSAPublicKey(storedKeys.publicKey);
                    const encryptedData = await _services_EncryptionService__WEBPACK_IMPORTED_MODULE_0__["default"].Utils.encryptWithRSA({
                        website,
                        user: username,
                        password,
                    }, publicKey);
                    await _services_EncryptionService__WEBPACK_IMPORTED_MODULE_0__["default"].API.PasswordPost({
                        id: crypto.randomUUID(),
                        website: encryptedData.website,
                        user: encryptedData.user,
                        password: encryptedData.password,
                    });
                }
                catch (error) {
                    console.error("Failed to save password:", error);
                }
            }
            chrome.notifications.clear(notificationId);
        });
    }
});

})();

/******/ })()
;
//# sourceMappingURL=background.js.map