window.onload = function() {
    const toggleBtn = document.getElementById("toggleButton");
    toggleBtn.addEventListener("click", toggleChart);

    let speedSlider = document.getElementById("speedSlider");
    let updateTime = speedSlider.value * 10;
    let intervalId = null;
    speedSlider.addEventListener("change", function() {
        updateTime = speedSlider.value * 10;
        startInterval();
    });

    const maxInput = document.getElementById("maxInput");
    const minInput = document.getElementById("minInput");   

    const toggleGridCheckbox = document.getElementById("toggleGrid");
    let showGrid = toggleGridCheckbox.checked;

    toggleGridCheckbox.addEventListener("change", function() {
        showGrid = toggleGridCheckbox.checked;
        draw();
    });

    const resetBtn = document.getElementById("resetBtn");
    resetBtn.addEventListener("click", function() {
        generateInitialData(); // regenerate all datasets
        draw();                // redraw the chart immediately
    });

    let canvas = document.getElementById('chartCanvas');
    let context = canvas.getContext('2d');
    let chartMode = "line";

    let width = canvas.width;
    let height = canvas.height;

    let xIncrement = 150;
    let yIncrement = 100;
    let valueIncrement = 20;
    let textOffset = 5;

    let isRunning = false;

    let datasets = [
        {
            label: "Line A",
            color: "green",
            data: [],
            generator: () => Math.random() * height
        },
        {
            label: "Line B",
            color: "red",
            data: [],
            generator: () => height / 2 + Math.random() * 80 // around the middle
        },
        {
            label: "Line C",
            color: "blue",
            data: [],
            generator: () => Math.sin(Date.now() / 500) * 200 + height / 2  // wavy pattern
        }
    ];

    let tooltip = {
        visible: false,
        x: 0,
        y: 0,
        text: ''
    };

    document.getElementById("lineChartBtn").addEventListener("click", () => {
        chartMode = "line";
        draw();
    });
    
    document.getElementById("barChartBtn").addEventListener("click", () => {
        chartMode = "bar";
        draw();
    });
    
    document.getElementById("areaChartBtn").addEventListener("click", () => {
        chartMode = "area";
        draw();
    });
    
    document.getElementById("scatterPlotBtn").addEventListener("click", () => {
        chartMode = "scatter";
        draw();
    });

    const themeSwitch = document.getElementById("themeSwitch");

    themeSwitch.addEventListener("change", function() {
        if(themeSwitch.checked) {
            // Dark theme
            document.documentElement.style.setProperty('--bg-color', '#1e1e1e');
            document.documentElement.style.setProperty('--text-color', '#ffffff');
            document.documentElement.style.setProperty('--chart-bg', '#333333');
            document.documentElement.style.setProperty('--btn-bg', '#555555');
            document.documentElement.style.setProperty('--btn-text', '#ffffff');
            document.documentElement.style.setProperty('--btn-border', '#ffffff');
        } else {
            // Light theme
            document.documentElement.style.setProperty('--bg-color', 'white');
            document.documentElement.style.setProperty('--text-color', 'black');
            document.documentElement.style.setProperty('--chart-bg', '#FA8072');
            document.documentElement.style.setProperty('--btn-bg', 'white');
            document.documentElement.style.setProperty('--btn-text', 'black');
            document.documentElement.style.setProperty('--btn-border', 'black');
        }
    });

    // Track mouse movement
    canvas.addEventListener('mousemove', function(e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        tooltip.visible = false;

        const threshold = 8; // px distance to detect a data point

        // Loop through datasets
        for(let ds of datasets) {
            let smooth = movingAverage(ds.data, 4);
            smooth = smooth.map(v => clamp(v, parseFloat(minInput.value) || 0, 
                parseFloat(maxInput.value) || height));
            
            for(let i=0;i<smooth.length;i++) {
                let pointX = i * valueIncrement;
                let pointY = height - smooth[i];

                // Check if mouse is close to the point
                if(Math.abs(mouseX - pointX) < threshold && Math.abs(mouseY - pointY) < threshold) {
                    tooltip.visible = true;
                    tooltip.x = pointX;
                    tooltip.y = pointY;
                    tooltip.text = `${ds.label}: ${smooth[i].toFixed(2)}`;
                    break; // stop after first match
                }
            }
            if(tooltip.visible) break;
        }
        draw(); // redraw with tooltip
    });

    function drawToolTip() {
        if(!tooltip.visible) return;

        const padding = 5;
        const fontSize = 14;
        context.font = `${fontSize}px sans-serif`;
        context.textBaseline = 'middle';
        const textWidth = context.measureText(tooltip.text).width;
        
        // Draw background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(tooltip.x + 10, tooltip.y - fontSize / 2, textWidth + 2 * padding, fontSize + 2 * padding);

        // Draw text
        context.fillStyle = "white";
        context.fillText(tooltip.text, tooltip.x + 10 + padding, tooltip.y + padding);
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function drawVerticalLines()
    {
        context.strokeStyle = 'gray';
        context.lineWidth = 1;
        
        for(let i = 0; i< width; i += xIncrement)
        {
            context.beginPath();
            context.moveTo(i, 0);
            context.lineTo(i, height);
            context.stroke();
        }
    }

    function drawHorizontalLines()
    {
        context.strokeStyle = 'gray';
        context.lineWidth = 1;

        for (let i = 0; i < height; i += yIncrement)
        {
            context.beginPath();
            context.moveTo(0, i);
            context.lineTo(width, i);
            context.stroke();
        }
    }

    function drawChart()
    {
        let minVal = parseFloat(minInput.value) || 0;
        let maxVal = parseFloat(maxInput.value) || height;        
        
        for(let ds of datasets) {
            if(!ds.data || ds.data.length === 0) continue;
            let smooth = movingAverage(ds.data, 4);
            smooth = smooth.map(v => clamp(v, minVal, maxVal));
            context.strokeStyle = ds.color;
            context.fillStyle = ds.color;
            context.lineWidth = 3;
            
            if(chartMode === "line") {
                context.beginPath();
                context.moveTo(0, height - smooth[0]);

                for (let i = 1; i < smooth.length; i++)
                {
                    context.lineTo(i * valueIncrement, height - smooth[i]);
                }

                context.stroke();
            }
            else if(chartMode === "bar") {
                for(let i=0;i<smooth.length;i++) {
                    let x = i * valueIncrement - valueIncrement /4;
                    let y = height - smooth[i];
                    let w = valueIncrement / 2;
                    let h = smooth[i];
                    context.fillRect(x, y, w, h);
                }
            }
            else if(chartMode === "area") {
                context.beginPath();
                context.moveTo(0, height);

                for(let i=0;i<smooth.length;i++) {
                    context.lineTo(i * valueIncrement, height - smooth[i]);
                }
                context.lineTo(smooth.length * valueIncrement, height);
                context.closePath();
                context.fill();
            }
            else if(chartMode === "scatter") {
                for(let i=0;i<smooth.length;i++) {
                    let x = i * valueIncrement;
                    let y = height - smooth[i];
                    context.beginPath();
                    context.arc(x,y,4,0,Math.PI * 2);
                    context.fill();
                }
            }
        }
    }

    function generateInitialData() {
        let points = Math.floor(width / valueIncrement);
        let minVal = parseFloat(minInput.value) || 0;
        let maxVal = parseFloat(maxInput.value) || height;
        for(let ds of datasets) {
            ds.data = []
            for(let i=0;i<=points;i++) {
                ds.data.push(clamp(ds.generator(), minVal, maxVal));
            }
        }
    }

    function updateData() {
        let minVal = parseFloat(minInput.value) || 0;
        let maxVal = parseFloat(maxInput.value) || height;
        for(let ds of datasets) {
            let newValue = ds.generator();
            newValue = clamp(newValue, minVal, maxVal);
            ds.data.push(newValue);
            ds.data.shift();
        }
    }
    function toggleChart() { 
        isRunning = !isRunning; // <--- properly flips the value
        document.getElementById("toggleButton").textContent = isRunning ? "Stop" : "Start";

        if(isRunning) startInterval();
    }

    function drawVerticalLabels()
    {
        for (let i = 0; i < height; i += yIncrement)
        {
            context.strokeText(height - i, textOffset, i + 2 * textOffset);
        }
    }

    function drawHorizontalLabels()
    {
        for (let i = 0; i < width; i+=xIncrement)
        {
            context.strokeText(i, i + textOffset, height - 20);
        }
    }

    function movingAverage(array, windowSize = 5) {
        let smoothed = []
        for(let i=0;i<array.length;i++) {
            let start = Math.max(0, i-windowSize);
            let end = Math.min(array.length - 1, i + windowSize);
            let sum = 0, count = 0;
            for(let j=start;j<=end;j++) {
                sum += array[j];
                count++;
            }
            smoothed.push(sum / count);
        }
        return smoothed;
    }

    function generateRandomNumber()
    {
        return parseInt(Math.random() * height);
    }

    function draw()
    {
        if(isRunning) {
            context.clearRect(0, 0, width, height);
            context.strokeStyle = 'black';
            context.lineWidth = 1;
            
            drawChart();
            if(showGrid) {
                drawVerticalLines();
                drawHorizontalLines();
            }
            drawToolTip();
            
            context.strokeStyle = 'black';
            context.lineWidth = 1;
            drawHorizontalLabels();
            drawVerticalLabels();

            updateStats();
        } 
    }

    function startInterval() {
        if(intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
            if(isRunning) {
                updateData();
                draw();
            }
        }, updateTime);
    }

    function updateStats() {
        let minVal = Infinity;
        let maxVal = -Infinity;
        let allValues = [];

        let currentValues = [];

        // Go through each dataset
        for(let ds of datasets) {
            if(!ds.data || ds.data.length === 0) continue;
            let lastVal = ds.data[ds.data.length-1];
            currentValues.push(lastVal);

            allValues.push(...ds.data);

            minVal = Math.min(minVal, ...ds.data);
            maxVal = Math.max(maxVal, ...ds.data);
        }

        let avg = allValues.reduce((a,b) => a+b, 0) / allValues.length;

        // Trend: compare new points vs older
        let trend = "Stable";
        let recent = allValues.slice(-20);
        let previous = allValues.slice(-40, -20);

        if(recent.length && previous.length) {
            let rAvg = recent.reduce((a,b)=>a+b,0)/recent.length;
            let pAvg = previous.reduce((a,b)=>a+b,0)/previous.length;
            if(rAvg > pAvg) trend = "Rising";
            else if(rAvg < pAvg) trend = "Falling";
        }

        // Update HTML Content
        document.getElementById("valStats").textContent = `Values: A=${currentValues[0]?.toFixed(2)}
        , B=${currentValues[1]?.toFixed(2)}, C=${currentValues[2]?.toFixed(2)}`;

        document.getElementById("minMaxStats").textContent = `Max = ${maxVal.toFixed(2)} || Min = ${minVal.toFixed(2)}`;
        
        document.getElementById("avgTrendStats").textContent = `Avg: ${avg.toFixed(2)} || ${trend}`;
    }

    generateInitialData();
    draw();
}