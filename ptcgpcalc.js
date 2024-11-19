const fileManager = FileManager.iCloud();
const filePath = fileManager.joinPath(fileManager.documentsDirectory(), "cardData.json");
const settingsPath = fileManager.joinPath(fileManager.documentsDirectory(), "settings.json");

async function main() {
  try {
    await initializeSettings();
    await showStartScreen();
  } catch (error) {
    logError("Main function error", error);
  }
}

// Initialize settings
async function initializeSettings() {
  try {
    if (!fileManager.fileExists(settingsPath)) {
      const defaultSettings = { markovWeight: 0.5, patternWeight: 0.3, frequencyWeight: 0.2, bayesianWeight: 0.0 };
      await saveSettings(defaultSettings);
    }
  } catch (error) {
    logError("Error initializing settings", error);
    throw error;
  }
}

// Show start screen
async function showStartScreen() {
  try {
    const alert = new Alert();
    alert.title = "Pokémon TCG Calculator";
    alert.message = "Choose a card or manage settings";
    alert.addAction("Card 1 | 🃏");
    alert.addAction("Card 2 | 🃏");
    alert.addAction("Card 3 | 🃏");
    alert.addAction("Card 4 | 🃏");
    alert.addAction("Card 5 | 🃏");
    alert.addAction("Manage Settings | ⚙️");
    alert.addAction("Delete Entries | 🗑️");
    alert.addAction("View Statistics | 📊");
    alert.addCancelAction("Cancel | ❌");

    const response = await alert.presentAlert();

    if (response === 5) await manageSettings();
    else if (response === 6) await manageEntries();
    else if (response === 7) await showStatistics();
    else if (response !== 8) await showCardOptions(response + 1);
  } catch (error) {
    logError("Error in showStartScreen", error);
    throw error;
  }
}

// Show card options
async function showCardOptions(cardNumber) {
  try {
    console.log(`Showing options for card ${cardNumber}`);
    const probabilities = await getEnhancedPositionProbabilities(cardNumber);
    const alert = new Alert();
    alert.title = `Card ${cardNumber} Options`;
    alert.message = `Predictions:\nMarkov: ${formatProbabilities(probabilities.markov)}\nPattern: ${formatProbabilities(probabilities.pattern)}\nFrequency: ${formatProbabilities(probabilities.frequency)}\nBayesian: ${formatProbabilities(probabilities.bayesian)}`;

    Object.entries(probabilities.combined).forEach(([pos, prob]) => {
      alert.addAction(`Position ${pos} (${(prob * 100).toFixed(2)}%)`);
    });
    alert.addCancelAction("Back | 🔙");

    const response = await alert.presentAlert();
    if (response !== -1) {
      const actualPosition = parseInt(Object.keys(probabilities.combined)[response]);
      await saveUserSelection(cardNumber, actualPosition, probabilities);
      await updateWeights(actualPosition, probabilities, cardNumber);
    }
  } catch (error) {
    logError("Error in showCardOptions", error);
    throw error;
  }
}

// Format probabilities as a string
function formatProbabilities(probabilities) {
  return Object.entries(probabilities)
    .map(([pos, prob]) => `Position ${pos}: ${(prob * 100).toFixed(2)}%`)
    .join(", ");
}

// Get enhanced probabilities
async function getEnhancedPositionProbabilities(cardNumber) {
  try {
    const data = await loadData();
    const settings = await loadSettings();
    const probabilities = {
      markov: getMarkovProbabilities(data, cardNumber),
      pattern: getPatternProbabilities(data, cardNumber),
      frequency: getFrequencyProbabilities(data, cardNumber),
      bayesian: getBayesianProbabilities(data, cardNumber),
      combined: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    for (const pos in probabilities.combined) {
      probabilities.combined[pos] = (settings.markovWeight * probabilities.markov[pos]) +
                                    (settings.patternWeight * probabilities.pattern[pos]) +
                                    (settings.frequencyWeight * probabilities.frequency[pos]) +
                                    (settings.bayesianWeight * probabilities.bayesian[pos]);
    }

    const total = Object.values(probabilities.combined).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      for (const key in probabilities.combined) probabilities.combined[key] /= total;
    }

    return probabilities;
  } catch (error) {
    logError("Error in getEnhancedPositionProbabilities", error);
    throw error;
  }
}

// Load data with error handling
async function loadData() {
  try {
    if (fileManager.fileExists(filePath)) {
      const content = fileManager.readString(filePath);
      return JSON.parse(content || "[]");
    }
    return [];
  } catch (error) {
    logError("Error loading data", error);
    throw error;
  }
}

