import React, { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import Passwords from "./components/Passwords";
import Keys from "./components/keys";
import Profile from "./components/profile";
import Settings from "./components/Settings";
import SetupEntry from "./components/setup/SetupEntry";
//import StoringServiceTest from "./components/Setup";
// import SessionManager from "../services/Keys-managment/SessionManager";
import DatabaseService from "../services/db";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";

// const App = () => {
//   console.log("App component is rendering");
//   const [activeTab, setActiveTab] = useState("passwords");
//   const [isInitialized, setIsInitialized] = useState(false);
//   const [needsKeyRotation, setNeedsKeyRotation] = useState(false);
//   const [sessionStatus, setSessionStatus] = useState<{
//     isValid: boolean;
//     isLoading: boolean;
//     error?: string;
//   }>({
//     isValid: false,
//     isLoading: true,
//   });

//   useEffect(() => {
//     console.log("Component mounted, checking session status...");
//     checkSessionStatus();
//     const intervalId = setInterval(() => {
//       console.log("Checking session status...");
//       checkSessionStatus();
//     }, 60000);
//     return () => {
//       console.log("Component unmounted, clearing interval...");
//       clearInterval(intervalId);
//     };
//   }, []);

//   const checkSessionStatus = async () => {
//     try {
//       console.log("Validating session...");
//       const isValid = await SessionManager.instance.validateSession();
//       console.log("Session valid:", isValid);
//       setSessionStatus({
//         isValid,
//         isLoading: false,
//       });

//       if (isValid) {
//         const keySet = SessionManager.instance.getKeySet();
//         const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
//         const needsRotation = Date.now() - keySet.lastRotated > thirtyDaysInMs;
//         console.log("Needs key rotation:", needsRotation);
//         setNeedsKeyRotation(needsRotation);
//       }
//     } catch (error) {
//       console.error("Error validating session:", error);
//       setSessionStatus({
//         isValid: false,
//         isLoading: false,
//         error: (error as Error).message,
//       });
//     }
//   };

//   const handleKeyRotation = async () => {
//     try {
//       console.log("Rotating keys...");
//       await DatabaseService.rotateKeys();
//       console.log("Keys rotated successfully.");
//       setNeedsKeyRotation(false);
//       await checkSessionStatus();
//     } catch (error) {
//       console.error("Error rotating keys:", error);
//       setSessionStatus((prev) => ({
//         ...prev,
//         error: "Failed to rotate keys. Please try again.",
//       }));
//     }
//   };

//   const handleLogout = async () => {
//     try {
//       console.log("Logging out...");
//       await SessionManager.instance.endSession();
//       console.log("Logged out successfully.");
//       setSessionStatus({
//         isValid: false,
//         isLoading: false,
//       });
//       setActiveTab("passwords");
//     } catch (error) {
//       console.error("Error logging out:", error);
//     }
//   };

//   if (sessionStatus.isLoading) {
//     return (
//       <div className="min-w-[400px] min-h-96 bg-gray-50 flex items-center justify-center">
//         <div className="text-gray-600">Loading...</div>
//         <h1>4 testing the appearence</h1>
//       </div>
//     );
//   }

//   if (!sessionStatus.isValid) {
//     return (
//       <div className="min-w-[400px] min-h-96 bg-gray-50">
//         <SetupEntry />
//         {sessionStatus.error && (
//           <Alert variant="destructive" className="mt-4">
//             <AlertTitle>Error</AlertTitle>
//             <h1>3 testing the appearence</h1>
//             <AlertDescription>{sessionStatus.error}</AlertDescription>
//           </Alert>
//         )}
//       </div>
//     );
//   }

//   return (
//     <div className="min-w-[400px] min-h-96 bg-gray-50">
//       {needsKeyRotation && (
//         <Alert variant="default" className="mb-4">
//           <AlertTitle>Security Notice</AlertTitle>
//           <AlertDescription>
//             Your encryption keys need to be rotated for security.
//             <button
//               onClick={handleKeyRotation}
//               className="ml-2 text-sm font-medium underline hover:text-amber-600"
//             >
//               Rotate Keys Now
//             </button>
//             <h1>2 testing the appearence</h1>
//           </AlertDescription>
//         </Alert>
//       )}

//       <Navigation
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         onLogout={handleLogout}
//       />
//       <h1>1 testing the appearence</h1>
//       <main className="p-4">
//         {activeTab === "passwords" && <Passwords />}
//         {activeTab === "keys" && <Keys />}
//         {activeTab === "profile" && <Profile />}
//         {activeTab === "settings" && <Settings />}
//       </main>
//     </div>
//   );
// };

const App = () => {
  return (
    <div className="min-w-[400px] min-h-96 bg-gray-50">
      <SetupEntry />
    </div>
  );
};
export default App;
