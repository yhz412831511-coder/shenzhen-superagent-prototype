import registry from './organization-registry.json' with { type: 'json' };
import type { CatalogEntry } from './fiscal-catalog.ts';

export type OrganizationUnit = (typeof registry.units)[number];
export type OrganizationCarrier = (typeof registry.carriers)[number];

export const organizationUnits = registry.units as OrganizationUnit[];
export const organizationCarriers = registry.carriers as OrganizationCarrier[];
export const builtOrganizationCarriers = organizationCarriers.filter(
  (carrier) => carrier.buildStatus === 'built',
);
export const plannedOrganizationCarriers = organizationCarriers.filter(
  (carrier) => carrier.buildStatus === 'planned_demo',
);
export const organizationCarrierIds = new Set(
  builtOrganizationCarriers.map((carrier) => carrier.id),
);

export function carriersForUnit(unitId: string) {
  return organizationCarriers.filter((carrier) => carrier.unitId === unitId);
}

export function unitForCarrier(carrierId: string) {
  const carrier = organizationCarriers.find((item) => item.id === carrierId);
  return carrier
    ? organizationUnits.find((unit) => unit.id === carrier.unitId)
    : undefined;
}

export function sceneAgents(catalog: CatalogEntry[]) {
  return catalog.filter((entry) => entry.kind === '场景工作智能体');
}

export function searchOrganization(query: string) {
  const value = query.trim().toLocaleLowerCase('zh-CN');
  if (!value) return organizationUnits.map((unit) => unit.id);
  return organizationUnits
    .filter((unit) => {
      const unitMatches = `${unit.formalName}${unit.displayName}`
        .toLocaleLowerCase('zh-CN')
        .includes(value);
      const carrierMatches = carriersForUnit(unit.id).some((carrier) =>
        `${carrier.formalName}${carrier.displayName}`
          .toLocaleLowerCase('zh-CN')
          .includes(value),
      );
      return unitMatches || carrierMatches;
    })
    .map((unit) => unit.id);
}

export function preferredCarrierForUnit(unitId: string, query = '') {
  const carriers = carriersForUnit(unitId);
  const value = query.trim().toLocaleLowerCase('zh-CN');
  if (value) {
    const matched = carriers.find((carrier) =>
      `${carrier.formalName}${carrier.displayName}`
        .toLocaleLowerCase('zh-CN')
        .includes(value),
    );
    if (matched) return matched;
  }
  return carriers.find((carrier) => carrier.buildStatus === 'built');
}

export const organizationRegistryMeta = {
  verifiedAt: registry.verifiedAt,
  portalUrl: registry.portalUrl,
};
