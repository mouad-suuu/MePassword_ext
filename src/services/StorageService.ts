import { KeyStorage } from "./storage/KeyStorage";
import { CredentialStorage } from "./storage/CredentialStorage";
import { SecureStorageService } from "./storage/WindowsHelloStorage";

export default class StorageService {
  public static Keys = KeyStorage;
  public static Credentials = CredentialStorage;
  public static SecureStorage = SecureStorageService;
}
