import KnowledgeDetailClient from './KnowledgeDetailClient';
import { builtinKnowledgePoints } from '@/data/knowledge';

export function generateStaticParams() {
  return builtinKnowledgePoints.map((kp) => ({ id: kp.id }));
}

export default async function KnowledgeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <KnowledgeDetailClient id={id} />;
}
