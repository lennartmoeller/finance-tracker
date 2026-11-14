import { Store } from "lucide-react";
import type { Brand } from "@finance-tracker/shared/contract";
import { Intro } from "../Intro.tsx";
import { Logo } from "../Logo.tsx";
import { OwnerForm } from "./OwnerForm.tsx";
import { byName, type Kind, type OwnerPanelProps } from "./RuleList.tsx";

export const brandKind: Kind<Brand> = {
  noun: "brand",
  rows: (data) =>
    data.brands.toSorted(byName).map((brand) => [brand, 0, false]),
  name: (brand) => (
    <span className="named">
      <Logo src={brand.logo} name={brand.name} />
      <span>
        {brand.name} <span className="domain">{brand.domain}</span>
      </span>
    </span>
  ),
  counts: (data) => {
    const counts = new Map<number | null, number>();
    for (const { brandId } of data.transactions)
      counts.set(brandId, (counts.get(brandId) ?? 0) + 1);
    return counts;
  },
  intro: (
    <Intro
      icon={<Store />}
      title="No brands yet"
      text="A brand's rules on counterparty and description assign it to cash transactions, with its logo."
    />
  ),
  OwnerPanel: BrandPanel,
};

function BrandPanel({
  owner: brand,
  onChange,
  onClose,
}: OwnerPanelProps<Brand>) {
  return (
    <OwnerForm
      title={brand?.name ?? "New brand"}
      icon={brand && <Logo src={brand.logo} name={brand.name} />}
      subtitle="Brand"
      fields={[
        { name: "name", label: "Name", placeholder: "Lidl" },
        { name: "domain", label: "Domain", placeholder: "lidl.de" },
      ]}
      initial={{ name: brand?.name ?? "", domain: brand?.domain ?? "" }}
      rules={brand?.rules ?? []}
      onSave={(values, rules) =>
        onChange((api) =>
          brand
            ? api.brand.update({ id: brand.id, ...values, rules })
            : api.brand.create({ ...values, rules }),
        )
      }
      removal={
        brand && {
          label: "Delete brand",
          question: `Delete the brand “${brand.name}” with its rules and logo?`,
          remove: () => onChange((api) => api.brand.remove({ id: brand.id })),
        }
      }
      onClose={onClose}
    />
  );
}
