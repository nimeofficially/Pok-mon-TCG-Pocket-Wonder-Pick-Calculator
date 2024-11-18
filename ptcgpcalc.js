const fileManager = FileManager.iCloud();
const filePath = fileManager.joinPath(fileManager.documentsDirectory(), "cardData.json");

let algorithmStats = {
  patternPrediction: { correct: 0, total: 0 },
  markovPrediction: { correct: 0, total: 0 },
  frequencyPrediction: { correct: 0, total: 0 }
};

async function showStartScreen() {
  let alert = new Alert();
  alert.title = "Pokémon TCG Pocket - Wonder Pick Calculator";
  alert.message = "Choose a card and a position!";

  for (let i = 1; i <= 5; i++) {
    alert.addAction(`Card ${i} | 🃏`);
  }

  alert.addAction("Delete Entries | 🗑️");
  alert.addAction("Cancel | ❌");

  let response = await alert.presentAlert();

  if (response === 5) {
    await manageEntries();
  } else if (response === 6) {
    return;
  } else {
    await showCardOptions(response + 1);
  }
}

async function showCardOptions(cardNumber) {
  let alert = new Alert();
  alert.title = `Options for Card ${cardNumber}`;

  let possiblePositions = getPossiblePositions(cardNumber);
  
  let probabilities = await getEnhancedPositionProbabilities(cardNumber);

  let sortedPositions = possiblePositions.sort((a, b) => probabilities[b] - probabilities[a]);

  sortedPositions.forEach(position => {
    let probability = probabilities[position]?.toFixed(2) || "0.00";
    alert.addAction(`Position ${position} (Probability: ${probability}%) | 📍`);
  });

  let remainingPositions = [1,2,3,4,5].filter(pos => !possiblePositions.includes(pos));
  
  remainingPositions.forEach(position => {
    let probability = probabilities[position]?.toFixed(2) || "0.00";
    alert.addAction(`Position ${position} (Probability: ${probability}%) | 📍`);
  });

  let { predictedPosition } = await getShortTermProbabilities(cardNumber);
  
  if (predictedPosition !== null) {
    alert.message += `\n\nNext Position (Prediction): ${predictedPosition}`;
  } else {
    alert.message += "\nNo prediction available.";
  }

  alert.addAction("Previous Page | 🔙");

  let response = await alert.presentAlert();

  if (response < sortedPositions.length + remainingPositions.length) {
    let chosenPosition = response < sortedPositions.length 
      ? sortedPositions[response] 
      : remainingPositions[response - sortedPositions.length];
    
    await logChoice(cardNumber, chosenPosition);
    
    await assessAndUpdatePredictions(cardNumber, chosenPosition);
    
    await adjustWeights(cardNumber, chosenPosition);
    
    await detectAndStorePatterns(cardNumber);
    
    await updateMarkovChains(cardNumber, chosenPosition);
    
    await evaluateAllCards();
    
    provideFeedback(predictedPosition, chosenPosition);

    // Return to start screen after processing
    await showStartScreen();
    
  } else {
    await showStartScreen();
  }
}

function getPossiblePositions(cardNumber) {
   const positionsMap = {
     1: [2, 3, 5],
     2: [2, 4, 5],
     3: [1, 2, 5],
     4: [1, 2, 5],
     5: [2, 3, 4]
   };
   
   return positionsMap[cardNumber] || [];
}

async function getEnhancedPositionProbabilities(cardNumber) {
   let data = await loadData();
   
   const probabilities = new Map([1,2,3,4,5].map(pos => [pos, { count: 0 }]));
   
   data.forEach(entry => {
     if (entry.card === cardNumber) {
       probabilities.get(entry.position).count++;
     }
   });

   const totalEntries = Array.from(probabilities.values()).reduce((sum, pos) => sum + pos.count, 0);
   
   const markovChainKey = `markov_${cardNumber}`;
   const markovData = data[markovChainKey] || {};
   
   probabilities.forEach((value, key) => {
     value.probability = totalEntries ? (value.count / totalEntries) * (markovData[key] ? markovData[key].probability :1) :0;
   });

   return Object.fromEntries([...probabilities.entries()].map(([key,value]) => [key,value.probability]));
}

async function logChoice(cardNumber, chosenPosition) {
   const entry = { card: cardNumber, position: chosenPosition, timestamp: new Date().toISOString() };
   const data = await loadData();

   data.push(entry);
   const filteredData = data.filter(e => e.card === cardNumber);

   if (filteredData.length > 100) {
       const excessEntries = filteredData.length - 100;
       data.splice(data.indexOf(filteredData[0]), excessEntries);
   }

   await saveData(data);
}

async function assessAndUpdatePredictions(cardNumber, selectedPosition) {
   const data = await loadData();
   const history = data.filter(entry => entry.card === cardNumber);

   if (history.length > 0) {
     const lastEntry = history[history.length -1];
     const predictedPosition = lastEntry.prediction || null;
     
     if (predictedPosition === selectedPosition) {
       algorithmStats.frequencyPrediction.correct++;
       algorithmStats.patternPrediction.correct++;
       algorithmStats.markovPrediction.correct++;
     }
     algorithmStats.frequencyPrediction.total++;
     algorithmStats.patternPrediction.total++;
     algorithmStats.markovPrediction.total++;

     lastEntry.predictionAccuracy = predictedPosition === selectedPosition;
     lastEntry.selectedPosition = selectedPosition;

     await saveData(data);
   }
}

