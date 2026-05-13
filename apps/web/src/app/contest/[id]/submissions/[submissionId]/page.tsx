'use client';

import React, { useState } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { trpc } from '@/utils/trpc';
import {
  CopyOutlined,
  DownloadOutlined,
  FileUnknownOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// コピーボタン用のサブコンポーネント
const CopyButton = ({
  text,
  label,
  showText = false,
}: {
  text: string;
  label: string;
  showText?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!text) return null;

  return (
    <Button
      icon={<CopyOutlined style={{ color: copied ? '#52c41a' : undefined }} />}
      onClick={handleCopy}
    >
      {showText && (copied ? 'Copied!' : `Copy ${label}`)}
    </Button>
  );
};

export default function SubmissionDetailPage() {
  const params = useParams();
  const contestId = Number(params.id);
  const submissionId = Number(params.submissionId);

  const {
    data: submission,
    isLoading,
    error,
  } = trpc.getSubmissionDetail.useQuery({ submissionId });

  if (isLoading)
    return (
      <div style={{ padding: '32px 0', textAlign: 'center' }}>Loading submission details...</div>
    );
  if (error)
    return (
      <div style={{ padding: '32px 0' }}>
        <Alert message="Error" description={error.message} type="error" showIcon />
      </div>
    );
  if (!submission)
    return (
      <div style={{ padding: '32px 0', textAlign: 'center' }}>
        <Empty description="提出が見つからないか、閲覧権限がありません。" />
      </div>
    );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AC':
        return 'success';
      case 'WA':
        return 'warning';
      case 'RE':
        return 'error';
      case 'TLE':
        return 'orange';
      case 'WJ':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusHexColor = (status: string) => {
    switch (status) {
      case 'AC':
        return '#52c41a';
      case 'WA':
        return '#faad14';
      case 'RE':
        return '#f5222d';
      case 'TLE':
        return '#fa8c16';
      default:
        return '#8c8c8c';
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `data:application/octet-stream;base64,${submission.codeBase64}`;
    link.download = `submission_${submission.id}_${submission.language.name.toLowerCase().replace(/\s+/g, '_')}`;
    link.click();
  };

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', paddingBottom: 48 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            提出詳細 #{submission.id}
          </Title>
        </Col>
      </Row>

      <div style={{ marginBottom: 32 }}>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="提出者">
            <Space>
              <Avatar
                size="small"
                src={submission.user.image}
                icon={!submission.user.image && <UserOutlined />}
              />
              <Text>{submission.user.name || 'Unknown'}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="提出時刻">
            <Text>{dayjs(submission.submittedAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="問題">
            <Link href={`/contest/${contestId}/problem/${submission.problem.id}`}>
              <Text underline>{submission.problem.title}</Text>
            </Link>
          </Descriptions.Item>
          <Descriptions.Item label="言語">
            <Text>{submission.language.name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="バイト数">
            <Text>{submission.codeLength} bytes</Text>
          </Descriptions.Item>
          <Descriptions.Item label="ステータス">
            <Tag color={getStatusColor(submission.status)} style={{ fontWeight: 'bold' }}>
              {submission.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="スコア">
            <Text strong style={{ fontSize: 20, color: '#1677ff', fontFamily: 'monospace' }}>
              {submission.score !== null ? submission.score : '-'}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </div>

      {submission.message && (
        <Alert
          message="Result Summary"
          description={<div style={{ whiteSpace: 'pre-wrap' }}>{submission.message}</div>}
          type="info"
          showIcon
          style={{ marginBottom: 32 }}
        />
      )}

      <div style={{ marginBottom: 32 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              ソースコード
            </Title>
          </Col>
          <Col>
            <Space>
              <CopyButton text={submission.codeText || ''} label="Code" showText />
              <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                Download Code
              </Button>
            </Space>
          </Col>
        </Row>

        {submission.isBinary ? (
          <Card style={{ textAlign: 'center', backgroundColor: '#fafafa', borderStyle: 'dashed' }}>
            <FileUnknownOutlined style={{ fontSize: 48, color: '#bfbfbf', marginBottom: 16 }} />
            <Title level={5}>Binary Data Detected</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              This file contains non-UTF-8 characters and cannot be displayed as text.
            </Text>
            <Button type="primary" onClick={handleDownload}>
              Download to View
            </Button>
          </Card>
        ) : (
          <pre
            style={{
              maxHeight: 500,
              overflow: 'auto',
              padding: 24,
              borderRadius: 8,
              backgroundColor: '#001529',
              color: '#e6f4ff',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: '1.6',
              margin: 0,
            }}
          >
            {submission.codeText}
          </pre>
        )}
      </div>

      <div>
        <Title level={4} style={{ marginBottom: 16 }}>
          実行結果 (テストケース)
        </Title>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {submission.executions.map((exec: any, idx: number) => (
            <Card
              key={idx}
              size="small"
              title={
                <Space>
                  <Text strong>Case #{idx + 1}</Text>
                  {exec.testcase.isSample && <Tag color="blue">Sample</Tag>}
                </Space>
              }
              extra={
                <Tag color={getStatusColor(exec.status)} style={{ fontWeight: 'bold' }}>
                  {exec.status} ({exec.executionTime} ms)
                </Tag>
              }
              styles={{ body: { padding: 16 }, header: { backgroundColor: '#fafafa' } }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {exec.message && (
                  <Alert
                    message={
                      <span>
                        <Text strong>Checker Message:</Text> {exec.message}
                      </span>
                    }
                    type="warning"
                    showIcon={false}
                    style={{ fontSize: '12px' }}
                  />
                )}

                {exec.testcase.input && (
                  <div>
                    <Row justify="space-between" align="middle" style={{ marginBottom: 4 }}>
                      <Col>
                        <Text
                          type="secondary"
                          strong
                          style={{ fontSize: '12px', textTransform: 'uppercase' }}
                        >
                          Input
                        </Text>
                      </Col>
                      <Col>
                        <CopyButton text={exec.testcase.input} label={`Case #${idx + 1} Input`} />
                      </Col>
                    </Row>
                    <pre
                      style={{
                        maxHeight: 128,
                        overflow: 'auto',
                        padding: 8,
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #d9d9d9',
                        borderRadius: 4,
                        margin: 0,
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {exec.testcase.input}
                    </pre>
                  </div>
                )}

                <div>
                  <Row justify="space-between" align="middle" style={{ marginBottom: 4 }}>
                    <Col>
                      <Text
                        type="secondary"
                        strong
                        style={{ fontSize: '12px', textTransform: 'uppercase' }}
                      >
                        Stdout
                      </Text>
                    </Col>
                    <Col>
                      <CopyButton text={exec.stdout || ''} label={`Case #${idx + 1} Stdout`} />
                    </Col>
                  </Row>
                  <pre
                    style={{
                      maxHeight: 128,
                      overflow: 'auto',
                      padding: 8,
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                      margin: 0,
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {exec.stdout || (
                      <Text italic type="secondary">
                        (empty)
                      </Text>
                    )}
                  </pre>
                </div>

                {exec.stderr && (
                  <div>
                    <Row justify="space-between" align="middle" style={{ marginBottom: 4 }}>
                      <Col>
                        <Text
                          type="danger"
                          strong
                          style={{ fontSize: '12px', textTransform: 'uppercase' }}
                        >
                          Stderr
                        </Text>
                      </Col>
                      <Col>
                        <CopyButton text={exec.stderr} label={`Case #${idx + 1} Stderr`} />
                      </Col>
                    </Row>
                    <pre
                      style={{
                        maxHeight: 128,
                        overflow: 'auto',
                        padding: 8,
                        backgroundColor: '#fff2f0',
                        border: '1px solid #ffccc7',
                        borderRadius: 4,
                        margin: 0,
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        color: '#ff4d4f',
                      }}
                    >
                      {exec.stderr}
                    </pre>
                  </div>
                )}
              </Space>
            </Card>
          ))}
        </Space>
      </div>
    </div>
  );
}
