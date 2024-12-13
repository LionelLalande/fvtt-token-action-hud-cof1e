import { Group } from './Group';
import { GROUPS } from './constants';

interface DEFAULTS {
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
}

let DEFAULTS: DEFAULTS;

export function initDefaults(coreModule: TokenActionHudCoreModule) {
  const groups: {
    // attributes
    attributesStats: Group;
    // combat
    combatSkills: Group;
    combatAttacks: Group;
    combatMelee: Group;
    combatRanged: Group;
    combatSpells: Group;
    combatShields: Group;
    ////combatArmors: Group;
    combatUtils: Group;
    // capacities
    capacitiesRacial: Group;
    capacitiesProfile: Group;
    capacitiesOther: Group;
    // inventory
    inventoryWeapons: Group;
    inventoryProtections: Group;
    inventoryContainers: Group;
    inventoryConsumables: Group;
    inventoryAmmunitions: Group;
    inventoryEquipment: Group;
    inventoryWand: Group;
    inventoryJewel: Group;
    inventoryMount: Group;
    inventoryScroll: Group;
    inventorySpell: Group;
    inventoryOther: Group;
    // effects
    effectsPermanent: Group;
    effectsTemporary: Group;
    ////effectsPassive: Group;
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
          { ...groups.combatSpells, nestId: 'combat_spells' },
          { ...groups.combatShields, nestId: 'combat_shields' },
          { ...groups.combatUtils, nestId: 'combat_utils' },
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
        nestId: 'inventory',
        id: 'inventory',
        name: coreModule.api.Utils.i18n('COF.tabs.inventory'),
        groups: [
          { ...groups.inventoryEquipment, nestId: 'inventory_equipment' },
          { ...groups.inventoryAmmunitons, nestId: 'inventory_ammunitions' },
          { ...groups.inventoryConsumables, nestId: 'inventory_consumables' },
          { ...groups.inventoryProtections, nestId: 'inventory_protections' },
          { ...groups.inventoryWeapons, nestId: 'inventory_weapons' },
          { ...groups.inventoryWand, nestId: 'inventory_wand' },
          { ...groups.inventoryJewel, nestId: 'inventory_jewel' },
          { ...groups.inventoryMount, nestId: 'inventory_mount' },
          { ...groups.inventoryScroll, nestId: 'inventory_scroll' },
          { ...groups.inventorySpell, nestId: 'inventory_spell' },
          { ...groups.inventoryOther, nestId: 'inventory_other' },
          { ...groups.inventoryContainers, nestId: 'inventory_containers' },
        ],
      },
      {
        nestId: 'effects',
        id: 'effects',
        name: coreModule.api.Utils.i18n('COF.tabs.effects'),
        groups: [
          { ...groups.effectsPermanent, nestId: 'effects_permanent' },
          { ...groups.effectsTemporary, nestId: 'effects_temporary' },
          ////{ ...groups.effectsPassive, nestId: 'effects_passive' },
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
