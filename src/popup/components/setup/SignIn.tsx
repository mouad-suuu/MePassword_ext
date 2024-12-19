import React from 'react';
import { SignIn as ClerkSignIn, useAuth } from '@clerk/chrome-extension';
import { Card, CardContent } from '../ui/card';
import { useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../routes';
import { useEffect } from 'react';
import { SessionManagementService } from '../../../services/sessionManagment/SessionManager';

const SignIn = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, getToken } = useAuth();

  useEffect(() => {
    const updateAuthToken = async () => {
      
      if (isLoaded && isSignedIn) {
        try {
          
          // Get the current stored keys
          const currentKeys = await SessionManagementService.getKeys();
         
          
          if (currentKeys) {
            // Get the new token from Clerk
            const token = await getToken();
            
            if (token) {
              // Update the auth token in the stored keys
              const updatedKeys = {
                ...currentKeys,
                Credentials: {
                  ...currentKeys.Credentials,
                  authToken: token
                }
              };
              
              // Store the updated keys
              await SessionManagementService.updateKeys(updatedKeys);
              }
          }
          
          // Navigate to setup page
          navigate(AppRoutes.SETUP);
        } catch (error) {
          console.error('[SignIn] Error updating auth token:', error);
        }
      }
    };

    updateAuthToken();
  }, [isLoaded, isSignedIn, navigate, getToken]);

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