// Save settings
async function saveSettings(settings) {
  try {
    fileManager.writeString(settingsPath, JSON.stringify(settings));
  } catch (error) {
    logError("Error saving settings", error);
    throw error;
  }
}

// Utility: Log errors
function logError(context, error) {
  console.error(`${new Date().toISOString()} [${context}]`, error.message || error);
  new Notification().title("Error").body(`${context}: ${error.message || error}`).schedule();
}

// Utility: Create alert
function createAlert(title, message, actions) {
  const alert = new Alert();
  alert.title = title;
  alert.message = message;
  actions.forEach((action) => alert.addAction(action));
  return alert;
}

// Manage settings
async function manageSettings() {
  try {
    const settings = await loadSettings();
    const alert = new Alert();
    alert.title = "Manage Settings";
    alert.message = "Adjust the weights for the prediction model";
    alert.addTextField("Markov Weight", settings.markovWeight.toString());
    alert.addTextField("Pattern Weight", settings.patternWeight.toString());
    alert.addTextField("Frequency Weight", settings.frequencyWeight.toString());
    alert.addTextField("Bayesian Weight", settings.bayesianWeight.toString());
    alert.addAction("Save");
    alert.addCancelAction("Cancel");

    const response = await alert.presentAlert();
    if (response === 0) {
      const markovWeight = parseFloat(alert.textFieldValue(0));
      const patternWeight = parseFloat(alert.textFieldValue(1));
      const frequencyWeight = parseFloat(alert.textFieldValue(2));
      const bayesianWeight = parseFloat(alert.textFieldValue(3));
      const newSettings = { markovWeight, patternWeight, frequencyWeight, bayesianWeight };
      await saveSettings(newSettings);
    }
  } catch (error) {
    logError("Error in manageSettings", error);
    throw error;
  }
}

// Manage entries
async function manageEntries() {
  try {
    const alert = new Alert();
    alert.title = "Manage Entries";
    alert.message = "Choose an option";
    alert.addAction("Delete All Entries");
    alert.addCancelAction("Cancel");

    const response = await alert.presentAlert();
    if (response === 0) {
      fileManager.remove(filePath);
      console.log("All entries deleted");
    }
  } catch (error) {
    logError("Error in manageEntries", error);
    throw error;
  }
}

// Get Markov probabilities
function getMarkovProbabilities(data, cardNumber) {
  const transitions = getMarkovTransitions(data, cardNumber);
  const probabilities = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const [current, targets] of Object.entries(transitions)) {
    for (const [target, count] of Object.entries(targets)) {
      probabilities[target] = (probabilities[target] || 0) + count;
    }
  }

  const total = Object.values(probabilities).reduce((sum, val) => sum + val, 0);
  if (total > 0) {
    for (const key in probabilities) probabilities[key] /= total;
  }

  return probabilities;
}

// Get pattern probabilities
function getPatternProbabilities(data, cardNumber) {
  const patternCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  data.forEach(entry => {
    if (entry.cardNumber === cardNumber) {
      patternCounts[entry.nextPosition]++;
    }
  });

  const total = Object.values(patternCounts).reduce((sum, val) => sum + val, 0);
  if (total > 0) {
    for (const key in patternCounts) patternCounts[key] /= total;
  }

  return patternCounts;
}

// Get frequency probabilities
function getFrequencyProbabilities(data, cardNumber) {
  const frequencyCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  data.forEach(entry => {
    if (entry.cardNumber === cardNumber) {
      frequencyCounts[entry.nextPosition]++;
    }
  });

  const total = Object.values(frequencyCounts).reduce((sum, val) => sum + val, 0);
  if (total > 0) {
    for (const key in frequencyCounts) frequencyCounts[key] /= total;
  }

  return frequencyCounts;
}

// Get Bayesian probabilities
function getBayesianProbabilities(data, cardNumber) {
  const probabilities = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const totalCount = data.filter(entry => entry.cardNumber === cardNumber).length;

  data.forEach(entry => {
    if (entry.cardNumber === cardNumber) {
      probabilities[entry.nextPosition]++;
    }
  });

  for (const key in probabilities) {
    probabilities[key] = (probabilities[key] + 1) / (totalCount + 5); // Laplace smoothing
  }

  return probabilities;
}

