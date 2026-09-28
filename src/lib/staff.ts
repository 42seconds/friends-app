import { rand } from './pricing';

export const REJECT_REASONS = ['Wrong amount', 'Reference missing', "Can't read image", 'Not reflected yet', 'Something else'];

// Pre-written message to the guest for each reason (staff can edit it).
export function rejectMessage(reason: string, amount: number, ref: string) {
  switch (reason) {
    case 'Wrong amount':
      return `The amount on your proof doesn't match ${rand(amount)}. Please send proof of the full amount.`;
    case 'Reference missing':
      return `We can see ${rand(amount)}, but not your reference ${ref}. A screenshot from your banking app works too.`;
    case "Can't read image":
      return "We couldn't read your proof. Please send a clearer photo or a screenshot from your banking app.";
    case 'Not reflected yet':
      return "Your payment hasn't reflected in our account yet. We'll check again, or send a new proof once it clears.";
    default:
      return '';
  }
}
