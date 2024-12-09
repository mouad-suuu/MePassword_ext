import { BaseEncryptionService } from "./BaseEncryptionService";
import { APIService } from "./APIService";

export class SessionEncryptionService extends BaseEncryptionService {
    public static API = APIService;
}
