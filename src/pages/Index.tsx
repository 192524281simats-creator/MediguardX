// Redirect to dashboard — handled by AppLayout auth check
import { Navigate } from "react-router-dom";
export default function Index() {
  return <Navigate to="/" replace />;
}
