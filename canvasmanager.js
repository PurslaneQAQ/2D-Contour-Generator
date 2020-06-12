const default_active_color = 'rgb(13, 87, 133)';

function CanvasManager(id){
    this.canvas = $(`#${id}`)[0];
    this.ctx = this.canvas.getContext('2d');
    this.curves = new Array();
    this.ptSets = new Array();
    this.pics = new Array();
    this.meshes = new Array();
    this.curveClosed = true;
    this.breakTangent = -1;

    this.activeCurve = -1;
    this.activePic = -1;
    this.activeMesh = -1;
    this.activePtSet = -1;
    
    this.activeNode = -1;
    this.activePt = -1;
    
    this.showControlPolygon = true;
    this.defaultSegments = 16;
    this.minSegment = 16;
    this.initialTension = 0.5;

    this.meshBaseWeight = 1;
    this.meshBrushWeight = 0.5;
    this.brushSize = 0;

    // Setup event listeners
	this.cvState = CVSTATE.Idle;

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

CanvasManager.prototype.exportPos = function(x, y){
    return `${(5 * (x-this.canvas.width/2)/this.canvas.width).toFixed(5)} ${-(5 * (y-this.canvas.height/2)/this.canvas.width).toFixed(5)} \n`;
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

CanvasManager.prototype.disActiveAll = function(){
    if(this.activePic != -1)this.pics[this.activePic].status = 1;
    this.activePic = -1;
    if(this.activeCurve != -1)this.curves[this.activeCurve].status = 1;
    this.activeCurve = -1;
    if(this.activePtSet != -1)this.ptSets[this.activePtSet].status = 1;
    this.activePtSet = -1;
    if(this.activeMesh != -1)this.meshes[this.activeMesh].status = 1;
    this.activeMesh = -1;

    this.activeNode = -1;
    this.activePt = -1;
}

CanvasManager.prototype.newCurve = function(){
    if(!this.curveClosed){
		alert("Please close recent curve first!");
		return -1;
	}
	else {
        this.curves.push(new HermiteSpline(this.canvas, this));
        this.disActiveAll();
        this.activeCurve = this.curves.length - 1;
        this.activeNode = -1; 
		this.curveClosed = false;
		return this.curves.length - 1;
	}
}

CanvasManager.prototype.setShowControlPolygon = function(bShow)
{
	this.showControlPolygon = bShow;
}

CanvasManager.prototype.setMinSegment = function(val)
{
    this.minSegment = val;
}

CanvasManager.prototype.preview = function(mode){
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.meshes.forEach(mesh=>{
        if(mesh.status > mode)mesh.draw();
    });
    // console.log("set min seg, mode: "+ mode);
    this.curves.forEach(curve=>{
        if(curve.status >= mode){
            curve.export(this.minSegment);
        }
    });
    this.ptSets.forEach(ptSet=>{
        if(ptSet.status > mode)ptSet.draw();
    });
}

CanvasManager.prototype.handleDelete = function() {
    if (this.activePtSet !== -1 && this.activePt !== -1){
      this.ptSets[this.activePtSet].deletePt(this.activePt);
      this.activePt = -1;
    } else if (this.activeCurve !== -1 && this.activeNode !== -1){
      this.curves[this.activeCurve].deleteNode(this.activeNode);
      this.activeNode = -1;
    }
}

CanvasManager.prototype.setActiveLayer = function(type, id){
    console.log("Tring to set active layer " + type + "-" + id);
    this.disActiveAll();
    switch(type){
        case 0 :
            this.activePic = id;
            this.pics[id].status = 2;
            break;
        case 1:
            this.activeCurve = id;
            this.curves[id].status = 2;
            break;
        case 2:
            this.activePtSet = id;
            this.ptSets[id].status = 2;
            break;
        case 3:
            this.activeMesh = id;
            this.meshes[id].status = 2;
            break;
        default: 
            break; 
    }
}

// CanvasManager.prototype.disActiveCurve = function(curveId){
//     // Looks strange but I'll buy it for now
//     this.activeNode = -1;
//     this.curves[curveId].status = 1;
// }

CanvasManager.prototype.getActiveCurve = function(){
    return this.activeCurve;
}

CanvasManager.prototype.getCloseStatus = function(){
    return this.curveClosed;
}

CanvasManager.prototype.getLayerStatus = function (type, id){
    switch(type){
        case 0:
            return this.pics[id].status;
        case 1:
            return this.curves[id].status;
        case 2:
            return this.ptSets[id].status;
        case 3:
            return this.meshes[id].status;
    }
}

CanvasManager.prototype.hideCurve = function(curveId){
    console.log("Trying to hide curve "+ curveId);
    if(this.activeCurve == curveId && !this.curveClosed){
        alert("Please close current curve！");
        return false;
    }
    else if(this.activeCurve == curveId){
        this.activeCurve = -1;
    }
    this.curves[curveId].status = 0;
    return true;
}

CanvasManager.prototype.hideLayer = function(type, id){
    switch(type){
        case 0:
            if(this.activePic == id){
                this.activePic = -1;
            }
            this.pics[id].status = 0;
            break;
        case 1:
            return this.hideCurve(id);
        case 2:
            if(this.activePtSet == id){
                this.activePtSet = -1;
            }
            this.ptSets[id].status = 0;
            break;
        case 3:
            if(this.activeMesh == id){
                this.activeMesh = -1;
            }
            this.meshes[id].status = 0;
            break;
    }
    return true;
}

CanvasManager.prototype.showLayer = function(type, id){
    switch(type){
        case 0:
            this.pics[id].status = 1;
            break;
        case 1:
            this.curves[id].status = 1;
            break;
        case 2:
            this.ptSets[id].status = 1;
            break;
        case 3:
            this.meshes[id].status = 1;
            break;
    }
}

CanvasManager.prototype.newPointSet = function(){
    // To do
    this.disActiveAll();
    this.ptSets.push(new PointSet(this.canvas, this));
    this.activePtSet = this.ptSets.length - 1;
    return this.activePtSet;
}

CanvasManager.prototype.loadPicture = function(pic){
    this.disActiveAll();
    this.pics.push(new PicLoader(this.canvas, this, pic));
    this.activePic = this.pics.length - 1;
    return this.activePic;
}

CanvasManager.prototype.loadMesh = function(content){
    this.disActiveAll();
    this.meshes[0] = new Mesh(this.canvas, this, content);
    this.activeMesh = 0;//this.meshes.length - 1;
    return this.activeMesh;
}


CanvasManager.prototype.changePicColor = function(color){
    if(this.activePic != -1){
        console.log(color);
        this.pics[this.activePic].repaint(color);
    }
}

CanvasManager.prototype.deletePic = function(){
    if(this.activePic != -1){
        this.meshes[this.activePic].delete();
        this.activePic = -1;
    }
}

CanvasManager.prototype.deleteCurve = function(){
    if(this.activeCurve != -1){
        this.curves[this.activeCurve].deleteCurve();
        //this.disActiveCurve(this.activeCurve);
        this.curveClosed = true;
    }
}

CanvasManager.prototype.deletePtSet = function(){
    if(this.activePtSet != -1){
        this.ptSets[this.activePtSet].delete();
        this.activePtSet = -1;
    }
}

CanvasManager.prototype.deleteMesh = function(){
    console.log("Deleting mesh, active id: " + this.activeMesh);
    if(this.activeMesh != -1){
        this.meshes[this.activeMesh].delete();
        this.activeMesh = -1;
    }
}

CanvasManager.prototype.clearCanvas = function(){
    canvasManager = new CanvasManager(canvasId);
}

CanvasManager.prototype.drawLayers = function(){
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.pics.forEach(pic=>{
        if(pic.status > 0)pic.draw();
    });
    this.meshes.forEach(mesh=>{
        if(mesh.status > 0)mesh.draw();
    });
    this.curves.forEach(curve=>{
        if(curve.status > 0)curve.drawCurve();
    });
    this.ptSets.forEach(ptSet=>{
        if(ptSet.status > 0)ptSet.draw();
    });
}
CanvasManager.prototype.SetMeshBaseWeight = function(w){
    this.meshBaseWeight = w;
}

CanvasManager.prototype.SetMeshBrushWeight = function(w){
    this.meshBrushWeight = w;
}

CanvasManager.prototype.setBrushSize = function(size){
    this.brushSize = parseInt(size);
}

CanvasManager.prototype.saveFile = async function(data, filename){
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
CanvasManager.prototype.exportLayers = function(mode, prefix){
	// mode 0: export all layers
    // mode 1: export visible layers
    let curCount = 0;
    let res = "";
    this.curves.forEach(curve=>{
        if(curve.status >= mode){
            curCount++;
            res += curve.export(this.minSegment);
        }
    });
    if(curCount){
        res = `2dContour ${curCount} ${(2.4 * this.minSegment/this.canvas.width).toFixed(5)}\n${res}`;
        const filename = prefix + "_contour.txt";
        this.saveFile(res, filename);
    }
   

    let pointCount = 0;
    let res_points = "";
    this.ptSets.forEach(ptSet=>{
        if(ptSet.status >= mode){
            pointCount += ptSet.pts.length;
            res_points += ptSet.export();
        }
    });
    if(pointCount){
        res_points = `2dPoints ${pointCount} \n${res_points}`;
        const filenamepoints = prefix + "_points.txt";
        this.saveFile(res_points, filenamepoints);
    }

    const filenameMesh =  prefix + "_mesh.txt";
    if(this.meshes[0]) this.saveFile(this.meshes[0].export(), filenameMesh);
}

CanvasManager.prototype.mousePress = function(event)
{
	if (event.button == 0) {
		var pos = getMousePos(event);
        this.movingTangent = -1;
        
        if(this.activePic != -1){
            // Todo : move image
        }
        else if (this.activeMesh != -1){
            this.meshes[this.activeMesh].paint(pos, this.meshBrushWeight, this.brushSize);
            this.cvState = CVSTATE.Painting;
        }
        else if(this.activeCurve != -1){
            let ind = this.activeNode;
            // console.log(this.activeCurve + " " + this.activeNode);
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
                    if (this.curves[this.activeCurve].nodes[i].isInside(pos.x,pos.y, 16)) {
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
                // showHint("按住alt可取消切线方向链接，按住shift+alt可重新链接");
                showHint("Press alt to disable the link of tangent direction. Press shift+alt to relink.");
            }
            this.cvState = CVSTATE.SelectPoint;
        }
        else if(this.activePtSet != -1){
            this.activePt = -1;

            console.log("Trying to add a new point!");

            for (var i = 0; i < this.ptSets[this.activePtSet].pts.length; i++) {
                if (this.ptSets[this.activePtSet].pts[i].isInside(pos.x,pos.y)) {
                    this.activePt = i;
                    break;
                }
            }

            // No node selected: add a new node
            if (this.activePt == -1) {
                if(!this.ptSets[this.activePtSet].closed){
                    this.ptSets[this.activePtSet].addPt(pos.x,pos.y);
                    this.activePt = this.ptSets[this.activePtSet].pts.length-1;
                }
            }
            this.cvState = CVSTATE.SelectPoint;
        }
		event.preventDefault();
	}
}

CanvasManager.prototype.mouseMove = function(event) {
    if(this.cvState != CVSTATE.SelectPoint && this.cvState != CVSTATE.MovePoint && this.cvState != CVSTATE.Painting)return;
    var pos = getMousePos(event);
	if (this.activeNode != -1) {
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
    } 
    else if(this.activePt != -1){
		this.ptSets[this.activePtSet].pts[this.activePt].setPos(pos.x,pos.y);
    }
    else if (this.activeMesh != -1){
        this.meshes[this.activeMesh].paint(pos, this.meshBrushWeight, this.brushSize);
    }
}

CanvasManager.prototype.mouseRelease = function(event)
{
	this.cvState = CVSTATE.Idle;
    this.movingTangent = -1;
    this.breakTangent = -1;
    // this.activePt = -1;
    showHint("");
}