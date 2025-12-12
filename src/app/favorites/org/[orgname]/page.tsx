"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRequireAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePinnedTemplatesStore } from "@/stores/pinnedTemplates";

interface PageProps {
  params: Promise<{
    orgname: string;
  }>;
}

const LANGUAGES = [
  "All",
  "TypeScript",
  "Python",
  "JavaScript",
  "Go",
  "Rust",
  "Java",
  "C++",
  "C#",
  "Ruby",
  "PHP",
];

const UPDATE_RANGES = [
  { label: "Updated < 1 week", value: "week", color: "bg-green-100 text-green-800" },
  { label: "Updated < 1 month", value: "month", color: "bg-yellow-100 text-yellow-800" },
  { label: "Updated > 6 months", value: "old", color: "bg-gray-100 text-gray-800" },
];

export default function OrgPinnedTemplate({ params: paramPromise }: PageProps) {
  const { isLoading: authLoading } = useRequireAuth();
  const [orgname, setOrgname] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [sortBy, setSortBy] = useState<"updated" | "stars">("updated");
  const { getPinnedOrg } = usePinnedTemplatesStore();

  useEffect(() => {
    paramPromise.then((params) => {
      setOrgname(params.orgname);
    });
  }, [paramPromise]);

  useEffect(() => {
    if (orgname) {
      const pinned = getPinnedOrg(orgname);
      if (!pinned) {
        console.log(`Organization ${orgname} not pinned`);
      }
    }
  }, [orgname, getPinnedOrg]);

  if (authLoading || !orgname) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading organization...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <PageHeader
          title={orgname}
          description="Organization Repository Overview"
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{orgname.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{orgname}</CardTitle>
                  <p className="text-sm text-muted-foreground">Organization</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">Repositories</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="rising" className="w-full">
          <TabsList>
            <TabsTrigger value="rising">Rising Stars</TabsTrigger>
            <TabsTrigger value="filter">Tech Stack Filter</TabsTrigger>
          </TabsList>

          <TabsContent value="rising" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Repository Activity Status</CardTitle>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as "updated" | "stars")}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updated">Last Updated</SelectItem>
                      <SelectItem value="stars">Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {UPDATE_RANGES.map((range) => (
                  <div key={range.value} className="space-y-2">
                    <Badge className={range.color}>{range.label}</Badge>
                    <p className="text-sm text-muted-foreground">
                      Repositories in this organization categorized by last update
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filter" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Filter by Language</CardTitle>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Showing repositories written in: <strong>{selectedLanguage}</strong>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
