import * as systemSettings from './settings';

export function initSystemManager(
  coreModule: TokenActionHudCoreModule,
  ActionHandlerType: typeof ActionHandler<CofActor, CofToken>,
  RollHandlerType: typeof RollHandler<CofActor, CofToken>,
  DEFAULTS: unknown,
): typeof SystemManager<CofActor, CofToken> {
  return class CofSystemManager extends coreModule.api.SystemManager<CofActor, CofToken> {
    override getActionHandler(): ActionHandler<CofActor, CofToken> {
      const actionHandler = new ActionHandlerType();
      return actionHandler;
    }

    override getAvailableRollHandlers(): { core: string } {
      const coreTitle = 'COF';
      const choices = { core: coreTitle };
      return choices;
    }

    override getRollHandler(rollHandlerId: string): RollHandler<CofActor, CofToken> {
      switch (rollHandlerId) {
        case 'core':
        default:
          return new RollHandlerType();
      }
    }

    override registerSettings(onChangeFunction: (value?: string) => void) {
      systemSettings.register(onChangeFunction);
    }

    override async registerDefaults(): Promise<unknown> {
      const defaults = DEFAULTS;
      return defaults;
    }
  };
}
