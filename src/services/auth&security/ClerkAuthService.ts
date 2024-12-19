import { useAuth } from '@clerk/chrome-extension';

export class ClerkAuthService {
    private static instance: ClerkAuthService | null = null;

    public static getInstance(): ClerkAuthService {
        if (!this.instance) {
            this.instance = new ClerkAuthService();
        }
        return this.instance;
    }

    public async getActiveToken(): Promise<string> {
        try {
            // Get the current session token from Clerk
            const { getToken } = useAuth();
            const token = await getToken();
            
            if (!token) {
                throw new Error('No active session token found');
            }

            return token;
        } catch (error) {
            console.error('[ClerkAuthService] Error getting token:', error);
            throw error;
        }
    }
}
