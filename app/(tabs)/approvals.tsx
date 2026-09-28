import { Redirect } from 'expo-router';

// Payment approvals now live in Staff mode.
export default function ApprovalsRedirect() {
  return <Redirect href="/staff/approvals" />;
}
