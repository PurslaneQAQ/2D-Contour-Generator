var HermiteSpline = function(dCanvas, manager, id)
{
	CanvasLayer.call(this, dCanvas, manager, id);

	this.closed = false;
	// Setup all the data related to the actual curve.
	this.nodes = new Array();
	this.tangents = new Array();
	//status: -1: deleted, 0: hidden, 1: normal, 2: active

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

HermiteSpline.prototype.deleteNode = function(nodeId) {
	if(	this.nodes.length > 3){
		this.nodes.splice(nodeId, 1);
	  this.tangents.splice(nodeId, 1);
	}
}

HermiteSpline.prototype.deleteCurve = function(){
	this.nodes.length = 0;
	this.tangents.length = 0;
	this.status = -1;
	this.closed = true;
}

HermiteSpline.prototype.drawTangents = function(_ctx)
{	
	const ctx = _ctx||this.ctx;
	if(this.status == 2 && this.manager.activeNode != -1){
		let ind = this.manager.activeNode;
		var tangent = [this.tangents[ind][0].dir.multiply(this.tangents[ind][0].len), this.tangents[ind][1].dir.multiply(this.tangents[ind][1].len)];

		var t_end1 = Node.sub(this.nodes[ind], tangent[0]);
		var t_end2 = Node.sum(this.nodes[ind], tangent[1]);
		setColors(ctx,'rgb(220,200,0)', 'white');
		drawLine(ctx, this.nodes[ind].x, this.nodes[ind].y, t_end1.x, t_end1.y);
		drawLine(ctx, this.nodes[ind].x, this.nodes[ind].y, t_end2.x, t_end2.y);
		t_end1.draw(ctx);
		t_end2.draw(ctx);
	}
}

HermiteSpline.prototype.export = function(numSegments)
{
	let data = "";
	let count = 0;
	let maxNode = this.closed? this.nodes.length:this.nodes.length-1;
	setColors(this.ctx,'black');
	for(let i = 0; i < maxNode; i++){
		var p0 = this.nodes[i];
		let p1Id = (i+1)%this.nodes.length;
		var p1 = this.nodes[p1Id];
		var t0 = this.tangents[i][1].dir.multiply(this.tangents[i][1].len * 2);
		var t1 = this.tangents[p1Id][0].dir.multiply(this.tangents[p1Id][0].len * 2);

		var crBasis = new SimpleMatrix(2, -2, 1, 1, -3, 3, -2, -1, 0, 0, 1, 0, 1, 0, 0, 0);
		var cVector = new SimpleMatrix(p0.x, p0.y, 0, 0, p1.x, p1.y, 0, 0, t0.x, t0.y, 0, 0, t1.x, t1.y, 0, 0);
		
		var basis = SimpleMatrix.multiply(crBasis, cVector).transpose();
		var lastPoint = [p0.x, p0.y];
		var segNum = this.manager.defaultSegments;
		let curvelength = 0;
		for(let i = 0; i <= segNum; i++){
			var u = i * 1.0 / segNum;
			let u2 = u*u;
			let u3 = u2*u;
			var p = basis.multiplyVector([u3, u2, u, 1]);
			if(lastPoint){
				let dist = new Node(lastPoint[0]-p[0], lastPoint[1]-p[1]);
				//console.log(dist);
				curvelength += dist.length();
			}
			lastPoint = p;
		}
		segNum = 1>curvelength/numSegments? 1: Math.floor(curvelength/numSegments);
		lastPoint = [p0.x, p0.y];
		data += this.manager.exportPos(lastPoint[0], lastPoint[1]);
		count++;
		for(let i = 1; i <= segNum; i++){
			var u = i / segNum;
			let u2 = u*u;
			let u3 = u2*u;
			var p = basis.multiplyVector([u3, u2, u, 1]);
			drawLine(this.ctx, lastPoint[0], lastPoint[1], p[0], p[1]);
			lastPoint = p;
			if (i != segNum){
				data += this.manager.exportPos(p[0], p[1]);
			  count++;
			}
		}
		drawLine(this.ctx, lastPoint[0], lastPoint[1], this.nodes[0][0], this.nodes[0][1]);
	}
	data = count + "\n" + data;
	return data;
}

HermiteSpline.prototype.draw = function(_ctx)
{
	const ctx = _ctx||this.ctx;
	if(this.status == 2){
		setColors(ctx, default_active_color);
	}
	else if(this.status == 1){
		setColors(ctx,'black');
	}
	else {
		return;
	}
	let left = this.dCanvas.width;
	let top = this.dCanvas.height;
	let right = 0;
	let bottom = 0;
	let maxNode = this.closed? this.nodes.length:this.nodes.length-1;
	let lastPoint;
	for(let i = 0; i < maxNode; i++){
		let p0 = this.nodes[i];
		let p1Id = (i+1)%this.nodes.length;
		let p1 = this.nodes[p1Id];
		let t0 = this.tangents[i][1].dir.multiply(this.tangents[i][1].len * 2);
		let t1 = this.tangents[p1Id][0].dir.multiply(this.tangents[p1Id][0].len * 2);

		let crBasis = new SimpleMatrix(2, -2, 1, 1, -3, 3, -2, -1, 0, 0, 1, 0, 1, 0, 0, 0);
		let cVector = new SimpleMatrix(p0.x, p0.y, 0, 0, p1.x, p1.y, 0, 0, t0.x, t0.y, 0, 0, t1.x, t1.y, 0, 0);
		
		let basis = SimpleMatrix.multiply(crBasis, cVector).transpose();
		lastPoint = [p0.x, p0.y];
		let segNum = this.manager.defaultSegments;
		for(let i = 1; i <= segNum; i++){
			let u = i * 1.0 / segNum;
			let u2 = u*u;
			let u3 = u2*u;
			let p = basis.multiplyVector([u3, u2, u, 1]);
			drawLine(ctx, lastPoint[0], lastPoint[1], p[0], p[1]);
			lastPoint = p;
			if(_ctx){
				if(p[0] < left){
					left = p[0];
				} else if(p[0] > right){
					right = p[0];
				}
				if(p[1] < top){
					top = p[1];
				} else if(p[1] > bottom){
					bottom = p[1];
				}
			}
		}
	}
	if(_ctx){
		this.left = left-10;
		this.top = top-10;
		this.width = right - left + 20;
		this.height = bottom - top + 20;
	}
	drawLine(ctx, lastPoint[0], lastPoint[1], this.nodes[0][0], this.nodes[0][1]);
}

HermiteSpline.prototype.drawCurve = function()
{
		if(this.status !== 2){
			if(this.change){
				this.saveDraw((ctx)=>{
					this.draw(ctx);
				});
				this.change = false;
			}
			this.defaultDraw();
		}else{
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
		
			// We need at least 2 points to start rendering the curve.
			if(this.nodes.length < 2) return;
		
			// Draw the curve
			this.draw();
			this.drawTangents();
		}
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