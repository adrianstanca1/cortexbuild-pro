import { PlatformSettingsClient } from "./_components/platform-settings-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function PlatformSettingsPage() {
  return <PlatformSettingsClient />;
}
