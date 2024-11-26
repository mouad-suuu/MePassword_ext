import { RingLoader } from "react-spinners";

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="loading-spinner">
      {message && <p>{message}</p>}
      <RingLoader />
    </div>
  );
};

export default LoadingSpinner;