async function adjustWeights(cardNumber, selectedPosition) {
   const data = await loadData();
   const history = data.filter(entry => entry.card === cardNumber);

   history.forEach(entry => {
      if (entry.selectedPosition === selectedPosition) {
          entry.weightAdjustment += Math.random();
      } else {
          entry.weightAdjustment -= Math.random();
      }
      entry.timestamp = new Date().toISOString();
   });

   await saveData(data);
}

async function detectAndStorePatterns(cardNumber) {
   const data = await loadData();
   const history = data.filter(entry => entry.card === cardNumber).map(entry => entry.position);

   const patternsFound = detectRepeatingPatterns(history);

   for (let pattern of patternsFound) {
      data.push({ pattern: pattern });
   }

   await saveData(data);
}

function detectRepeatingPatterns(sequence) {
    const repeatingPatterns = [];
    const sequenceLength = sequence.length;

    for (let length = Math.floor(sequenceLength / 2); length > 0; length--) { 
        for (let startIndex = sequenceLength - length; startIndex >= length; startIndex--) { 
            const patternCandidate = sequence.slice(startIndex - length +1 , startIndex +1); 
            if (sequence.join('').includes(patternCandidate.join(',')) && !repeatingPatterns.includes(patternCandidate.join(','))) { 
                repeatingPatterns.push(patternCandidate.join(',')); 
            }
        }
    }

    return repeatingPatterns;
}

async function updateMarkovChains(cardNumber, chosenPosition) {
    const data = await loadData();
    const history = data.filter(entry => entry.card === cardNumber).map(entry => entry.position);

    let markovChainKey = `markov_${cardNumber}`;
    
    if (!data[markovChainKey]) {
        data[markovChainKey] = {};
    }

    for (let i=0; i<history.length-1; i++) {
        let currentPos = history[i];
        let nextPos = history[i+1];

        if (!data[markovChainKey][currentPos]) {
            data[markovChainKey][currentPos] = {};
        }

        if (!data[markovChainKey][currentPos][nextPos]) {
            data[markovChainKey][currentPos][nextPos] = { count: 0 };
        }

        data[markovChainKey][currentPos][nextPos].count++;
    }

    await saveData(data);
}

function provideFeedback(predictedPosition, selectedPosition) {
    if (predictedPosition !== null && selectedPosition !== null) { 
        if (predictedPosition === selectedPosition) {
            algorithmStats.patternPrediction.correct++; 
        }
        algorithmStats.patternPrediction.total++;
        
        console.log(`Feedback processed. Correct predictions: ${algorithmStats.patternPrediction.correct}`);
      }
}

async function evaluateAllCards() {
    const allData=await loadData();

    for(let cardNum=1;cardNum<=5;cardNum++){
        const cardHistory=allData.filter(entry=>entry.card===cardNum);

        if(cardHistory.length>0){ 
            console.log(`Evaluating Card ${cardNum}:`, cardHistory); 
        }
        
        console.log(`Evaluating All Cards Combined:` , allData); 
        console.log(`Total Entries for Card ${cardNum}:`, cardHistory.length);
        
        console.log(`Total Entries Combined:` , allData.length); 
        console.log('-----------------------------');
        
      }
}

async function getShortTermProbabilities(cardNumber) {
   const data=await loadData();
   const history=data.filter(entry=>entry.card===cardNumber).map(entry=>entry.position);

   if(history.length<12)return { predictedPosition:null };

   const weightFactors=[0.5 ,0.3 ,0.2];

const weightedPrediction={};

history.slice(-12).forEach((pos,index)=>{ 
weightedPrediction[pos]=(weightedPrediction[pos]||0)+weightFactors[index % weightFactors.length]; 
});

const predictedPositions=Object.entries(weightedPrediction).sort((a,b)=>b[1]-a[1]);
const predictedPosition=predictedPositions[0][0]; 

return {predictedPosition:parseInt(predictedPosition),predictionText:`Prediction based on recent history.`};
}

async function manageEntries() {
   let alert=new Alert();
   alert.title="Manage Entries | 🗑️";
   alert.message="Choose an option for managing your saved entries.";

   alert.addAction("Delete All Entries | 🗑️");
   alert.addAction("Delete Last Entry | ♻️");
   alert.addAction("Cancel | ❌");

let response=await alert.presentAlert();

if(response===0 )await clearData(); 
else if(response===1 )await deleteLastEntry(); 
else await showStartScreen(); 
}

async function clearData() { 
if(fileManager.fileExists(filePath))await fileManager.remove(filePath);

let alert=new Alert(); 
alert.title="All Data Deleted | 🗑️"; 
alert.message="All saved entries have been deleted."; 

await alert.presentAlert(); 
}

async function deleteLastEntry() { 
const data=await loadData();

if(data.length>0){ 
data.pop(); 
await saveData(data); 
let alert=new Alert(); 
alert.title="Last Entry Deleted | ♻️"; 
alert.message="The last saved entry has been removed."; 
await alert.presentAlert(); 
}else{ 
let alert=new Alert(); 
alert.title="No Entries Found | ❌"; 
alert.message="There are no entries to delete."; 
await alert.presentAlert(); 
} 
}

async function loadData() { 
if(fileManager.fileExists(filePath)){ 
const fileData=await fileManager.readString(filePath); return JSON.parse(fileData||"[]"); }

return []; }

async function saveData(data){ 

await fileManager.writeString(filePath ,JSON.stringify(data)); }

async function main() { 

await showStartScreen(); }

main();
