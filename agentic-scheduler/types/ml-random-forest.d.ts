declare module 'ml-random-forest' {
  interface RandomForestRegressionOptions {
    nEstimators?: number;
    maxFeatures?: number;
    replacement?: boolean;
    seed?: number;
  }

  export class RandomForestRegression {
    constructor(options?: RandomForestRegressionOptions);
    train(trainingSet: number[][], predictions: number[]): void;
    predict(dataset: number[][]): number[];
  }
}
