'use client';

import React, { useEffect, useState } from 'react';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { trpc } from '@/utils/trpc';
import {
  LockOutlined,
  LogoutOutlined,
  MailOutlined,
  ReloadOutlined,
  SlackOutlined,
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
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
} from 'antd';

const { Title, Text } = Typography;

export default function UserSettingsPage() {
  const router = useRouter();
  const {
    data: session,
    status,
    update: updateSession,
  } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login');
    },
  });

  const { message } = AntApp.useApp();
  const { data: fullUser, refetch: refetchFullUser } = trpc.getMeFull.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const updateMeMutation = trpc.updateMe.useMutation();
  const updatePasswordMutation = trpc.updatePassword.useMutation();

  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const watchedName = Form.useWatch('name', form);

  useEffect(() => {
    if (fullUser) {
      form.setFieldsValue({
        name: fullUser.name,
      });
      setPreviewImage(fullUser.image || null);
    }
  }, [fullUser, form]);

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
      message.success('プロフィールを更新しました');
    } catch (err: any) {
      message.error('更新に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (values: any) => {
    try {
      await updatePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('パスワードを更新しました');
      setIsPasswordModalOpen(false);
      passwordForm.resetFields();
      refetchFullUser();
    } catch (err: any) {
      message.error(err.message || 'パスワードの更新に失敗しました');
    }
  };

  const handleRevertPreview = () => {
    if (fullUser?.providerImage) {
      setPreviewImage(fullUser.providerImage);
      message.info('プロバイダのアイコンをプレビューにセットしました。保存すると反映されます。');
    }
  };

  if (status === 'loading' || !fullUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Title level={2} className="!mb-0">
            ユーザー設定
          </Title>
          <Button icon={<UserOutlined />} onClick={() => router.push(`/user/${fullUser.id}`)}>
            公開プロフィールを表示
          </Button>
        </div>

        <Space direction="vertical" size="large" className="w-full">
          {/* 基本プロフィールの設定 */}
          <Card className="shadow-sm" title="基本プロフィール">
            <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
              <div className="mb-8 flex flex-col items-center">
                <Avatar
                  size={100}
                  src={previewImage}
                  icon={!previewImage && <UserOutlined />}
                  className="mb-4 border-2 border-white shadow-sm"
                />
                <Space>
                  <Upload
                    beforeUpload={(file) => {
                      const reader = new FileReader();
                      reader.readAsDataURL(file);
                      reader.onload = () => {
                        setPreviewImage(reader.result as string);
                      };
                      return false;
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
                      元に戻す
                    </Button>
                  )}
                </Space>
              </div>

              <Form.Item label="メールアドレス">
                <Input
                  size="large"
                  disabled
                  value={fullUser.email || ''}
                  prefix={<MailOutlined className="text-gray-400" />}
                />
                <Text type="secondary" className="text-xs">
                  メールアドレスは変更できません
                </Text>
              </Form.Item>

              <Form.Item
                name="name"
                label="表示名"
                rules={[{ required: true, message: '表示名を入力してください' }]}
              >
                <Input size="large" prefix={<UserOutlined className="text-gray-400" />} />
              </Form.Item>

              <div className="flex justify-end pt-4">
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={loading}
                  disabled={!isChanged}
                >
                  変更を保存する
                </Button>
              </div>
            </Form>
          </Card>

          {/* セキュリティ・ログイン方法の設定 */}
          <Card className="shadow-sm" title="ログイン方法とセキュリティ">
            <div className="space-y-6">
              <div>
                <Text strong className="mb-2 block">
                  連携済みのログイン方法
                </Text>
                <div className="flex flex-wrap gap-3">
                  {fullUser.hasPassword && (
                    <Tag icon={<LockOutlined />} color="blue" className="px-3 py-1 text-sm">
                      ID/パスワード
                    </Tag>
                  )}
                  {fullUser.accounts?.map((acc: any) => (
                    <Tag
                      key={acc.provider}
                      icon={acc.provider === 'slack' ? <SlackOutlined /> : <UserOutlined />}
                      color="cyan"
                      className="px-3 py-1 text-sm uppercase"
                    >
                      {acc.provider}
                    </Tag>
                  ))}
                </div>
              </div>

              <Divider className="my-4" />

              <div className="flex items-center justify-between">
                <div>
                  <Text strong className="block">
                    パスワード
                  </Text>
                  {!fullUser.hasPassword && (
                    <Text type="secondary" className="text-sm">
                      パスワードを設定して、ID/パスワードでのログインを有効にします
                    </Text>
                  )}
                </div>
                <Button onClick={() => setIsPasswordModalOpen(true)}>
                  {fullUser.hasPassword ? 'パスワードを変更' : 'パスワードを設定'}
                </Button>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-4 pt-4">
            <Button
              size="large"
              danger
              icon={<LogoutOutlined />}
              onClick={() => signOut({ callbackUrl: '/' })}
              className="bg-white"
            >
              ログアウト
            </Button>
          </div>
        </Space>
      </div>

      {/* パスワード変更モーダル */}
      <Modal
        title={fullUser.hasPassword ? 'パスワードを変更' : 'パスワードを設定'}
        open={isPasswordModalOpen}
        onOk={() => passwordForm.submit()}
        onCancel={() => {
          setIsPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        confirmLoading={updatePasswordMutation.isPending}
        okText="保存"
        cancelText="キャンセル"
      >
        <Form form={passwordForm} layout="vertical" onFinish={handleUpdatePassword}>
          {fullUser.hasPassword && (
            <Form.Item
              name="currentPassword"
              label="現在のパスワード"
              rules={[{ required: true, message: '現在のパスワードを入力してください' }]}
            >
              <Input.Password prefix={<LockOutlined className="text-gray-400" />} />
            </Form.Item>
          )}
          <Form.Item
            name="newPassword"
            label={fullUser.hasPassword ? '新しいパスワード' : 'パスワード'}
            rules={[
              { required: true, message: '新しいパスワードを入力してください' },
              { min: 4, message: '4文字以上で入力してください' },
            ]}
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="確認用パスワード"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'パスワードを再入力してください' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('パスワードが一致しません'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
