import {
  AverageMachinesDown,
  AverageRepairTime,
  DowntimeByCategory,
  MachineAvailability,
  SlaCompliance,
} from "fablab-metrics/components/maintenance/DowntimeCharts";
import { MaintenanceSummary } from "fablab-metrics/components/maintenance/MaintenanceSummary";
import { OutagesTable } from "fablab-metrics/components/maintenance/OutagesTable";
import {
  CategoryStatusTable,
  PerceivedByCategory,
  PerceivedByState,
  PerceivedSummary,
} from "fablab-metrics/components/maintenance/PerceivedAvailability";
import { SectionHeading } from "fablab-metrics/ui/SectionHeading";

export const metadata = {
  title: "Fablab Brno - Metriky - Údržba strojů",
};

export default function MaintenancePage() {
  return (
    <main className="container mx-auto p-4">
      <SectionHeading>Co členové najdou při příchodu</SectionHeading>
      <PerceivedSummary />

      <SectionHeading>Stav kategorií teď</SectionHeading>
      <CategoryStatusTable />

      <SectionHeading>Příchody podle stavu strojů</SectionHeading>
      <PerceivedByState />

      <SectionHeading>Příchody s omezením podle kategorie</SectionHeading>
      <PerceivedByCategory />

      <SectionHeading>Stav strojů</SectionHeading>
      <MaintenanceSummary />

      <SectionHeading>Aktuálně mimo provoz</SectionHeading>
      <OutagesTable kind="current" />

      <SectionHeading>Dostupnost strojů</SectionHeading>
      <MachineAvailability />

      <SectionHeading>Průměrný počet nefunkčních strojů</SectionHeading>
      <AverageMachinesDown />

      <SectionHeading>Průměrná doba opravy (hodiny)</SectionHeading>
      <AverageRepairTime />

      <SectionHeading>Výpadky opravené v rámci SLA</SectionHeading>
      <SlaCompliance />

      <SectionHeading>Hodiny mimo provoz podle kategorie</SectionHeading>
      <DowntimeByCategory />

      <SectionHeading>Poslední ukončené výpadky</SectionHeading>
      <OutagesTable kind="recent" />
    </main>
  );
}
