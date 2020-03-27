var CatmullRomSpline = function(canvasId, tensionSliderId, printTension)
{
	// Set up all the data related to drawing the curve
	this.cId = canvasId;
	this.dCanvas = document.getElementById(this.cId);
	this.ctx = this.dCanvas.getContext('2d');
	this.dCanvas.addEventListener('resize', this.computeCanvasSize());
	this.tensionSlider = document.getElementById(tensionSliderId);
	this.printTension = printTension;
	this.computeCanvasSize();
	this.closed = false;

	// Setup all the data related to the actual curve.
	this.nodes = new Array();
	this.nodes.push(new Array());
	this.tangents = new Array();
	this.tangents.push(new Array());

	this.lastCurve = 0;
	this.showControlPolygon = true;
	this.showTangents = false;

	// Assumes a equal parametric split strategy
	this.numSegments = 8;

	// Global tension parameter
	this.tension = 0.5;

	// Setup event listeners
	this.cvState = CVSTATE.Idle;
	this.activeCurve = 0;
	this.activeNode = -1;

	this.movingTangent = -1;

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

CatmullRomSpline.prototype.setShowControlPolygon = function(bShow)
{
	this.showControlPolygon = bShow;
}

CatmullRomSpline.prototype.setShowTangents = function(bShow)
{
	this.showTangents = bShow;
}

// CatmullRomSpline.prototype.setTension = function(val)
// {
// 	this.tension = val;
// 	if(this.activeNode != -1){
// 		this.tangents[this.activeCurve][this.activeNode] = val;
// 	}
// 	if(!this.closed && this.nodes[this.lastCurve].length>1){
// 		this.tangents[this.lastCurve][this.nodes[this.lastCurve].length-2] = val;
// 	}
// }

// CatmullRomSpline.prototype.setTensionSlider = function(val){
// 	this.tensionSlider.value = val;
// 	this.printTension();
// }

CatmullRomSpline.prototype.setNumSegments = function(val)
{
	this.numSegments = val;
}

CatmullRomSpline.prototype.newCurve = function(val)
{
	if(!this.closed)alert("Please close recent curve first!");
	else {
		this.nodes.push(new Array());
		this.tangents.push(new Array());
		this.lastCurve++;
		this.closed = false;
		this.activeCurve = this.lastCurve;
		this.activeNode = -1;
	}
}

CatmullRomSpline.prototype.closeCurve = function(){
	if(this.nodes[this.lastCurve].length < 3){
		alert("No enough nodes!");
		return;
	}
	else if(this.closed){
		console.log("Already closed!")
	}
	else{
		// Update tangent of last node
		let lastNode = this.nodes[this.lastCurve].length-1;
		let tangent = Node.sub(this.nodes[this.lastCurve][0], this.nodes[this.lastCurve][lastNode-1]);
		tangent.x *= 0.5;
		tangent.y *= 0.5;
		this.tangents[this.lastCurve][lastNode] = [tangent, new Node(tangent.x, tangent.y)];

		// Update tangent of the first
		tangent = Node.sub(this.nodes[this.lastCurve][1], this.nodes[this.lastCurve][lastNode]);
		tangent.x *= 0.5;
		tangent.y *= 0.5;
		this.tangents[this.lastCurve][0] = [tangent, new Node(tangent.x, tangent.y)];

		this.closed = true;
	}
}

CatmullRomSpline.prototype.storeCurve = function(){
	data = this.draw('save');
	filename = "contour.txt";
	var file = new Blob([data]);
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

CatmullRomSpline.prototype.mousePress = function(event)
{
	if (event.button == 0) {
		
		var pos = getMousePos(event);

		this.movingTangent = -1;

		if(this.activeNode != -1){
			let ind = this.activeNode;
			let tangent = this.tangents[this.activeCurve][ind];
			let t_end1 = Node.sub(this.nodes[this.activeCurve][ind], tangent[0]);
			let t_end2 = Node.sum(this.nodes[this.activeCurve][ind], tangent[1]);
			if (t_end1.isInside(pos.x,pos.y)) {
				this.movingTangent = 0;
				var flag = true;
			}
			else if (t_end2.isInside(pos.x,pos.y)) {
				this.movingTangent = 1;
				var flag = true;
			}
		}
		
		if(!flag){
			this.activeNode = -1;

			// Try to find a node below the mouse
			for(var c = 0; c < this.nodes.length; c++){
				for (var i = 0; i < this.nodes[c].length; i++) {
					if (this.nodes[c][i].isInside(pos.x,pos.y)) {
						this.activeCurve = c;
						this.activeNode = i;
						//this.setTensionSlider(this.tangents[c][i]);
						//this.tension = this.tangents[c][i];
						break;
					}
				}
			}

			// No node selected: add a new node
			if (this.activeNode == -1) {
				if(!this.closed){
					this.addNode(pos.x,pos.y);
					this.activeNode = this.nodes[this.lastCurve].length-1;
				}
			}
		}
		this.cvState = CVSTATE.SelectPoint;
		event.preventDefault();
	}
}

CatmullRomSpline.prototype.mouseMove = function(event) {
	if (this.activeNode != -1 &&(this.cvState == CVSTATE.SelectPoint || this.cvState == CVSTATE.MovePoint)) {
		var pos = getMousePos(event);
		if(this.movingTangent != -1){
			let node = this.nodes[this.activeCurve][this.activeNode];
			if(this.movingTangent == 0)
				this.tangents[this.activeCurve][this.activeNode][this.movingTangent].setPos(node.x - pos.x,  node.y - pos.y);
			else{
				this.tangents[this.activeCurve][this.activeNode][this.movingTangent].setPos(pos.x - node.x, pos.y - node.y);
			}
		}
		else {
			this.nodes[this.activeCurve][this.activeNode].setPos(pos.x,pos.y);
		}
		// if(this.closed){
		// 	if(this.activeNode < 3)
		// 		this.nodes[this.lastCurve][this.nodes[this.lastCurve].length - 3 + this.activeNode].setPos(pos.x,pos.y);
		// 	else if(this.activeNode >= this.nodes[this.lastCurve].length - 3)
		// 		this.nodes[this.lastCurve][this.activeNode - (this.nodes[this.lastCurve].length - 3)].setPos(pos.x,pos.y);
		// } 
	} else {
		// No button pressed. Ignore movement.
	}
}

CatmullRomSpline.prototype.mouseRelease = function(event)
{
	this.cvState = CVSTATE.Idle; //this.activeNode = null;
	this.movingTangent = -1;
}

CatmullRomSpline.prototype.computeCanvasSize = function()
{
	var renderWidth = Math.min(this.dCanvas.parentNode.clientWidth - 20, 820);
    var renderHeight = Math.floor(renderWidth*9.0/16.0);
    this.dCanvas.width = renderWidth;
    this.dCanvas.height = renderHeight;
}

CatmullRomSpline.prototype.drawControlPolygon = function()
{
	for (var i = 0; i < this.nodes[this.lastCurve].length-1; i++)
		drawLine(this.ctx, this.nodes[this.lastCurve][i].x, this.nodes[this.lastCurve][i].y,
					  this.nodes[this.lastCurve][i+1].x, this.nodes[this.lastCurve][i+1].y);
}

CatmullRomSpline.prototype.drawControlPoints = function()
{
	for (var i = 0; i < this.nodes[this.lastCurve].length; i++)
		this.nodes[this.lastCurve][i].draw(this.ctx);
}

CatmullRomSpline.prototype.drawTangents = function()
{

// ################ Edit your code below
	// TODO: Task 4
    // Compute tangents at the nodes and draw them using drawLine(this.ctx, x0, y0, x1, y1);
	// Note: Tangents are available only for 2,..,n-1 nodes. The tangent is not defined for 1st and nth node.
    // The tangent of the i-th node can be computed from the (i-1)th and (i+1)th node
	// Normalize the tangent and compute a line with a length of 50 pixels from the current control point.
	
	if(this.activeNode != -1){
		let ind = this.activeNode;
		var tangent = this.tangents[this.activeCurve][ind];

		var t_end1 = Node.sub(this.nodes[this.activeCurve][ind], tangent[0]);
		var t_end2 = Node.sum(this.nodes[this.activeCurve][ind], tangent[1]);
		setColors(this.ctx,'rgb(220,200,0)');
		drawLine(this.ctx, this.nodes[this.activeCurve][ind].x, this.nodes[this.activeCurve][ind].y, t_end1.x, t_end1.y);
		drawLine(this.ctx, this.nodes[this.activeCurve][ind].x, this.nodes[this.activeCurve][ind].y, t_end2.x, t_end2.y);
		t_end1.draw(this.ctx);
		t_end2.draw(this.ctx);
	}
	// else {
	// 	for(let i = 0; i < this.nodes[this.activeCurve].length; i++){
	// 		var tangent = this.tangents[this.activeCurve][i];

	// 		var t_end1 = Node.sub(this.nodes[this.lastCurve][i], tangent[0]);
	// 		var t_end2 = Node.sum(this.nodes[this.lastCurve][i], tangent[1]);
	// 		setColors(this.ctx,'rgb(220,200,0)');
	// 		drawLine(this.ctx, this.nodes[this.lastCurve][i].x, this.nodes[this.lastCurve][i].y, t_end1.x, t_end1.y);
	// 		drawLine(this.ctx, this.nodes[this.lastCurve][i].x, this.nodes[this.lastCurve][i].y, t_end2.x, t_end2.y);
	// 	}
	// }
// ################

}

CatmullRomSpline.prototype.draw = function()
{
	if(arguments[0]){
		var data = "";
	}
	for(let c = 0; c <= this.lastCurve; c++){
		if(arguments[0]){
			var tempData = "";
			var count = 0;
		}
		let maxNode = c < this.lastCurve || this.closed? this.nodes[c].length:this.nodes[c].length-1;
		for(let i = 0; i < maxNode; i++){
			if(c != this.activeCurve || i != this.activeNode){
				setColors(this.ctx,'black');
			}
			else {
				setColors(this.ctx,'blue');
			}
			var p0 = this.nodes[c][i];
			var p1 = this.nodes[c][(i+1)%this.nodes[c].length];
			var t0 = this.tangents[c][i][1];
			var t1 = this.tangents[c][(i+1)%this.nodes[c].length][0];

			var crBasis = new SimpleMatrix(2, -2, 1, 1, -3, 3, -2, -1, 0, 0, 1, 0, 1, 0, 0, 0);
			var cVector = new SimpleMatrix(p0.x, p0.y, 0, 0, p1.x, p1.y, 0, 0, t0.x, t0.y, 0, 0, t1.x, t1.y, 0, 0);
			
			var basis = SimpleMatrix.multiply(crBasis, cVector).transpose();
			//var lastPoint = [p0.x, p0.y];
			var segNum = this.numSegments;
			for(let i = 0; i <= segNum; i++){
				var u = i * 1.0 / segNum;
				let u2 = u*u;
				let u3 = u2*u;
				var p = basis.multiplyVector([u3, u2, u, 1]);
				if(arguments[0]){
					tempData+=`${(5 * (p[0]-this.dCanvas.width/2)/this.dCanvas.width).toFixed(7)} ${(5 * (p[1]-this.dCanvas.height/2)/this.dCanvas.width).toFixed(7)} \n`;
					count++;
				}
				else{
					if(lastPoint)drawLine(this.ctx, lastPoint[0], lastPoint[1], p[0], p[1]);
				}
				var lastPoint = p;
			}
			lastPoint = null;
		}
		if(arguments[0]){
			data += count + "\n" + tempData;
		}
	}
	if(arguments[0]){
		data = `2dContour ${this.lastCurve + 1} \n${data}`;
		return data;
	}
}

// NOTE: Task 5 code.
CatmullRomSpline.prototype.drawTask5 = function()
{
	// clear the rect
	this.ctx.clearRect(0, 0, this.dCanvas.width, this.dCanvas.height);

    if (this.showControlPolygon) {
		// Connect nodes with a line
        setColors(this.ctx,'rgb(10,70,160)');
        for(var c = this.closed? 0:this.lastCurve; c < this.nodes.length; c++){
			for (var i = 1; i < this.nodes[c].length; i++) {
                drawLine(this.ctx, this.nodes[c][i-1].x, this.nodes[c][i-1].y, this.nodes[c][i].x, this.nodes[c][i].y);
			}
		}
		// Draw nodes
		setColors(this.ctx,'rgb(10,70,160)','white');
		for(var c = this.closed? 0:this.lastCurve; c < this.nodes.length; c++){
			for (var i = 0; i < this.nodes[c].length; i++) {
				this.nodes[c][i].draw(this.ctx);
			}
		}
    }

	// We need atleast 1 point to start rendering the curve.
    if(this.lastCurve == 0 && this.nodes[this.lastCurve].length < 1) return;

	// Draw the curve
	this.draw();

	//if(this.showTangents)
	this.drawTangents();
}


// Add a control point to the curve
CatmullRomSpline.prototype.addNode = function(x,y)
{
	this.nodes[this.lastCurve].push(new Node(x,y));
	this.tangents[this.lastCurve].push([new Node(0, 0), new Node(0, 0)]);
	let lastNode = this.nodes[this.lastCurve].length-1;
	if(lastNode > 0){
		let tangent = Node.sub(this.nodes[this.lastCurve][lastNode], this.nodes[this.lastCurve][lastNode-1]);
		tangent.x *= 0.5;
		tangent.y *= 0.5;
		this.tangents[this.lastCurve][lastNode - 1] = [tangent, new Node(tangent.x, tangent.y)];
		this.tangents[this.lastCurve][lastNode] = [tangent, new Node(tangent.x, tangent.y)];
	}
	if(lastNode > 1){
		let tangent = Node.sub(this.nodes[this.lastCurve][lastNode], this.nodes[this.lastCurve][lastNode-2]);
		tangent.x *= 0.5;
		tangent.y *= 0.5;
		this.tangents[this.lastCurve][lastNode - 1] = [tangent, new Node(tangent.x, tangent.y)];
	}
	console.log(`Line ${this.lastCurve} : ${x} ${y} `)
}
