/**
 * ユーザーのアバター表示用URLを取得する
 * 実際の判定（Base64の配信やURLへのリダイレクト）は API ルート側で行う
 */
export function getAvatarUrl(userId: string, hasImage = true): string | undefined {
  if (!hasImage) return undefined;
  return `/api/user/${userId}/avatar`;
}

const AVATAR_REDIRECT_DOMAINS = ['slack-edge.com', 'gravatar.com'];

/**
 * アバターとしてリダイレクトしてよい外部URLか判定する (OAuth プロバイダの画像配信元のみ許可)
 */
export function isAllowedAvatarRedirectUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      AVATAR_REDIRECT_DOMAINS.some(
        (domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`)
      )
    );
  } catch {
    return false;
  }
}
