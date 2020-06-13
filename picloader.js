var PicLoader = function(dCanvas, manager, pic, id)
{
    CanvasLayer.call(this, dCanvas, manager, id);
    this.pic = pic;
    // console.log($(pic)[0].width);
    this.width = Math.min($(pic)[0].width, dCanvas.width);
    this.height = this.width/$(pic)[0].width * $(pic)[0].height;

    this.repaint();// Do this when color changed or resized
    console.log(this.width + " " + this.height);
}

PicLoader.prototype.delete = function(){
    this.pic = null;
    this.status = -1;
}

PicLoader.prototype.draw = function(){
    this.defaultDraw();
    // this.ctx.drawImage(this.pic, this.left, this.top, this.width, this.height);
}

PicLoader.prototype.repaint = function(color){
    this.saveDraw((ctx)=>{
        ctx.drawImage(this.pic, this.left, this.top, this.width, this.height);
        // Adapted from https://segmentfault.com/a/1190000011880686
        const originColor = ctx.getImageData(this.left, this.top, this.width, this.height); 
        const originColorData = originColor.data;
        const output = ctx.createImageData(this.width, this.height);
        const outputData = output.data;
        this.changeColor(originColorData, outputData, this.width, this.height, color);
        ctx.putImageData(output, this.left, this.top);
    });
}

PicLoader.prototype.changeColor = function (originColorData, outputData, ws, hs, color) {
    let r, g, b;
    for (let y = 1; y <= hs; y++) {
        for (let x = 1; x <= ws; x++) {
            let index = ((y-1) * ws + (x-1)) * 4;
            // if(color){
            //     var L = originColorData[index]*0.30+originColorData[index+1]*0.59+originColorData[index+2]*0.11;
            // }
            for (let c = 0; c < 3; c++) {
                if(color){
                    outputData[index+c] = 256 - (256 - color[c])*(256 - originColorData[index+c])/256;
                }
                else {
                    outputData[index+c] = originColorData[index+c];
                }
            }
            if(color)outputData[index+3] = originColorData[index+3] * color[3];
            else outputData[index+3] = originColorData[index+3];
        }
    }
}
