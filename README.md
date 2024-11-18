### Description  
This script is a **calculator for Wonder Pick** in the game *Pokémon TCG Pocket*. It helps players analyze and predict card positions based on historical data and probabilities. The tool uses algorithms like Markov chains, weighted frequencies, and repeating patterns to assist in decision-making. It also allows users to manage saved entries, view prediction results, and improve their strategies.  

The first three position choices for each card are sorted based on data derived from a specific graphic, but **anomalies** may still occur due to variations in the data.  

**Important:** This tool should **not** be considered reliable for making accurate predictions. It is a work in progress, and the algorithms used may still require refinement. If anyone with expertise in predictive algorithms is interested in helping, please reach out, as this is my first time working with such concepts.

**Note:** This script requires the [Scriptable](https://scriptable.app) app on iOS to run.

---

### How to Use  
1. **Install Scriptable**:  
   Download the [Scriptable](https://scriptable.app) app from the iOS App Store. Open the app and add the script.

2. **Launch the Script**:  
   Start the script in Scriptable to see the main menu. You will be presented with options to pick a card or manage your saved data.

3. **Choose a Card**:  
   Select a card (Card 1–5) to view possible positions for that card. The tool calculates probabilities for each position based on past data.

4. **Select a Position**:  
   Once you choose a card, pick the predicted or desired position.  
   - The first three positions are sorted based on external reference data, though exceptions (anomalies) may occur.
   - Remaining positions are shown with their calculated probabilities.

5. **Prediction Information**:  
   For each card, you'll see:
   - Probabilities for each position based on past entries.
   - Short-term predictions using weighted history.
   - Optional algorithm analysis (currently shown in the console).

6. **Manage Data**:  
   - Delete all saved entries.
   - Remove the last saved entry.
   - Continue your progress with updated data.

---

This tool is designed to make Wonder Pick more strategic and help players refine their gameplay decisions, though its predictions are not guaranteed. If you have experience with predictive algorithms and would like to assist in improving this project, your help would be greatly appreciated!
