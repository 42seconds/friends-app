import { EMAIL_CODES_ON } from '../src/config/emailCodes';
import VerifyEmailCode from '../src/screens/VerifyEmailCode';
import VerifyEmailLink from '../src/screens/VerifyEmailLink';

// "Confirm your email": a 6-digit code when the code server is set up,
// otherwise Firebase's free email link (src/config/emailCodes.ts).
export default EMAIL_CODES_ON ? VerifyEmailCode : VerifyEmailLink;
