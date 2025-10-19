import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Advotac App Portal',
  description: 'AI Legal Research & Drafting Platform for Indian Law',
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
