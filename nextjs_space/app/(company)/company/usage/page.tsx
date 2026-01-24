import { CompanyUsageClient } from './usage-client';

export default function CompanyUsagePage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Company Usage</h1>
            <CompanyUsageClient />
        </div>
    );
}