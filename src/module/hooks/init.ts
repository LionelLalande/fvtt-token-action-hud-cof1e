export const Init = {
  listen: function () {
    Hooks.once('init', () => {
      console.debug('COF-TAH Debug | Initializing COF-TAH module...');
    });
  },
};
