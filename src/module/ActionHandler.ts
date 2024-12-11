import { ACTION_ICON, ACTION_TYPE, ATTACK_TYPE, CAPACITY_TYPE, EFFECT_TYPE, ITEM_TYPE } from './constants';

export function initActionHandler(coreModule: TokenActionHudCoreModule, utils: typeof Utils) {
  return class CofActionHandler extends coreModule.api.ActionHandler<CofActor, CofToken> {
    public actorType?: string;

    public items?: foundry.abstract.EmbeddedCollection<CofItem>;

    public groupIds?: string[];

    // Initialize setting variables
    public abbreviateSkills: boolean = false;

    /**
     * Build System Actions
     */
    override async buildSystemActions(groupIds: string[]) {
      // Set actor and token variables
      this.actorType = this.actor?.type;

      // Exit if actor is not a known type
      const knownActors = ['character', 'npc', 'encounter'];
      if (this.actorType && !knownActors.includes(this.actorType)) return;

      // Set items variable
      if (this.actor) {
        let items = this.actor.items as foundry.abstract.EmbeddedCollection<CofItem>;
        items = coreModule.api.Utils.sortItemsByName(items);
        for (const item of items) {
          if (item.type !== 'item') items.delete(item.id);
        }
        this.items = items;
      }

      this.abbreviateSkills = utils.getSetting('abbreviateSkills', false) as boolean;

      // Set group variables
      this.groupIds = groupIds;

      if (this.actorType === 'character' || this.actorType === 'npc') {
        await this.#buildCharacterActions();
      } else if (this.actorType === 'encounter') {
        await this.#buildEncounterActions();
      } else if (!this.actor) {
        this.#buildMultipleTokenActions();
      }
    }

    /** Build character actions. */
    async #buildCharacterActions() {
      // eslint-disable-next-line prettier/prettier
      await Promise.all([
        this.#buildAttributesStats(),
        this.#buildCombatSkills(),
        this.#buildCombatAttacks(),
        this.#buildCapacities(),
        this.#buildInventory(),
        this.#buildCombatUtils(),
        this.#buildEffects(),
      ]);
    }

    /** Build encounter actions. */
    async #buildEncounterActions() {
      // eslint-disable-next-line prettier/prettier
      await Promise.all([
        this.#buildAttributesStats(),
        this.#buildCombatAttacksForEncounters(),
        this.#buildCapacities(),
        this.#buildInventory(),
        this.#buildCombatUtils(),
        this.#buildEffects(),
      ]);
    }

    /** Build multiple controlled tokens actions. */
    async #buildMultipleTokenActions() {
      // eslint-disable-next-line prettier/prettier
      await Promise.all([
        this.#buildAttributesStats(),
        this.#buildCombatSkills(),
        this.#buildCombatUtils(),
        this.#buildEffects(),
      ]);
    }

    async #buildAttributesStats() {
      const groupId = 'attributes';
      const actionType = 'stats';
      const stats = (this.actor ? this.actor.system!.stats : game.cof.config.stats) as Record<
        string,
        { value: number; mod: number }
      >;
      const actions = Object.entries(stats).map(([statId, stat]) => {
        const id = `${groupId}-${actionType}-${statId}`;
        const abbreviatedName = coreModule.api.Utils.i18n(`COF.stats.${statId}.abbrev`);
        const label = game.cof.config.stats[statId];
        const name = this.abbreviateSkills ? abbreviatedName : label;
        const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: `;
        const listName = `${actionTypeName}${label}`;
        const icon1 = '';
        const info1 = this.#getItemMod(stat);
        return {
          id,
          name,
          icon1,
          info1,
          listName,
          system: { actionType, actionId: statId },
        } as Action;
      });

      const groupData = { id: 'attributes-stats', type: 'system' };
      this.addActions(actions, groupData);
    }

    async #buildCombatSkills() {
      const groupId = 'combat';
      const actionType = 'skill';
      const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: `;

      const skills = <
        {
          [key: string]: {
            mod: number;
          };
        }
        >(this.actor ? this.actor.system!.attacks : game.cof.config.skills);

      const actions = Object.entries(skills)
        .map(([key, skill]) => {
          try {
            const id = `${groupId}-${actionType}-${key}`;
            const abbreviatedName = coreModule.api.Utils.i18n(`COF.attacks.${key}.abbrev`);
            const name = this.abbreviateSkills ? abbreviatedName : game.cof.config.skills[key];
            const listName = `${actionTypeName}${game.cof.config.skills[key]}`;
            const info1 = this.#getItemMod(skill);
            return {
              id,
              name,
              icon1: undefined,
              info1,
              listName,
              system: { actionType, actionId: key },
            } as Action;
          } catch (error) {
            coreModule.api.Logger.error(skill);
            return null;
          }
        })
        .filter((skill) => !!skill)
        .map((skill) => skill!);

      const groupData = { id: 'combat-skills', type: 'system' };
      this.addActions(actions, groupData);
    }

    async #buildCombatAttacks() {
      // Exit early if no items exist
      if (!this.items || this.items.size === 0) return;

      const hasCoupDeBouclierItem = Array.from(this.items.values()).find((item) => item.name === 'Coup de bouclier');

      const attacksMap = new Map<string, Map<string, CofItem>>();

      this.items.forEach((item: CofItem) => {
        const isEquippedItem = item.system?.worn;
        if (isEquippedItem) {
          if (!hasCoupDeBouclierItem && item.system.subtype === 'shield') return;
          const itemCategoryMap = attacksMap.get(item.system.subtype) ?? new Map<string, CofItem>();
          itemCategoryMap.set(item.id, item);
          attacksMap.set(item.system.subtype, itemCategoryMap);
        }
      });

      // Loop through inventory group ids
      for (const [actionType, items] of attacksMap) {
        // Create group data
        const groupId = ATTACK_TYPE[actionType]?.groupId;
        if (!groupId) continue;
        const groupData = { id: groupId, type: 'system' };
        console.debug('COF-TAH Debug |', actionType, groupData);

        // Get actions
        const actions = await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          [...items].map(async ([_, item]) => {
            const id = this.#getActionId(item);
            const name = this.#getActionName(item);
            const listName = this.#getActionListName(item, actionType);
            const cssClass = this.#getActionCss(item);
            const icon1 = this.#getIcon1(<CofItem & { actionIcon: string }>item /*, actionType*/);
            const icon2 = this.#getCarryTypeIcon(item);
            const img = coreModule.api.Utils.getImage(item);
            const info1 = this.#getItemMod(item);
            const info2 = this.#getItemQuantity(item);
            return {
              id,
              name,
              cssClass,
              img,
              icon1,
              icon2,
              info1,
              info2,
              listName,
              system: { actionType, actionId: item.id ?? item._id },
            } as Action;
          }),
        );

        console.debug('COF-TAH Debug | attacks', actions);

        // Add actions to action list
        this.addActions(actions, groupData);
      }
    }

    async #buildCombatAttacksForEncounters() {
      const attacks = this.actor.system?.weapons;

      // Exit early if no items exist
      if (!attacks || attacks.length === 0) return;

      const groupId = 'combat';
      const actionType = 'attack';
      const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: `;

      const actions = await Promise.all(
        Object.entries(attacks).map(([key, attack]) => {
          const id = `${groupId}-${actionType}-${key}`;
          const name = this.#getActionName(attack);
          const listName = `${actionTypeName}${name}`;
          const cssClass = this.#getActionCss(attack);
          const img = '/systems/cof/ui/icons/attack.webp';
          const info1 = this.#getItemMod(attack);
          return {
            id,
            name,
            cssClass,
            img,
            info1,
            listName,
            system: { actionType, actionId: key },
          } as Action;
        }),
      );

      console.debug('COF-TAH Debug | encounter attacks', attacks, actions);

      // Create group data
      const groupData = { id: 'combat-attacks', type: 'system' };

      // Add actions to action list
      this.addActions(actions, groupData);
    }

    async #buildCapacities() {
      // Exit early if no items exist
      if (this.items?.size === 0) return;

      const actionType = 'capacity';
      const capacitiesMap = new Map<string, Map<string, CofItem>>();

      this.items?.forEach((item: CofItem) => {
        if (item.type !== 'capacity') return;

        const key = item.id;
        const itemType =
          'species' in item.system ? 'species' : 'path' in item.system && item.system.path !== '' ? 'profile' : 'other';
        const groupId = CAPACITY_TYPE[itemType]?.groupId;
        if (!groupId) return;

        const itemCategoryMap = capacitiesMap.get(groupId) ?? new Map<string, CofItem>();
        itemCategoryMap.set(key, item);
        capacitiesMap.set(groupId, itemCategoryMap);
      });

      // Loop through attack group ids
      for (const [groupId, capacity] of capacitiesMap) {
        // Create group data
        const groupData = { id: groupId, type: 'system' };

        // Get actions
        const actions = await Promise.all(
          [...capacity].map(async ([id, itemData]) => {
            const name = this.#getActionName(itemData);
            const listName = this.#getActionListName(itemData, actionType);
            const cssClass = this.#getActionCss(itemData);
            const icon1 = '';
            const icon2 = this.#getCarryTypeIcon(itemData) || this.#getActivableTypeIcon(itemData);
            const img = coreModule.api.Utils.getImage(itemData);
            const info1 = this.#getItemQuantity(itemData);
            const info2 = this.#getItemMod(itemData);
            return {
              id,
              name,
              cssClass,
              img,
              icon1,
              icon2,
              info1,
              info2,
              listName,
              system: { actionType, actionId: id },
            } as Action;
          }),
        );

        // Add actions to action list
        this.addActions(actions, groupData);
      }
    }

    async #buildInventory() {
      // Exit early if no items exist
      if (this.items?.size === 0) return;

      const actionType = 'item';
      const inventoryMap = new Map<string, Map<string, CofItem>>();

      this.items?.forEach((item: CofItem) => {
        const key = item.id;
        const hasQuantity = item.system.qty > 0;
        if (hasQuantity) {
          const itemCategoryMap = inventoryMap.get(item.system.subtype) ?? new Map<string, CofItem>();
          itemCategoryMap.set(key, item);
          inventoryMap.set(item.system.subtype, itemCategoryMap);
        }
      });

      // Loop through inventory group ids
      for (const [id, items] of inventoryMap) {
        // Create group data
        const groupId = ITEM_TYPE[id]?.groupId;
        if (!groupId) continue;
        const groupData = { id: groupId, type: 'system' };
        const actionTypeName = `${coreModule.api.Utils.i18n('COF.category.item')}: `;

        // Get actions
        const actions = await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          [...items].map(async ([_, itemData]) => {
            const id = this.#getActionId(itemData);
            const name = this.#getActionName(itemData);
            const listName = `${actionTypeName}${name}`;
            const cssClass = this.#getActionCss(itemData);
            const img = coreModule.api.Utils.getImage(itemData);
            const icon1 = this.#getIcon1(<CofItem & { actionIcon: string }>itemData /*, actionType*/);
            const icon2 = this.#getCarryTypeIcon(itemData) || this.#getActivableTypeIcon(itemData);
            const info1 = this.#getItemQuantity(itemData);
            return {
              id,
              name,
              cssClass,
              img,
              icon1,
              icon2,
              info1,
              listName,
              system: { actionType, actionId: itemData.id ?? itemData._id },
            } as Action;
          }),
        );

        // Add actions to action list
        this.addActions(actions, groupData);
      }
    }

    async #buildCombatUtils() {
      const combatTypes: { [key: string]: { id: string; name: string } } = {
        initiative: { id: 'initiative', name: coreModule.api.Utils.i18n('tokenActionHud.cof.Combat.rollInitiative') },
        endTurn: { id: 'endTurn', name: coreModule.api.Utils.i18n('tokenActionHud.endTurn') },
      };

      // Delete initiative if combat has not started or
      // no selected tokens are in combat...
      if (!game.combat) {
        delete combatTypes.initiative;
      } else if (this.tokens) {
        for (const t of this.tokens) {
          const combatant = game.combat.getCombatantByToken(t.id);
          if (!combatant) {
            delete combatTypes.initiative;
            break;
          }
        }
      }

      // Delete endTurn for multiple tokens
      if (game.combat?.current?.tokenId !== this.token?.id) {
        delete combatTypes.endTurn;
      }

      const actions = Object.entries(combatTypes).map((combatType) => {
        const actionType = 'combat';
        const id = `combat-utils-${combatType[0]}`;
        const name = combatType[1].name;
        const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: `;
        const listName = `${actionTypeName}${name}`;
        const info1: { class?: string; text?: number | null } = {};
        let cssClass = '';
        if (combatType[0] === 'initiative' && game.combat) {
          const tokenIds = this.tokens.map((token) => token.id);
          const combatants = (game.combat.combatants as CofCombatant[])
            .filter((combatant: CofCombatant) => typeof combatant.tokenId === 'string')
            .filter((combatant: CofCombatant) => tokenIds.includes(combatant.tokenId!));

          // Get initiative for single token
          if (combatants.length === 1) {
            const currentInitiative = combatants[0].initiative;
            info1.class = 'tah-spotlight';
            info1.text = currentInitiative;
          }

          const active =
            combatants.length > 0 && combatants.every((combatant: CofCombatant) => combatant?.initiative)
              ? ' active'
              : '';
          cssClass = `toggle${active}`;
        }
        return {
          id,
          name,
          info1,
          cssClass,
          listName,
          system: { actionType, actionId: combatType[1].id },
        } as Action;
      });

      const groupData = { id: 'combat-utils', type: 'system' };
      this.addActions(actions, groupData);
    }

    async #buildEffects() {
      const effects = this.actor.effects;
      if (effects.size === 0) return;

      const effectsMap = new Map<string, ActiveEffect<CofActor>[]>();

      effects?.forEach((effect) => {
        const itemType = effect.isTemporary ? 'temporary' : 'passive';
        const groupId = EFFECT_TYPE[itemType]?.groupId;
        if (!groupId) return;

        const effects = effectsMap.get(groupId) ?? [];
        effects.push(effect);
        effectsMap.set(groupId, effects);
      });

      const actionType = 'effects';

      // Loop through attack group ids
      for (const [groupId, effect] of effectsMap) {
        // Create group data
        const groupData = { id: groupId, type: 'system' };

        // Get actions
        const actions = await Promise.all(
          [...effect].map(async (effect) => {
            const id = `${groupId}_${actionType}_${effect._id}`;
            const name = effect.name;
            const active = effect.disabled ? '' : ' active';
            const cssClass = `toggle${active}`;
            const img = coreModule.api.Utils.getImage(effect);
            const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: `;
            const listName = `${actionTypeName}${name}`;

            return {
              id,
              name,
              cssClass,
              img,
              listName,
              system: { actionType, actionId: effect._id },
            } as Action;
          }),
        );

        // Add actions to action list
        this.addActions(actions, groupData);
      }
    }

    #getActionId(entity: CofItem /*, actionType?: string /*, spellLevel*/): string {
      return entity.id ?? entity._id;
    }

    #getActionName(entity: { name?: string; label?: string }) {
      return entity?.name ?? entity?.label ?? '';
    }

    #getActionListName(entity: { name?: string; label?: string; listName?: string }, actionType: string) {
      const name = this.#getActionName(entity);
      const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: `;
      return entity.listName ?? `${actionTypeName}${name}`;
    }

    #getActionCss(entity: object) {
      if ('disabled' in entity) {
        const active = !entity.disabled ? ' active' : '';
        return `toggle${active}`;
      }
      if ('selected' in entity) {
        const active = entity.selected ? ' active' : '';
        return `toggle${active}`;
      }
    }

    #getIcon1(entity: CofItem) {
      const iconType = entity.system.worn ? 'equipped' : undefined;
      return this.#getActionIcon(String(iconType));
    }

    #getCarryTypeIcon(item?: CofItem) {
      const worn = item?.system.worn;
      if (worn) {
        return '<i class="fas fa-shield-alt"></i>';
      }
    }

    #getActivableTypeIcon(item?: CofItem) {
      const activable = item?.system.activable;
      if (activable) {
        return '<i class="fas fa-check"></i>';
      }
    }

    #getItemQuantity(item: CofItem): Partial<ActionInfo> | undefined {
      if ('system' in item) {
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
    }

    #getItemMod(item: CofItem | { mod: number }): Partial<ActionInfo> | undefined {
      if ('system' in item && 'skill' in item.system && 'skillBonus' in item.system && item.system.skill) {
        let skillName = item.system.skill as string;
        skillName = skillName.split('@')[1];
        if (!skillName) return;
        const skillMod0 = this.#getValue<number>(item.actor.system, skillName) ?? 0;
        const skillMod1 = Number(item.system.skillBonus) ?? 0;
        const skillMod = skillMod0 + skillMod1;
        const text = skillMod < 0 ? skillMod : `(+${skillMod})`;
        return { text: `${text}` };
      }

      // monster/encounter attack/weapon or skill
      if ('mod' in item) {
        const text = item.mod < 0 ? item.mod : `(+${item.mod})`;
        return { text: `${text}` };
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    #getValue<T extends number | string | null>(instance: any, path: string): T {
      const parts = path.split('.');
      for (const part of parts) {
        if (part in instance) {
          instance = instance[part];
        }
      }

      return instance as T;
    }

    #getActionIcon(action: string) {
      return ACTION_ICON[action];
    }
  };
}
