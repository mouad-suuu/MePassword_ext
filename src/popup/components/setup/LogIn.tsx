import React, { useState } from "react";
import {
    SignedIn,
    SignedOut,
    useUser,
    useAuth,
    SignIn as ClerkSignIn,
    SignUp as ClerkSignUp
} from '@clerk/chrome-extension'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { useAppNavigate } from '../../routes';
import { Button } from "../ui/button";
import { Logo } from "../Logo";

// Note: Due to Chrome Extension limitations and security considerations,
// social provider authentication (Google, Facebook, etc.) is only available
// in the web application version of MePassword. The extension uses email/password
// authentication for better security and reliability.

type AuthView = 'main' | 'signin' | 'signup';

function LogIn() {
    const { user, isLoaded } = useUser();
    const { isSignedIn, getToken } = useAuth();
    const { goToSetup } = useAppNavigate();
    const [view, setView] = useState<AuthView>('main');



    const renderAuthContent = () => {
        switch (view) {
            case 'signin':
                return (
                    <Card className="w-full">
                       
                        <CardContent>
                            <ClerkSignIn 
                                redirectUrl={chrome.runtime.getURL('popup.html')}
                            />
                            <Button 
                              className="mt-4 w-full border-2 border-[hsl(222.2,47.4%,11.2%)] bg-transparent hover:bg-[hsl(217.2,32.6%,17.5%)] hover:text-white transition-colors" 
                                variant="ghost"
                                onClick={() => setView('main')}
                            >
                                Back to Login
                            </Button>
                        </CardContent>
                    </Card>
                );
            case 'signup':
                return (
                    <Card className="w-full">
                       
                        <CardContent>
                            <ClerkSignUp 
                                redirectUrl={chrome.runtime.getURL('popup.html')}
                            />
                            <Button 
                                className="mt-4 w-full border-2 border-[hsl(222.2,47.4%,11.2%)] bg-transparent hover:bg-[hsl(217.2,32.6%,17.5%)] hover:text-white transition-colors" 
                                variant="ghost"
                                onClick={() => setView('main')}
                            >
                                Back to Login
                            </Button>
                        </CardContent>
                    </Card>
                );
            default:
                return (
                    <Card className="w-full">
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <Logo clickable={true} />
                            </div>  
                            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(217.2,32.6%,17.5%)] bg-clip-text text-transparent">
                                MePassword
                            </CardTitle>
                            <CardDescription className="mt-3 space-y-2">
                                <p className="font-medium text-base">
                                    Your Digital Vault, Your Rules
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Where security meets simplicity
                                </p>
                                <p className="text-xs text-muted-foreground mt-4">
                                    Note: Social login options (Google, Facebook, etc.) are available in our web app at <a href="me-password-web.vercel.app" className="text-blue-500 hover:underline">me-password</a>, google chrom policies doesn't allow it.
                                </p>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button 
                                className="w-full rounded-md bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(217.2,32.6%,17.5%)] hover:opacity-90 transition-opacity text-white" 
                                onClick={() => setView('signin')}
                            >
                                Sign In
                            </Button>
                            <Button 
                                className="w-full rounded-md border-2 border-[hsl(222.2,47.4%,11.2%)] bg-transparent hover:bg-[hsl(217.2,32.6%,17.5%)] hover:text-white transition-colors" 
                                variant="outline"
                                onClick={() => setView('signup')}
                            >
                                Create Account
                            </Button>
                        </CardContent>
                    </Card>
                );
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <SignedIn>
                <Card>
                    <CardContent>
                        <Button onClick={goToSetup}>Continue to App</Button>
                    </CardContent>
                </Card>
            </SignedIn>
            <SignedOut>
                {renderAuthContent()}
            </SignedOut>
        </div>
    );
}

export default LogIn;