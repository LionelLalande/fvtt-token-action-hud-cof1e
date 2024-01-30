/// <reference Path="../foundry/index.d.ts" />
import { AnyActor } from "@types/foundry/client/documents/token-document";
import { ActorSchema } from "../foundry/common/documents/actor";
import { ItemSchema } from "../foundry/common/documents/item";

export {}
declare global {

  export interface CofRoll {
    static rollAttackCapacity(
      actor: CofActor,
      capacity: unknown,
      options?: {
        bonus?: number;
        malus?: number;
        dmgBonus?: number;
        dmgOnly?: boolean;
        customLabel?: string;
        skillDescr?: string;
        dmgDescr?: string;
        dialog?: boolean;
      },
    ): Promise<void> | void;
  }

  export interface CofScene extends Scene {
  }

  export interface CofTokenDocument<TParent extends CofScene = CofScene> extends TokenDocument<TParent> {
    get actor(): CofActor<this | null> | null;
    get combatant(): CofCombatant<CofCombat, this> | null;
    get object(): CofToken<this> | null;
    ////get sheet(): CofTokenConfig<this>;
  }

  export interface CofActor<TParent extends CofTokenDocument = CofTokenDocument> extends Actor<TParent> {
    readonly _source: CofActorSource;
    readonly items: foundry.abstract.EmbeddedCollection<CofItem<this>>;
    system: CofActorSystemSource;

    get token(): TParent;

    activateCapacity(capacity: CofItem, options?: { bonus?: number; malus?: number; dialog?: boolean } ): Promise<void>;
    consumeItem(item: CofItem): CofItem;
    getMalusFromArmor(): number;
    getOverloadedMalusTotal(): number;
    rollStat(stat: string, options?: { bonus?: number; malus?: number, dialog?: boolean } ): Promise<void>;
    rollWeapon(item: CofItem, options?: { bonus?: number; malus?: number; dmgOnly?: boolean; dialog?: boolean } ): Promise<void>;
    // for monsters/encounters
    rollWeapon(
      weaponId: number,
      customLabel?: string,
      dmgOnly?: boolean,
      bonus?: number,
      malus?: number,
      dmgBonus?: number,
      skillDescr?: string,
      dmgDescr?: string,
      dialog?: boolean,
    ): Promise<void>;
    toggleEquipItem(item: CofItem, bypassChecks: boolean): Promise<void>;
  }

  export interface CofItem extends Item<CofActor> {
    readonly _source: CofItemSource;
    system: CofItemSystemSource;

    applyEffects(actor: CofActor, options?: { bonus?: number; malus?: number; dialog?: boolean }): Promise<void>;
    modifyQuantity(increment: number, isDecrese: boolean);
    modifyUse(increment: number, isDecrese: boolean);

    // Item Macro
    hasMacro(): boolean;
    executeMacro(...args: any): Promise<void>;
  }

  export interface CofToken<TDocument extends CofTokenDocument = CofTokenDocument> extends Token<TDocument> {
    get id(): string;
    get actor(): CofActor;
  }

  export interface CofCombat extends Combat {
    readonly combatants: foundry.abstract.EmbeddedCollection<CofCombatant>;
    get combatant(): CollectionValue<this["combatants"]> | undefined;
  }

  export interface CofCombatant extends Combatant<CofCombat> {}

  export interface CofEncounterWeapon {
    critrange: string;
    dmg: string;
    mod: number;
    name: string;
  }

  export type CofActorSource = {
    system: CofActorSystemSource
  } & SourceFromSchema<ActorSchema<string, object, SourceFromSchema<ItemSchema<string, object>>>>;

  export type CofActorSystemSource = {
    stats: {
      str: { value: number; mod: number };
      dex: { value: number; mod: number };
      con: { value: number; mod: number };
      int: { value: number; mod: number };
      cha: { value: number; mod: number };
      wis: { value: number; mod: number };
      [key: string]: { value: number; mod: number };
    };
    attacks: {
      magic: { mod: number };
      melee: { mod: number };
      ranged: { mod: number };
      [key: string]: { mod: number };
    };
    defense: {};
    init: {};
    weapons: CofEncounterWeapon[];
  };

  export type CofItemSource = {
    system : CofItemSystemSource
  };

  export type CofItemSystemSource = {
    activable: boolean;
    actionType: { value: string; };
    actions: { value: string; };
    description: string;
    subtype: string;
    mod: number;
    qty: number;
    worn: boolean;
    properties: {
      equipable: boolean;
      consumable: boolean;
      ranged: boolean;
      activable: boolean;
      stackable: boolean;
      limitedUsage:{
        maxUse:number;
        use: number;
      }
    };
    limited: boolean;
    limitedUsage: boolean;
    spell: boolean;
    save: boolean;
  };

  export const CofRoll: CofRoll;
}
