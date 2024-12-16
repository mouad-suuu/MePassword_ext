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
      console.log('[SignIn] Checking auth state:', { isLoaded, isSignedIn });
      
      if (isLoaded && isSignedIn) {
        try {
          console.log('[SignIn] User is authenticated, updating token...');
          
          // Get the current stored keys
          const currentKeys = await SessionManagementService.getKeys();
          console.log('[SignIn] Retrieved current keys:', { 
            hasKeys: !!currentKeys,
            hasCredentials: currentKeys ? !!currentKeys.Credentials : false 
          });
          
          if (currentKeys) {
            // Get the new token from Clerk
            console.log('[SignIn] Getting new token from Clerk...');
            const token = await getToken();
            console.log('[SignIn] Got new token:', { hasToken: !!token });
            
            if (token) {
              // Update the auth token in the stored keys
              const updatedKeys = {
                ...currentKeys,
                Credentials: {
                  ...currentKeys.Credentials,
                  authToken: token
                }
              };
              
              console.log('[SignIn] Updating stored keys with new token...');
              // Store the updated keys
              await SessionManagementService.updateKeys(updatedKeys);
              console.log('[SignIn] Successfully updated auth token');
            }
          }
          
          console.log('[SignIn] Navigating to setup page...');
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