// Get Markov transitions
function getMarkovTransitions(data, cardNumber) {
  const transitions = {};
  data.forEach(entry => {
    if (entry.cardNumber === cardNumber) {
      if (!transitions[entry.currentPosition]) {
        transitions[entry.currentPosition] = {};
      }
      if (!transitions[entry.currentPosition][entry.nextPosition]) {
        transitions[entry.currentPosition][entry.nextPosition] = 0;
      }
      transitions[entry.currentPosition][entry.nextPosition]++;
    }
  });
  return transitions;
}

// Load settings
async function loadSettings() {
  try {
    if (fileManager.fileExists(settingsPath)) {
      const content = fileManager.readString(settingsPath);
      return JSON.parse(content);
    }
    return { markovWeight: 0.5, patternWeight: 0.3, frequencyWeight: 0.2, bayesianWeight: 0.0 };
  } catch (error) {
    logError("Error loading settings", error);
    throw error;
  }
}

// Save user selection
async function saveUserSelection(cardNumber, actualPosition, probabilities) {
  try {
    const data = await loadData();
    data.push({
      cardNumber,
      currentPosition: actualPosition,
      nextPosition: {
        markov: Object.keys(probabilities.markov).reduce((a, b) => probabilities.markov[a] > probabilities.markov[b] ? a : b),
        pattern: Object.keys(probabilities.pattern).reduce((a, b) => probabilities.pattern[a] > probabilities.pattern[b] ? a : b),
        frequency: Object.keys(probabilities.frequency).reduce((a, b) => probabilities.frequency[a] > probabilities.frequency[b] ? a : b),
        bayesian: Object.keys(probabilities.bayesian).reduce((a, b) => probabilities.bayesian[a] > probabilities.bayesian[b] ? a : b),
        combined: Object.keys(probabilities.combined).reduce((a, b) => probabilities.combined[a] > probabilities.combined[b] ? a : b)
      }
    });
    fileManager.writeString(filePath, JSON.stringify(data));
  } catch (error) {
    logError("Error saving user selection", error);
    throw error;
  }
}

// Update weights based on actual results
async function updateWeights(actualPosition, probabilities, cardNumber) {
  try {
    const settings = await loadSettings();
    const data = await loadData();

    // Calculate the error for each algorithm
    const errors = {
      markov: Math.abs(actualPosition - probabilities.markov[actualPosition]),
      pattern: Math.abs(actualPosition - probabilities.pattern[actualPosition]),
      frequency: Math.abs(actualPosition - probabilities.frequency[actualPosition]),
      bayesian: Math.abs(actualPosition - probabilities.bayesian[actualPosition])
    };

    // Adjust weights based on error
    if (errors.markov > 0) {
      settings.markovWeight -= 0.01;
    } else {
      settings.markovWeight += 0.01;
    }

    if (errors.pattern > 0) {
      settings.patternWeight -= 0.01;
    } else {
      settings.patternWeight += 0.01;
    }

    if (errors.frequency > 0) {
      settings.frequencyWeight -= 0.01;
    } else {
      settings.frequencyWeight += 0.01;
    }

    if (errors.bayesian > 0) {
      settings.bayesianWeight -= 0.01;
    } else {
      settings.bayesianWeight += 0.01;
    }

    // Normalize weights
    const totalWeight = settings.markovWeight + settings.patternWeight + settings.frequencyWeight + settings.bayesianWeight;
    settings.markovWeight /= totalWeight;
    settings.patternWeight /= totalWeight;
    settings.frequencyWeight /= totalWeight;
    settings.bayesianWeight /= totalWeight;

    // Save updated settings
    await saveSettings(settings);
  } catch (error) {
    logError("Error updating weights", error);
    throw error;
  }
}

// Show statistics
async function showStatistics() {
  try {
    const data = await loadData();
    const settings = await loadSettings();

    const totalEntries = data.length;
    const markovWeight = settings.markovWeight;
    const patternWeight = settings.patternWeight;
    const frequencyWeight = settings.frequencyWeight;
    const bayesianWeight = settings.bayesianWeight;

    const alert = new Alert();
    alert.title = "Statistics";
    alert.message = `Total Entries: ${totalEntries}\nMarkov Weight: ${markovWeight}\nPattern Weight: ${patternWeight}\nFrequency Weight: ${frequencyWeight}\nBayesian Weight: ${bayesianWeight}`;
    alert.addAction("OK");
    await alert.presentAlert();
  } catch (error) {
    logError("Error in showStatistics", error);
    throw error;
  }
}

// Run the main function
await main();
