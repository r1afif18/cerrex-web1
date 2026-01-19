import { redirect } from 'next/navigation';

interface WizardEntryPageProps {
    params: Promise<{ projectId: string }>;
}

export default async function WizardEntryPage({ params }: WizardEntryPageProps) {
    const { projectId } = await params;

    // Redirect to Step 0 (Project Context)
    // In future: check wizard_sessions to get current_step and redirect accordingly
    redirect(`/dashboard/wizard/${projectId}/step-0`);
}
