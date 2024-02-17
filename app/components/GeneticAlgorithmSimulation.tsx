'use client';

import React, { useEffect, useRef } from 'react';
import p5 from 'p5';

export default function GeneticAlgorithmSimulation() {

  //const [generation, setGeneration] = useState(1);
  const generationRef = useRef(0);
  const mutationRateRef = useRef(0);
  const averageFitness = useRef(Infinity);
  const walls: any = []; // Array to store wall positions

  const populationSize = 1000;
  const inputSize = 2;
  const numHiddenLayers = 2;
  const numHiddenNodesPerLayer = 16;
  const numHiddenNodes = numHiddenLayers * numHiddenNodesPerLayer;
  const numOutputNodes = 8;
  const selectionRate = 0.5;
  const wallDensity = 0.0005;
  const numWalls = Math.floor(window.innerWidth * window.innerHeight * wallDensity);
  const penaltyFactor = 10;
  const defaultMutationRate = 0.07;
  const amplifiedMutationRate = 0.13;
  const numWeights = (inputSize * numHiddenNodesPerLayer) + (numHiddenNodesPerLayer * numHiddenNodesPerLayer) + (numHiddenNodesPerLayer * numOutputNodes);

  const reluActivate = (value: number) => Math.max(0, value);

  const softmaxActivation = (inputArray: number[]) => {
    const expValues = inputArray.map((x) => Math.exp(x));
    const sumExpValues = expValues.reduce((acc, value) => acc + value, 0);
    return expValues.map((value) => value / sumExpValues);
  }

  const neuralNetwork = (input: number[], weights: number[], bias: number[]) => {
    const x = input[0];
    const y = input[1];

    // Initialize input layer
    let layerInput = [x, y];

    // Hidden layers
    for (let layer = 0; layer < numHiddenLayers; layer++) {
      const hiddenNodes = [];
      for (let i = 0; i < numHiddenNodesPerLayer; i++) {
        let hiddenNodeInput = 0;
        for (let j = 0; j < layerInput.length; j++) {
          hiddenNodeInput += layerInput[j] * weights[layer * numHiddenNodesPerLayer * inputSize + i * inputSize + j];
        }
        hiddenNodes.push(reluActivate(hiddenNodeInput + bias[layer * numHiddenNodesPerLayer + i]));
      }
      layerInput = hiddenNodes;
    }

    // Output layer
  const outputNodes = [];
  for (let i = 0; i < numOutputNodes; i++) {
    let outputNodeInput = 0;
    for (let j = 0; j < layerInput.length; j++) {
      outputNodeInput += layerInput[j] * weights[numHiddenLayers * numHiddenNodesPerLayer * inputSize + i * layerInput.length + j];
    }
    outputNodes.push(outputNodeInput);
  }

    return softmaxActivation(outputNodes);
}

  const calcEuclideanDistance = (sourceX: number, sourceY: number, targetX: number, targetY: number) =>
    Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2));


  // Function to generate random walls
  const generateWalls = () => {
    walls.length = 0; // Clear existing walls

    for (let i = 0; i < numWalls; i++) { // Adjust the number of walls as needed
      const wallX = Math.random() * window.innerWidth;
      const wallY = Math.random() * window.innerHeight;
      const wallWidth = Math.random() * 100 + 10; // Adjust the size of the walls
      const wallHeight = Math.random() * 100 + 10;

      walls.push({
        x: wallX,
        y: wallY,
        width: wallWidth,
        height: wallHeight,
      });
    }
  };

  const checkCollision = (x: number, y: number) => {
    for (const wall of walls) {
      if (
        x < wall.x + wall.width &&
        x + 10 > wall.x &&
        y < wall.y + wall.height &&
        y + 10 > wall.y
      ) {
        return true; // Collision detected
      }
    }
    return false; // No collision
  };

  useEffect(() => {
    let initX: number;
    let initY: number;
    let canvas : any;

    do{
      initX = Math.random() * window.innerWidth;
      initY = Math.random() * window.innerHeight;
    } while(checkCollision(initX, initY))

    const initializedPopulation = (initX: number, initY: number) => {

      const population = [];
  
      for(let i = 0; i < populationSize; i++){
        population.push({
          x: initX,
          y: initY,
          weights: Array.from({ length: numWeights }, () => Math.random() * 2 - 1),
          bias: Array.from({ length: numHiddenNodes }, () => Math.random() * 2 - 1),
          fitness: Infinity,
          speed: Math.random() * 10 + 1
        })
      }
  
      return population;
    }
  
    const evaluateFitness = (population: any, target: any) => {
  
      const sortedPopulation: any = [];
      const totalFitness = population.reduce((sum: any, individual: any) => sum + calcEuclideanDistance(individual.x, individual.y, target.x, target.y), 0);
      const average = totalFitness / population.length;
  
      // Update the averageFitness.current
      averageFitness.current = average;
  
      for (const individual of population) {
        // Check for collision with walls
        let collision = false;
        for (const wall of walls) {
          if (
            individual.x < wall.x + wall.width &&
            individual.x + 10 > wall.x &&
            individual.y < wall.y + wall.height &&
            individual.y + 10 > wall.y
          ) {
            collision = true;
            break;
          }
        }
    
        // Check for hitting the environment boundaries
        const hitBoundaryPenalty = (individual.x <= 0 || individual.x >= window.innerWidth || individual.y <= 0 || individual.y >= window.innerHeight) ? penaltyFactor : 1;
  
        // Calculate Euclidean distance
        const distanceToTarget = calcEuclideanDistance(individual.x, individual.y, target.x, target.y);
    
        // Apply penalty for collision
        const collisionPenalty = collision ? penaltyFactor : 1;
    
        // Update fitness with penalty
        individual.fitness = distanceToTarget * collisionPenalty * hitBoundaryPenalty;
    
        sortedPopulation.push(individual);
      }
  
      const sortedBest = sortedPopulation.sort((a: any, b: any) => a.fitness - b.fitness);
      const survivingPopulation = sortedBest.slice(0, populationSize * selectionRate);
  
      return survivingPopulation;
    }
  
    const crossOver = (population: any) => {
  
      const parents: any = [];
      const children: any[] = [];

      let mutationRate = defaultMutationRate;

      // if(generationRef.current % 10 == 0) {
       // mutationRate = amplifiedMutationRate;
      //}
    
      mutationRateRef.current = mutationRate;
  
      for (const individual of population){
        parents.push({
          weights: individual.weights,
          bias: individual.bias,
          speed: individual.speed
        })
      }

      //parents.sort(() => Math.random() - 0.5);
      
      let i = 0;
      while (parents.length + children.length < populationSize) {
        let parentOne: any;
        let parentTwo: any;
  
        if (i === parents.length - 1) {
          parentOne = parents[i];
          parentTwo = parents[0];
        } else {
          parentOne = parents[i];
          parentTwo = parents[i + 1];
        }
  
        const childWeight = parentOne.weights.map((_: any, index: any) => (Math.random() < 0.5 ? parentOne.weights[index] : parentTwo.weights[index]));
        const childBias = parentOne.bias.map((_: any, index: any) => (Math.random() < 0.5 ? parentOne.bias[index] : parentTwo.bias[index]));
        const childSpeed = Math.random() < 0.5 ? parentOne.speed : parentTwo.speed;
  
        const mutatedChildWeight = childWeight.map((value: any) => (Math.random() < mutationRate ? Math.random() * 2 - 1 : value));
        const mutatedChildBias = childBias.map((value: any) => (Math.random() < mutationRate ? Math.random() * 2 - 1 : value));
        const mutatedChildSpeed = Math.random() < mutationRate ? Math.random() * 10 + 1 : childSpeed;
  
        children.push({
          weights: mutatedChildWeight,
          bias: mutatedChildBias,
          speed: mutatedChildSpeed
        });
  
        // Update the loop index
        i = (i + 1) % parents.length;
      }
  
  
      const newPopulationResult = parents.concat(children);
  
      const newPopulation = [];
  
      for(const {weights, bias, speed} of newPopulationResult){
        newPopulation.push({
          x: initX,
          y: initY,
          weights: weights,
          bias: bias,
          fitness: Infinity,
          speed: speed
        })
      }
  
      return newPopulation;
    }

    const sketch = (p : any) => {

            let population : any;
            let target : any;
      
            // P5.js setup function
            p.setup = () => {
              p.createCanvas(window.innerWidth, window.innerHeight);
      
              generateWalls();
              population = initializedPopulation(initX, initY);

              do {
                target = {
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                };
              } while (checkCollision(target.x, target.y));
      
            };
      
            // P5.js draw function (called continuously)
            p.draw = () => {
              // Your draw logic for the genetic algorithm goes here
              p.background(255);
      
              p.fill(150);
              for (const wall of walls) {
                p.rect(wall.x, wall.y, wall.width, wall.height);
              }
      
              p.fill(255, 0, 0);
              p.rect(target.x, target.y, 10, 10);
              p.text(`Generation: ${generationRef.current}`, 10, 20);
              p.text(`Average Fitness: ${1 - (averageFitness.current / Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2))}`, 10, 40);
              p.text(`Mutation Rate: ${mutationRateRef.current}`, 10, 60);
      
              for (const individual of population) {
      
                const inputs = [individual.x, individual.y];
      
                const outputs = neuralNetwork(inputs, individual.weights, individual.bias);
                // direction will be determined by neural network
                const direction = outputs.indexOf(Math.max(...outputs));
      
                const nextX = individual.x + (
                    direction === 3 ? individual.speed : 
                    direction === 2 ? -(individual.speed) : 
                    direction === 4 ? -(individual.speed) : 
                    direction === 5 ? individual.speed : 
                    direction === 6 ? individual.speed :
                    direction === 7 ? -(individual.speed) : 0
                  );
                const nextY = individual.y + (
                  direction === 0 ? individual.speed : 
                  direction === 1 ? -(individual.speed) : 
                  direction === 4 ? individual.speed :
                  direction === 5 ? individual.speed :
                  direction === 6 ? -(individual.speed) :
                  direction === 7 ? -(individual.speed) : 0
                );
      
      
                // Check for collision with walls
                let collision = false;
                for (const wall of walls) {
                  if (
                    nextX < wall.x + wall.width &&
                    nextX + 10 > wall.x &&
                    nextY < wall.y + wall.height &&
                    nextY + 10 > wall.y
                  ) {
                    collision = true;
                    break;
                  }
                }
      
                if(!collision) {
                  individual.x = p.constrain(nextX, 0, p.width - 10);
                  individual.y = p.constrain(nextY, 0, p.height - 10);
                }
      
                p.fill(0, 255, 0);
                p.rect(individual.x, individual.y, 10, 10); // Adjust the size and shape accordingly
              }
      
              // Evaluate fitness after a certain interval
              if (p.frameCount % 300 === 0) {
                const survivingPopulation = evaluateFitness(population, target);
                // Perform genetic operations (e.g., cross-over) based on the fitness
                generationRef.current += 1;
                population = crossOver(survivingPopulation);
              }
             };
        }
      
          // Create a new P5 instance with the sketch function
          canvas = new p5(sketch);
      
          // Cleanup function to remove the P5 instance when the component unmounts
          return () => {
            canvas.remove();
          };
  }, [])

  return <div id="geneticAlgorithmCanvas"></div>;
}


