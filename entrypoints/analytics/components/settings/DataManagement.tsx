import { DataOverview } from "./DataOverview";
import { DataActions } from "./DataActions";

export function DataManagement() {
  // Mock data usage
  const dataUsage = {
    total: "2.4 MB",
    websites: 1234,
    sessions: 5678,
    lastBackup: "2 days ago"
  };

  return (
    <div className="space-y-6">
      <DataOverview dataUsage={dataUsage} />
      <DataActions />
    </div>
  );
}
