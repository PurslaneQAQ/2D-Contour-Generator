var CanvasLayer = function(dCanvas, manager, id){
    this.left =  0;
    this.top = 0;
    this.width = 0;
    this.height = 0;

    this.change = true;
    this.status = 2;
    
    this.dCanvas = dCanvas;
    this.manager = manager;
    this.id = id;
    this.content = new Image();

    this.computeCanvasSize = function(){
        var renderWidth = Math.min(this.dCanvas.parentNode.clientWidth - 20, 820);
        var renderHeight = Math.floor(renderWidth*3.0/4.0);
        this.dCanvas.width = renderWidth;
        this.dCanvas.height = renderHeight;
    }

	this.computeCanvasSize();
    this.ctx = dCanvas.getContext('2d');
    this.dCanvas.addEventListener('resize', this.computeCanvasSize());

    this.moveWhole = function(x, y){
        this.left+=x;
        this.top+=y;
    }

    this.updateOverview = function(){
        console.log(this.id);
        menuManager.setOverview(this.id, this.content.src);
    }
    
    this.saveDraw = function(drawFunc){
        const c = document.createElement("canvas");
        c.width = this.dCanvas.width;
        c.height = this.dCanvas.height;
        const ctx = c.getContext("2d");
        drawFunc(ctx);
        const url = c.toDataURL();
        const img = new Image();
        img.src = url;
        img.onload = ()=>{
            const output = document.createElement("canvas");
            output.width = this.width;
            output.height = this.height;
            const outputCtx = output.getContext("2d");
            outputCtx.drawImage(img, -this.left, -this.top);
            this.content.src = output.toDataURL();
            this.updateOverview();
        };
    }
    
    this.defaultDraw = function(){
        this.ctx.drawImage(this.content, this.left, this.top);
    }
};
