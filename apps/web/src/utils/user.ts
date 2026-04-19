/**
 * ユーザーのアバター表示用URLを取得する
 * 実際の判定（Base64の配信やURLへのリダイレクト）は API ルート側で行う
 */
export function getAvatarUrl(userId: string, hasImage: boolean = true): string | undefined {
  if (!hasImage) return undefined;
  return `/api/user/${userId}/avatar`;
}
