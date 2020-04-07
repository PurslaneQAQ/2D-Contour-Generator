function CanvasManager(id){
    this.canvas = $(`#${id}`)[0];
    this.curves = new Array();
    this.points = new Array();
    this.pics = new Array();
    this.curveClosed = true;
}

CanvasManager.prototype.newCurve = function(){

}

CanvasManager.prototype.newPointSets = function(){

}

CanvasManager.prototype.loadPicture = function(){
    
}

CanvasManager.prototype.deleteLayer = function(id){

}

CanvasManager.prototype.exportVisibleLayer = function(){

}

CanvasManager.prototype.exportEverything = function(){

}

CanvasManager.prototype.clearCanvas = function(){
    var container = $('#layer-container')[0];
    while(container.lastChild) 
    {
        container.removeChild(container.lastChild);
    }
    canvasManager = new CanvasManager(canvasId);
    layers = [0, 0];
}