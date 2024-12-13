export const REQUIRED_CORE_MODULE_VERSION = '2.0';

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
  combatSpells: { id: 'combat-spells', name: 'tokenActionHud.cof.magic-plural', type: 'system' },
  combatShields: { id: 'combat-shields', name: 'COF.armors.shield', type: 'system' },
  combatUtils: { id: 'combat-utils', name: 'tokenActionHud.cof.Combat.Utils', type: 'system' },
  capacitiesRacial: { id: 'capacities-racial', name: 'COF.species.capacities', type: 'system' },
  capacitiesProfile: { id: 'capacities-profile', name: 'COF.ui.capacities', type: 'system' },
  capacitiesOther: { id: 'capacities-other', name: 'COF.ui.OffPathsCapacities', type: 'system' },
  inventoryWeapons: { id: 'inventory-weapons', name: 'tokenActionHud.cof.Weapons', type: 'system' },
  inventoryProtections: { id: 'inventory-protections', name: 'COF.properties.protection', type: 'system' },
  inventoryContainers: { id: 'inventory-containers', name: 'COF.category.container', type: 'system' },
  inventoryConsumables: { id: 'inventory-consumables', name: 'COF.category.consumable', type: 'system' },
  inventoryAmmunitions: { id: 'inventory-ammunitions', name: 'COF.category.ammunition', type: 'system' },
  inventoryEquipment: { id: 'inventory-equipment', name: 'COF.category.item', type: 'system' },
  inventoryWand: { id: 'inventory-wand', name: 'COF.category.wand', type: 'system' },
  inventoryJewel: { id: 'inventory-jewel', name: 'COF.category.jewel', type: 'system' },
  inventoryMount: { id: 'inventory-mount', name: 'COF.category.mount', type: 'system' },
  inventoryScroll: { id: 'inventory-scroll', name: 'COF.category.scroll', type: 'system' },
  inventorySpell: { id: 'inventory-spell', name: 'COF.category.spell', type: 'system' },
  inventoryOther: { id: 'inventory-other', name: 'COF.category.other', type: 'system' },
  effectsPermanent: { id: 'effects-permanent', name: 'tokenActionHud.cof.Effects.Permanent', type: 'system' },
  effectsTemporary: { id: 'effects-temporary', name: 'tokenActionHud.cof.Effects.Temporary', type: 'system' },
  token: { id: 'token', name: 'tokenActionHud.token', type: 'system' },
};

export const ACTION_TYPE: Record<string, string> = {
  rollStat: 'COF.ui.stat',
  rollCombatSkill: 'tokenActionHud.cof.Combat.Skills',
  rollAttack: 'COF.ui.attack', // encounters
  rollAttackMelee: 'COF.category.melee',
  rollAttackRanged: 'COF.category.ranged',
  rollAttackShield: 'COF.category.shield',
  rollAttackSpell: 'COF.attacks.magic.label',
  rollCapacity: 'COF.ui.capacity',
  rollEffect: 'tokenActionHud.cof.Effects.All',
  useItem: 'tokenActionHud.cof.Items',
  combat: 'COF.tabs.combat', // initiative & endTurn
  utility: 'tokenActionHud.utility',
};

export const ACTION_ICON: Record<string, string> = {
  activatable: 'fa-solid fa-check fa-fw',
  equipped: 'fa-solid fa-shield-alt fa-fw',
  worn: 'fa-solid fa-hand-fist fa-fw fa-rotate-90', // fa-bow-arrow
};

export const ITEM_TYPE: Record<string, { groupId: string }> = {
  ammunition: { groupId: 'ammunition' },
  armor: { groupId: 'protections' },
  consumable: { groupId: 'consumables' },
  container: { groupId: 'containers' },
  equipment: { groupId: 'equipment' },
  melee: { groupId: 'weapons' },
  ranged: { groupId: 'weapons' },
  shield: { groupId: 'protections' },
  trapping: { groupId: 'equipment' },
  weapon: { groupId: 'weapons' },
  wand: { groupId: 'wand' }, // baguette
  jewel: { groupId: 'jewel' }, // bijou
  mount: { groupId: 'mount' }, // monture
  scroll: { groupId: 'scroll' }, // parchemin
  spell: { groupId: 'spell' }, // sort
  other: { groupId: 'other' },
};
