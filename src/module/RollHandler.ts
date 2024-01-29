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
      token: CofToken,
      actionId: string | number,
    ) {
      console.debug('COF-TAH Debug | handle action', actionType, actionId);

      const item: CofItem = actor.items.get(<string>actionId)!;
      const isShiftPressed = event.shiftKey;
      const isCtrlPressed = event.ctrlKey;
      const isRightClick = event.button === 2;

      const hasExtendedActions = ['melee', 'ranged', 'shield', 'item', 'capacity'].includes(actionType);
      if (hasExtendedActions || isCtrlPressed || isRightClick) {
        const hasHasMacroFunc = typeof item['hasMacro'] === 'function';
        const hasExecuteMacroFunc = typeof item['executeMacro'] === 'function';
        if (hasHasMacroFunc && hasExecuteMacroFunc && item.hasMacro()) {
          await item.executeMacro(actor);
          return;
        } else if (isCtrlPressed) {
          await this.#showItem(item);
          return;
        } else if (isRightClick) {
          await this.#sendToChatItem(item);
          return;
        }
      }

      switch (actionType) {
        case 'stat':
        case 'stats':
        case 'skill':
          await actor.rollStat(<string>actionId, { dialog: !isShiftPressed });
          break;

        case 'melee':
        case 'ranged':
          await actor.rollWeapon(item, { dialog: !isShiftPressed });
          break;

        case 'item':
          const equipable = item.system.properties.equipable;
          const consumable = item.system.properties.consumable;
          if (consumable) {
            actor.consumeItem(item);
          } else if (equipable) {
            actor.toggleEquipItem(item, game.user.isGM && isShiftPressed);
          }
          break;

        case 'capacity':
          actor.activateCapacity(item);
          break;

        case 'attack':
          // for monsters/encounters
          await actor.rollWeapon(
            /*weaponId:*/ <number>actionId,
            /*customLabel:*/ undefined,
            /*dmgOnly:*/ undefined,
            /*bonus:*/ undefined,
            /*malus: */ undefined,
            /*dmgMalus:*/ undefined,
            /*skillDesc:*/ undefined,
            /*dmgDescr:*/ undefined,
            /*dialog:*/ !isShiftPressed,
          );
          break;

        case 'effect':
        case 'effects':
          const effect = actor.effects?.get(<string>actionId);
          if (!effect) return;

          const updates = actor.effects?.map((effect) => {
            return { _id: effect.id, disabled: !effect.disabled };
          });
          await actor.updateEmbeddedDocuments('ActiveEffect', [...updates]);
          Hooks.callAll('forceUpdateTokenActionHud');
          break;

        case 'combat':
          if (token?.inCombat) {
            const { combat } = game;
            switch (actionId) {
              case 'initiative':
                const combatant = combat.getCombatantByToken(token.id);
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

    async #showItem(item: CofItem) {
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
  };
}
