// this p5 sketch is written in instance mode
// read more here: https://github.com/processing/p5.js/wiki/Global-and-instance-mode

function sketch(parent) { // we pass the sketch data from the parent
  return function( p ) { // p could be any variable name
    // p5 sketch goes here
    let canvas;
    let grid, spacing, multiplier;
    let recentHover = false;
    let selectedLine = [];

    p.setup = function() {
      let target = parent.$el;
      let width = target.clientWidth;
      let height = target.clientHeight;

      canvas = p.createCanvas(width, height);
      canvas.parent(parent.$el);

      p.stroke(255,0,0);
      p.noLoop();
      drawLines(parent.data);
    };

    p.draw = function() {
    };

    // this is a new function we've added to p5
    // it runs only if the data changes
    p.dataChanged = function(data, oldData) {
      // console.log('data changed');
      // console.log('x: ', val.x, 'y: ', val.y);
      drawLines(data);
    };

    // uses some logic from https://stackoverflow.com/a/33558386
    p.windowResized = function() {
      // Hide the canvas so we can get the parent's responsive bounds
      let displayBackup = canvas.elt.style.display;
      canvas.elt.style.display = 'none';

      // measure parent without canvas
      let target = parent.$el;
      let width = target.clientWidth;
      let height = target.clientHeight;

      // resize canvas
      p.resizeCanvas(width, height);

      // restore canvas visibility
      canvas.elt.style.display = displayBackup;

      drawLines(parent.data);
    };

    p.mouseMoved = function() {

      if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {

        recentHover = true;
        drawLines(parent.data);
        
        let minLine = getNearestLine(p.mouseX, p.mouseY);

        if (minLine.length > 0) {
          p.push();
            p.translate(p.width / 2, p.height / 2);
            p.stroke(0, 255, 0);
            drawLine(multiplier * minLine[0], spacing * minLine[1]);
          p.pop();

          selectedLine = minLine;
        }

      } else if (recentHover) {
        recentHover = false;
        selectedLine = [];
        drawLines(parent.data);
      }

    };

    p.mouseClicked = function() {
      if (selectedLine.length > 0) {
        updateSelectedLines(selectedLine);
      }
    };

    // algorithm for identifying closest line
    // needs testing, could be optimized
    function getNearestLine(mouseX, mouseY) {

      let minDist = spacing;
      let minLine = [];

      for (let [angle, index] of grid) {
        let dist = p.abs(getXVal(multiplier * angle, spacing * index, mouseY - p.height/2) - (mouseX - p.width/2));

        if (!isNaN(dist)) {
          if (dist < minDist) {
            minLine = [angle, index];
            minDist = dist;
          }
        } 

        dist = p.abs(getYVal(multiplier * angle, spacing * index, mouseX - p.width/2) - (mouseY - p.height/2));
        if (!isNaN(dist)) {
          if (dist < minDist) {
            minLine = [angle, index];
            minDist = dist;
          }
        }        
      }

      if (minDist < 10 && minDist < spacing) {
        return minLine;
      } else {
        return [];
      }
    }

    function updateSelectedLines(line) {

      let index = parent.data.selectedLines.findIndex(e => e[0] == line[0] && e[1] == line[1]);

      if (index < 0) {
        let selectedLines = [...parent.data.selectedLines];
        selectedLines.push(line);
        parent.$emit('update:selected-lines', selectedLines); 
      } else {
        let selectedLines = parent.data.selectedLines.filter((e,i) => i !== index);
        parent.$emit('update:selected-lines', selectedLines); 
      }

    }

    function drawLines(data) {
      grid = data.grid;
      let steps = data.steps;
      multiplier = data.multiplier;
      spacing = p.min(p.width, p.height) / (steps);
      spacing = spacing * data.zoom; // zoom out to show parallel lines

      p.push();
      p.background(0, 0, 0.2 * 255);
      p.translate(p.width / 2, p.height / 2);

      let selectedLines = parent.data.selectedLines;

      for (let [angle, index] of grid) {
        if (selectedLines.filter(e => e[0] == angle && e[1] == index).length > 0) {
          p.stroke(0, 255, 0);
        } else {
          p.stroke(255, 0, 0);
        }
        drawLine(multiplier * angle, spacing * index);
      }


      if (data.showIntersections) {
        p.noStroke();
        p.fill(255);
        for (let pt of Object.values(data.intersectionPoints)) {
          p.ellipse(pt.x * spacing, pt.y * spacing, 4);
        }
      }

      // intersections corresponding to selected tiles
      p.noStroke();
      p.fill(0, 255, 0);
      for (let tile of data.selectedTiles) {
        p.ellipse(tile.x * spacing, tile.y * spacing, 5);
      }
      
      p.pop();
    }

    // angle, index
    function drawLine(angle, index) {
      let x0 = getXVal(angle, index, -p.height/2);
      let x1 = getXVal(angle, index, p.height/2);
      if (!isNaN(x0) && !isNaN(x1)) {
        p.line(x0, -p.height/2, x1, p.height/2);
      } else {
        let y0 = getYVal(angle, index, -p.width/2);
        let y1 = getYVal(angle, index, p.width/2);
        p.line(-p.width/2, y0, p.width/2, y1);
      }
    }

    // angle, index
    function getXVal(angle, index, y) {
      return (index - y * p.sin(angle))/p.cos(angle);
    }

    // angle, index
    function getYVal(angle, index, x) {
      return (index - x * p.cos(angle))/p.sin(angle);
    }

  };
}
