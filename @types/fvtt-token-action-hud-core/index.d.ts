import { PackageCompatibilitySchema } from "../foundry/common/packages/base-package";
import { AnyActor } from "../foundry/client/documents/token-document";

export {};
declare global {
  interface Module {
    id: string;
    readonly active: boolean;
    esmodules: Set<string>;
    scripts: Set<string>;
    flags: Record<string, Record<string, unknown>>;
    title: string;
    compatibility: ModelPropsFromSchema<PackageCompatibilitySchema>;
  }

  interface TokenActionHudModule extends Module {
    api: TokenActionHudModule.Api;
  }

  namespace TokenActionHudModule {
    interface Api {
      requiredCoreModuleVersion: string;
      SystemManager: { new(): SystemManager; };
    }
  }

  interface TokenActionHudCoreModule extends Module {
    api: TokenActionHudCoreModule.Api;
  }

  namespace TokenActionHudCoreModule {
    interface Api {
      actor: AnyActor;
      requiredCoreModuleVersion: string;
      ActionHandler: typeof ActionHandler;
      ActionHandlerExtender: typeof ActionHandlerExtender;
      ActionListExtender: typeof ActionHandlerExtender;
      DataHandler: typeof DataHandler;
      Logger: typeof Logger;
      PreRollHandler: typeof PreRollHandler;
      RollHandler: typeof RollHandler;
      SystemManager: typeof SystemManager;
      Timer: typeof Timer;
      Utils: typeof Utils;
    }
  }

  interface Action {
    id: string;
    name: string;
    encodedValue: string;
    icon1?: string;
    info1?: string | { class?: string; text?: number | string | null };
    info2?: string | {};
    listName: string;
    cssClass?: string;
  }

  class ActionHandler<TActor extends Actor<TokenDocument> = Actor<TokenDocument>, TToken = unknown> {
    actor: TActor;
    token: TToken;

    delimiter: string;

    addActions(actions: Action[], groupData: string | { id: string; type: string; });
    buildSystemActions(groupIds: string[]): void | Promise<void>;
  }

  class ActionHandlerExtender {}

  class DataHandler {}

  class Logger {
    static debug(message: string): void;
    static error(message: string | object): void;
  }

  class PreRollHandler {}

  class RollHandler<TActor extends Actor<TokenDocument> = Actor<TokenDocument>, TToken = unknown> {
    actor: TActor;
    token: TToken;
    handleActionClick(event: MouseEvent, encodedValue:string): Promise<void> | void;
  }

  class SystemManager<TActor extends Actor<TokenDocument> = Actor<TokenDocument>, TToken = unknown>{
    getActionHandler(): ActionHandler<TActor, TToken>;
    getAvailableRollHandlers(): { core: string };
    getRollHandler(rollHandlerId: string): RollHandler<CofActor, CofToken>;
    registerSettings(onChangeFunction: (value?: string) => void): void;
    registerDefaults(): void;
  }

  class Timer {}

  class Utils {
    static i18n(key: string): string;
    static getSetting(key: string , defaultValue?: unknown);
    static setSetting(key: string, value: unknown): void | Promise<void>;
    static isModuleActive(moduleID: string): boolean;
    static getModuleTitle(moduleID: string): string;
    static getControlledTokens(): unknown[];
    static getImage(itemData: any);
    static sortItemsByName<TCollection>(items: TCollection): TCollection;
  }

  class Hooks {
  }
}
