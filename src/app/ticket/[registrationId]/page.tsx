import { Metadata } from 'next';
import { TicketPageClient } from './TicketPageClient';

interface TicketPageProps {
    params: Promise<{ registrationId: string }>;
}

export async function generateMetadata({ params }: TicketPageProps): Promise<Metadata> {
    const { registrationId } = await params;

    return {
        title: 'Your Ticket | Energy Hub',
        description: `Digital ticket ${registrationId} from Energy Hub`,
    };
}

export default async function TicketPage({ params }: TicketPageProps) {
    const { registrationId } = await params;

    // Pass the registration ID to the client component which will fetch from Firestore
    return <TicketPageClient registrationId={registrationId} />;
}

