import { MODULES, REQUIRED_CORE_MODULE_VERSION } from '../constants';
import { initActionHandler } from '../ActionHandler';
import { initRollHandler } from '../RollHandler';
import { initSystemManager } from '../SystemManager';
import { initUtils } from '../Utils';
import { initDefaults } from '../defaults';

export const TokenActionHudCoreApiReady = {
  listen: function () {
    let SystemManagerType: typeof SystemManager;

    Hooks.once('tokenActionHudCoreApiReady', (coreModule: TokenActionHudCoreModule): void => {
      console.debug('COF-TAH Debug | TokenActionHUDCore | Initialize types.');
      const UtilsType = initUtils(coreModule);
      const ActionHandlerType = initActionHandler(coreModule, UtilsType);
      const RollHandlerType = initRollHandler(coreModule);
      const DEFAULTS = initDefaults(coreModule);
      SystemManagerType = initSystemManager(
        coreModule,
        ActionHandlerType as typeof ActionHandler,
        RollHandlerType as typeof RollHandler,
        DEFAULTS,
      ) as typeof SystemManager;
    });

    Hooks.once('tokenActionHudCoreApiReady', async (): Promise<void> => {
      console.debug('COF-TAH Debug | TokenActionHUDCore | Initialize module.');
      const module = game.modules.get(MODULES.TokenActionHUD.COF.ID) as TokenActionHudModule;
      module.api = {
        requiredCoreModuleVersion: REQUIRED_CORE_MODULE_VERSION,
        SystemManager: SystemManagerType,
      };

      Hooks.call('tokenActionHudSystemReady', module);
    });

    Hooks.once('tokenActionHudSystemReady', (): void => {
      console.debug('COF-TAH Debug | TokenActionHUDCore | Ready.');
    });
  },
};
