import { BackupRestoreClient } from "./_components/backup-restore-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function BackupRestorePage() {
  return <BackupRestoreClient />;
}
