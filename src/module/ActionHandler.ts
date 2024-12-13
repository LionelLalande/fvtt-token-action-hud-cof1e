import { ACTION_ICON, ACTION_TYPE, ITEM_TYPE } from './constants'; // ATTACK_TYPE, CAPACITY_TYPE, EFFECT_TYPE,

export function initActionHandler(coreModule: TokenActionHudCoreModule, utils: typeof Utils) {
  return class CofActionHandler extends coreModule.api.ActionHandler<CofActor, CofToken> {
    // Initialize setting variables
    public abbreviateSkills: boolean = false;

    /**
     * Build System Actions
     */
    override async buildSystemActions(/*_groupIds: string[]*/) {
      const actorType = this.actor?.type;

      // Exit if actor is not a known type
      const knownActors = ['character', 'npc', 'encounter'];
      if (actorType && !knownActors.includes(actorType)) return;

      this.abbreviateSkills = utils.getSetting('abbreviateSkills', false) as boolean;

      ////// Set group variables
      ////this.groupIds = groupIds.sort((a, b) => b.localeCompare(a));

      const availableActions = this.#getActorActions(actorType);
      for (const data of availableActions) {
        const { groupId, actions } = data;
        this.addActions(actions, { id: groupId, type: 'system' });
      }
    }

    /** Retrieve all available actions in zero, one or more actors */
    #getActorActions(actorType: string): {
      groupId: string;
      actions: Action[];
    }[] {
      switch (actorType) {
        case 'character':
        case 'npc':
          return this.#buildCharacterSections();
        case 'encounter':
          return this.#buildEncounterSections();
        default:
          return this.#buildTokensSections();
      }
    }

    // ******************************************************************************** //

    #buildCharacterSections(): {
      groupId: string;
      actions: Action[];
    }[] {
      const items = (function (self) {
        if (self.actor) {
          let items = self.actor.items as foundry.abstract.EmbeddedCollection<CofItem>;
          items = coreModule.api.Utils.sortItemsByName(items);
          //for (const item of items) {
          //  if (item.type !== 'item') items.delete(item.id);
          //}
          return items.values().toArray();
        }
        return [];
      })(this);
      const effects = this.actor.effects.values().toArray();
      return [
        ...this.#buildAttributesSection(),
        ...this.#buildCombatSection(items),
        ...this.#buildCapacitiesSection(items),
        ...this.#buildInventorySection(items),
        ...this.#buildEffectsSection(effects),
      ];
    }

    #buildEncounterSections(): {
      groupId: string;
      actions: Action[];
    }[] {
      const items = (function (self) {
        if (self.actor) {
          let items = self.actor.items as foundry.abstract.EmbeddedCollection<CofItem>;
          items = coreModule.api.Utils.sortItemsByName(items);
          //for (const item of items) {
          //  if (item.type !== 'item') items.delete(item.id);
          //}
          return items.values().toArray();
        }
        return [];
      })(this);
      const effects = this.actor.effects.values().toArray();
      return [
        ...this.#buildAttributesSection(),
        ...this.#buildEncounterCombatSection(),
        ...this.#buildCapacitiesSection(items),
        ...this.#buildInventorySection(items),
        ...this.#buildEffectsSection(effects),
      ];
    }

    /** Build multiple controlled tokens actions. */
    #buildTokensSections(): {
      groupId: string;
      actions: Action[];
    }[] {
      return [
        ...this.#buildAttributesSection(),
        this.#buildCombatSkillsSection('combat'),
        ////...this.#buildCombatUtils(),
      ];
    }

    // ******************************************************************************** //

    #buildAttributesSection(): {
      groupId: string;
      actions: Action[];
    }[] {
      const groupType = 'attributes';
      return [
        {
          groupId: `${groupType}-stats`,
          actions: this.#getAttributeStatsActions(`${groupType}-stats`, 'rollStat'),
        },
      ];
    }

    #buildCombatSection(items: CofItem[]): {
      groupId: string;
      actions: Action[];
    }[] {
      const groupId = 'combat';
      return [
        this.#buildCombatSkillsSection(groupId),
        this.#buildCombatMeleeSection(groupId, items),
        this.#buildCombatRangedSection(groupId, items),
        this.#buildCombatSpellsSection(groupId, items),
        this.#buildCombatShieldsSection(groupId, items),
        ////...this.#buildCombatUtils(),
      ];
    }

    #buildEncounterCombatSection(): {
      groupId: string;
      actions: Action[];
    }[] {
      const groupId = 'combat';
      const attacks = Object.values(this.actor.system?.weapons);
      const result = [this.#buildCombatSkillsSection(groupId)];
      if (attacks && attacks.length > 0) {
        result.push(this.#buildEncounterCombatAttackSection(groupId, attacks));
      }
      ////...this.#buildCombatUtils(),
      return result;
    }

    #buildEncounterCombatAttackSection(
      groupId: string,
      attacks: CofEncounterWeapon[],
    ): {
      groupId: string;
      actions: Action[];
    } {
      groupId = `${groupId}-attacks`;
      return {
        groupId,
        actions: this.#buildEncounterCombatAttackActions(groupId, 'rollAttack', attacks),
      };
    }

    #buildCombatSkillsSection(groupId: string): {
      groupId: string;
      actions: Action[];
    } {
      groupId = `${groupId}-skills`;
      const skills = this.actor ? this.actor.system!.attacks : game.cof.config.skills;
      return {
        groupId,
        actions: this.#buildCombatSkillActions(groupId, 'rollCombatSkill', skills),
      };
    }

    #buildCombatMeleeSection(
      groupId: string,
      items: CofItem[],
    ): {
      groupId: string;
      actions: Action[];
    } {
      groupId = `${groupId}-melee`;
      const weapons = items.filter(
        (item) => item.type === 'item' && item.system.subtype === 'melee' && item.system.worn,
      );
      return {
        groupId,
        actions: this.#buildCombatAttackActions(groupId, 'rollAttackRanged', weapons),
      };
    }

    #buildCombatRangedSection(
      groupId: string,
      items: CofItem[],
    ): {
      groupId: string;
      actions: Action[];
    } {
      groupId = `${groupId}-ranged`;
      const weapons = items.filter(
        (item) => item.type === 'item' && item.system.subtype === 'ranged' && item.system.worn,
      );
      return {
        groupId,
        actions: this.#buildCombatAttackActions(groupId, 'rollAttackRanged', weapons),
      };
    }

    #buildCombatSpellsSection(
      groupId: string,
      items: CofItem[],
    ): {
      groupId: string;
      actions: Action[];
    } {
      groupId = `${groupId}-spells`;
      const spells = items.filter(
        (item) =>
          item.type === 'capacity' &&
          'attack' in item.system &&
          item.system.attack &&
          item.system.spell &&
          (!('heal' in item.system) || !item.system.heal), // TODO add "mains libres" ?
      );
      return {
        groupId,
        actions: this.#buildCombatAttackActions(groupId, 'rollAttackSpell', spells),
      };
    }

    #buildCombatShieldsSection(
      groupId: string,
      items: CofItem[],
    ): {
      groupId: string;
      actions: Action[];
    } {
      groupId = `${groupId}-shields`;
      const coupDeBouclierItem = items.find((item) => item.name === 'Coup de bouclier');
      const shields = items.filter(
        (item) => item.type === 'item' && item.system.subtype === 'shield' && item.system.worn,
      );
      return {
        groupId,
        actions: coupDeBouclierItem
          ? this.#buildCombatAttackActions(groupId, 'rollAttackShield', shields, coupDeBouclierItem?.id)
          : [],
      };
    }

    #buildCapacitiesSection(items: CofItem[]): {
      groupId: string;
      actions: Action[];
    }[] {
      // TODO filter out not usabled capacity! use settings to enable or disable...
      ////const isUsableCapacity = (item: CofItem) => {
      ////  return (!('attack' in item.system) || !item.system.attack) &&
      ////    (item.system.activable || item.system.limitedUsage || item.system.spell);
      ////};
      const isRacialCapacity = (item: CofItem) => item.type === 'capacity' && 'species' in item.system;
      const isProfileCapacity = (item: CofItem) => {
        const capacity = this.#isCapacity(item) ? item : undefined;
        if (!capacity) return false;
        const path =
          // ts-expect-error don't know why!
          'path' in capacity.system && capacity.system.path && '_id' in capacity.system.path
            ? this.actor.items.get(capacity.system.path._id as string)
            : undefined;
        if (!path) return false;
        const profile =
          'profile' in path.system && path.system.profile && '_id' in path.system.profile
            ? this.actor.items.get(path.system.profile._id as string)
            : undefined;
        return !!profile;
      };
      const isOtherCapacity = (item: CofItem) => {
        const capacity = this.#isCapacity(item) ? item : undefined;
        if (!capacity || isProfileCapacity(item) || isRacialCapacity(item)) return false;
        return true;
      };
      const capacityMap = {
        racial: items.filter(isRacialCapacity),
        profile: items.filter(isProfileCapacity),
        other: items.filter(isOtherCapacity),
      };
      const groupId = 'capacities';
      const actionType = 'rollCapacity';
      return Object.entries(capacityMap).map(([key, capacities]) => {
        return this.#buildSubSection(`${groupId}-${key}`, actionType, capacities);
      });
    }

    ////#buildCapacitySection(groupId: string, actionType: string, capacities: CofItem[]): Action[] {
    ////  return capacities.map((capacity) => {
    ////    return this.#buildAction(groupId, actionType, capacity);
    ////  });
    ////}

    #buildInventorySection(items: CofItem[]): {
      groupId: string;
      actions: Action[];
    }[] {
      // Exit early if no items exist
      if (items.length === 0) return [];

      const inventoryMap = new Map</*category*/ string, CofItem[]>();
      items.forEach((item: CofItem) => {
        if (item.type !== 'item') return;
        const key = item.system.properties.consumable ? 'consumable' : item.system.subtype;
        const groupId = ITEM_TYPE[key]?.groupId;
        if (!groupId) return;
        const hasQuantity = item.system.qty > 0;
        if (!hasQuantity) return;
        const itemCategoryMap = inventoryMap.get(groupId) ?? [];
        itemCategoryMap.push(item);
        inventoryMap.set(groupId, itemCategoryMap);
      });

      const groupId = 'inventory';
      const actionType = 'useItem';
      const groupedItems: { groupId: string; actions: Action[] }[] = [];
      inventoryMap.forEach((items, key) => {
        const section = this.#buildSubSection(`${groupId}-${key}`, actionType, items);
        groupedItems.push(section);
      });
      return groupedItems;
    }

    #buildEffectsSection(effects: ActiveEffect<CofActor>[]): {
      groupId: string;
      actions: Action[];
    }[] {
      // Exit early if no items exist
      if (effects.length === 0) return [];

      const effectMap = {
        permanent: effects.filter((effect) => !effect.isTemporary),
        temporary: effects.filter((effect) => effect.isTemporary),
      };

      const groupId = 'effects';
      const actionType = 'toggleEffect';
      return Object.entries(effectMap).map(([key, effects]) => {
        return this.#buildSubSection(`${groupId}-${key}`, actionType, effects);
      });
    }

    // ******************************************************************************** //

    #buildSubSection<T extends CofItem | ActiveEffect<CofActor>>(
      groupId: string,
      actionType: string,
      objects: T[],
    ): {
      groupId: string;
      actions: Action[];
    } {
      return {
        groupId,
        actions: objects.map((obj) => this.#buildAction(groupId, actionType, obj)),
      };
    }

    // ******************************************************************************** //

    #getAttributeStatsActions(groupId: string, actionType: string): Action[] {
      const stats = (this.actor ? this.actor.system!.stats : game.cof.config.stats) as Record<
        string,
        { value: number; mod: number }
      >;
      const abbrev = (key: string) => `COF.stats.${key}.abbrev`;
      const values = (key: string) => game.cof.config.stats[key];
      return Object.entries(stats).map(([key, stat]) => {
        return this.#buildStatAction(groupId, actionType, key, stat, abbrev(key), values(key));
      });
    }

    #buildCombatSkillActions(groupId: string, actionType: string, skills: Record<string, { mod: number }>): Action[] {
      const abbrev = (key: string) => `COF.attacks.${key}.abbrev`;
      const values = (key: string) => game.cof.config.skills[key];
      return Object.entries(skills).map(([key, skill]) => {
        return this.#buildStatAction(groupId, actionType, key, skill, abbrev(key), values(key));
      });
    }

    #buildCombatAttackActions(groupId: string, actionType: string, attacks: CofItem[], replaceId?: string): Action[] {
      return attacks.map((attack) => {
        return this.#buildAction(groupId, actionType, attack, { replaceId, showMod: true });
      });
    }

    #buildEncounterCombatAttackActions(groupId: string, actionType: string, attacks: CofEncounterWeapon[]): Action[] {
      return Object.entries(attacks).map(([key, attack]) => {
        return this.#buildEncounterAttackAction(groupId, actionType, key, attack);
      });
    }

    // ******************************************************************************** //

    #buildAction(
      groupId: string,
      actionType: string,
      action: CofItem | ActiveEffect<CofActor>,
      options?: { replaceId?: string; showMod?: boolean },
    ) {
      const id = `${groupId}-${action.id}`;
      const name = action.name;
      return {
        id,
        name,
        listName: this.#getActionListName(actionType, name),
        img: coreModule.api.Utils.getImage(action),
        cssClass: this.#getActionCss(action),
        icon1: this.#isItem(action) ? this.#getActionIcon(action) : undefined,
        info1:
          (options?.showMod ?? false) && (this.#isCapacity(action) || this.#isWeapon(action))
            ? this.#getActionModifier(action)
            : undefined,
        info2: this.#hasQuantity(action) ? this.#getActionQuantity(action) : undefined,
        system: { actionType, actionId: options?.replaceId ?? action.id },
      } as Action;
    }

    #buildStatAction(
      groupId: string,
      actionType: string,
      key: string,
      action: string | { mod: number },
      translationKey: string,
      label: string,
    ): Action {
      const id = `${groupId}-${key}`;
      const abbrev = coreModule.api.Utils.i18n(translationKey);
      const name = this.abbreviateSkills ? abbrev : label;
      return {
        id,
        name,
        listName: this.#getActionListName(actionType, label),
        info1: typeof action === 'string' ? '' : this.#getActionModifier(action),
        system: { actionType, actionId: key },
      } as Action;
    }

    #buildEncounterAttackAction(groupId: string, actionType: string, key: string, action: CofEncounterWeapon): Action {
      const id = `${groupId}-${key}`;
      const name = action.name;
      return {
        id,
        name,
        listName: this.#getActionListName(actionType, name),
        img: coreModule.api.Utils.getImage(action) ?? '/systems/cof/ui/icons/attack.webp',
        cssClass: this.#getActionCss(action),
        info1: this.#getActionModifier(action),
        system: { actionType, actionId: key },
      } as Action;
    }

    // ******************************************************************************** //

    #isActiveEffect(obj: unknown): obj is ActiveEffect<CofActor> {
      // @ts-expect-error parameter is unknown
      return 'duration' in obj && 'isTemporary' in obj;
    }

    #isItem(obj: unknown): obj is CofItem {
      // @ts-expect-error parameter is unknown
      return obj.type === 'item';
    }

    #isCapacity(obj: unknown): obj is CofItem {
      // @ts-expect-error parameter is unknown
      return obj.type === 'capacity';
    }

    #isPath(obj: unknown): obj is CofItem {
      // @ts-expect-error parameter is unknown
      return obj.type === 'path';
    }

    #isWeapon(obj: unknown): obj is CofItem {
      // @ts-expect-error parameter is unknown
      return ['melee', 'ranged'].includes(obj.system.subtype);
    }

    #hasQuantity(obj: unknown): obj is CofItem {
      // @ts-expect-error parameter is unknown
      if (!('properties' in obj.system)) return undefined;
      // @ts-expect-error parameter is unknown
      const { system } = obj;
      const { properties } = system;
      return (
        'limitedUsage' in properties ||
        ('stackable' in properties && 'qty' in system) ||
        ('consumable' in properties && 'qty' in system)
      );
    }

    #getActionListName(actionType: string, name: string) {
      const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: `;
      return `${actionTypeName}${name}`;
    }

    #getActionCss(obj: CofItem | CofEncounterWeapon | ActiveEffect<CofActor>) {
      if ('disabled' in obj) {
        const active = obj.disabled ? '' : ' active';
        return `toggle${active}`;
      }
      if ('selected' in obj) {
        const active = obj.selected ? ' active' : '';
        return `toggle${active}`;
      }
    }

    #getActionIcon(obj: CofItem) {
      const iconType = (function () {
        const activable = obj.system.activable;
        if (activable) return 'activatable';
        const worn = obj.system.worn;
        const isWeapon = ['melee', 'ranged'].includes(obj.system.subtype);
        if (isWeapon && worn) return 'worn';
        if (worn) return 'equipped';
        return '';
      })();
      return `<i class="${ACTION_ICON[iconType]}"></i>`;
    }

    #getActionQuantity(item: CofItem): Partial<ActionInfo> | undefined {
      const { system } = item;
      const { properties } = system;
      if (properties?.limitedUsage) {
        const max = properties.limitedUsage.maxUse;
        if (max > 0) {
          const quantity = properties.limitedUsage.use;
          const text = `[${quantity}/${max}]`;
          return { text };
        }
      }
      if ((properties?.stackable || properties?.consumable) && system.qty) {
        const text = system.qty > 1 ? `[${system.qty}]` : '';
        return { text };
      }
    }

    #getActionModifier(item: CofItem | CofEncounterWeapon | { mod: number }): Partial<ActionInfo> | undefined {
      if ('system' in item && 'skill' in item.system && 'skillBonus' in item.system && item.system.skill) {
        let skillName = item.system.skill as string;
        skillName = skillName.split('@')[1];
        if (!skillName) return;
        const skillMod0 = Number(foundry.utils.getProperty(item.actor.system, skillName));
        const skillMod1 = Number(item.system.skillBonus);
        const skillMod = skillMod0 + skillMod1;
        const text = skillMod < 0 ? skillMod : `(+${skillMod})`;
        return { text: `${text}` };
      }

      // monster/encounter attack/weapon or skill
      if ('mod' in item) {
        const text = item.mod < 0 ? item.mod : `+${item.mod}`;
        return { text: `(${text})` };
      }
    }
  };
}
