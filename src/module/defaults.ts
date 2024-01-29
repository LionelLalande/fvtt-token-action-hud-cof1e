import { Group } from './Group';
import { GROUPS } from './constants';

let DEFAULTS: {
  layout: {
    id: string;
    nestId: string;
    name: string;
    settings?: {
      customWidth?: number;
      grid?: boolean;
      showTitle?: boolean;
      image?: string;
      style?: 'tab' | 'grid';
    };
    groups: {
      id: string;
      name: string;
      type: string;
      nestId: string;
    }[];
  }[];
  groups: Group[];
};

export function initDefaults(coreModule: TokenActionHudCoreModule) {
  const groups: {
    // attributes
    attributesStats: Group;
    // combat
    combatSkills: Group;
    combatAttacks: Group;
    combatMelee: Group;
    combatRanged: Group;
    combatMagic: Group;
    combatShields: Group;
    combatArmors: Group;
    combatUtils: Group;
    // inventory
    inventoryWeapons: Group;
    inventoryProtections: Group;
    inventoryContainers: Group;
    inventoryConsumables: Group;
    inventoryEquipment: Group;
    // capacities
    capacitiesRacial: Group;
    capacitiesProfile: Group;
    capacitiesOther: Group;
    // effects
    temporaryEffects: Group;
    passiveEffects: Group;
    // utilities
    token: Group;
    [key: string]: Group;
  } = GROUPS;

  Object.values(groups).forEach((group: Group) => {
    group.name = coreModule.api.Utils.i18n(group.name);
    group.listName = `${coreModule.api.Utils.i18n('Group')}: ${coreModule.api.Utils.i18n(group.name)}`;
  });

  const groupsArray = Object.values(groups);

  console.debug(groupsArray);

  DEFAULTS = {
    layout: [
      {
        nestId: 'attributes',
        id: 'attributes',
        name: coreModule.api.Utils.i18n('COF.tabs.stats'),
        settings: {
          customWidth: 800,
        },
        groups: [
          { ...groups.attributesStats, nestId: 'attributes_stats' },
          //{ ...groups.attributesSkills, nestId: 'attributes_skills' },
        ],
      },
      {
        nestId: 'combat',
        id: 'combat',
        name: coreModule.api.Utils.i18n('COF.tabs.combat'),
        groups: [
          { ...groups.combatSkills, nestId: 'combat_skills' },
          { ...groups.combatAttacks, nestId: 'combat_attacks' },
          { ...groups.combatMelee, nestId: 'combat_melee' },
          { ...groups.combatRanged, nestId: 'combat_ranged' },
          { ...groups.combatMagic, nestId: 'combat_magic' },
          { ...groups.combatShields, nestId: 'combat_shields' },
          { ...groups.combatUtils, nestId: 'combat_utils' },
        ],
      },
      {
        nestId: 'inventory',
        id: 'inventory',
        name: coreModule.api.Utils.i18n('COF.tabs.inventory'),
        groups: [
          { ...groups.inventoryWeapons, nestId: 'inventory_weapons' },
          { ...groups.inventoryProtections, nestId: 'inventory_protections' },
          { ...groups.inventoryContainers, nestId: 'inventory_containers' },
          { ...groups.inventoryEquipment, nestId: 'inventory_equipment' },
          { ...groups.inventoryConsumables, nestId: 'inventory_consumables' },
        ],
      },
      {
        nestId: 'capacities',
        id: 'capacities',
        name: coreModule.api.Utils.i18n('COF.tabs.capacities'),
        groups: [
          { ...groups.capacitiesRacial, nestId: 'capacities_racial' },
          { ...groups.capacitiesProfile, nestId: 'capacities_profile' },
          { ...groups.capacitiesOther, nestId: 'capacities_other' },
        ],
      },
      {
        nestId: 'effects',
        id: 'effects',
        name: coreModule.api.Utils.i18n('COF.tabs.effects'),
        groups: [
          { ...groups.temporaryEffects, nestId: 'effects_temporary-effects' },
          { ...groups.passiveEffects, nestId: 'effects_passive-effects' },
        ],
      },
      {
        nestId: 'utility',
        id: 'utility',
        name: coreModule.api.Utils.i18n('tokenActionHud.utility'),
        groups: [{ ...groups.token, nestId: 'utility_token' }],
      },
    ],
    groups: groupsArray,
  };

  return DEFAULTS;
}
