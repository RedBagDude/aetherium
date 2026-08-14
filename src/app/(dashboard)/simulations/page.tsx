import { SimulationClient } from './SimulationClient';

export default async function SimulationsPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>;
}) {
  const params = await searchParams;
  return <SimulationClient initialScenario={params.scenario ?? null} />;
}
