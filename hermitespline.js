var HermiteSpline = function(dCanvas, manager)
{
	this.dCanvas = dCanvas;
	this.manager = manager;
	this.ctx = this.dCanvas.getContext('2d');
	this.dCanvas.addEventListener('resize', this.computeCanvasSize());
	this.computeCanvasSize();
	this.closed = false;

	// Setup all the data related to the actual curve.
	this.nodes = new Array();
	this.tangents = new Array();
	this.status = 2;
	//status: -1: deleted, 0: hidden, 1: normal, 2: active

	// Setup event listeners
	this.cvState = CVSTATE.Idle;
	this.movingTangent = -1;

}

HermiteSpline.prototype.closeCurve = function(){
	if(this.nodes.length < 3){
		alert("No enough nodes!");
		return;
	}
	else if(this.closed){
		console.log("Already closed!")
	}
	else{
		// Update tangent of last node
		let lastNode = this.nodes.length-1;
		let tangent = Node.sub(this.nodes[0], this.nodes[lastNode-1]);
		tangent.x *= this.manager.initialTension/2;
		tangent.y *= this.manager.initialTension/2;
		let len = tangent.length();
		tangent = tangent.multiply(1./len);
		this.tangents[lastNode] = [{"dir":tangent, "len": len}, {"dir":tangent, "len": len}];

		// Update tangent of the first
		let tangent2 = Node.sub(this.nodes[1], this.nodes[lastNode]);
		tangent2.x *= this.manager.initialTension/2;
		tangent2.y *= this.manager.initialTension/2;
		len = tangent2.length();
		tangent2 = tangent2.multiply(1./len);
		this.tangents[0] = [{"dir":tangent2, "len": len}, {"dir":tangent2, "len": len}];

		this.closed = true;
	}
}

