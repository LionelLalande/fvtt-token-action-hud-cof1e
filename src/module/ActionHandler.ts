/// <reference Path="../../@types/foundry/index.d.ts" />
/// <reference Path="../../@types/fvtt-token-action-hud-core/index.d.ts" />
/// <reference Path="../../@types/fvtt-cof/index.d.ts" />

////import { AnyActor } from '@types/foundry/client/documents/token-document';
import { ACTION_ICON, ACTION_TYPE, ATTACK_TYPE, CAPACITY_TYPE, EFFECT_TYPE, ITEM_TYPE } from './constants';

export function initActionHandler(coreModule: TokenActionHudCoreModule, utils: typeof Utils) {
  return class CofActionHandler extends coreModule.api.ActionHandler<CofActor, CofToken> {
    ////private actorId?: string;
    public actors?: CofActor[];
    public actorType?: string;
    ////private tokenId?: string;
    public tokens?: CofToken[];

    public items?: foundry.abstract.EmbeddedCollection<CofItem>;

    public groupIds?: string[];
    ////private activationGroupIds?: string[];
    ////private effectGroupIds?: string[];
    ////private inventoryGroupIds?: string[];

    ////private inventoryActions?: Action[];

    // Initialize setting variables
    public abbreviateSkills: boolean = false;

    /**
     * Build System Actions
     */
    override async buildSystemActions(groupIds: string[]) {
      // Set actor and token variables
      this.actors = !this.actor ? this.#getActors() : [<CofActor>(<unknown>this.actor)];
      this.actorType = this.actor?.type;
      this.tokens = !this.token ? this.#getTokens() : [<CofToken>(<unknown>this.token)];

      // Exit if actor is not a known type
      const knownActors = ['character', 'npc', 'encounter'];
      if (this.actorType && !knownActors.includes(this.actorType)) return;

      // Set items variable
      if (this.actor) {
        let items = (<CofActor>(<unknown>this.actor)).items;
        items = coreModule.api.Utils.sortItemsByName(items);
        for (const item of items) {
          if (item.type !== 'item') items.delete(item.id);
        }
        this.items = items;
      }

      this.abbreviateSkills = <boolean>utils.getSetting('abbreviateSkills');

      // Set group variables
      this.groupIds = groupIds;

      if (this.actorType === 'character' || this.actorType === 'npc') {
        await this.#buildCharacterActions();
      } else if (this.actorType == 'encounter') {
        await this.#buildEncounterActions();
      } else if (!this.actor) {
        this.#buildMultipleTokenActions();
      }
    }

    /** Get selected actors from canvas. */
    #getActors(): CofActor[] {
      const allowedTypes = ['character', 'npc', 'encounter'];
      const tokens = <CofToken[]>coreModule.api.Utils.getControlledTokens();
      const actors = tokens.filter((token) => token.actor).map((token) => token.actor!);
      if (actors.every((actor) => allowedTypes.includes(actor.type))) {
        return actors;
      }

      return [];
    }

    /** Get selected tokens from canvas */
    #getTokens(): CofToken[] {
      const allowedTypes = ['character', 'npc', 'encounter'];
      const tokens = <CofToken[]>coreModule.api.Utils.getControlledTokens();
      const actors = tokens?.filter((token) => token.actor).map((token) => token.actor!);
      if (actors.every((actor) => allowedTypes.includes(actor.type))) {
        return tokens;
      }

      return [];
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
        this.#buildToken(),
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
        this.#buildToken(),
        this.#buildEffects(),
      ]);
    }

    /** Build multiple controlled tokens actions. */
    async #buildMultipleTokenActions() {
      // eslint-disable-next-line prettier/prettier
      await Promise.all([
        this.#buildAttributesStats(),
        this.#buildCombatSkills(),
        this.#buildToken(),
        this.#buildEffects(),
      ]);
    }

    async #buildAttributesStats() {
      const groupId = 'attributes';
      const actionType = 'stats';
      const stats = <{ [key: string]: { value: number; mod: number } }>(
        (this.actor ? this.actor.system!.stats : game.cof.config.stats)
      );
      const actions = Object.entries(stats).map(([statId, stat]) => {
        const id = `${groupId}-${actionType}-${statId}`;
        const abbreviatedName = coreModule.api.Utils.i18n(`COF.stats.${statId}.abbrev`);
        const label = game.cof.config.stats[statId];
        const name = this.abbreviateSkills ? abbreviatedName : label;
        const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? '';
        const listName = `${actionTypeName}${label}`;
        const encodedValue = [actionType, statId].join(this.delimiter);
        const icon1 = ''; ////(groupId !== 'checks') ? this.#getProficiencyIcon(abilities[abilityId].proficient) : ''
        ////const mod = stat.mod ?? null; //// (groupId !== 'saves') ? ability?.mod : ((groupId === 'saves') ? ability?.save : '')
        const info1 = this.#getItemInfo(stat); ////  this.actor ? { text: mod >= 0 ? '+' + mod : mod } : null; // coreModule.api.Utils.getModifier(mod)
        const info2 = {}; ////(this.actor && groupId === 'abilities') ? { text: `(${coreModule.api.Utils.getModifier(ability?.save)})` } : null
        return <Action>{
          id,
          name,
          encodedValue,
          icon1,
          info1,
          info2,
          listName,
        };
      });

      const groupData = { id: 'attributes-stats', type: 'system' };
      this.addActions(actions, groupData);
    }

    async #buildCombatSkills() {
      const groupId = 'combat';
      const actionType = 'skill';
      const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? '';

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
            const encodedValue = [actionType, key].join(this.delimiter);
            const info1 = this.#getItemInfo(skill); //// this.actor ? { text: mod || mod < 0 ? mod : '+' + mod } : '';
            return {
              id,
              name,
              encodedValue,
              icon1: undefined,
              info1: info1,
              listName,
            };
          } catch (error) {
            coreModule.api.Logger.error(skill);
            return null;
          }
        })
        .filter((skill) => !!skill)
        .map((skill) => <Action>skill!);

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
            const encodedValue = [actionType, item.id ?? item._id].join(this.delimiter);
            const icon1 = this.#getIcon1(<CofItem & { actionIcon: string }>item /*, actionType*/);
            const icon2 = this.#getCarryTypeIcon(item);
            const img = coreModule.api.Utils.getImage(item);
            const info1 = this.#getItemInfo(item);
            ////const tooltipData = null; ////await this.#getTooltipData(actionType, itemData);
            const tooltip: string | null = null; ////await this.#getTooltip(actionType, tooltipData);
            return {
              id,
              name,
              encodedValue,
              cssClass,
              img,
              icon1,
              icon2,
              info1,
              listName,
              tooltip,
            };
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
      const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? '';

      const actions = await Promise.all(
        Object.entries(attacks).map(([key, attack]) => {
          const id = `${groupId}-${actionType}-${key}`;
          const name = this.#getActionName(<{ name?: string; label?: string }>attack);
          const listName = `${actionTypeName}${name}`;
          const cssClass = this.#getActionCss(attack);
          const encodedValue = [actionType, key].join(this.delimiter);
          const icon1 = ''; ////this.#getIcon1(attack /*, actionType*/);
          const icon2 = ''; ////this.#getCarryTypeIcon(attack);
          const img = coreModule.api.Utils.getImage(attack);
          const info1 = this.#getItemInfo(attack);
          ////const tooltipData = null; ////await this.#getTooltipData(actionType, attack);
          const tooltip: string | null = null; ////await this.#getTooltip(actionType, tooltipData);
          return <Action>{
            id,
            name,
            encodedValue,
            cssClass,
            img,
            icon1,
            icon2,
            info1,
            listName,
            tooltip,
          };
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
            const encodedValue = [actionType, id].join(this.delimiter);
            const icon1 = ''; ////this.#getIcon1(itemData /*, actionType*/);
            const icon2 = this.#getCarryTypeIcon(itemData);
            const img = coreModule.api.Utils.getImage(itemData);
            const info1 = this.#getItemInfo(itemData);
            ////const tooltipData = null; ////await this.#getTooltipData(actionType, itemData);
            const tooltip: string | null = null; ////await this.#getTooltip(actionType, tooltipData);
            return <Action>{
              id,
              name,
              encodedValue,
              cssClass,
              img,
              icon1,
              icon2,
              info1,
              listName,
              tooltip,
            };
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
        const actionTypeName = `${coreModule.api.Utils.i18n('COF.category.item')}: ` ?? '';

        // Get actions
        const actions = await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          [...items].map(async ([_, itemData]) => {
            const id = this.#getActionId(itemData);
            const name = this.#getActionName(itemData);
            const listName = `${actionTypeName}${name}`;
            const cssClass = this.#getActionCss(itemData);
            const encodedValue = [actionType, itemData.id ?? itemData._id].join(this.delimiter);
            const img = coreModule.api.Utils.getImage(itemData);
            const icon1 = this.#getIcon1(<CofItem & { actionIcon: string }>itemData /*, actionType*/);
            const icon2 = this.#getCarryTypeIcon(itemData);
            const info1 = this.#getItemInfo(itemData, true);
            ////const tooltipData = null; ////await this.#getTooltipData(actionType, itemData);
            const tooltip: string | null = null; ////await this.#getTooltip(actionType, tooltipData);
            return {
              id,
              name,
              encodedValue,
              cssClass,
              img,
              icon1,
              icon2,
              info1,
              listName,
              tooltip,
            };
          }),
        );

        // Add actions to action list
        this.addActions(actions, groupData);
      }
    }

    async #buildToken() {
      const groupId = 'combat';
      const actionType = 'utility';

      const combatTypes: { initiative: { id: string; name: string }; endTurn?: { id: string; name: string } } = {
        initiative: { id: 'initiative', name: coreModule.api.Utils.i18n('tokenActionHud.cof.rollInitiative') },
        endTurn: { id: 'endTurn', name: coreModule.api.Utils.i18n('tokenActionHud.endTurn') },
      };

      // Delete endTurn for multiple tokens
      if (game.combat?.current?.tokenId !== this.token?.id) {
        delete combatTypes.endTurn;
      }

      const actions = Object.entries(combatTypes).map((combatType) => {
        const id = `${groupId}-${actionType}-${combatType[1].id}`;
        const name = combatType[1].name;
        const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? '';
        const listName = `${actionTypeName}${name}`;
        const encodedValue = [actionType, combatType[1].id].join(this.delimiter);
        const info1: { class?: string; text?: number | null } = {};
        let cssClass = '';
        if (combatType[0] === 'initiative' && game.combat) {
          const tokens = <CofToken[]>coreModule.api.Utils.getControlledTokens();
          const tokenIds = tokens?.map((token) => token.id);
          const combatants = (<CofCombatant[]>game.combat.combatants).filter((combatant: CofCombatant) =>
            tokenIds.includes(<string>combatant.tokenId),
          );

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
          encodedValue,
          info1,
          cssClass,
          listName,
        };
      });

      const groupData = { id: 'combat', type: 'system' };
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
            const encodedValue = [actionType, effect._id].join(this.delimiter);
            const active = effect.disabled ? '' : ' active';
            const cssClass = `toggle${active}`;
            const img = coreModule.api.Utils.getImage(effect);
            const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? '';
            const listName = `${actionTypeName}${name}`;

            return {
              id,
              name,
              encodedValue,
              cssClass,
              img,
              listName,
            };
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
      const name = this.#getActionName(<{ name?: string; label?: string }>entity);
      const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? '';
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

    #getIcon1(entity: CofItem & { actionIcon: string } /*, actionType: string*/) {
      const { actions, actionType } = entity.system;
      const actionTypes = ['free', 'reaction', 'passive'];
      const actionTypeValue = actionType?.value;
      const actionsCost = actions ? parseInt((actions || {}).value, 10) : null;
      ////const timeValue = entity.system?.time?.value;
      const actionIcon = entity.actionIcon;
      const iconType = actionTypes.includes(actionTypeValue) ? actionTypeValue : actionsCost ?? actionIcon;
      return this.#getActionIcon(String(iconType));
    }

    #getCarryTypeIcon(item?: CofItem) {
      const worn = item?.system.worn;
      if (worn) {
        return '<i class="fas fa-shield-alt"></i>';
      }
    }

    #getItemInfo(item: CofItem | { mod: number }, useQuantity: boolean = false) {
      if (useQuantity && 'system' in item && item.system?.qty) {
        const quantity = item.system.qty || item.system.qty > 1 ? `(${item.system.qty})` : '';
        return { text: quantity };
      }

      if ('system' in item && 'skill' in item.system && 'skillBonus' in item.system && item.system.skill) {
        let skillName = <string>item.system.skill;
        skillName = skillName.split('@')[1];
        if (!skillName) return;
        const skillMod0 = this.#getValue<number>(item.actor.system, skillName) ?? 0;
        const skillMod1 = Number(item.system.skillBonus) ?? 0;
        const skillMod = skillMod0 + skillMod1;
        const text = skillMod < 0 ? skillMod : '+' + skillMod;
        return { text };
      }

      // encounter attack/weapon or skill
      if ('mod' in item) {
        const text = item.mod < 0 ? item.mod : '+' + item.mod;
        return { text };
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

      return <T>instance;
    }

    #getActionIcon(action: string) {
      return ACTION_ICON[action];
    }
  };
}
