import Splash from '../src/components/night/Splash';

// Exists so "/" has something to render for the split second before
// _layout.tsx's RedirectGate sends the user on to onboarding, login or
// Explore.
export default function Index() {
  return <Splash />;
}
