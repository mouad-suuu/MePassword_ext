import React from "react";

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  console.log("SessionProvider: Rendering");

  React.useEffect(() => {
    console.log("SessionProvider: Mounted");
    return () => {
      console.log("SessionProvider: Unmounted");
    };
  }, []);

  return <div>{children}</div>;
};
