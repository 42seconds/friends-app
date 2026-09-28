// Bank details shown on the Pay by EFT screen. Replace with the real
// &FRIENDS business account before going live.
export const bankDetails = {
  bank: 'FNB',
  accountName: '&FRIENDS',
  accountNumber: '0000000000',
  branchCode: '000000',
};

// Support contacts and public links. PLACEHOLDERS: replace before launch.
export const support = {
  whatsapp: '27000000000', // international format, no +
  email: 'hello@example.com',
  instagram: 'https://instagram.com/',
  whatsappChannel: 'https://whatsapp.com/channel/',
  policyUrl: 'https://example.com/privacy',
  appStoreUrl: 'https://example.com/app', // App Store / Play Store listing
};

// Web page a friend opens to accept a sent ticket (not part of this app).
export const claimUrl = (ticketId: string) => `https://example.com/claim/${ticketId}`;
