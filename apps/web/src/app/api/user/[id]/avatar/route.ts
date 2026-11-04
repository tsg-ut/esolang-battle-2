import { NextRequest, NextResponse } from 'next/server';

import { isAllowedAvatarRedirectUrl } from '@/utils/user';

import { parseAvatarDataUrl } from '@esolang-battle/common';
import { prisma } from '@esolang-battle/db';

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; sandbox",
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { image: true },
  });

  if (!user?.image) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // データURL (data:image/png;base64,...) 形式の場合の処理
  const dataUrl = parseAvatarDataUrl(user.image);
  if (dataUrl) {
    const buffer = Buffer.from(dataUrl.base64, 'base64');

    return new NextResponse(buffer, {
      headers: {
        ...SECURITY_HEADERS,
        'Content-Type': dataUrl.contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1時間キャッシュ
      },
    });
  }

  // OAuth プロバイダの画像URLの場合はリダイレクト
  if (isAllowedAvatarRedirectUrl(user.image)) {
    return NextResponse.redirect(user.image);
  }

  return new NextResponse('Invalid Image Format', { status: 400, headers: SECURITY_HEADERS });
}
