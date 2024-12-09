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
import { useEffect } from "react";
import { useAppNavigate } from '../../routes';
import { Button } from "../ui/button";
import { AppRoutes } from "../../routes";

type AuthView = 'main' | 'signin' | 'signup';

function LogIn() {
    const { user, isLoaded } = useUser();
    const { isSignedIn } = useAuth();
    const { goToSetup } = useAppNavigate();
    const [view, setView] = useState<AuthView>('main');

    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            console.log("User authenticated, navigating to setup");
            goToSetup();
        }
    }, [user, isLoaded, isSignedIn, goToSetup]);

    const renderAuthContent = () => {
        switch (view) {
            case 'signin':
                return (
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Sign In</CardTitle>
                            <CardDescription>Welcome back!</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ClerkSignIn 
                                redirectUrl={chrome.runtime.getURL('popup.html')}
                            />
                            <Button 
                                className="mt-4 w-full" 
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
                        <CardHeader>
                            <CardTitle>Create Account</CardTitle>
                            <CardDescription>Join MePassword today!</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ClerkSignUp 
                                redirectUrl={chrome.runtime.getURL('popup.html')}
                            />
                            <Button 
                                className="mt-4 w-full" 
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
                        <CardHeader>
                            <CardTitle>Welcome to MePassword</CardTitle>
                            <CardDescription>Sign in to access your passwords</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-between gap-4">
                            <Button 
                                className="flex-1" 
                                onClick={() => setView('signin')}
                                variant="default"
                            >
                                Sign In
                            </Button>
                            <Button 
                                className="flex-1" 
                                onClick={() => setView('signup')}
                                variant="outline"
                            >
                                Sign Up
                            </Button>
                        </CardContent>
                    </Card>
                );
        }
    };

    return (
        <div className="flex min-w-[350px] h-[450px] items-center justify-center bg-background p-4">
            <SignedIn>
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome Back!</CardTitle>
                        <CardDescription>You are already signed in.</CardDescription>
                    </CardHeader>
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