declare module "lunar-javascript" {
  export const Solar: {
    fromYmdHms: (y: number, m: number, d: number, h: number, mi: number, s: number) => {
      getLunar: () => {
        getYearInGanZhi: () => string;
        getMonthInGanZhi: () => string;
        getDayInGanZhi: () => string;
        getEightChar: () => {
          getYun: (gender: number, sect?: number) => {
            getDaYun: (n: number) => Array<{
              getStartYear: () => number;
              getEndYear: () => number;
              getStartAge: () => number;
              getGanZhi: () => string;
            }>;
          };
        };
      };
    };
  };
}
