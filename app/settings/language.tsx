import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { T, H1, Screen, TopBar, ListGroup, ListRow, Pill } from '../../src/components/night';
import { night } from '../../src/theme/night';

const LANGS = [
  ['English', 'English'],
  ['isiZulu', 'isiZulu'],
  ['Sesotho', 'Sesotho'],
  ['Afrikaans', 'Afrikaans'],
  ['isiXhosa', 'isiXhosa'],
  ['French', 'Français'],
];

export default function LanguageScreen() {
  return (
    <Screen>
      <TopBar />
      <H1 size={56}>Language</H1>
      <ListGroup>
        {LANGS.map(([en, native], i) => (
          <ListRow
            key={en}
            title={native}
            subtitle={en !== native ? en : undefined}
            right={
              i === 0 ? (
                <View style={{ width: 28, height: 28, borderRadius: 99, backgroundColor: night.ink, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={16} color={night.lime} />
                </View>
              ) : (
                <Pill label="Coming soon" />
              )
            }
          />
        ))}
      </ListGroup>
      <T size={13} color={night.muted}>Event names and descriptions stay in the language the host wrote them in.</T>
    </Screen>
  );
}
