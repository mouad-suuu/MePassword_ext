import { KeyGenerationService } from "./KeyGeneration";
import { CredentialCryptoService } from "./CredentialCrypto";
import { ZeroKnowledgeProofService } from "./ZeroKnowledgeProof";
import { CryptoUtils } from "./CryptoUtils";

export class BaseEncryptionService {
    public static KeyGeneration = KeyGenerationService;
    public static CredentialCrypto = CredentialCryptoService;
    public static ZeroKnowledgeProof = ZeroKnowledgeProofService;
    public static Utils = CryptoUtils;
}
