import { notFound } from "next/navigation";
import { ClientDetail } from "@/features/clients/components/client-detail";
import { getLeadDetail, getClientAssignmentHistory } from "@/services/clients.service";
import { getCallHistoryView } from "@/services/calls.service";

export default async function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;

  const detail = await getLeadDetail(clientId);
  if (!detail) notFound();

  const [callHistory, assignmentHistory] = await Promise.all([getCallHistoryView(detail.clientId), getClientAssignmentHistory(detail.clientId)]);

  return <ClientDetail lead={detail.lead} callHistory={callHistory} assignmentHistory={assignmentHistory} firstContactDate={detail.firstContactDate} />;
}
