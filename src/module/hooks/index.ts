import { Init } from './init';
import { Load } from './load';
import { Ready } from './ready';
import { Setup } from './setup';
import { TokenActionHudCoreApiReady } from './token-action-hud-core';

export const Hooks = {
  listen: function () {
    const listeners = [
      Load,
      Init,
      Setup,
      Ready,
      // Add any additional hooks if necessary
      TokenActionHudCoreApiReady,
    ];
    for (const listener of listeners) {
      listener.listen();
    }
  },
};
