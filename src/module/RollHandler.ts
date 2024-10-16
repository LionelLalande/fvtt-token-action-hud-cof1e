export function initRollHandler(coreModule: TokenActionHudCoreModule) {
  return class RollHandler extends coreModule.api.RollHandler<CofActor, CofToken> {
    /**
     * Handle action click
     * @override
     * @param event
     * @param encodedValue
     */
    override async handleActionClick(event: MouseEvent, encodedValue: string) {
      const [actionType, actionId] = encodedValue.split('|');
      if (!this.actor) {
        for (const token of <CofToken[]>coreModule.api.Utils.getControlledTokens()) {
          const actor = token.actor!;
          await this.#handleAction(event, actionType, actor, token, actionId);
        }
      } else {
        await this.#handleAction(event, actionType, <CofActor>(<unknown>this.actor), <CofToken>this.token, actionId);
      }
    }

    /**
     * Handle action
     * @private
     * @param event
     * @param actionType
     * @param actor
     * @param token
     * @param actionId
     */
    async #handleAction(
      event: MouseEvent,
      actionType: string,
      actor: CofActor,
      _token: CofToken,
      actionId: string | number,
    ) {
      console.debug('COF-TAH Debug | handle action', actionType, actionId);

      const item: CofItem = actor.items.get(<string>actionId)!;
      const action = this.#getAction(event, actionType);
      switch (action) {
        case 'standard':
          if (item) {
            const hasHasMacroFunc = typeof item['hasMacro'] === 'function';
            const hasExecuteMacroFunc = typeof item['executeMacro'] === 'function';
            if (hasHasMacroFunc && hasExecuteMacroFunc && item.hasMacro()) {
              // execute macro before "normal" execution...
              await item.executeMacro(actor);
            }
          }
          return await this.#execute(actionType, actionId, item);
        case 'alternate':
          return await this.#executeAlt(actionType, actionId, item);
        case 'alternate2':
          return await this.#executeAlt2(actionType, actionId, item);
        case 'dmgOnly':
          if (actionType === 'attack') {
            return await this.#executeDmgOnlyForMonster(<number>actionId);
          }
          return await this.executeDmgOnly(item);
        case 'openSheet':
          return await this.#openItemSheet(item);
        case 'sendToChat':
          return await this.#sendToChatItem(item);
      }
    }

    async #execute(actionType: string, actionId: number | string, item: CofItem) {
      switch (actionType) {
        case 'stat':
        case 'stats':
        case 'skill':
          return await this.actor.rollStat(<string>actionId);

        case 'melee':
        case 'ranged':
          return await this.actor.rollWeapon(item);

        case 'attack': // encounters/monsters
          return await this.actor.rollWeapon(/*weaponId:*/ <number>actionId);

        case 'capacity':
          return await this.actor.activateCapacity(item);

        case 'item':
          const equipable = item.system.properties.equipable;
          if (equipable) {
            return this.actor.toggleEquipItem(item, false);
          }

          const consumable = item.system.properties.consumable;
          if (consumable) {
            return this.actor.consumeItem(item);
          }

          const stackable = item.system.properties.stackable;
          if (stackable) {
            return item.modifyQuantity(1, true);
          }
          break;

        case 'effect':
        case 'effects':
          const updates = this.actor.effects
            ?.filter((effect) => {
              return effect.id === actionId;
            })
            .map((effect) => {
              return { _id: effect.id, disabled: !effect.disabled };
            });
          if (!updates) return;
          await this.actor.updateEmbeddedDocuments('ActiveEffect', [...updates]);
          Hooks.callAll('forceUpdateTokenActionHud');
          break;

        case 'combat':
          if (this.token?.inCombat) {
            const { combat } = game;
            switch (actionId) {
              case 'initiative':
                const combatant = combat.getCombatantByToken(this.token.id);
                await combat.rollInitiative(combatant.id);
                break;

              case 'endTurn':
                await combat.nextTurn();
                break;
            }

            Hooks.callAll('forceUpdateTokenActionHud');
          }
          break;
      }
    }

    async #executeAlt(actionType: string, actionId: number | string, item: CofItem) {
      switch (actionType) {
        case 'stat':
        case 'stats':
        case 'skill':
          return await this.actor.rollStat(<string>actionId, { dialog: false });

        case 'melee':
        case 'ranged':
          return await this.actor.rollWeapon(item, { dialog: false });

        case 'attack': // encounters/monsters
          return await this.actor.rollWeapon(
            /*weaponId:*/ <number>actionId,
            /*customLabel:*/ undefined,
            /*dmgOnly:*/ undefined,
            /*bonus:*/ undefined,
            /*malus: */ undefined,
            /*dmgMalus:*/ undefined,
            /*skillDesc:*/ undefined,
            /*dmgDescr:*/ undefined,
            /*dialog:*/ false,
          );

        case 'item':
          const equipable = item.system.properties.equipable;
          if (equipable) {
            return this.actor.toggleEquipItem(item, true);
          }
      }
    }

    async #executeAlt2(actionType: string, _actionId: number | string, item: CofItem) {
      switch (actionType) {
        case 'melee':
        case 'ranged':
          return await this.actor.rollWeapon(item, { dmgOnly: true });
      }
    }

    executeDmgOnly(item: CofItem) {
      return this.actor.rollWeapon(item, { dmgOnly: true, dialog: false });
    }

    #executeDmgOnlyForMonster(actionId: number) {
      return this.actor.rollWeapon(
        /*weaponId:*/ actionId,
        /*customLabel:*/ undefined,
        /*dmgOnly:*/ true,
        /*bonus:*/ undefined,
        /*malus:*/ undefined,
        /*dmgBonus:*/ undefined,
        /*skillDescr:*/ undefined,
        /*dmgDescr:*/ undefined,
        /*dialog:*/ false,
      );
    }

    async #openItemSheet(item: CofItem) {
      item.sheet.render(true);
    }

    async #sendToChatItem(item: CofItem) {
      let description = item.system.description;
      if (description.startsWith('<h1>Description</h1>')) {
        description = description.substr(20);
      }

      const templateData = {
        itemName: item.name,
        itemUuid: item.uuid,
        description: description,
        limited: item.system.limited,
        spell: item.system.spell,
        ranged: item.system.properties.ranged,
        limitedUsage: item.system.limitedUsage,
        save: item.system.save,
        activable: item.system.properties.activable,
      };

      const html = await renderTemplate('systems/cof/templates/chat/item-card.hbs', templateData);
      const chatData = {
        speaker: ChatMessage.getSpeaker(),
        content: html,
      };

      ChatMessage.create(chatData, {});
    }

    #getAction(event: MouseEvent, actionType: string) {
      const leftBtn = event.button === 0;
      const rightBtn = event.button === 2;
      const shift = event.shiftKey;
      const ctrl = event.ctrlKey;

      switch ([leftBtn, rightBtn, shift, ctrl].join(',')) {
        case 'true,false,false,false':
          return 'standard';
        case 'true,false,true,false':
          return 'alternate';
        case 'false,true,false,true':
          return 'alternate2';
        case 'true,false,false,true':
          return 'openSheet';
        case 'false,true,false,false':
          return 'sendToChat';
        case 'false,true,true,false':
          switch (actionType) {
            case 'melee':
            case 'ranged':
            case 'attack':
              return 'dmgOnly';
          }
      }
    }
  };
}
