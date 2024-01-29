export const REQUIRED_CORE_MODULE_VERSION = '1.5';

export const MODULES = {
  TokenActionHUD: {
    Core: { ID: 'token-action-hud-core' },
    COF: { ID: 'token-action-hud-cof1e' },
  },
  COF: { ID: 'cof' },
};

export const GROUPS = {
  // in order of appearance
  attributesStats: { id: 'attributes-stats', name: 'COF.tabs.stats', type: 'system' },
  combatSkills: { id: 'combat-skills', name: 'tokenActionHud.cof.Combat.Skills', type: 'system' },
  combatAttacks: { id: 'combat-attacks', name: 'COF.combat.attacks', type: 'system' },
  combatMelee: { id: 'combat-melee', name: 'COF.category.melee-plural', type: 'system' },
  combatRanged: { id: 'combat-ranged', name: 'COF.category.ranged-plural', type: 'system' },
  combatMagic: { id: 'combat-magic', name: 'COF.attacks.magic.label', type: 'system' },
  combatShields: { id: 'combat-shields', name: 'COF.armors.shield', type: 'system' },
  combatArmors: { id: 'combat-armors', name: 'COF.category.armor-plural', type: 'system' },
  combatUtils: { id: 'combat-utils', name: 'tokenActionHud.cof.Combat.Utils', type: 'system' },
  inventoryWeapons: { id: 'inventory-weapons', name: 'tokenActionHud.cof.Weapons', type: 'system' },
  inventoryProtections: { id: 'inventory-protections', name: 'COF.properties.protection', type: 'system' },
  inventoryContainers: { id: 'inventory-containers', name: 'COF.category.container', type: 'system' },
  inventoryConsumables: { id: 'inventory-consumables', name: 'COF.category.consumable', type: 'system' },
  inventoryEquipment: { id: 'inventory-equipment', name: 'COF.ui.equipment', type: 'system' },
  capacitiesRacial: { id: 'capacities-racial', name: 'COF.species.capacities', type: 'system' },
  capacitiesProfile: { id: 'capacities-profile', name: 'COF.ui.capacities', type: 'system' },
  capacitiesOther: { id: 'capacities-other', name: 'COF.ui.OffPathsCapacities', type: 'system' },
  temporaryEffects: { id: 'temporary-effects', name: 'tokenActionHud.cof.Effects.Temporary', type: 'system' },
  passiveEffects: { id: 'passive-effects', name: 'tokenActionHud.cof.Effects.Passive', type: 'system' },
  token: { id: 'token', name: 'tokenActionHud.token', type: 'system' },
};

export const ACTION_TYPE: { [key: string]: string } = {
  stats: 'COF.ui.stat',
  capacity: 'COF.ui.capacity',
  skill: 'tokenActionHud.cof.Combat.Skills',
  items: 'tokenActionHud.cof.Items',
  effects: 'tokenActionHud.cof.Effects.All',
  utility: 'tokenActionHud.utility',
  attack: 'COF.ui.attack',
  armor: 'COF.category.armor',
  melee: 'COF.category.melee',
  ranged: 'COF.category.ranged',
  shield: 'COF.category.shield',
  spell: 'COF.attacks.magic.label',
  combat: 'COF.tabs.combat',
};

export const ACTION_ICON: { [key: string]: string } = {
  equiped: 'fa-solid fa-bow-arrow fa-fw',
};

export const ITEM_TYPE: { [key: string]: { groupId: string } } = {
  ammunition: { groupId: 'inventory-consumables' },
  armor: { groupId: 'inventory-protections' },
  consumable: { groupId: 'inventory-consumables' },
  container: { groupId: 'inventory-containers' },
  equipment: { groupId: 'inventory-equipment' },
  melee: { groupId: 'inventory-weapons' },
  ranged: { groupId: 'inventory-weapons' },
  shield: { groupId: 'inventory-protections' },
  trapping: { groupId: 'inventory-consumables' },
  weapon: { groupId: 'inventory-weapons' },
};

export const ATTACK_TYPE: { [key: string]: { groupId: string } } = {
  attack: { groupId: 'combat-attacks' },
  armor: { groupId: 'combat-armors' },
  melee: { groupId: 'combat-melee' },
  ranged: { groupId: 'combat-ranged' },
  shield: { groupId: 'combat-shields' },
  spell: { groupId: 'combat-spells' },
};

export const CAPACITY_TYPE: { [key: string]: { groupId: string } } = {
  species: { groupId: 'capacities-racial' },
  other: { groupId: 'capacities-other' },
  profile: { groupId: 'capacities-profile' },
};

export const EFFECT_TYPE: { [key: string]: { groupId: string } } = {
  passive: { groupId: 'passive-effects' },
  temporary: { groupId: 'temporary-effects' },
};
