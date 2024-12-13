export function initRollHandler(coreModule: TokenActionHudCoreModule) {
  return class RollHandler extends coreModule.api.RollHandler<CofActor, CofToken> {
    /**
     * Handle action click
     * @override
     * @param event
     * @param encodedValue
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    override async handleActionClick(_event: MouseEvent, _encodedValue: string) {
      const { actionType, actionId } = this.action.system;
      if (!this.actor) {
        for (const token of this.tokens /*<CofToken[]>coreModule.api.Utils.getControlledTokens()*/) {
          const actor = token.actor;
          await this.#handleAction(actor, token, actionType, actionId);
        }
      } else {
        await this.#handleAction(this.actor, this.token, actionType, actionId);
      }
    }

    /**
     * Handle action
     * @private
     * @param actor
     * @param token
     * @param actionType
     * @param actionId
     */
    async #handleAction(actor: CofActor, _token: CofToken, actionType: string, actionId: string) {
      console.debug('COF-TAH Debug | handle action', actionType, actionId);
      const itemOrEffect = actor.items.get(actionId) as CofItem || actor.effects.get(actionId) as ActiveEffect<CofActor>;
      const action = this.#getAction(actionId, actionType, itemOrEffect);
      if (action)
        await action();
    }

    /** Execute primary action (left-click) */
    async #executePrimary(actionType: string, actionId: string, item?: CofItem) {
      switch (actionType) {
        case 'rollStat':
        case 'rollCombatSkill':
          return await this.actor.rollStat(actionId);

        case 'rollAttackMelee':
        case 'rollAttackRanged':
          return await this.actor.rollWeapon(item!);

        case 'rollAttack': // encounters/monsters
          return await this.actor.rollWeapon(/*weaponId:*/ Number(actionId));

        case 'rollAttackSpell':
        case 'rollCapacity':
          return await this.actor.activateCapacity(item!);

        case 'rollAttackShield':
          item!.applyEffects(this.actor, { /*dice: 'd12'*/ }); // cannot change dice to roll!
          break;

        case 'useItem':
          const equipable = item?.system.properties.equipable;
          if (equipable) {
            return this.actor.toggleEquipItem(item, false);
          }

          const limitedUsage = item?.system.limitedUsage;
          if (limitedUsage) {
            item.modifyUse(1, true);
          }

          const consumable = item?.system.properties.consumable;
          if (consumable) {
            this.actor.consumeItem(item);
          }

          const stackable = item?.system.properties.stackable;
          if (stackable) {
            item.modifyQuantity(1, true);
          }
          break;

        case 'toggleEffect':
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

    /** Execute alternate primary action (shift + left-click) */
    async #executePrimaryAlt(actionType: string, actionId: string, item?: CofItem) {
      switch (actionType) {
        case 'rollStat':
        case 'rollCombatSkill':
          const { actor } = this;
          const stat = eval(`actor.system.stats.${actionId}`) ?? eval(`actor.system.attacks.${actionId}`);
          const { superior } = stat;
          const dice = superior ? (actor.isWeakened() ? '2d12kh' : '2d20kh') : actor.isWeakened() ? '1d12' : '1d20';
          return await actor.rollStat(actionId, { dice, dialog: false });

        case 'rollAttackMelee':
        case 'rollAttackRanged':
          return await this.actor.rollWeapon(item!, { dialog: false });

        case 'rollAttackSpell':
          return await this.actor.activateCapacity(item!, { dialog: false }); // dialog is even shown!

        case 'rollAttackShield':
          item!.applyEffects(this.actor, { dialog: false, /*dice: 'd12'*/ }); // dialog is even shown! cannot change dice to roll!
          break;

        case 'rollAttack': // encounters/monsters
          return await this.actor.rollWeapon(
            /*weaponId:*/ Number(actionId),
            /*customLabel:*/ undefined,
            /*dmgOnly:*/ undefined,
            /*bonus:*/ undefined,
            /*malus: */ undefined,
            /*dmgMalus:*/ undefined,
            /*skillDesc:*/ undefined,
            /*dmgDescr:*/ undefined,
            /*dialog:*/ false,
          );

        case 'useItem':
          const equipable = item?.system.properties.equipable;
          if (equipable) {
            return this.actor.toggleEquipItem(item, true);
          }
      }
    }

    /** Execute secondary action (right-click) */
    async #sendItemToChat(item: CofItem) {
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

    /** Execute alternate secondary action (ctrl + right-click) */
    async #executeSecondary(actionType: string, item: CofItem) {
      const options = { dmgOnly: true };
      switch (actionType) {
        case 'rollAttackMelee':
        case 'rollAttackRanged':
          return await this.actor.rollWeapon(item, options);

        case 'rollAttackSpell':
          return await this.actor.activateCapacity(item!, options); // even roll attack!

        case 'rollAttackShield':
          return item!.applyEffects(this.actor, { ...options, /*dice: 'd12'*/ }); // cannot change dice to roll!
      }
    }

    /** Execute alternate secondary attack action (ctrl + right-click) */
    async #executeSecondaryForEncounter(actionId: string) {
      // encounters/monsters
      return this.actor.rollWeapon(
        /*weaponId:*/ Number(actionId),
        /*customLabel:*/ undefined,
        /*dmgOnly:*/ true,
        /*bonus:*/ undefined,
        /*malus: */ undefined,
        /*dmgMalus:*/ undefined,
        /*skillDesc:*/ undefined,
        /*dmgDescr:*/ undefined,
        /*dialog:*/ undefined,
      );
    }

    /** Execute ternary action (ctrl + left-click) */
    async #openItemSheet(item: CofItem) {
      item.sheet.render(true);
    }

    /** Execute ternary action (ctrl + left-click) */
    async #openEffectSheet(effect: ActiveEffect<CofActor>) {
      effect.sheet.render(true);
    }

    /** Execute alternate attack action (shift + right-click) */
    #executeDmgOnly(actionType: string, item: CofItem) {
      const options = { dmgOnly: true, dialog: false }
      switch (actionType) {
        case 'rollAttackMelee':
        case 'rollAttackRanged':
          return this.actor.rollWeapon(item, options);

        case 'rollAttackSpell':
          return this.actor.activateCapacity(item!, options); // dialog is even shown!

        case 'rollAttackShield':
          return item!.applyEffects(this.actor, { ...options, /*dice: 'd12'*/ }); // cannot change dice to roll! dialog is even shown!
      }
    }

    /** Execute alternate attack action (shift + right-click) */
    #executeDmgOnlyForEncounter(actionId: number) {
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

    #getAction(actionId: string, actionType: string, item?: CofItem) {
      switch ([this.isRightClick, this.isShift, this.isCtrl].join(',')) {
        // left-click (execute primary action or macro if any)
        case 'false,false,false':
          if (item) {
            const hasHasMacroFunc = typeof item['hasMacro'] === 'function';
            const hasExecuteMacroFunc = typeof item['executeMacro'] === 'function';
            if (hasHasMacroFunc && hasExecuteMacroFunc && item.hasMacro()) {
              // execute macro before "normal" execution...
              return async () => item.executeMacro(this.actor);
            }
          }
          return () => this.#executePrimary(actionType, actionId, item);

        // shift + left-click (execute aternative primary action)
        case 'false,true,false':
          return () => this.#executePrimaryAlt(actionType, actionId, item);

        // ctrl + left-click (execute ternary action: open sheet)
        case 'false,false,true':
          if (item) return () => this.#openItemSheet(item);
          const effect = this.actor.effects.get(actionId);
          if (effect) return () => this.#openEffectSheet(effect);
          break;

        // right-click (execute secondary action: send to chat)
        case 'true,false,false':
          if (item) return () => this.#sendItemToChat(item);
          break;

        // shift + right-click (execute aternative secondary action; attack ONLY; damages ONLY;)
        case 'true,true,false':
          switch (actionType) {
            case 'rollAttackMelee':
            case 'rollAttackRanged':
            case 'rollAttackSpell':
            case 'rollAttackShield':
              if (item) return () => this.#executeDmgOnly(actionType, item);
              break;

            case 'rollAttack':
              return () => this.#executeDmgOnlyForEncounter(Number(actionId));
          }
          break;

        // ctrl + right-click (execute alternative ternary action)
        case 'true,false,true':
          if (item) return () => this.#executeSecondary(actionType, item);
          if (actionType === 'rollAttack') return () => this.#executeSecondaryForEncounter(actionId);
          break;
      }
    }
  };
}
