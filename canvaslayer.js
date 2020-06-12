var CanvasLayer = function(dCanvas, manager){
    this.left =  0;
    this.top = 0;
    this.width = 0;
    this.height = 0;
    this.status = 2;
    this.dCanvas = dCanvas;
    this.manager = manager;

    this.computeCanvasSize = function(){
        var renderWidth = Math.min(this.dCanvas.parentNode.clientWidth - 20, 820);
        var renderHeight = Math.floor(renderWidth*3.0/4.0);
        this.dCanvas.width = renderWidth;
        this.dCanvas.height = renderHeight;
    }

	this.computeCanvasSize();
    this.ctx = dCanvas.getContext('2d');
    this.dCanvas.addEventListener('resize', this.computeCanvasSize());
};