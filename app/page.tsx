import { ActiveMembersByPackage } from "fablab-metrics/components/metrics/ActiveMembersByPackage";
import { MemberVisits } from "fablab-metrics/components/metrics/MemberVisits";
import { PackageChangesByMonth } from "fablab-metrics/components/metrics/PackageChangesByMonth";
import { ResourceUsage } from "fablab-metrics/components/metrics/ResourceUsage";
import { TotalMembersByPackage } from "fablab-metrics/components/metrics/TotalMembersByPackage";
import { TrainingsByDate } from "fablab-metrics/components/metrics/TrainingsByDate";
import { TrainingsByMember } from "fablab-metrics/components/metrics/TrainingsByMember";
import { SectionHeading } from "fablab-metrics/ui/SectionHeading";
import { TrainingsByMemberInfoDialog } from "fablab-metrics/ui/TrainingsByMemberInfoDialog";
import { useStatus } from "fablab-metrics/ui/useStatus";

export default function Page() {
  const status = useStatus();

  return (
    <main className="container mx-auto p-4">
      <SectionHeading>
        Počet členů{" "}
        <small className="font-normal text-xs">
          ({status.members_without_package} členů nemělo nikdy aktivní členství)
        </small>
      </SectionHeading>
      <TotalMembersByPackage />

      <SectionHeading>Aktivní členství</SectionHeading>
      <ActiveMembersByPackage />

      <SectionHeading>Přechody mezi členstvím</SectionHeading>
      <PackageChangesByMonth />

      <SectionHeading>
        Počet hodin strávených na jednotlivých strojích
      </SectionHeading>
      <ResourceUsage />

      <SectionHeading>
        Počet dnů za časové období, kolikrát člen navštívil dílu
      </SectionHeading>
      <MemberVisits />

      <SectionHeading>
        Počet školení jednotlivých členů <TrainingsByMemberInfoDialog />
      </SectionHeading>
      <TrainingsByMember />

      <SectionHeading>Nově absolvovaná školení</SectionHeading>
      <TrainingsByDate />
    </main>
  );
}
