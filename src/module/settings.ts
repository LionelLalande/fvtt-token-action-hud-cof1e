import { MODULES } from './constants';

export function register(updateFunc: (value?: string) => void) {
  game.settings.register(MODULES.TokenActionHUD.COF.ID, 'abbreviateSkills', {
    name: game.i18n.localize('tokenActionHud.cof.Settings.AbbreviateSkills.Name'),
    hint: game.i18n.localize('tokenActionHud.cof.Settings.AbbreviateSkills.Hint'),
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
    onChange: (value?: string) => {
      updateFunc(value);
    },
  });
}
