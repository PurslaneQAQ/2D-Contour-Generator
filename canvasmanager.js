function CanvasManager(id){
    this.canvas = $(`#${id}`)[0];
    this.ctx = this.canvas.getContext('2d');
    this.curves = new Array();
    this.points = new Array();
    this.pics = new Array();
    this.curveClosed = true;
    this.breakTangent = -1;

    this.activeCurve = -1;
    this.activeNode = -1;
    
    this.showControlPolygon = true;
    this.numSegments = 16;
    this.initialTension = 1;

    // closure
	var that = this;

	// Event listeners
	this.canvas.addEventListener('mousedown', function(event) {
        that.mousePress(event);
    });

	this.canvas.addEventListener('mousemove', function(event) {
		that.mouseMove(event);
	});

	this.canvas.addEventListener('mouseup', function(event) {
		that.mouseRelease(event);
	});

	this.canvas.addEventListener('mouseleave', function(event) {
		that.mouseRelease(event);
	});
}

CanvasManager.prototype.closeCurve = function(){
    if(!this.curveClosed && this.activeCurve != -1){
        this.curves[this.activeCurve].closeCurve();
        if(this.curves[this.activeCurve].closed == true){
            this.curveClosed = true;
            return true;
        }
        else{
            return false;
        }
    }
    return true;
}

CanvasManager.prototype.newCurve = function(){
    if(!this.curveClosed){
		alert("Please close recent curve first!");
		return false;
	}
	else {
        this.curves.push(new HermiteSpline(this.canvas, this));
        if(this.activeCurve != -1)this.curves[this.activeCurve].status = 1;
        this.activeCurve = this.curves.length - 1;
        this.activeNode = -1; 
		this.curveClosed = false;
		return true;
	}
}

CanvasManager.prototype.setShowControlPolygon = function(bShow)
{
	this.showControlPolygon = bShow;
}

CanvasManager.prototype.setNumSegments = function(val)
{
	this.numSegments = val;
}

CanvasManager.prototype.setInitTension = function(val)
{
	this.initialTension = val;
}

CanvasManager.prototype.setActiveCurve = function(activeCurve){
	console.log("Tring to set active curve " + activeCurve);
	if(this.activeCurve != activeCurve){
        if(this.activeCurve != -1)this.curves[this.activeCurve].status = 1;
        this.activeCurve = activeCurve;
        this.curves[activeCurve].status = 2;
        this.activeNode = -1;
	}
	console.log(this.activeCurve);
}

CanvasManager.prototype.disActiveCurve = function(curveId){
    // Looks strange but I'll take it for now
    this.activeNode = -1;
    this.curves[curveId].status = 1;
}

CanvasManager.prototype.getActiveCurve = function(){
    return this.activeCurve;
}

CanvasManager.prototype.getCloseStatus = function(){
    return this.curveClosed;
}

CanvasManager.prototype.getCurveStatus = function (curveId){
    return this.curves[curveId].status;
}

CanvasManager.prototype.hideCurve = function(curveId){
    console.log("Trying to hide curve "+ curveId);
    if(this.activeCurve == curveId && !this.curveClosed){
        alert("请先闭合当前曲线！");
        return false;
    }
    else if(this.activeCurve == curveId){
        this.activeCurve = -1;
    }
    this.curves[curveId].status = 0;
    return true;
}

CanvasManager.prototype.showCurve = function(curveId){
    this.curves[curveId].status = 1;
}

CanvasManager.prototype.newPointSet = function(){
    // To do
    this.points.push({});
    return true;
}

CanvasManager.prototype.loadPicture = function(img){
    this.pics.push(img);
}

CanvasManager.prototype.deleteCurve = function(){
    if(this.activeCurve != -1){
        this.disActiveCurve(this.activeCurve);
        this.curves[this.activeCurve].deleteCurve();
        this.curveClosed = true;
    }
}

CanvasManager.prototype.exportVisibleLayer = function(){

}

CanvasManager.prototype.exportEverything = function(){

}

CanvasManager.prototype.clearCanvas = function(){
    canvasManager = new CanvasManager(canvasId);
}

CanvasManager.prototype.drawLayers = function(){
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.pics.forEach(img=>{
        let w = Math.min(img.width, this.ctx.canvas.width);
        //console.log(this.ctx.canvas.width);
        this.ctx.drawImage(img, 0, 0, w, w/img.width * img.height);
    });
    this.curves.forEach(curve=>{
        curve.drawCurve();
    });
}

CanvasManager.prototype.mousePress = function(event)
{
	if (event.button == 0) {
		var pos = getMousePos(event);
		this.movingTangent = -1;
        if(this.activeCurve == -1)return;
        let ind = this.activeNode;
        //console.log(this.activeCurve + " " + this.activeNode);
		if(ind != -1){	
            let tangent = this.curves[this.activeCurve].tangents[ind];
			let t_end1 = Node.sub(this.curves[this.activeCurve].nodes[ind], tangent[0].dir.multiply(tangent[0].len));
			let t_end2 = Node.sum(this.curves[this.activeCurve].nodes[ind], tangent[1].dir.multiply(tangent[1].len));
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

			for (var i = 0; i < this.curves[this.activeCurve].nodes.length; i++) {
				if (this.curves[this.activeCurve].nodes[i].isInside(pos.x,pos.y)) {
					this.activeNode = i;
					break;
				}
			}

			// No node selected: add a new node
			if (this.activeNode == -1) {
				if(!this.curves[this.activeCurve].closed){
					this.curves[this.activeCurve].addNode(pos.x,pos.y);
					this.activeNode = this.curves[this.activeCurve].nodes.length-1;
				}
			}
        }
        else{
            this.breakTangent = -1;
            showHint("按住alt可取消切线方向链接，按住shift+alt可重新链接");
        }
		this.cvState = CVSTATE.SelectPoint;
		event.preventDefault();
	}
}

CanvasManager.prototype.mouseMove = function(event) {
	if (this.activeNode != -1 &&(this.cvState == CVSTATE.SelectPoint || this.cvState == CVSTATE.MovePoint)) {
		var pos = getMousePos(event);
		if(this.movingTangent != -1){
            let node = this.curves[this.activeCurve].nodes[this.activeNode];
            let tangents = this.curves[this.activeCurve].tangents[this.activeNode];
            let dir = new Node(pos.x-node.x, pos.y-node.y);
            let len = dir.length();
            tangents[this.movingTangent].len = len;

            if(this.breakTangent == 1 && tangents[0].dir == tangents[1].dir){
                tangents[this.movingTangent].dir = new Node(0, 0);
            }
            else if(this.breakTangent == 0 && tangents[0].dir != tangents[1].dir){
                tangents[0].dir = tangents[1].dir;
            }

            if(this.movingTangent == 0){
                dir = dir.multiply(-1./len);
                tangents[this.movingTangent].dir.setPos(dir.x, dir.y);
            }
            else{
                dir = dir.multiply(1./len);
                tangents[this.movingTangent].dir.setPos(dir.x, dir.y);
            }
		}
		else {
			this.curves[this.activeCurve].nodes[this.activeNode].setPos(pos.x,pos.y);
		}
	} else {
		// No button pressed. Ignore movement.
	}
}

CanvasManager.prototype.mouseRelease = function(event)
{
	this.cvState = CVSTATE.Idle; //this.activeNode = null;
    this.movingTangent = -1;
    this.breakTangent = -1;
    showHint("");
}