HermiteSpline.prototype.storeCurve = async function(){
	data = await this.draw('save');
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

HermiteSpline.prototype.deleteCurve = function(){
	this.nodes.length = 0;
	this.tangents.length = 0;
	this.status = -1;
	this.closed = true;
}

HermiteSpline.prototype.computeCanvasSize = function()
{
	var renderWidth = Math.min(this.dCanvas.parentNode.clientWidth - 20, 820);
    var renderHeight = Math.floor(renderWidth*3.0/4.0);
    this.dCanvas.width = renderWidth;
    this.dCanvas.height = renderHeight;
}

HermiteSpline.prototype.drawTangents = function()
{	
	if(this.status == 2 && this.manager.activeNode != -1){
		let ind = this.manager.activeNode;
		var tangent = [this.tangents[ind][0].dir.multiply(this.tangents[ind][0].len), this.tangents[ind][1].dir.multiply(this.tangents[ind][1].len)];

		var t_end1 = Node.sub(this.nodes[ind], tangent[0]);
		var t_end2 = Node.sum(this.nodes[ind], tangent[1]);
		setColors(this.ctx,'rgb(220,200,0)', 'white');
		drawLine(this.ctx, this.nodes[ind].x, this.nodes[ind].y, t_end1.x, t_end1.y);
		drawLine(this.ctx, this.nodes[ind].x, this.nodes[ind].y, t_end2.x, t_end2.y);
		t_end1.draw(this.ctx);
		t_end2.draw(this.ctx);
	}
}

HermiteSpline.prototype.draw = function()
{
	// if(arguments[0]){
	// 	var data = "";
	// 	var curveNum = 0;
	// }
	// for(let c = 0; c <= this.lastCurve; c++){
		// if(this.status[c] != 1)continue;
		// if(arguments[0]){
		// 	var tempData = "";
		// 	var count = 0;
		// 	curveNum++;
		// }
		// else if(c != this.activeCurve){
		// 	setColors(this.ctx,'black');
		// }
		// else {
		// 	setColors(this.ctx, 'rgb(13, 87, 133)');
		// }
		if(this.status == 2){
			setColors(this.ctx, 'rgb(13, 87, 133)');
		}
		else if(this.status == 1){
			setColors(this.ctx,'black');
		}
		else {
			return;
		}
		let maxNode = this.closed? this.nodes.length:this.nodes.length-1;
		for(let i = 0; i < maxNode; i++){
			// if(arguments[0]){
			// 	var curvelength = 0;
			// }
			var p0 = this.nodes[i];
			let p1Id = (i+1)%this.nodes.length;
			var p1 = this.nodes[p1Id];
			var t0 = this.tangents[i][1].dir.multiply(this.tangents[i][1].len * 2);
			var t1 = this.tangents[p1Id][0].dir.multiply(this.tangents[p1Id][0].len * 2);

			var crBasis = new SimpleMatrix(2, -2, 1, 1, -3, 3, -2, -1, 0, 0, 1, 0, 1, 0, 0, 0);
			var cVector = new SimpleMatrix(p0.x, p0.y, 0, 0, p1.x, p1.y, 0, 0, t0.x, t0.y, 0, 0, t1.x, t1.y, 0, 0);
			
			var basis = SimpleMatrix.multiply(crBasis, cVector).transpose();
			//var lastPoint = [p0.x, p0.y];
			var segNum = this.manager.numSegments;
			for(let i = 0; i <= segNum; i++){
				var u = i * 1.0 / segNum;
				let u2 = u*u;
				let u3 = u2*u;
				var p = basis.multiplyVector([u3, u2, u, 1]);
				// if(arguments[0]){
				// 	if(lastPoint){
				// 		let dist = new Node(lastPoint[0]-p[0], lastPoint[1]-p[1]);
				// 		//console.log(dist);
				// 		curvelength += dist.length();
				// 	}
				// }
				// else{
					if(lastPoint)drawLine(this.ctx, lastPoint[0], lastPoint[1], p[0], p[1]);
				//}
				var lastPoint = p;
			}
			// if(arguments[0]){
			// 	segNum = 1>curvelength/20? 1: curvelength/20;
			// 	console.log(segNum);
			// 	for(let i = 0; i <= segNum; i++){
			// 		var u = i * 1.0 / segNum;
			// 		let u2 = u*u;
			// 		let u3 = u2*u;
			// 		var p = basis.multiplyVector([u3, u2, u, 1]);
					
			// 		tempData+=`${(5 * (p[0]-this.dCanvas.width/2)/this.dCanvas.width).toFixed(7)} ${-(5 * (p[1]-this.dCanvas.height/2)/this.dCanvas.width).toFixed(7)} \n`;
			// 		count++;
			// 	}
			// }
			lastPoint = null;
		}
	// 	if(arguments[0]){
	// 		data += count + "\n" + tempData;
	// 	//}
	// }
	// if(arguments[0]){
	// 	data = `2dContour ${curveNum} \n${data}`;
	// 	return data;
	// }
}

// NOTE: Task 5 code.
HermiteSpline.prototype.drawCurve = function()
{
	// clear the rect
    if (this.status == 2 && (!this.closed || this.manager.showControlPolygon)){
		// Connect nodes with a line
        setColors(this.ctx,'rgb(54,151,220)');
		for (var i = 1; i < this.nodes.length; i++) {
			drawLine(this.ctx, this.nodes[i-1].x, this.nodes[i-1].y, this.nodes[i].x, this.nodes[i].y);
		}
		setColors(this.ctx,'rgb(54,151,220)','white');
		for (var i = 0; i < this.nodes.length; i++) {
			this.nodes[i].draw(this.ctx);
		}
    }

	// We need at least 1 point to start rendering the curve.
    if(this.nodes.length < 1) return;

	// Draw the curve
	this.draw();
	this.drawTangents();
}


// Add a control point to the curve
HermiteSpline.prototype.addNode = function(x,y)
{
	this.nodes.push(new Node(x,y));
	let dir = new Node(0, 0);
	this.tangents.push([{"dir":dir, "len": 0}, {"dir":dir, "len": 0}]);
	let lastNode = this.nodes.length-1;
	if(lastNode > 0){
		let tangent = Node.sub(this.nodes[lastNode], this.nodes[lastNode-1]);
		tangent.x *= this.manager.initialTension/2;
		tangent.y *= this.manager.initialTension/2;
		let len = tangent.length();
		tangent = tangent.multiply(1./len);
		tangent2 = new Node(tangent.x, tangent.y);
		this.tangents[lastNode - 1] = [{"dir":tangent, "len": len}, {"dir":tangent, "len": len}];
		this.tangents[lastNode] = [{"dir":tangent2, "len": len}, {"dir":tangent2, "len": len}];
	}
	if(lastNode > 1){
		let tangent = Node.sub(this.nodes[lastNode], this.nodes[lastNode-2]);
		tangent.x *= this.manager.initialTension/2;
		tangent.y *= this.manager.initialTension/2;
		let len = tangent.length();
		tangent = tangent.multiply(1./len);
		tangent2 = new Node(tangent.x, tangent.y);
		this.tangents[lastNode - 1] = [{"dir":tangent, "len": len}, {"dir":tangent, "len": len}];
	}
}