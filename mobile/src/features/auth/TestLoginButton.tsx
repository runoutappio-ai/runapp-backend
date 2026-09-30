import { useState } from 'react';
import { FlaskConical } from 'lucide-react-native';
import { useAuth } from '@/auth/AuthProvider';
import { Button, InlineError } from '@/components/ui';
import { config } from '@/config';
import { colors } from '@/theme/tokens';

/** Development-only shortcut that signs in with the test account from .env.local. Renders nothing in release builds. */
export function TestLoginButton() {
  const { signIn, busy } = useAuth();
  const [error, setError] = useState('');
  if (!config.testLogin) return null;
  const { email, password } = config.testLogin;
  const run = async () => {
    setError('');
    try { await signIn(email, password); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Test login failed.'); }
  };
  return (
    <>
      {error ? <InlineError message={error} /> : null}
      {config.demoMode ? (
        <Button loading={busy} onPress={() => void run()} accessibilityLabel="Enter the demo">Enter the demo</Button>
      ) : (
        <Button variant="ghost" loading={busy} onPress={() => void run()} accessibilityLabel="Test login">
          <FlaskConical size={15} color={colors.gold} /> Test login
        </Button>
      )}
    </>
  );
}
