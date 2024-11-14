import { KeyGenerationService } from "./Keys-managment/KeyGeneration";
import { CredentialCryptoService } from "./Keys-managment/CredentialCrypto";
import { ZeroKnowledgeProofService } from "./Keys-managment/ZeroKnowledgeProof";
import { SessionManagementService } from "./sessionManagment/SessionManager";
import { APIService } from "./Keys-managment/APIService";
import { CryptoUtils } from "./Keys-managment/CryptoUtils";

export default class EncryptionService {
  public static KeyGeneration = KeyGenerationService;
  public static CredentialCrypto = CredentialCryptoService;
  public static ZeroKnowledgeProof = ZeroKnowledgeProofService;
  public static Session = SessionManagementService;
  public static API = APIService;
  public static Utils = CryptoUtils;
}
