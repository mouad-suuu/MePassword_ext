import React from 'react';
import { SignIn as ClerkSignIn, useAuth } from '@clerk/chrome-extension';
import { Card, CardContent } from '../ui/card';
import { useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../routes';
import { useEffect } from 'react';

const SignIn = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate(AppRoutes.SETUP);
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="flex min-w-[350px] h-[450px] items-center justify-center bg-background p-4">
      <Card className="w-full">
        <CardContent>
          <ClerkSignIn 
            afterSignInUrl={chrome.runtime.getURL('popup.html')}
            routing="path"
            path="/signin"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SignIn;
