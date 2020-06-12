var PointSet = function(dCanvas, manager)
{
    CanvasLayer.call(this, dCanvas, manager);
    this.pts = new Array();
}

PointSet.prototype.addPt = function(ptx, pty){
    this.pts.push(new Node(ptx, pty));
}

PointSet.prototype.delete = function(){
    this.pts.length = 0;
    this.status = -1;
}

PointSet.prototype.deletePt = function(ptId){
    this.pts.splice(ptId, 1);
}

PointSet.prototype.export = function(mode){
    let data = '';
    this.pts.forEach((pt, ind)=>{
        data += this.manager.exportPos(pt.x, pt.y);
    })
    return data;
}

PointSet.prototype.draw = function(){
    this.pts.forEach((pt, ind)=>{
        if(this.status == 2){
            if(ind == this.manager.activePt){
                setColors(this.ctx, "rgb(255, 213, 0)");
            }
            else{
                setColors(this.ctx, default_active_color);
            }
        }
        else{
            setColors(this.ctx, "black");
        }
        drawLine(this.ctx, pt.x-8, pt.y, pt.x + 8, pt.y);
        drawLine(this.ctx, pt.x, pt.y-8, pt.x, pt.y+8);
    })
}

