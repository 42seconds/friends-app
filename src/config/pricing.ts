// All-in pricing, as shown in the Braam Night+ designs:
// face value + 5% service fee, then 15% VAT on top of both.
// e.g. R150 face -> R181.13 all-in. Change the rates here only.
export const SERVICE_FEE_RATE = 0.05;
export const VAT_RATE = 0.15;

// How long reserved tickets are held while the buyer pays by EFT.
export const HOLD_HOURS = 24;

// Hard cap per booking, shown on the ticket picker.
export const MAX_TICKETS_PER_PERSON = 4;
