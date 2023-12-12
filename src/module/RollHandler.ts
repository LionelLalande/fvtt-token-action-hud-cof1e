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
      console.debug('COF-TAH Debug |  handle action', actionType, actionId);

      const item: CofItem = actor.items.find((item) => item._id == actionId)!;
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
          await actor.rollStat(<string>actionId);
          break;

        case 'skill':
          // TODO add bonus for attributes skills (but not for combat skill)
          await actor.rollStat(<string>actionId);
          break;

        case 'melee':
        case 'ranged':
          await actor.rollWeapon(item, { dialog: true });
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
          await item.applyEffects(actor);
          break;

        case 'attack':
          await actor.rollWeapon(<number>actionId);
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