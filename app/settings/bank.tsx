import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { T, H1, Screen, TopBar, Field, Segmented, Note, SectionLabel, PrimaryButton } from '../../src/components/night';
import { useProfile } from '../../src/hooks/useProfile';
import { saveRefundBank, last4 } from '../../src/services/userService';
import { night } from '../../src/theme/night';
import { safeBack } from '../../src/lib/nav';
import { LIMITS, checkName, checkText, checkAccountNumber, checkBranchCode, collectErrors } from '../../src/lib/validation';

// South African universal branch codes, filled in when the bank is typed.
const BRANCHES: Record<string, string> = {
  absa: '632005',
  capitec: '470010',
  fnb: '250655',
  'first national bank': '250655',
  nedbank: '198765',
  'standard bank': '051001',
  tymebank: '678910',
  discovery: '679000',
  investec: '580105',
  'african bank': '430000',
};

export default function RefundBankScreen() {
  const router = useRouter();
  const { profile, user } = useProfile();
  const existing = profile?.refundBank;
  const [holder, setHolder] = useState('');
  const [bank, setBank] = useState('');
  const [type, setType] = useState<'cheque' | 'savings'>('cheque');
  const [account, setAccount] = useState('');
  const [branch, setBranch] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setHolder(existing?.holder ?? profile?.name ?? '');
    setBank(existing?.bank ?? '');
    setType(existing?.accountType ?? 'cheque');
    setBranch(existing?.branchCode ?? '');
  }, [profile]);

  const onBank = (b: string) => {
    setBank(b);
    const code = BRANCHES[b.trim().toLowerCase()];
    if (code) setBranch(code);
  };

  const save = async () => {
    if (!user) return;
    const e = collectErrors({
      holder: checkName(holder, 'account holder name'),
      bank: checkText(bank, 'your bank', LIMITS.shortText),
      account: checkAccountNumber(account),
      branch: checkBranchCode(branch),
    });
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await saveRefundBank(user.uid, { holder: holder.trim(), bank: bank.trim(), accountType: type, accountNumber: account.replace(/\s/g, ''), branchCode: branch.replace(/\s/g, '') });
      safeBack(router);
    } catch {
      Alert.alert("Couldn't save", 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen header={<TopBar />} footer={<PrimaryButton label="Save bank details" loading={saving} onPress={save} />}>
      <H1 size={52}>Refund{'\n'}bank details</H1>
      <Note icon="shield-checkmark-outline">
        <T size={14} lh={1.5} color={night.paper}>
          <T size={14} weight="700" color={night.paper}>Only used to pay refunds to you.</T> We never debit your account.
        </T>
      </Note>
      <Field label="ACCOUNT HOLDER" value={holder} onChangeText={setHolder} autoCapitalize="words" maxLength={LIMITS.name} error={errors.holder} />
      <Field label="BANK" value={bank} onChangeText={onBank} placeholder="e.g. Capitec" autoCapitalize="words" maxLength={LIMITS.shortText} error={errors.bank} />
      <SectionLabel>ACCOUNT TYPE</SectionLabel>
      <Segmented value={type} onChange={setType} options={[{ key: 'cheque', label: 'Cheque / current' }, { key: 'savings', label: 'Savings' }]} />
      <Field label="ACCOUNT NUMBER" value={account} onChangeText={setAccount} mono keyboardType="number-pad" maxLength={16} error={errors.account} placeholder={existing ? `•••• •••• ${last4(existing.accountNumber)}` : 'Account number'} />
      <Field label="BRANCH CODE" value={branch} onChangeText={setBranch} mono keyboardType="number-pad" maxLength={6} error={errors.branch} placeholder="Filled in from your bank" />
      <T size={13} lh={1.5} color={night.muted}>After saving, you'll only see the last 4 digits. {existing ? 'Re-enter the full number to change it.' : ''}</T>
    </Screen>
  );
}
