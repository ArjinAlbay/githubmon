"use client";

import { Layout } from "@/components/layout/Layout";
import { useRequireAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/layout/PageHeader";
import { TodoDashboard } from "@/components/widget/TodoDashboard";

export default function DashboardPage() {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <PageHeader title="Dashboard" />

        <TodoDashboard />
      </div>
    </Layout>
  );
}
