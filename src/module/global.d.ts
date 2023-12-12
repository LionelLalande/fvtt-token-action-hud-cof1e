export {};
declare global {
  const ui: FoundryUI;
  const canvas: Canvas;

  interface Game {
    cof: {
      config: {
        stats: {
          str: string;
          dex: string;
          con: string;
          int: string;
          cha: string;
          wis: string;
          [key: string]: string;
        };
        skills: {
          magic: string;
          melee: string;
          ranged: string;
          [key: string]: string;
        };
      };
      macros: unknown;
      skin: string;
    };
  }

  const game: Game<CofActor, Actors, ChatMessage, CofCombat, CofItem>;
}
