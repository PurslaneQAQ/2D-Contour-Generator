var BSpline = function(canvasId)
{
	// Set up all the data related to drawing the curve
	this.cId = canvasId;
	this.dCanvas = document.getElementById(this.cId);
	this.ctx = this.dCanvas.getContext('2d');
	this.dCanvas.addEventListener('resize', this.computeCanvasSize());
	this.computeCanvasSize();

	// Setup all the data related to the actual curve.
	this.nodes = new Array();
	this.showControlPolygon = true;
	this.showTangents = true;

	// Assumes a equal parametric split strategy
	this.numSegments = 16;

	// Setup event listeners
	this.cvState = CVSTATE.Idle;
	this.activeNode = null;

	// closure
	var that = this;

	// Event listeners
	this.dCanvas.addEventListener('mousedown', function(event) {
        that.mousePress(event);
    });

	this.dCanvas.addEventListener('mousemove', function(event) {
		that.mouseMove(event);
	});

	this.dCanvas.addEventListener('mouseup', function(event) {
		that.mouseRelease(event);
	});

	this.dCanvas.addEventListener('mouseleave', function(event) {
		that.mouseRelease(event);
	});
}

BSpline.prototype.setShowControlPolygon = function(bShow)
{
	this.showControlPolygon = bShow;
}

BSpline.prototype.setNumSegments = function(val)
{
	this.numSegments = val;
}

BSpline.prototype.mousePress = function(event)
{
	if (event.button == 0) {
		this.activeNode = null;
		var pos = getMousePos(event);

		// Try to find a node below the mouse
		for (var i = 0; i < this.nodes.length; i++) {
			if (this.nodes[i].isInside(pos.x,pos.y)) {
				this.activeNode = this.nodes[i];
				break;
			}
		}
	}

	// No node selected: add a new node
	if (this.activeNode == null) {
		this.addNode(pos.x,pos.y);
		this.activeNode = this.nodes[this.nodes.length-1];
	}

	this.cvState = CVSTATE.SelectPoint;
	event.preventDefault();
}

BSpline.prototype.mouseMove = function(event) {
	if (this.cvState == CVSTATE.SelectPoint || this.cvState == CVSTATE.MovePoint) {
		var pos = getMousePos(event);
		this.activeNode.setPos(pos.x,pos.y);
	} else {
		// No button pressed. Ignore movement.
	}
}

BSpline.prototype.mouseRelease = function(event)
{
	this.cvState = CVSTATE.Idle; this.activeNode = null;
}

BSpline.prototype.computeCanvasSize = function()
{
	var renderWidth = Math.min(this.dCanvas.parentNode.clientWidth - 20, 820);
    var renderHeight = Math.floor(renderWidth*9.0/16.0);
    this.dCanvas.width = renderWidth;
    this.dCanvas.height = renderHeight;
}

BSpline.prototype.drawControlPolygon = function()
{
	for (var i = 0; i < this.nodes.length-1; i++)
		drawLine(this.ctx, this.nodes[i].x, this.nodes[i].y,
					  this.nodes[i+1].x, this.nodes[i+1].y);
}

BSpline.prototype.drawControlPoints = function()
{
	for (var i = 0; i < this.nodes.length; i++)
		this.nodes[i].draw(this.ctx);
}

BSpline.prototype.draw = function()
{

// ################ Edit your code below
	// TODO: Task 6: Draw the B-Spline curve (see the assignment for more details)
	// Hint: You can base this off of your Catmull-Rom code
	setColors(this.ctx,'black');

    for(let i = 0; i < this.nodes.length-3; i++){
		var p0 = this.nodes[i];
		var p1 = this.nodes[i+1];
		var p2 = this.nodes[i+2];
		var p3 = this.nodes[i+3];

		var crBasis = new SimpleMatrix(-1, 3, -3, 1, 3, -6, 3, 0, -3, 0, 3, 0, 1, 4, 1, 0);
		var cVector = new SimpleMatrix(p0.x, p0.y, 0, 0, p1.x, p1.y, 0, 0, p2.x, p2.y, 0, 0, p3.x, p3.y, 0, 0);
		
		var basis = SimpleMatrix.multiply(crBasis, cVector);
		var lastPoint = p0;
		for(let i = 0; i <= this.numSegments; i++){
			let u = i * 1.0 / this.numSegments;
			let u2 = u*u;
			let u3 = u2*u;
			var p = basis.transpose().multiplyVector([u3, u2, u, 1]);
			p[0] /= 6;
			p[1] /= 6;
			drawLine(this.ctx, lastPoint[0], lastPoint[1], p[0], p[1]);
			lastPoint = p;
		}
	}
// ################

}

// NOTE: Task 6 code.
BSpline.prototype.drawTask6 = function()
{
	// clear the rect
	this.ctx.clearRect(0, 0, this.dCanvas.width, this.dCanvas.height);

    if (this.showControlPolygon) {
		// Connect nodes with a line
        setColors(this.ctx,'rgb(10,70,160)');
        for (var i = 1; i < this.nodes.length; i++) {
            drawLine(this.ctx, this.nodes[i-1].x, this.nodes[i-1].y, this.nodes[i].x, this.nodes[i].y);
        }
		// Draw nodes
		setColors(this.ctx,'rgb(10,70,160)','white');
		for (var i = 0; i < this.nodes.length; i++) {
			this.nodes[i].draw(this.ctx);
		}
    }

	// We need atleast 4 points to start rendering the curve.
    if(this.nodes.length < 4) return;

	// Draw the curve
	this.draw();

}


// Add a control point to the curve
BSpline.prototype.addNode = function(x,y)
{
	this.nodes.push(new Node(x,y));
}
