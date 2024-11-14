import { KeyStorage } from "./storage/KeyStorage";
import { CredentialStorage } from "./storage/CredentialStorage";
import { LocalStorageManager } from "./storage/LocalStorageManager";

export default class StorageService {
  public static Keys = KeyStorage;
  public static Credentials = CredentialStorage;
  public static Storage = LocalStorageManager;
}
