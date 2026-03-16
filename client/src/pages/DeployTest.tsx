import AppLayout from "@/components/AppLayout";

export default function DeployTest() {
  return (
    <AppLayout>
      <div className="p-10">
        <h1 className="text-4xl font-bold">Deployment Test: VERSION 2 (Consolidated Export)</h1>
        <p className="mt-4">If you see this, the latest code IS deployed.</p>
        <p className="text-sm text-gray-400">Timestamp: {new Date().toISOString()}</p>
      </div>
    </AppLayout>
  );
}
