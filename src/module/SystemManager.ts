import * as systemSettings from './settings';

export function initSystemManager(
  coreModule: TokenActionHudCoreModule,
  actionHandlerType: typeof ActionHandler<CofActor, CofToken>,
  rollHandlerType: typeof RollHandler<CofActor, CofToken>,
  utilsType: typeof Utils,
  DEFAULTS: unknown,
) {
  return class CofSystemManager extends coreModule.api.SystemManager<CofActor, CofToken> {
    override getActionHandler(): ActionHandler<CofActor, CofToken> {
      const actionHandler = new actionHandlerType();
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
          const rollHandler = new rollHandlerType();
          return rollHandler;
      }
    }

    // eslint-disable-next-line no-unused-vars
    override registerSettings(onChangeFunction: (value?: string) => void) {
      systemSettings.register(onChangeFunction);
    }

    override async registerDefaults() {
      const defaults = DEFAULTS;
      return defaults;
    }
  };
}
