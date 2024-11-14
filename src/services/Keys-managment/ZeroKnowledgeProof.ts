import { CryptoUtils } from "./CryptoUtils";

export class ZeroKnowledgeProofService {
  public static async generateZKP(
    message: string,
    privateKeyBase64: string
  ): Promise<{ proof: string; publicKey: string }> {
    const privateKey = await CryptoUtils.importRSAPrivateKey(privateKeyBase64);
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const signature = await window.crypto.subtle.sign(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      privateKey,
      data
    );

    return {
      proof: CryptoUtils.bufferToBase64(signature),
      publicKey: privateKeyBase64, // In a real ZKP system, you'd derive a public key
    };
  }

  public static async verifyZKP(
    message: string,
    proofBase64: string,
    publicKeyBase64: string
  ): Promise<boolean> {
    try {
      const publicKey = await CryptoUtils.importRSAPublicKey(publicKeyBase64);
      const proof = CryptoUtils.base64ToBuffer(proofBase64);
      const encoder = new TextEncoder();
      const data = encoder.encode(message);

      return await window.crypto.subtle.verify(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        publicKey,
        proof,
        data
      );
    } catch (error) {
      console.error("ZKP verification failed:", error);
      return false;
    }
  }
}
