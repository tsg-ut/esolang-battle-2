'use client';

import React, { useEffect, useState } from 'react';

import { signOut, useSession } from 'next-auth/react';

import { trpc } from '@/utils/trpc';
import {
  EditOutlined,
  LogoutOutlined,
  ReloadOutlined,
  TeamOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  App as AntApp,
  Avatar,
  Button,
  Card,
  Divider,
  Form,
  Input,
  List,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd';

const { Title, Text } = Typography;

export function ProfileCard() {
  const { data: session, update: updateSession } = useSession();
  const { message } = AntApp.useApp();

  const { data: fullUser, refetch: refetchFullUser } = trpc.getMeFull.useQuery(undefined);

  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateMeMutation = trpc.updateMe.useMutation();
  const revertImageMutation = trpc.revertToProviderImage.useMutation();

  const [form] = Form.useForm();
  const watchedName = Form.useWatch('name', form);

  useEffect(() => {
    if (fullUser && isEditing) {
      form.setFieldsValue({
        name: fullUser.name,
      });
      setPreviewImage(fullUser.image || null);
    }
  }, [fullUser, isEditing, form]);

  // 変更があったかどうかを判定 (null, undefined, 空文字を同一視して比較)
  const isChanged =
    !!fullUser &&
    watchedName !== undefined &&
    ((watchedName || '') !== (fullUser.name || '') ||
      (previewImage || null) !== (fullUser.image || null));

  const isPreviewBase64 = previewImage?.startsWith('data:image/');

  const handleUpdateProfile = async (values: { name: string }) => {
    setLoading(true);
    try {
      await updateMeMutation.mutateAsync({
        name: values.name,
        image: previewImage || undefined,
      });

      await updateSession();
      await refetchFullUser();
      setIsEditing(false);
      setPreviewImage(null);
      message.success('プロフィールを更新しました');
    } catch (err: any) {
      message.error('更新に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevertPreview = () => {
    if (fullUser?.providerImage) {
      setPreviewImage(fullUser.providerImage);
      message.info('プロバイダのアイコンをプレビューにセットしました。保存すると反映されます。');
    }
  };

  return (
    <Card
      className="shadow-sm"
      title="プロフィール"
      extra={
        !isEditing && (
          <Button icon={<EditOutlined />} onClick={() => setIsEditing(true)} type="link">
            編集
          </Button>
        )
      }
    >
      {isEditing ? (
        <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
          <div className="mb-6 flex flex-col items-center">
            <Avatar
              size={80}
              src={previewImage}
              icon={!previewImage && <UserOutlined />}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Upload
                beforeUpload={(file) => {
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  reader.onload = () => {
                    setPreviewImage(reader.result as string);
                  };
                  return false; // 自動アップロードを停止
                }}
                maxCount={1}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>画像をアップロード</Button>
              </Upload>
              {fullUser?.providerImage && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRevertPreview}
                  disabled={!isPreviewBase64}
                >
                  プロバイダのアイコンに戻す
                </Button>
              )}
            </div>
          </div>

          <Form.Item
            name="name"
            label="表示名"
            rules={[{ required: true, message: '表示名を入力してください' }]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setIsEditing(false);
                setPreviewImage(null);
              }}
            >
              キャンセル
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} disabled={!isChanged}>
              保存
            </Button>
          </div>
        </Form>
      ) : (
        <Space direction="vertical" size="large" className="w-full">
          <div className="flex items-center gap-4">
            <Avatar
              size={64}
              src={fullUser?.image}
              icon={!fullUser?.image && <UserOutlined />}
              style={{ backgroundColor: '#1677ff' }}
            />
            <div>
              <Title level={3} className="!mb-0">
                {fullUser?.name}
              </Title>
              <Text type="secondary">{fullUser?.isAdmin ? '管理者' : '一般ユーザ'}</Text>
              <div className="mt-1 font-mono text-xs text-gray-400">{fullUser?.email}</div>
            </div>
          </div>

          <Divider className="my-0" />

          <div>
            <Title level={4}>
              <TeamOutlined className="mr-2" />
              所属チーム
            </Title>
            <List
              dataSource={fullUser?.teams || []}
              renderItem={(t: any) => (
                <List.Item className="px-0">
                  <List.Item.Meta
                    avatar={<Avatar size="small" style={{ backgroundColor: t.color }} />}
                    title={t.contest?.name || `コンテスト #${t.contestId}`}
                    description={
                      <div className="flex items-center gap-2">
                        <Text type="secondary">{t.name || `チーム ${t.id}`}</Text>
                        <Tag color={t.color} style={{ border: 'none', height: 16 }} />
                      </div>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: '所属チームはありません' }}
            />
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              danger
              type="primary"
              icon={<LogoutOutlined />}
              onClick={() => signOut({ callbackUrl: '/login' })}
              size="large"
            >
              ログアウト
            </Button>
          </div>
        </Space>
      )}
    </Card>
  );
}
