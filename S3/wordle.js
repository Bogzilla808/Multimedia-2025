window.onload = function() {
    let board = document.getElementById('board');
    let guessButton = document.getElementById('guessButton');
    let guessInput = document.getElementById('guessInput');

    const newGameButton = document.getElementById('newGameButton');
    const errorDisplay = document.getElementById('errorMsg');

    // Load stats from localStorage or initialize
    let stats = {
        gamesPlayed: parseInt(localStorage.getItem('gamesPlayed')) || 0,
        wins: parseInt(localStorage.getItem('wins')) || 0,
        currentStreak: parseInt(localStorage.getItem('currentStreak')) || 0,
        pct: parseInt(localStorage.getItem("pct")) || 0
    };

    // Update the stats display
    function updateStatsDisplay() {
        document.getElementById('gamesPlayed').textContent = stats.gamesPlayed;
        document.getElementById('wins').textContent = stats.wins;

        // if it's not the first game, compute whole percentage of winrate 
        document.getElementById('winPct').textContent = stats.pct + '%';

        document.getElementById('currentStreak').textContent = stats.currentStreak;
    }

    // Initialize display
    updateStatsDisplay();

    for(let i=0;i<6;i++) {
        let row = document.createElement('div');
        row.classList.add('row');
        board.append(row);

        for(let j=0;j<5;j++) {
            let cell = document.createElement('div');
            cell.classList.add('cell');
            cell.setAttribute('data-row', i);
            cell.setAttribute('data-column', j);
            row.append(cell);
        }
    }

    const words = ["table", "chair", "piano", "mouse", "house", "plant", "brain", "cloud", 
                   "beach", "fruit", "media", "llama"];
    const randomIndex = Math.floor(Math.random() * words.length);
    let word = words[randomIndex];
    let tries = 0;
    let gameOver = false;

    guessButton.addEventListener('click', function() {
        if(gameOver == true)
        {
            errorDisplay.textContent = "Game is already over!";
            return;
        }

        let guess = guessInput.value;

        // Convert both to uppercase for consistency
        let guessUpper = guess.toUpperCase();
        let wordUpper = word.toUpperCase();
        // Track letters used for yellow coloring
        let letterCounts = {};

        // Validation
        if(guess.length !== 5) {
            errorDisplay.textContent = "Please enter 5 letters!";
            return;
        }
        // Tests with regex if string DOESN'T have only letters
        if(!/^[a-zA-Z]+$/.test(guess)) {
            errorDisplay.textContent = "Please enter letters only!";
            return;
        }

        // Count each letter in the word
        for (let letter of wordUpper) {
            letterCounts[letter] = (letterCounts[letter] || 0) + 1;
        }

        let colors = Array(5).fill(''); // temp array for colors
        for (let i = 0; i < 5; i++) {
            if (guessUpper[i] === wordUpper[i]) {
                colors[i] = 'green';
                letterCounts[guessUpper[i]]--; // decrement available count
            }
        }

        // Second pass: mark yellows and reds
        for (let i = 0; i < 5; i++) {
            if (colors[i] === '') {
                if (wordUpper.includes(guessUpper[i]) && letterCounts[guessUpper[i]] > 0) {
                    colors[i] = 'yellow';
                    letterCounts[guessUpper[i]]--;
                } else {
                    colors[i] = 'red';
                }
            }
        }

        // Add guess in table
        for(let i=0;i<5;i++) {
            let currentCell = document.querySelector(
                `[data-row="${tries}"][data-column="${i}"]`    
            );

            let currentLetter = document.createTextNode(guess[i]);
            // currentCell.append(currentLetter);
            currentCell.textContent = guessUpper[i];
            // Add flip animation with a small stagger delay =========
            setTimeout(() => {
                currentCell.classList.add('flip');

                setTimeout(() => {
                    currentCell.classList.add(colors[i]); // use the computed colors array
                    currentCell.classList.remove('flip');
                }, 300);
            }, i * 200); // small delay between letters ===== increases for each iteration
            setTimeout(()=>{
                guessInput.value='';
            }, 800);
        }

        if(wordUpper === guessUpper) {
            alert('You won!');
            gameOver = true;
            newGameButton.style.display = 'inline-block';

            stats.gamesPlayed++;
            stats.currentStreak++;
            stats.wins++;
            stats.pct = Math.round((stats.wins / stats.gamesPlayed) * 100);
            localStorage.setItem("gamesPlayed", stats.gamesPlayed);
            localStorage.setItem("currentStreak", stats.currentStreak);
            localStorage.setItem("wins", stats.wins);
            localStorage.setItem("pct", stats.pct);

            updateStatsDisplay();
            return;
        }

        if(tries == 5) {
            alert('You lost :(   The word was ' + word);
            gameOver = true;
            newGameButton.style.display = 'inline-block';

            // Update stats
            stats.gamesPlayed++;
            stats.currentStreak = 0;
            stats.pct = Math.round((stats.wins / stats.gamesPlayed) * 100);
            localStorage.setItem('gamesPlayed', stats.gamesPlayed);
            localStorage.setItem('currentStreak', stats.currentStreak);
            localStorage.setItem('pct', stats.pct);

            updateStatsDisplay();
            return;
        }

        tries++;
    });

    // Allow guess with enter
    guessInput.addEventListener('keydown', function(e) {
        if(e.key === 'Enter') {
            e.preventDefault(); // prevent page reload
            guessButton.click();
        }
    });

    newGameButton.addEventListener('click', function() {
        // Clear all cells
        document.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('green', 'yellow', 'red');
        });

        // Reset input
        guessInput.value = '';
        errorDisplay.textContent = '';

        // Pick a new random word
        const randomIndex = Math.floor(Math.random() * words.length);
        word = words[randomIndex];

        // Reset tries and game state
        tries = 0;
        gameOver = false;

        // Hide the New Game button
        newGameButton.style.display = 'none';
    });
}