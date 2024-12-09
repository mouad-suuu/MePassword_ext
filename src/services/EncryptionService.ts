import { BaseEncryptionService } from "./Keys-managment/BaseEncryptionService";
import { APIService } from "./Keys-managment/APIService";

export default class EncryptionService extends BaseEncryptionService {
  public static API = APIService;
  
}
