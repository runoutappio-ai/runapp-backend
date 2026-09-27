export type IdentityProviderId = 'google' | 'apple';
export type IdentityProviderDefinition = {
  id: IdentityProviderId;
  label: string;
  configured: boolean;
  authorizationParams: Record<string, string>;
};

export const identityProviders: Record<IdentityProviderId, IdentityProviderDefinition> = {
  google: { id: 'google', label: 'Google', configured: true, authorizationParams: { kc_idp_hint: 'google' } },
  apple: { id: 'apple', label: 'Apple', configured: false, authorizationParams: { kc_idp_hint: 'apple' } },
};
