"use client";

import { Layout } from "@/components/layout/Layout";
import { ArchiveView } from "@/components/kanban/ArchiveView";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRequireAuth } from "@/hooks/useAuth";

export default function ArchivePage() {
  useRequireAuth();

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <PageHeader
          title="Archived Tasks"
          description="View and manage your archived tasks"
        />
        <ArchiveView />
      </div>
    </Layout>
  );
}
