import { ActivityIndicator, Linking, Share, View } from 'react-native';
import { useRouter } from 'expo-router';
import { T, H1, Screen, TopBar, SectionLabel, KV, Pill, ListGroup, ListRow, OutlineButton, TextLink, EmptyState, PrimaryButton } from '../src/components/night';
import { useBookings } from '../src/hooks/useBookings';
import { effectiveStatus } from '../src/services/ticketService';
import { bookingHref } from '../src/lib/booking';
import { breakdown, rand } from '../src/lib/pricing';
import { shortDate, stamp } from '../src/lib/dates';
import { support } from '../src/config/payment';
import { night } from '../src/theme/night';
import { PurchasedTicket } from '../src/types';

function badge(t: PurchasedTicket) {
  if (t.refundRequested) return <Pill label="REFUND ASKED" bg={night.refundBg} mono />;
  const s = effectiveStatus(t);
  if (s === 'confirmed') return t.totalPrice === 0 ? <Pill label="FREE" mono /> : <Pill label="PAID" bg={night.successBg} color={night.success} mono />;
  if (s === 'pending_verification') return <Pill label="CHECKING" bg={night.amberBg} mono />;
  if (s === 'rejected') return <Pill label="NEEDS A FIX" bg={night.pink} color={night.pinkText} mono />;
  if (s === 'expired') return <Pill label="EXPIRED" mono />;
  return <Pill label="UNPAID" bg={night.cream} mono />;
}

// Older bookings don't store a breakdown; derive one from the total's face value.
function lines(t: PurchasedTicket) {
  if (t.subtotal !== undefined) return { subtotal: t.subtotal, serviceFee: t.serviceFee ?? 0, vat: t.vat ?? 0, discount: t.discount ?? 0, total: t.totalPrice };
  return breakdown((t.price ?? 0) * t.quantity);
}

function receiptText(t: PurchasedTicket) {
  const b = lines(t);
  return [`&FRIENDS receipt · ${t.id}`, `${t.eventTitle} · ${shortDate(t.eventDate, t.eventTime)}`, `${t.quantity} × ${t.tier}: ${rand(b.subtotal)}`, b.discount ? `Discount: −${rand(b.discount)}` : '', `Service fee: ${rand(b.serviceFee)}`, `VAT: ${rand(b.vat)}`, `Total: ${rand(t.totalPrice)}`, `Paid by EFT · ref ${t.id}`, t.validatedAt ? `Approved ${stamp(t.validatedAt)}` : ''].filter(Boolean).join('\n');
}

export default function PurchasesScreen() {
  const router = useRouter();
  const { tickets, loading } = useBookings();
  const latest = tickets.find((t) => effectiveStatus(t) === 'confirmed');
  const earlier = tickets.filter((t) => t !== latest);

  return (
    <Screen>
      <TopBar />
      <H1 size={56}>Purchases</H1>
      {loading ? (
        <ActivityIndicator color={night.ink} />
      ) : !tickets.length ? (
        <EmptyState icon="receipt-outline" title="No purchases yet" body="Receipts for everything you book land here.">
          <PrimaryButton label="See what's on" onPress={() => router.replace('/(tabs)/home')} />
        </EmptyState>
      ) : (
        <>
          {latest && (
            <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
              <View style={{ backgroundColor: night.ink, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <T mono weight="700" size={11} color={night.inkMuted}>ORDER {latest.id}</T>
                  <T display size={26} color={night.paper}>{latest.eventTitle}</T>
                </View>
                {badge(latest)}
              </View>
              <View style={{ padding: 16, gap: 8 }}>
                {(() => {
                  const b = lines(latest);
                  return (
                    <>
                      <KV k={`${latest.quantity} × ${latest.tier}`} v={rand(b.subtotal)} />
                      {b.discount > 0 && <KV k={`Code ${latest.promoCode ?? ''}`} v={`−${rand(b.discount)}`} />}
                      <KV k="Service fee" v={rand(b.serviceFee)} />
                      <KV k="VAT (15%)" v={rand(b.vat)} />
                      <View style={{ borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: night.border, paddingTop: 8 }}>
                        <KV k="Total" v={rand(latest.totalPrice)} strong />
                      </View>
                    </>
                  );
                })()}
                <View style={{ padding: 12, borderRadius: 12, backgroundColor: night.paper, gap: 2 }}>
                  <T size={13} color={night.muted}>Paid by EFT · ref <T mono weight="700" size={13}>{latest.id}</T></T>
                  {!!latest.validatedAt && <T size={13} color={night.muted}>Approved {stamp(latest.validatedAt)}</T>}
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <OutlineButton label="Share receipt" icon="share-outline" style={{ flex: 1 }} onPress={() => Share.share({ message: receiptText(latest) })} />
                  <OutlineButton label="Email a copy" icon="mail-outline" style={{ flex: 1 }} onPress={() => Linking.openURL(`mailto:?subject=${encodeURIComponent(`&FRIENDS receipt ${latest.id}`)}&body=${encodeURIComponent(receiptText(latest))}`)} />
                </View>
              </View>
            </View>
          )}
          {earlier.length > 0 && (
            <>
              <SectionLabel>{latest ? 'EARLIER' : 'ALL PURCHASES'}</SectionLabel>
              <ListGroup>
                {earlier.map((t) => (
                  <ListRow key={t.id} title={t.eventTitle ?? t.id} subtitle={`${shortDate(t.createdAt)} · ${t.quantity} ticket${t.quantity > 1 ? 's' : ''} · ${rand(t.totalPrice)}`} right={badge(t)} onPress={() => router.push(bookingHref(t) as any)} />
                ))}
              </ListGroup>
            </>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, alignItems: 'center' }}>
            <T size={13} color={night.muted}>Need a tax invoice with your company details?</T>
            <TextLink size={13} label="Ask us" onPress={() => Linking.openURL(`mailto:${support.email}?subject=Tax%20invoice`)} />
          </View>
        </>
      )}
    </Screen>
  );
}
