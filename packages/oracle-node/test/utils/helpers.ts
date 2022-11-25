export const getComplicatedFunction = (functionToRun: () => Promise<any>) => {
  return async () => {
    const outerFunction = async () => {
      const innerFunction = async () => {
        await functionToRun();
      };
      await innerFunction();
    };
    await outerFunction();
  };
};
