var PointSet = function(dCanvas, manager, id)
{
    CanvasLayer.call(this, dCanvas, manager, id);
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
    const _draw = (_ctx) => {
        let left = this.dCanvas.width;
        let top = this.dCanvas.height;
        let right = 0;
        let bottom = 0;
        const ctx = _ctx||this.ctx;
        this.pts.forEach((pt, ind)=>{
            if(this.status == 2){
                if(ind == this.manager.activePt){
                    setColors(ctx, "rgb(255, 213, 0)");
                }
                else{
                    setColors(ctx, default_active_color);
                }
            }
            else{
                setColors(ctx, "black");
            }
            drawLine(ctx, pt.x-8, pt.y, pt.x + 8, pt.y);
            drawLine(ctx, pt.x, pt.y-8, pt.x, pt.y+8);
            if(_ctx){
				if(pt.x < left){
					left = pt.x;
				} else if(pt.x > right){
					right = pt.x;
				}
				if(pt.y < top){
					top = pt.y;
				} else if(pt.y > bottom){
					bottom = pt.y;
				}
			}
		});
        if(_ctx){
            this.left = left-10;
            this.top = top-10;
            this.width = right - left + 20;
            this.height = bottom - top + 20;
        }
    }
    if(this.status !== 2){
        if(this.change){
          this.saveDraw((ctx)=>{
            _draw(ctx);
          });
          this.change = false;
        }
        this.defaultDraw();
      }else{
        _draw(this.ctx);
    }
}

