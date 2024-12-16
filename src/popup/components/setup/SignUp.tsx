import React from 'react';
import { SignUp as ClerkSignUp, useAuth } from '@clerk/chrome-extension';
import { Card, CardContent } from '../ui/card';
import { useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../routes';
import { useEffect } from 'react';
import { SessionManagementService } from '../../../services/sessionManagment/SessionManager';

const SignUp = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, getToken } = useAuth();

  useEffect(() => {
    const updateAuthToken = async () => {
      console.log('[SignUp] Checking auth state:', { isLoaded, isSignedIn });
      
      if (isLoaded && isSignedIn) {
        try {
          console.log('[SignUp] User is authenticated, updating token...');
          
          // Get the current stored keys
          const currentKeys = await SessionManagementService.getKeys();
          console.log('[SignUp] Retrieved current keys:', { 
            hasKeys: !!currentKeys,
            hasCredentials: currentKeys ? !!currentKeys.Credentials : false 
          });
          
          if (currentKeys) {
            // Get the new token from Clerk
            console.log('[SignUp] Getting new token from Clerk...');
            const token = await getToken();
            console.log('[SignUp] Got new token:', { hasToken: !!token });
            
            if (token) {
              // Update the auth token in the stored keys
              const updatedKeys = {
                ...currentKeys,
                Credentials: {
                  ...currentKeys.Credentials,
                  authToken: token
                }
              };
              
              console.log('[SignUp] Updating stored keys with new token...');
              // Store the updated keys
              await SessionManagementService.updateKeys(updatedKeys);
              console.log('[SignUp] Successfully updated auth token');
            }
          }
          
          console.log('[SignUp] Navigating to setup page...');
          // Navigate to setup page
          navigate(AppRoutes.SETUP);
        } catch (error) {
          console.error('[SignUp] Error updating auth token:', error);
        }
      }
    };

    updateAuthToken();
  }, [isLoaded, isSignedIn, navigate, getToken]);

  return (
    <div className="flex min-w-[350px] h-[450px] items-center justify-center bg-background p-4">
      <Card className="w-full">
        <CardContent>
          <ClerkSignUp 
            afterSignUpUrl={chrome.runtime.getURL('popup.html')}
            routing="path"
            path="/signup"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;
