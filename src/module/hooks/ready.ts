export const Ready = {
  listen: function () {
    Hooks.once('ready', () => {
      // Do anything after ready
    });
  },
};
