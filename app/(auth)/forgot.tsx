import { RESET_BY_CODE } from '../../src/config/emailCodes';
import ForgotPasswordCode from '../../src/screens/ForgotPasswordCode';
import ForgotPasswordLink from '../../src/screens/ForgotPasswordLink';

// Forgot password: a 6-digit code when the code server is set up,
// otherwise Firebase's free reset link (src/config/emailCodes.ts).
export default RESET_BY_CODE ? ForgotPasswordCode : ForgotPasswordLink;
