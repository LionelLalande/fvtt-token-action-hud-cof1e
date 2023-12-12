export const Setup = {
  listen: function () {
    Hooks.once('setup', () => {
      // Do anything after initialization but before ready
    });
  },
};
