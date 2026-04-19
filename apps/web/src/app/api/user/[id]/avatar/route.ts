import { prisma } from '@esolang-battle/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { image: true },
  });

  if (!user?.image) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // データURL (data:image/png;base64,...) 形式の場合の処理
  if (user.image.startsWith('data:')) {
    const match = user.image.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const contentType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1時間キャッシュ
        },
      });
    }
  }

  // 外部URL（http...）の場合はリダイレクト
  if (user.image.startsWith('http')) {
    return NextResponse.redirect(user.image);
  }

  return new NextResponse('Invalid Image Format', { status: 400 });
}
